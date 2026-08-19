"""
Generates the (expanded, v2) sample dataset for the Student Result
Prediction System's early-warning model.

Adds previous-semester history, current assignment activity, a recent
assessment trend, academic engagement, and course/semester context to the
original three-input model (attendance, test average, study habits).

Because access to a real institutional dataset was not available, this
script builds a synthetic dataset of 400 student-semester records with
deliberately realistic relationships between the inputs and the final
score (informed by the literature reviewed in Chapter 2), plus controlled
random noise so the data is not perfectly clean. Features with a weak or
no genuine linear relationship to outcome (course load, weeks remaining)
are generated independently of the target, so the model is not credited
with signal that was never actually built into the data — this is stated
explicitly in ml/metrics_report.txt.

Run: python generate_dataset.py
Output: dataset.csv (400 rows)
"""

import numpy as np
import pandas as pd

RANDOM_SEED = 42
N_RECORDS = 400


def clip(values, low=0.0, high=100.0):
    return np.clip(values, low, high)


def main():
    rng = np.random.default_rng(RANDOM_SEED)
    n = N_RECORDS

    # --- Previous academic performance -----------------------------------
    previous_semester_average = clip(rng.normal(loc=58, scale=19, size=n))
    fail_lambda = clip(3.2 - previous_semester_average / 22, 0.05, 4)
    previous_failed_courses = rng.poisson(fail_lambda).clip(0, 6)

    # --- Attendance & study behaviour -------------------------------------
    attendance_rate = clip(
        0.25 * previous_semester_average + rng.normal(loc=40, scale=18, size=n)
    )
    weekly_study_hours = clip(
        0.15 * previous_semester_average + rng.normal(loc=6, scale=5, size=n), 0, 40
    )
    study_consistency = clip(
        0.3 * attendance_rate + rng.normal(loc=30, scale=20, size=n)
    )
    study_habits_score = clip(
        np.minimum(100, (weekly_study_hours / 20) * 100) * 0.6 + study_consistency * 0.4
    )

    # --- Current performance ------------------------------------------------
    avg_test_score = clip(
        0.35 * previous_semester_average
        + 0.25 * attendance_rate
        + 0.15 * study_habits_score
        + rng.normal(loc=8, scale=13, size=n)
    )
    assignment_average = clip(
        0.5 * avg_test_score + rng.normal(loc=15, scale=14, size=n)
    )

    assignments_total = rng.integers(6, 16, size=n)
    completion_p = clip(0.4 + 0.006 * study_habits_score, 0.05, 0.99)
    assignments_completed = np.array(
        [rng.binomial(t, p) for t, p in zip(assignments_total, completion_p)]
    )
    assignments_missing = assignments_total - assignments_completed
    late_p = clip(0.35 - 0.003 * attendance_rate, 0.02, 0.6)
    assignments_late = np.array(
        [rng.binomial(c, p) for c, p in zip(assignments_completed, late_p)]
    )

    assignment_completion_rate = (assignments_completed / assignments_total) * 100
    assignment_missing_rate = (assignments_missing / assignments_total) * 100
    assignment_late_rate = (assignments_late / assignments_total) * 100

    # --- Recent assessment trend --------------------------------------------
    base = avg_test_score
    drift = rng.normal(loc=0, scale=6, size=n)
    assessments = np.stack(
        [
            clip(base - 1.5 * drift + rng.normal(0, 5, size=n)),
            clip(base - 0.5 * drift + rng.normal(0, 5, size=n)),
            clip(base + 0.5 * drift + rng.normal(0, 5, size=n)),
            clip(base + 1.5 * drift + rng.normal(0, 5, size=n)),
        ],
        axis=1,
    )
    earlier_assessment_avg = assessments[:, :2].mean(axis=1)
    recent_assessment_avg = assessments[:, 2:].mean(axis=1)
    performance_change = recent_assessment_avg - earlier_assessment_avg

    # --- Engagement ---------------------------------------------------------
    engagement_p = clip(0.3 + 0.006 * attendance_rate, 0.05, 0.95)
    engagement_score = rng.binomial(2, engagement_p, size=n)
    lms_p = clip(0.3 + 0.005 * study_habits_score, 0.05, 0.95)
    lms_activity_score = rng.binomial(2, lms_p, size=n)

    # --- Course/semester context (kept independent of the target) ---------
    course_load = rng.integers(3, 9, size=n)
    weeks_remaining = rng.integers(1, 17, size=n)

    # --- Target: final_score --------------------------------------------
    noise = rng.normal(loc=0, scale=6.0, size=n)
    final_score = clip(
        4
        + 0.16 * previous_semester_average
        + 0.28 * avg_test_score
        + 0.14 * attendance_rate
        + 0.10 * assignment_completion_rate
        + 0.10 * study_habits_score
        + 0.55 * performance_change
        + 2.2 * engagement_score
        + 1.6 * lms_activity_score
        - 2.4 * previous_failed_courses
        - 0.06 * assignment_missing_rate
        + noise
    )

    df = pd.DataFrame(
        {
            "previous_semester_average": previous_semester_average.round(1),
            "previous_failed_courses": previous_failed_courses.astype(int),
            "attendance_rate": attendance_rate.round(1),
            "avg_test_score": avg_test_score.round(1),
            "study_habits_score": study_habits_score.round(1),
            "assignment_average": assignment_average.round(1),
            "assignments_total": assignments_total.astype(int),
            "assignments_completed": assignments_completed.astype(int),
            "assignments_missing": assignments_missing.astype(int),
            "assignments_late": assignments_late.astype(int),
            "assignment_completion_rate": assignment_completion_rate.round(1),
            "assignment_missing_rate": assignment_missing_rate.round(1),
            "assignment_late_rate": assignment_late_rate.round(1),
            "recent_assessment_avg": recent_assessment_avg.round(1),
            "earlier_assessment_avg": earlier_assessment_avg.round(1),
            "performance_change": performance_change.round(1),
            "engagement_score": engagement_score.astype(int),
            "lms_activity_score": lms_activity_score.astype(int),
            "course_load": course_load.astype(int),
            "weeks_remaining": weeks_remaining.astype(int),
            "final_score": final_score.round(1),
        }
    )

    df.to_csv("dataset.csv", index=False)
    print(f"Wrote {len(df)} records to dataset.csv")
    print(df.describe().round(1).to_string())


if __name__ == "__main__":
    main()
