-- Expands performance_records to support the v2 early-warning model:
-- previous-semester history, current assignment activity, a recent
-- assessment trend, academic engagement, course/semester context, and
-- full explainability + prediction-history metadata.

ALTER TABLE public.performance_records
  ADD COLUMN previous_semester_average numeric,
  ADD COLUMN previous_failed_courses integer,
  ADD COLUMN assignment_average numeric,
  ADD COLUMN assignments_total integer,
  ADD COLUMN assignments_completed integer,
  ADD COLUMN assignments_missing integer,
  ADD COLUMN assignments_late integer,
  ADD COLUMN assignment_completion_rate numeric,
  ADD COLUMN assignment_late_rate numeric,
  ADD COLUMN recent_assessment_scores numeric[] NOT NULL DEFAULT '{}',
  ADD COLUMN earlier_assessment_avg numeric,
  ADD COLUMN recent_assessment_avg numeric,
  ADD COLUMN performance_change numeric,
  ADD COLUMN performance_trend text,
  ADD COLUMN engagement_level text,
  ADD COLUMN lms_activity_level text,
  ADD COLUMN course_load integer,
  ADD COLUMN weeks_remaining integer,
  ADD COLUMN prediction_stage text NOT NULL DEFAULT 'Not specified',
  ADD COLUMN score_range_low numeric,
  ADD COLUMN score_range_high numeric,
  ADD COLUMN positive_factors text[] NOT NULL DEFAULT '{}',
  ADD COLUMN risk_factors text[] NOT NULL DEFAULT '{}',
  ADD COLUMN recommended_action text,
  ADD COLUMN model_version text NOT NULL DEFAULT 'v2';

-- Existing rows were saved by the original v1 (3-input) model — label them
-- honestly rather than implying they used the expanded model.
UPDATE public.performance_records SET model_version = 'v1' WHERE model_version = 'v2';

COMMENT ON COLUMN public.performance_records.performance_trend IS 'Improving | Stable | Declining | Insufficient data';
COMMENT ON COLUMN public.performance_records.engagement_level IS 'Low | Medium | High';
COMMENT ON COLUMN public.performance_records.lms_activity_level IS 'Low | Medium | High';
COMMENT ON COLUMN public.performance_records.prediction_stage IS 'Week 3 | Week 6 | Week 10 | Near Final Exams | Not specified';
