import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { RiskBadge } from "@/components/RiskBadge";
import { ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import { useStudents, useLatestRecordForStudent } from "@/hooks/useAcademicData";
import { predictPerformance } from "@/lib/prediction.functions";
import { SEMESTER_ORDER, PREDICTION_STAGES } from "@/lib/prediction";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/predict")({
  validateSearch: z.object({ student: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Run a Prediction | Student Result Prediction System" },
      {
        name: "description",
        content:
          "Enter a student's academic history, current performance, attendance, study habits, and engagement to get an early-warning prediction with a full explanation.",
      },
      { property: "og:title", content: "Run a Prediction | Student Result Prediction System" },
      {
        property: "og:description",
        content: "The prediction tool for lecturers and academic advisers.",
      },
    ],
  }),
  component: PredictPage,
});

const pct = z
  .number({ message: "Enter a number" })
  .min(0, "Must be 0–100")
  .max(100, "Must be 0–100");
const nonNegInt = z
  .number({ message: "Enter a number" })
  .int("Whole numbers only")
  .min(0, "Cannot be negative");

const formSchema = z
  .object({
    student_id: z.string().uuid({ message: "Select a student" }),
    semester: z.string().trim().min(3, { message: "Enter a semester" }).max(60),
    prediction_stage: z.enum(PREDICTION_STAGES),
    previous_semester_average: pct,
    previous_failed_courses: nonNegInt.max(20),
    attendance_rate: pct,
    avg_test_score: pct,
    assignment_average: pct,
    assignments_total: nonNegInt.max(100),
    assignments_completed: nonNegInt.max(100),
    assignments_late: nonNegInt.max(100),
    recent_assessment_scores: z.array(pct).max(8),
    study_hours: z.number({ message: "Enter a number" }).min(0).max(40),
    consistency: pct,
    engagement_level: z.enum(["Low", "Medium", "High"]),
    lms_activity_level: z.enum(["Low", "Medium", "High"]),
    course_load: z
      .number({ message: "Enter a number" })
      .int()
      .min(1, "At least 1")
      .max(12, "Max 12"),
    weeks_remaining: nonNegInt.max(30),
  })
  .superRefine((v, ctx) => {
    if (v.assignments_completed > v.assignments_total) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assignments_completed"],
        message: "Cannot exceed total assignments",
      });
    }
    if (v.assignments_late > v.assignments_completed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assignments_late"],
        message: "Cannot exceed completed assignments",
      });
    }
  });

type PredictResult = {
  predicted_score: number;
  risk_band: string;
  score_range_low: number;
  score_range_high: number;
  performance_trend: string;
  performance_change: number;
  positive_factors: string[];
  risk_factors: string[];
  recommended_action: string;
  assignment_completion_rate: number;
  studyHabits: number;
  previousAverage: number;
  currentAverage: number;
  recentScores: number[];
};

