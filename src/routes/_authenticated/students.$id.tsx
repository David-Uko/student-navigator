import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RiskBadge } from "@/components/RiskBadge";
import { ErrorBlock, LoadingBlock, EmptyBlock } from "@/components/StateBlocks";
import { useStudent } from "@/hooks/useAcademicData";
import { sortSemesters } from "@/lib/prediction";

export const Route = createFileRoute("/_authenticated/students/$id")({
  head: () => ({
    meta: [
      { title: "Student Profile | Student Result Prediction System" },
      {
        name: "description",
        content:
          "Individual student profile: semester-by-semester performance records, predicted score trend and current risk band.",
      },
      { property: "og:title", content: "Student Profile | Student Result Prediction System" },
      {
        property: "og:description",
        content: "Semester history and predicted score trend for a single tracked student.",
      },
    ],
  }),
  component: StudentProfile,
});

function StudentProfile() {
  const { id } = Route.useParams();
  const { data, isLoading, isError, error, refetch } = useStudent(id);

  if (isLoading) {
    return (
      <AppShell title="Student profile" description="Loading this student's performance history.">
        <LoadingBlock label="Loading student profile…" />
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell title="Student profile" description="This student's performance history.">
        <ErrorBlock
          message={error instanceof Error ? error.message : "Unknown error"}
          onRetry={() => refetch()}
        />
      </AppShell>
    );
  }

  const student = data?.student;
  if (!student) {
    return (
      <AppShell title="Student not found" description="No student matches this identifier.">
        <EmptyBlock
          title="Student not found"
          hint="The record may have been removed. Return to the register to pick another student."
        >
          <Link
            to="/students"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Back to register
          </Link>
        </EmptyBlock>
      </AppShell>
    );
  }

  const records = [...(data?.records ?? [])].sort((a, b) => {
    const bySemester = sortSemesters(a.semester, b.semester);
    if (bySemester !== 0) return bySemester;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
  const current = records[records.length - 1];

  const chartData = records.map((r, i) => ({
    semester:
      r.semester.replace("2024/2025 ", "24/25 ").replace("2025/2026 ", "25/26 ") +
      (r.prediction_stage && r.prediction_stage !== "Not specified"
        ? ` · ${r.prediction_stage}`
        : ` #${i + 1}`),
    predicted: Number(Number(r.predicted_score).toFixed(1)),
    actual: r.actual_score === null ? null : Number(Number(r.actual_score).toFixed(1)),
  }));

  return (
    <AppShell
      title={student.full_name}
      description={`${student.matric_number} · ${student.department} · ${student.level}`}
      actions={
        <div className="flex gap-2">
          <Link
            to="/students"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" /> Register
          </Link>
          <Link
            to="/predict"
            search={{ student: student.id }}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Add new record
          </Link>
        </div>
      }
    >
      <div className="space-y-8">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Current standing
            </p>
            {current ? (
              <>
                <p className="mt-4 font-display text-5xl font-semibold text-foreground">
                  {Number(current.predicted_score).toFixed(1)}%
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Predicted · {current.semester}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <RiskBadge band={current.risk_band} size="lg" />
                  {current.performance_trend && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-foreground">
                      {current.performance_trend}
                    </span>
                  )}
                </div>
                <dl className="mt-6 space-y-3 text-sm">
                  {[
                    ["Attendance rate", current.attendance_rate],
                    ["Average test score", current.avg_test_score],
                    ["Study habits score", current.study_habits_score],
                  ].map(([label, value]) => (
                    <div
                      key={String(label)}
                      className="flex items-center justify-between border-b border-border pb-2"
                    >
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="font-medium text-foreground">{Number(value).toFixed(1)}%</dd>
                    </div>
                  ))}
                </dl>
                {current.recommended_action && (
                  <div className="mt-4 rounded-lg border border-border bg-secondary/60 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Recommended action
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-foreground">
                      {current.recommended_action}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No performance record has been captured for this student yet.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Predicted score over time
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Each point is one semester's prediction; the dashed line shows the actual score where
              it has been recorded.
            </p>
            {chartData.length === 0 ? (
              <EmptyBlock
                title="Nothing to chart yet"
                hint="Add a prediction to start this student's trend line."
              />
            ) : (
              <div className="mt-6 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 28, left: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="semester"
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                      label={{
                        value: "Semester",
                        position: "insideBottom",
                        offset: -16,
                        fill: "var(--muted-foreground)",
                        fontSize: 12,
                      }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                      label={{
                        value: "Score (%)",
                        angle: -90,
                        position: "insideLeft",
                        fill: "var(--muted-foreground)",
                        fontSize: 12,
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      name="Predicted score"
                      stroke="var(--chart-2)"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      name="Actual score"
                      stroke="var(--chart-4)"
                      strokeWidth={2}
                      strokeDasharray="5 4"
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-6">
            <h2 className="font-display text-lg font-semibold text-foreground">Semester history</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Every performance record captured for {student.full_name}.
            </p>
          </div>
          {records.length === 0 ? (
            <div className="p-6">
              <EmptyBlock
                title="No records yet"
                hint="Use “Add new record” to capture this student's first prediction."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Semester</th>
                    <th className="px-6 py-3 font-semibold">Stage</th>
                    <th className="px-6 py-3 font-semibold">Attendance</th>
                    <th className="px-6 py-3 font-semibold">Test average</th>
                    <th className="px-6 py-3 font-semibold">Study habits</th>
                    <th className="px-6 py-3 font-semibold">Predicted</th>
                    <th className="px-6 py-3 font-semibold">Actual</th>
                    <th className="px-6 py-3 font-semibold">Trend</th>
                    <th className="px-6 py-3 font-semibold">Risk band</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-6 py-3 font-medium text-foreground">{r.semester}</td>
                      <td className="px-6 py-3 text-muted-foreground">{r.prediction_stage}</td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {Number(r.attendance_rate).toFixed(1)}%
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {Number(r.avg_test_score).toFixed(1)}%
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {Number(r.study_habits_score).toFixed(1)}%
                      </td>
                      <td className="px-6 py-3 font-semibold text-foreground">
                        {Number(r.predicted_score).toFixed(1)}%
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {r.actual_score === null
                          ? "Not yet released"
                          : `${Number(r.actual_score).toFixed(1)}%`}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {r.performance_trend ?? "—"}
                      </td>
                      <td className="px-6 py-3">
                        <RiskBadge band={r.risk_band} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
