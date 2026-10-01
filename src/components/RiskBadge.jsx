import { riskClasses } from "@/lib/prediction";
export function RiskBadge({ band, size = "sm" }) {
    return (<span className={`inline-flex items-center rounded-full border font-medium ${riskClasses(band)} ${size === "lg" ? "px-4 py-1.5 text-sm" : "px-2.5 py-0.5 text-xs"}`}>
      {band}
    </span>);
}
