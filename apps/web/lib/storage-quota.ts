import "server-only";

import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { serverEnv } from "@cap/env";

// Alpha Loom keeps every video in one bucket shared by all users, so the cap
// is on the bucket's total size. Measuring lists every object, so the result
// is cached and new uploads may overshoot the limit by what is in flight.
const CACHE_MS = 2 * 60 * 1000;

export type StorageUsage = { usedBytes: number; limitBytes: number };

let cached: { at: number; usedBytes: number } | undefined;
let measuring: Promise<number> | undefined;

function limitBytes() {
	const gb = Number(process.env.STORAGE_LIMIT_GB ?? "20");
	return (Number.isFinite(gb) && gb > 0 ? gb : 20) * 1_000_000_000;
}

async function measureUsedBytes() {
	const env = serverEnv();
	const client = new S3Client({
		endpoint: env.S3_INTERNAL_ENDPOINT ?? env.S3_PUBLIC_ENDPOINT,
		region: env.CAP_AWS_REGION,
		forcePathStyle: env.S3_PATH_STYLE,
		credentials:
			env.CAP_AWS_ACCESS_KEY && env.CAP_AWS_SECRET_KEY
				? {
						accessKeyId: env.CAP_AWS_ACCESS_KEY,
						secretAccessKey: env.CAP_AWS_SECRET_KEY,
					}
				: undefined,
	});

	let total = 0;
	let token: string | undefined;
	do {
		const page = await client.send(
			new ListObjectsV2Command({
				Bucket: env.CAP_AWS_BUCKET,
				ContinuationToken: token,
			}),
		);
		for (const object of page.Contents ?? []) total += object.Size ?? 0;
		token = page.IsTruncated ? page.NextContinuationToken : undefined;
	} while (token);
	return total;
}

export async function getStorageUsage(): Promise<StorageUsage> {
	if (!cached || Date.now() - cached.at > CACHE_MS) {
		measuring ??= measureUsedBytes().finally(() => {
			measuring = undefined;
		});
		cached = { at: Date.now(), usedBytes: await measuring };
	}
	return { usedBytes: cached.usedBytes, limitBytes: limitBytes() };
}

// Fail-open: a storage listing outage must not block recording.
export async function isStorageFull() {
	try {
		const { usedBytes, limitBytes } = await getStorageUsage();
		return usedBytes >= limitBytes;
	} catch (error) {
		console.error("Failed to measure storage usage", error);
		return false;
	}
}

export const STORAGE_FULL_MESSAGE =
	"Spazio video esaurito: elimina dei video vecchi per poterne caricare di nuovi.";
