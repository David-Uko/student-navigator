import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { PREDICTION_STAGES } from "@/lib/prediction";

const pct = z.number().min(0, "Must be 0–100").max(100, "Must be 0–100");

const inputSchema = z
  .object({
    student_id: z.string().uuid().optional(),
    semester: z.string().trim().min(3).max(60).optional(),
    prediction_stage: z.enum(PREDICTION_STAGES).default("Not specified"),
    save: z.boolean().default(false),
    previous_semester_average: pct,
    previous_failed_courses: z.number().int().min(0).max(20),
    attendance_rate: pct,
    avg_test_score: pct,
    study_habits_score: pct,
    assignment_average: pct,
    assignments_total: z.number().int().min(0).max(100),
    assignments_completed: z.number().int().min(0).max(100),
    assignments_late: z.number().int().min(0).max(100),
    recent_assessment_scores: z.array(pct).max(8).default([]),
    engagement_level: z.enum(["Low", "Medium", "High"]),
    lms_activity_level: z.enum(["Low", "Medium", "High"]),
    course_load: z.number().int().min(1).max(12),
    weeks_remaining: z.number().int().min(0).max(30),
  })
  .superRefine((value, ctx) => {
    if (value.assignments_completed > value.assignments_total) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assignments_completed"],
        message: "Completed assignments cannot exceed total assignments.",
      });
    }
    if (value.assignments_late > value.assignments_completed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assignments_late"],
        message: "Late assignments cannot exceed completed assignments.",
      });
    }
  });

// Ridge Regression trained by ml/train_model.py.
// These values are copied from ml/model_coefficients.json.
const MODEL = {
  intercept: -0.2144,
  previous_semester_average: 0.1501,
  previous_failed_courses: -2.3203,
  attendance_rate: 0.129,
  avg_test_score: 0.2383,
  study_habits_score: 0.1117,
  assignment_average: 0.0212,
  assignment_completion_rate: 0.1756,
  assignment_late_rate: -0.0503,
  performance_change: 0.5239,
  engagement_score: 1.915,
  lms_activity_score: 2.7689,
  course_load: -0.1535,
  weeks_remaining: -0.121,
};

const TEST_RMSE = 5.61;
const MODEL_VERSION = "v2";

function classify(score) {
  if (score < 40) return "At Risk";
  if (score < 60) return "Needs Support";
  return "On Track";
}