function parseScores(raw: string): number[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map(Number)
    .filter((n) => !Number.isNaN(n));
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "Improving") return <TrendingUp className="h-4 w-4 text-risk-low" />;
  if (trend === "Declining") return <TrendingDown className="h-4 w-4 text-risk-high" />;
  if (trend === "Stable") return <Minus className="h-4 w-4 text-risk-mid" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border pt-5 first:border-t-0 first:pt-0">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="mt-3 grid gap-5 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function PredictPage() {
  const search = Route.useSearch();
  const students = useStudents();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const predict = useServerFn(predictPerformance);

  const [studentId, setStudentId] = useState(search.student ?? "");
  const [semester, setSemester] = useState(SEMESTER_ORDER[2]!);
  const [stage, setStage] = useState<(typeof PREDICTION_STAGES)[number]>("Week 6");

  const [previousAverage, setPreviousAverage] = useState("");
  const [previousFailed, setPreviousFailed] = useState("0");
  const [autoFilledPrevious, setAutoFilledPrevious] = useState(false);

  const [attendance, setAttendance] = useState("");
  const [testScore, setTestScore] = useState("");
  const [assignmentAverage, setAssignmentAverage] = useState("");
  const [assignmentsTotal, setAssignmentsTotal] = useState("");
  const [assignmentsCompleted, setAssignmentsCompleted] = useState("");
  const [assignmentsLate, setAssignmentsLate] = useState("0");
  const [recentScoresInput, setRecentScoresInput] = useState("");

  const [studyHours, setStudyHours] = useState("");
  const [consistency, setConsistency] = useState("");

  const [engagement, setEngagement] = useState<"Low" | "Medium" | "High">("Medium");
  const [lmsActivity, setLmsActivity] = useState<"Low" | "Medium" | "High">("Medium");

  const [courseLoad, setCourseLoad] = useState("5");
  const [weeksRemaining, setWeeksRemaining] = useState("8");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<PredictResult | null>(null);

  const latestRecord = useLatestRecordForStudent(studentId || undefined);

  // Auto-populate "previous semester average" from the student's most
  // recent saved record, rather than asking the lecturer to re-enter
  // information the system already has (only fills an empty field, so it
  // never overwrites something the lecturer has already typed).
  useEffect(() => {
    if (!latestRecord.data || previousAverage !== "") return;
    const value = latestRecord.data.actual_score ?? latestRecord.data.predicted_score;
    if (value != null) {
      setPreviousAverage(String(value));
      setAutoFilledPrevious(true);
    }
  }, [latestRecord.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const hoursScore = Math.min(100, (values.study_hours / 20) * 100);
      const study_habits_score =
        Math.round((hoursScore * 0.6 + values.consistency * 0.4) * 10) / 10;

      const res = await predict({
        data: {
          student_id: values.student_id,
          semester: values.semester,
          prediction_stage: values.prediction_stage,
          previous_semester_average: values.previous_semester_average,
          previous_failed_courses: values.previous_failed_courses,
          attendance_rate: values.attendance_rate,
          avg_test_score: values.avg_test_score,
          study_habits_score,
          assignment_average: values.assignment_average,
          assignments_total: values.assignments_total,
          assignments_completed: values.assignments_completed,
          assignments_late: values.assignments_late,
          recent_assessment_scores: values.recent_assessment_scores,
          engagement_level: values.engagement_level,
          lms_activity_level: values.lms_activity_level,
          course_load: values.course_load,
          weeks_remaining: values.weeks_remaining,
          save: true,
        },
      });
      return {
        ...res,
        studyHabits: study_habits_score,
        previousAverage: values.previous_semester_average,
        currentAverage: values.avg_test_score,
        recentScores: values.recent_assessment_scores,
      };
    },
    onSuccess: (res) => {
      setResult(res);
      queryClient.invalidateQueries({ queryKey: ["performance_records"] });
      queryClient.invalidateQueries({ queryKey: ["student", studentId] });
      queryClient.invalidateQueries({ queryKey: ["latest-record", studentId] });
      toast.success("Prediction saved to the student's record.");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "The prediction could not be completed.");
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = (s: string) => (s === "" ? NaN : Number(s));
    const parsed = formSchema.safeParse({
      student_id: studentId,
      semester,
      prediction_stage: stage,
      previous_semester_average: num(previousAverage),
      previous_failed_courses: num(previousFailed),
      attendance_rate: num(attendance),
      avg_test_score: num(testScore),
      assignment_average: num(assignmentAverage),
      assignments_total: num(assignmentsTotal),
      assignments_completed: num(assignmentsCompleted),
      assignments_late: num(assignmentsLate),
      recent_assessment_scores: parseScores(recentScoresInput),
      study_hours: num(studyHours),
      consistency: num(consistency),
      engagement_level: engagement,
      lms_activity_level: lmsActivity,
      course_load: num(courseLoad),
      weeks_remaining: num(weeksRemaining),
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
  }

  const field =
    "mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

  return (
    <AppShell
      title="Run a prediction"
      description="Enter this student's academic history, current performance, attendance, study habits, and engagement. The model runs on the server and the full result is saved to their record."
    >
      {students.isLoading ? (
        <LoadingBlock label="Loading the student register…" />
      ) : students.isError ? (
        <ErrorBlock
          message={students.error instanceof Error ? students.error.message : "Unknown error"}
          onRetry={() => students.refetch()}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_440px]">
          <form
            onSubmit={onSubmit}
            className="space-y-5 rounded-xl border border-border bg-card p-6"
            noValidate
          >
            <Section title="Student & Semester">
              <div className="sm:col-span-2">
                <Field label="Student" error={errors["student_id"]}>
                  <select
                    value={studentId}
                    onChange={(e) => {
                      setStudentId(e.target.value);
                      setPreviousAverage("");
                      setAutoFilledPrevious(false);
                    }}
                    className={field}
                  >
                    <option value="">Select a student…</option>
                    {students.data?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} — {s.matric_number} ({s.department})
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Semester" error={errors["semester"]}>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className={field}
                >
                  {SEMESTER_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Current week / stage"
                hint="A 50% average means something different in Week 3 than right before finals."
                error={errors["prediction_stage"]}
              >
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as (typeof PREDICTION_STAGES)[number])}
                  className={field}
                >
                  {PREDICTION_STAGES.filter((s) => s !== "Not specified").map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
            </Section>

            <Section title="Previous Performance">
              <Field
                label="Previous semester average (%)"
                hint={
                  autoFilledPrevious
                    ? "Auto-filled from this student's last saved record — edit if needed."
                    : "Enter their previous semester's overall average."
                }
                error={errors["previous_semester_average"]}
              >
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={previousAverage}
                  onChange={(e) => {
                    setPreviousAverage(e.target.value);
                    setAutoFilledPrevious(false);
                  }}
                  className={field}
                  placeholder="e.g. 62.0"
                />
              </Field>
              <Field label="Previously failed courses" error={errors["previous_failed_courses"]}>
                <input
                  type="number"
                  min={0}
                  max={20}
                  step="1"
                  value={previousFailed}
                  onChange={(e) => setPreviousFailed(e.target.value)}
                  className={field}
                  placeholder="0"
                />
              </Field>
            </Section>

            <Section title="Current Performance">
              <Field label="Current test/exam average (%)" error={errors["avg_test_score"]}>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={testScore}
                  onChange={(e) => setTestScore(e.target.value)}
                  className={field}
                  placeholder="e.g. 58.0"
                />
              </Field>
              <Field label="Assignment average (%)" error={errors["assignment_average"]}>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={assignmentAverage}
                  onChange={(e) => setAssignmentAverage(e.target.value)}
                  className={field}
                  placeholder="e.g. 64.0"
                />
              </Field>
              <Field label="Total assignments given" error={errors["assignments_total"]}>
                <input
                  type="number"
                  min={0}
                  step="1"
                  value={assignmentsTotal}
                  onChange={(e) => setAssignmentsTotal(e.target.value)}
                  className={field}
                  placeholder="e.g. 10"
                />
              </Field>
              <Field
                label="Assignments completed"
                hint="Missing and completion % are calculated automatically."
                error={errors["assignments_completed"]}
              >
                <input
                  type="number"
                  min={0}
                  step="1"
                  value={assignmentsCompleted}
                  onChange={(e) => setAssignmentsCompleted(e.target.value)}
                  className={field}
                  placeholder="e.g. 8"
                />
              </Field>
              <Field label="Of those, submitted late" error={errors["assignments_late"]}>
                <input
                  type="number"
                  min={0}
                  step="1"
                  value={assignmentsLate}
                  onChange={(e) => setAssignmentsLate(e.target.value)}
                  className={field}
                  placeholder="0"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field
                  label="Recent assessment scores"
                  hint="Oldest → most recent, comma-separated (e.g. 48, 55, 66, 78). At least 2 needed to detect a trend."
                  error={errors["recent_assessment_scores"]}
                >
                  <input
                    type="text"
                    value={recentScoresInput}
                    onChange={(e) => setRecentScoresInput(e.target.value)}
                    className={field}
                    placeholder="e.g. 48, 55, 66, 78"
                  />
                </Field>
              </div>
            </Section>

            <Section title="Attendance & Study Habits">
              <Field label="Attendance rate (%)" error={errors["attendance_rate"]}>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={attendance}
                  onChange={(e) => setAttendance(e.target.value)}
                  className={field}
                  placeholder="e.g. 72.5"
                />
              </Field>
              <Field label="Weekly study hours" error={errors["study_hours"]}>
                <input
                  type="number"
                  min={0}
                  max={40}
                  step="0.5"
                  value={studyHours}
                  onChange={(e) => setStudyHours(e.target.value)}
                  className={field}
                  placeholder="e.g. 10"
                />
              </Field>
              <Field label="Study consistency (%)" error={errors["consistency"]}>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="1"
                  value={consistency}
                  onChange={(e) => setConsistency(e.target.value)}
                  className={field}
                  placeholder="e.g. 65"
                />
              </Field>
            </Section>

            <Section title="Engagement">
              <Field label="Class participation" error={errors["engagement_level"]}>
                <select
                  value={engagement}
                  onChange={(e) => setEngagement(e.target.value as "Low" | "Medium" | "High")}
                  className={field}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </Field>
              <Field label="LMS / online learning activity" error={errors["lms_activity_level"]}>
                <select
                  value={lmsActivity}
                  onChange={(e) => setLmsActivity(e.target.value as "Low" | "Medium" | "High")}
                  className={field}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </Field>
            </Section>

            <Section title="Course Information">
              <Field label="Courses currently taken" error={errors["course_load"]}>
                <input
                  type="number"
                  min={1}
                  max={12}
                  step="1"
                  value={courseLoad}
                  onChange={(e) => setCourseLoad(e.target.value)}
                  className={field}
                />
              </Field>
              <Field label="Weeks remaining until final exams" error={errors["weeks_remaining"]}>
                <input
                  type="number"
                  min={0}
                  max={30}
                  step="1"
                  value={weeksRemaining}
                  onChange={(e) => setWeeksRemaining(e.target.value)}
                  className={field}
                />
              </Field>
            </Section>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {mutation.isPending ? "Running the model…" : "Predict and save record"}
            </button>
          </form>

          <aside className="h-fit rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Prediction result
            </h2>
            {mutation.isPending ? (
              <div className="mt-6">
                <LoadingBlock label="The model is scoring this student…" />
              </div>
            ) : result ? (
              <div className="mt-6 space-y-5">
                <div>
                  <p className="font-display text-5xl font-semibold text-foreground">
                    {result.predicted_score.toFixed(1)}%
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Predicted final performance — estimated range{" "}
                    {result.score_range_low.toFixed(0)}–{result.score_range_high.toFixed(0)}%
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <RiskBadge band={result.risk_band} size="lg" />
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-foreground">
                      <TrendIcon trend={result.performance_trend} />
                      {result.performance_trend}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-lg bg-secondary p-3 text-center">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Previous
                    </p>
                    <p className="font-display text-lg font-semibold text-foreground">
                      {result.previousAverage.toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Current
                    </p>
                    <p className="font-display text-lg font-semibold text-foreground">
                      {result.currentAverage.toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Predicted
                    </p>
                    <p className="font-display text-lg font-semibold text-foreground">
                      {result.predicted_score.toFixed(0)}%
                    </p>
                  </div>
                </div>

                {result.recentScores.length >= 2 && (
                  <div className="h-24 rounded-lg border border-border p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={result.recentScores.map((v, i) => ({ i: i + 1, v }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="i" hide />
                        <YAxis domain={[0, 100]} hide />
                        <Tooltip
                          formatter={(v: number) => [`${v}%`, "Score"]}
                          labelFormatter={() => "Assessment"}
                        />
                        <Line
                          type="monotone"
                          dataKey="v"
                          stroke="var(--accent)"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">Assignment completion</span>
                    <span className="text-muted-foreground">
                      {result.assignment_completion_rate.toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${Math.min(100, result.assignment_completion_rate)}%` }}
                    />
                  </div>
                </div>

                {result.positive_factors.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Positive factors
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {result.positive_factors.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-risk-low" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.risk_factors.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Risk factors
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {result.risk_factors.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-risk-high" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="rounded-lg border border-border bg-secondary/60 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Recommended action
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                    {result.recommended_action}
                  </p>
                </div>

                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  This is a model estimate based on the data entered, not a guarantee of the
                  student's eventual result. It is meant to support, not replace, academic judgment.
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => navigate({ to: "/students/$id", params: { id: studentId } })}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Open student profile
                  </button>
                  <button
                    onClick={() => setResult(null)}
                    className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                  >
                    Run another
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-lg border border-dashed border-border p-6 text-sm leading-relaxed text-muted-foreground">
                <p>
                  Fill in the form to score a student. The prediction uses a Ridge regression model,
                  trained in Python with scikit-learn on 13 academic features, selected over Linear
                  Regression, Random Forest, and Gradient Boosting alternatives for its stable,
                  lecturer-explainable coefficients.
                </p>
                <p className="mt-3">
                  Results below 40% are flagged <strong className="text-risk-high">At Risk</strong>,
                  40–59% <strong className="text-risk-mid">Needs Support</strong>, and 60% or above{" "}
                  <strong className="text-risk-low">On Track</strong>.
                </p>
                <Link
                  to="/about"
                  className="mt-3 inline-block font-medium text-accent hover:underline"
                >
                  Read how the model was built →
                </Link>
              </div>
            )}
          </aside>
        </div>
      )}
    </AppShell>
  );
}
