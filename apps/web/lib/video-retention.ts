import { DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { db } from "@cap/database";
import {
	importedVideos,
	sharedVideos,
	spaceVideos,
	videoProcessingJobs,
	videos,
	videoUploads,
} from "@cap/database/schema";
import { serverEnv } from "@cap/env";
import { and, eq, isNull, lt } from "drizzle-orm";
import { createStorageClient } from "@/lib/storage-quota";

// Alpha Loom deletes videos older than VIDEO_RETENTION_DAYS (default 30, 0
// disables) so the shared bucket stays small. Only videos in the default
// bucket are removed; mirrors VideosRepo.delete for the database rows.
const BATCH = 50;

function retentionDays() {
	const days = Number(process.env.VIDEO_RETENTION_DAYS ?? "30");
	return Number.isFinite(days) && days > 0 ? days : 0;
}

async function deleteVideoObjects(prefix: string) {
	const client = createStorageClient();
	const bucket = serverEnv().CAP_AWS_BUCKET;
	let token: string | undefined;
	do {
		const page = await client.send(
			new ListObjectsV2Command({
				Bucket: bucket,
				Prefix: prefix,
				ContinuationToken: token,
			}),
		);
		const keys = (page.Contents ?? []).flatMap((object) =>
			object.Key ? [{ Key: object.Key }] : [],
		);
		if (keys.length > 0) {
			await client.send(
				new DeleteObjectsCommand({
					Bucket: bucket,
					Delete: { Objects: keys, Quiet: true },
				}),
			);
		}
		token = page.IsTruncated ? page.NextContinuationToken : undefined;
	} while (token);
}

export async function deleteExpiredVideos() {
	const days = retentionDays();
	if (days === 0) return 0;

	const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
	const expired = await db()
		.select({ id: videos.id, ownerId: videos.ownerId })
		.from(videos)
		.where(
			and(
				lt(videos.createdAt, cutoff),
				isNull(videos.bucket),
				isNull(videos.storageIntegrationId),
			),
		)
		.limit(BATCH);

	for (const video of expired) {
		await deleteVideoObjects(`${video.ownerId}/${video.id}/`);
		await db().transaction(async (tx) => {
			await tx
				.delete(videoProcessingJobs)
				.where(eq(videoProcessingJobs.videoId, video.id));
			await tx.delete(sharedVideos).where(eq(sharedVideos.videoId, video.id));
			await tx.delete(spaceVideos).where(eq(spaceVideos.videoId, video.id));
			await tx.delete(importedVideos).where(eq(importedVideos.id, video.id));
			await tx.delete(videoUploads).where(eq(videoUploads.videoId, video.id));
			await tx.delete(videos).where(eq(videos.id, video.id));
		});
		console.log(
			`[retention] Deleted video ${video.id} older than ${days} days`,
		);
	}
	return expired.length;
}

export function scheduleVideoRetention() {
	const run = () =>
		deleteExpiredVideos().catch((error) =>
			console.error("[retention] Failed to delete expired videos", error),
		);
	setTimeout(run, 60 * 1000);
	setInterval(run, 6 * 60 * 60 * 1000);
}
