-- Attendance rate and study habits score are no longer required inputs on
-- the Predict form (they're less impactful to the prediction than the
-- other fields and can be safely left blank, falling back to a training-
-- set average in the model). The database must allow NULL to store what a
-- lecturer actually entered, rather than forcing every prediction to
-- pretend a value was provided.

ALTER TABLE public.performance_records
  ALTER COLUMN attendance_rate DROP NOT NULL,
  ALTER COLUMN study_habits_score DROP NOT NULL;