function levelScore(level) {
  return level === "Low" ? 0 : level === "Medium" ? 1 : 2;
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function calculateTrend(scores) {
  if (scores.length < 2) {
    return {
      earlier_assessment_avg: null,
      recent_assessment_avg: null,
      performance_change: 0,
      performance_trend: "Insufficient data",
    };
  }

  const half = Math.floor(scores.length / 2);
  const earlier = scores.slice(0, half);
  const recent = scores.slice(half);
  const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const change = recentAvg - earlierAvg;
  const trend = change > 3 ? "Improving" : change < -3 ? "Declining" : "Stable";

  return {
    earlier_assessment_avg: round1(earlierAvg),
    recent_assessment_avg: round1(recentAvg),
    performance_change: round1(change),
    performance_trend: trend,
  };
}

function buildFactors(input) {
  const positive = [];
  const risk = [];

  if (input.attendance_rate >= 80) {
    positive.push({
      key: "attendance_high",
      label: `High attendance (${input.attendance_rate.toFixed(0)}%)`,
    });
  } else if (input.attendance_rate < 60) {
    risk.push({
      key: "attendance_low",
      label: `Low attendance (${input.attendance_rate.toFixed(0)}%)`,
    });
  }

  if (input.previous_failed_courses > 0) {
    risk.push({
      key: "previous_failed",
      label: `${input.previous_failed_courses} previously failed course${input.previous_failed_courses === 1 ? "" : "s"}`,
    });
  } else if (input.previous_semester_average >= 60) {
    positive.push({ key: "previous_strong", label: "Strong previous semester performance" });
  }

  if (input.previous_semester_average - input.avg_test_score > 10) {
    risk.push({ key: "below_previous", label: "Current average is well below previous semester" });
  }

  if (input.assignment_completion_rate >= 85) {
    positive.push({ key: "completion_high", label: "Strong assignment completion" });
  }
  if (input.assignments_missing > 0) {
    risk.push({
      key: "assignments_missing",
      label: `${input.assignments_missing} assignment${input.assignments_missing === 1 ? "" : "s"} missing`,
    });
  }
  if (input.assignment_late_rate > 25) {
    risk.push({ key: "late_submissions", label: "Frequent late assignment submissions" });
  }

  if (input.performance_trend === "Improving") {
    positive.push({ key: "trend_improving", label: "Recent assessment scores are improving" });
  } else if (input.performance_trend === "Declining") {
    risk.push({ key: "trend_declining", label: "Recent assessment scores are declining" });
  }

  if (input.study_habits_score >= 70) {
    positive.push({ key: "study_strong", label: "Good study consistency" });
  } else if (input.study_habits_score < 35) {
    risk.push({ key: "study_weak", label: "Poor study consistency" });
  }

  if (input.engagement_level === "High") {
    positive.push({ key: "engagement_high", label: "High class participation" });
  } else if (input.engagement_level === "Low") {
    risk.push({ key: "engagement_low", label: "Low class participation" });
  }

  if (input.lms_activity_level === "High") {
    positive.push({ key: "lms_high", label: "High LMS/online learning activity" });
  } else if (input.lms_activity_level === "Low") {
    risk.push({ key: "lms_low", label: "Low LMS/online learning activity" });
  }

  return { positive: positive.slice(0, 5), risk: risk.slice(0, 5) };
}

const RECOMMENDATIONS = {
  attendance_low: "Review attendance and reach out to the student directly.",
  previous_failed: "Check whether unresolved gaps from previously failed courses need addressing.",
  below_previous: "Investigate what changed since last semester before it compounds further.",
  assignments_missing: "Agree an assignment completion/recovery plan with the student.",
  late_submissions: "Discuss workload and deadlines; a submission plan may help.",
  trend_declining: "Recommend academic tutoring or a lecturer consultation.",
  study_weak: "Recommend a structured weekly study schedule.",
  engagement_low: "Encourage class participation and monitor engagement.",
  lms_low: "Encourage regular use of the LMS and monitor online activity.",
};

function buildRecommendation(riskBand, riskFactors) {
  if (riskFactors.length === 0) {
    return "No immediate concerns identified. Continue routine monitoring.";
  }

  const actions = riskFactors
    .map((factor) => RECOMMENDATIONS[factor.key])
    .filter((action, index, array) => Boolean(action) && array.indexOf(action) === index)
    .slice(0, 2);

  const severity =
    riskBand === "At Risk" ? "high" : riskFactors.length >= 3 ? "moderate-to-high" : "moderate";
  const opening = `Student currently shows signs of ${severity} academic risk.`;
  const closing =
    riskFactors.length >= 3
      ? "Comprehensive academic support and closer monitoring are recommended."
      : actions.join(" ");

  return `${opening} ${closing}`.trim();
}

export async function predictPerformance(input) {
  const data = inputSchema.parse(input);

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  const assignments_missing = data.assignments_total - data.assignments_completed;
  const assignment_completion_rate =
    data.assignments_total > 0 ? (data.assignments_completed / data.assignments_total) * 100 : 0;
  const assignment_late_rate =
    data.assignments_total > 0 ? (data.assignments_late / data.assignments_total) * 100 : 0;

  const trend = calculateTrend(data.recent_assessment_scores);
  const engagement_score = levelScore(data.engagement_level);
  const lms_activity_score = levelScore(data.lms_activity_level);

  const raw =
    MODEL.intercept +
    MODEL.previous_semester_average * data.previous_semester_average +
    MODEL.previous_failed_courses * data.previous_failed_courses +
    MODEL.attendance_rate * data.attendance_rate +
    MODEL.avg_test_score * data.avg_test_score +
    MODEL.study_habits_score * data.study_habits_score +
    MODEL.assignment_average * data.assignment_average +
    MODEL.assignment_completion_rate * assignment_completion_rate +
    MODEL.assignment_late_rate * assignment_late_rate +
    MODEL.performance_change * trend.performance_change +
    MODEL.engagement_score * engagement_score +
    MODEL.lms_activity_score * lms_activity_score +
    MODEL.course_load * data.course_load +
    MODEL.weeks_remaining * data.weeks_remaining;

  const predicted_score = Math.min(100, Math.max(0, round1(raw)));
  const risk_band = classify(predicted_score);
  const score_range_low = Math.max(0, round1(predicted_score - TEST_RMSE));
  const score_range_high = Math.min(100, round1(predicted_score + TEST_RMSE));

  const { positive, risk } = buildFactors({
    attendance_rate: data.attendance_rate,
    previous_semester_average: data.previous_semester_average,
    previous_failed_courses: data.previous_failed_courses,
    avg_test_score: data.avg_test_score,
    assignment_completion_rate,
    assignments_missing,
    assignment_late_rate,
    study_habits_score: data.study_habits_score,
    engagement_level: data.engagement_level,
    lms_activity_level: data.lms_activity_level,
    performance_trend: trend.performance_trend,
  });

  const positive_factors = positive.map((factor) => factor.label);
  const risk_factors = risk.map((factor) => factor.label);
  const recommended_action = buildRecommendation(risk_band, risk);
  let saved_record_id = null;

  if (data.save && data.student_id && data.semester) {
    const { data: inserted, error } = await supabase
      .from("performance_records")
      .insert({
        student_id: data.student_id,
        semester: data.semester,
        prediction_stage: data.prediction_stage,
        attendance_rate: data.attendance_rate,
        avg_test_score: data.avg_test_score,
        study_habits_score: data.study_habits_score,
        previous_semester_average: data.previous_semester_average,
        previous_failed_courses: data.previous_failed_courses,
        assignment_average: data.assignment_average,
        assignments_total: data.assignments_total,
        assignments_completed: data.assignments_completed,
        assignments_missing,
        assignments_late: data.assignments_late,
        assignment_completion_rate: round1(assignment_completion_rate),
        assignment_late_rate: round1(assignment_late_rate),
        recent_assessment_scores: data.recent_assessment_scores,
        earlier_assessment_avg: trend.earlier_assessment_avg,
        recent_assessment_avg: trend.recent_assessment_avg,
        performance_change: trend.performance_change,
        performance_trend: trend.performance_trend,
        engagement_level: data.engagement_level,
        lms_activity_level: data.lms_activity_level,
        course_load: data.course_load,
        weeks_remaining: data.weeks_remaining,
        predicted_score,
        risk_band,
        score_range_low,
        score_range_high,
        positive_factors,
        risk_factors,
        recommended_action,
        model_version: MODEL_VERSION,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    saved_record_id = inserted?.id ?? null;
  }

  return {
    predicted_score,
    risk_band,
    score_range_low,
    score_range_high,
    performance_trend: trend.performance_trend,
    earlier_assessment_avg: trend.earlier_assessment_avg,
    recent_assessment_avg: trend.recent_assessment_avg,
    performance_change: trend.performance_change,
    positive_factors,
    risk_factors,
    recommended_action,
    assignment_completion_rate: round1(assignment_completion_rate),
    assignment_late_rate: round1(assignment_late_rate),
    assignments_missing,
    saved_record_id,
  };
}
