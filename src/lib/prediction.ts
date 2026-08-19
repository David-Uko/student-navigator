/**
 * Shared, client-safe helpers for the prediction model.
 * The authoritative prediction is computed server-side in
 * src/lib/prediction.functions.ts — these helpers are for display only.
 */

export type RiskBand = "At Risk" | "Needs Support" | "On Track";

export const RISK_BANDS: RiskBand[] = ["At Risk", "Needs Support", "On Track"];

export function riskBandFromScore(score: number): RiskBand {
  if (score < 40) return "At Risk";
  if (score < 60) return "Needs Support";
  return "On Track";
}

export function riskClasses(band: string): string {
  switch (band) {
    case "At Risk":
      return "bg-risk-high-soft text-risk-high border-risk-high/30";
    case "Needs Support":
      return "bg-risk-mid-soft text-risk-mid border-risk-mid/30";
    default:
      return "bg-risk-low-soft text-risk-low border-risk-low/30";
  }
}

export function riskChartColor(band: string): string {
  switch (band) {
    case "At Risk":
      return "var(--risk-high)";
    case "Needs Support":
      return "var(--risk-mid)";
    default:
      return "var(--risk-low)";
  }
}

export type StudentRow = {
  id: string;
  full_name: string;
  matric_number: string;
  department: string;
  level: string;
  created_at: string;
};

export type PerformanceRow = {
  id: string;
  student_id: string;
  semester: string;
  attendance_rate: number;
  avg_test_score: number;
  study_habits_score: number;
  predicted_score: number;
  risk_band: string;
  actual_score: number | null;
  created_at: string;
  // v2 fields — nullable because v1 records predate this schema.
  previous_semester_average: number | null;
  previous_failed_courses: number | null;
  assignment_average: number | null;
  assignments_total: number | null;
  assignments_completed: number | null;
  assignments_missing: number | null;
  assignments_late: number | null;
  assignment_completion_rate: number | null;
  assignment_late_rate: number | null;
  recent_assessment_scores: number[] | null;
  earlier_assessment_avg: number | null;
  recent_assessment_avg: number | null;
  performance_change: number | null;
  performance_trend: PerformanceTrend | null;
  engagement_level: EngagementLevel | null;
  lms_activity_level: EngagementLevel | null;
  course_load: number | null;
  weeks_remaining: number | null;
  prediction_stage: string;
  score_range_low: number | null;
  score_range_high: number | null;
  positive_factors: string[] | null;
  risk_factors: string[] | null;
  recommended_action: string | null;
  model_version: string;
};

export type EngagementLevel = "Low" | "Medium" | "High";
export const ENGAGEMENT_LEVELS: EngagementLevel[] = ["Low", "Medium", "High"];

export type PerformanceTrend = "Improving" | "Stable" | "Declining" | "Insufficient data";

export const PREDICTION_STAGES = [
  "Week 3",
  "Week 6",
  "Week 10",
  "Near Final Exams",
  "Not specified",
] as const;
export type PredictionStage = (typeof PREDICTION_STAGES)[number];

export const SEMESTER_ORDER = [
  "2024/2025 Harmattan",
  "2024/2025 Rain",
  "2025/2026 Harmattan",
  "2025/2026 Rain",
];

export function sortSemesters(a: string, b: string) {
  const ia = SEMESTER_ORDER.indexOf(a);
  const ib = SEMESTER_ORDER.indexOf(b);
  if (ia === -1 || ib === -1) return a.localeCompare(b);
  return ia - ib;
}
