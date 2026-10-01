/** Shared helpers used by the React interface. */
export const RISK_BANDS = ["At Risk", "Needs Support", "On Track"];

export function riskBandFromScore(score) {
  if (score < 40) return "At Risk";
  if (score < 60) return "Needs Support";
  return "On Track";
}

export function riskClasses(band) {
  switch (band) {
    case "At Risk":
      return "bg-risk-high-soft text-risk-high border-risk-high/30";
    case "Needs Support":
      return "bg-risk-mid-soft text-risk-mid border-risk-mid/30";
    default:
      return "bg-risk-low-soft text-risk-low border-risk-low/30";
  }
}

export function riskChartColor(band) {
  switch (band) {
    case "At Risk":
      return "var(--risk-high)";
    case "Needs Support":
      return "var(--risk-mid)";
    default:
      return "var(--risk-low)";
  }
}

export const ENGAGEMENT_LEVELS = ["Low", "Medium", "High"];

export const PREDICTION_STAGES = [
  "Week 3",
  "Week 6",
  "Week 10",
  "Near Final Exams",
  "Not specified",
];

export const SEMESTER_ORDER = [
  "2024/2025 Harmattan",
  "2024/2025 Rain",
  "2025/2026 Harmattan",
  "2025/2026 Rain",
];

export function sortSemesters(a, b) {
  const ia = SEMESTER_ORDER.indexOf(a);
  const ib = SEMESTER_ORDER.indexOf(b);
  if (ia === -1 || ib === -1) return a.localeCompare(b);
  return ia - ib;
}
