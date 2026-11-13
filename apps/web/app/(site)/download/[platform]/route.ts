import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { serverEnv } from "@cap/env";
import { type NextRequest, NextResponse } from "next/server";
import { createStorageClient } from "@/lib/storage-quota";

export const runtime = "nodejs";

// Alpha Loom installers live in the video bucket under downloads/. The bucket
// is private, so each request is redirected to a short-lived signed URL.
const installers = {
	mac: {
		key: "downloads/AlphaLoom-mac-apple-silicon.dmg",
		filename: "Alpha Loom.dmg",
	},
	windows: {
		key: "downloads/AlphaLoom-windows-setup.exe",
		filename: "Alpha Loom Setup.exe",
	},
} as const;

const aliases: Record<string, keyof typeof installers> = {
	mac: "mac",
	macos: "mac",
	"apple-silicon": "mac",
	aarch64: "mac",
	windows: "windows",
	win: "windows",
};

export async function GET(
	request: NextRequest,
	props: { params: Promise<{ platform: string }> },
) {
	const params = await props.params;
	const platform = aliases[params.platform?.toLowerCase() ?? ""];
	if (!platform) {
		return NextResponse.redirect(new URL("/download", request.url));
	}

	const installer = installers[platform];
	const url = await getSignedUrl(
		createStorageClient(),
		new GetObjectCommand({
			Bucket: serverEnv().CAP_AWS_BUCKET,
			Key: installer.key,
			ResponseContentDisposition: `attachment; filename="${installer.filename}"`,
		}),
		{ expiresIn: 60 * 60 },
	);

	return NextResponse.redirect(url);
}
