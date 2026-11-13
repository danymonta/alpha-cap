import type { StorageUsage } from "@/lib/storage-quota";

const WARN_RATIO = 0.8;

const formatGb = (bytes: number) =>
	(bytes / 1_000_000_000).toLocaleString("it-IT", {
		maximumFractionDigits: 1,
	});

export function StorageWarning({ usage }: { usage: StorageUsage | null }) {
	if (!usage || usage.usedBytes < usage.limitBytes * WARN_RATIO) return null;

	const full = usage.usedBytes >= usage.limitBytes;
	const amount = `${formatGb(usage.usedBytes)} GB su ${formatGb(usage.limitBytes)} GB`;

	return (
		<div
			role="alert"
			className={`rounded-xl border px-4 py-3 text-sm ${
				full
					? "border-red-300 bg-red-50 text-red-900"
					: "border-amber-300 bg-amber-50 text-amber-900"
			}`}
		>
			<p className="font-semibold">
				{full
					? `Spazio video esaurito (${amount})`
					: `Spazio video quasi pieno (${amount})`}
			</p>
			<p className="mt-1">
				{full
					? "Non si possono caricare nuovi video finché non elimini quelli che non servono più."
					: "Elimina i video che non servono più per lasciare spazio alle nuove registrazioni."}
			</p>
		</div>
	);
}
