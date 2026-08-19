import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Users, AlertTriangle, LifeBuoy, CheckCircle2, Gauge } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RiskBadge } from "@/components/RiskBadge";
import { ErrorBlock, LoadingBlock, EmptyBlock } from "@/components/StateBlocks";
import { useRecords } from "@/hooks/useAcademicData";
import { riskChartColor, sortSemesters, RISK_BANDS } from "@/lib/prediction";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | Student Result Prediction System" },
      {
        name: "description",
        content:
          "Cohort overview: risk-band distribution, average predicted score by semester and the students most at risk of failing.",
      },
      { property: "og:title", content: "Dashboard | Student Result Prediction System" },
      {
        property: "og:description",
        content: "Cohort-level early-warning overview for lecturers and academic advisers.",
      },
    ],
  }),
  component: Dashboard,
});

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: React.ElementType;
  tone?: "default" | "high" | "mid" | "low";
}) {
  const toneClass =
    tone === "high"
      ? "text-risk-high"
      : tone === "mid"
        ? "text-risk-mid"
        : tone === "low"
          ? "text-risk-low"
          : "text-accent";
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <Icon className={`h-4 w-4 ${toneClass}`} />
      </div>
      <p className="mt-3 font-display text-3xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function Dashboard() {
  const { data, isLoading, isError, error, refetch } = useRecords();

  return (
    <AppShell
      title="Cohort dashboard"
      description="Live overview of every tracked student's latest prediction, drawn from the department's performance records."
    >
      {isLoading ? (
        <LoadingBlock label="Loading cohort predictions…" />
      ) : isError ? (
        <ErrorBlock
          message={error instanceof Error ? error.message : "Unknown error"}
          onRetry={() => refetch()}
        />
      ) : !data || data.length === 0 ? (
        <EmptyBlock
          title="No performance records yet"
          hint="Once predictions are recorded for students, cohort statistics will appear here."
        >
          <Link
            to="/predict"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Run the first prediction
          </Link>
        </EmptyBlock>
      ) : (
        <DashboardContent records={data} />
      )}
    </AppShell>
  );
}

function DashboardContent({
  records,
}: {
  records: NonNullable<ReturnType<typeof useRecords>["data"]>;
}) {
  // Latest record per student defines their current standing.
  const latestByStudent = new Map<string, (typeof records)[number]>();
  for (const r of records) {
    const existing = latestByStudent.get(r.student_id);
    if (!existing || sortSemesters(existing.semester, r.semester) < 0)
      latestByStudent.set(r.student_id, r);
  }
  const latest = [...latestByStudent.values()];

  const counts = RISK_BANDS.map((band) => ({
    band,
    count: latest.filter((r) => r.risk_band === band).length,
  }));

  const avgPredicted =
    records.reduce((sum, r) => sum + Number(r.predicted_score), 0) / records.length;

  const semesters = [...new Set(records.map((r) => r.semester))].sort(sortSemesters);
  const trend = semesters.map((sem) => {
    const rows = records.filter((r) => r.semester === sem);
    return {
      semester: sem.replace("2024/2025 ", "24/25 ").replace("2025/2026 ", "25/26 "),
      average: Number(
        (rows.reduce((s, r) => s + Number(r.predicted_score), 0) / rows.length).toFixed(1),
      ),
      records: rows.length,
    };
  });

  const mostAtRisk = [...latest]
    .sort((a, b) => Number(a.predicted_score) - Number(b.predicted_score))
    .slice(0, 8);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Students tracked"
          value={latest.length}
          hint="With at least one record"
          icon={Users}
        />
        <StatCard
          label="At Risk"
          value={counts[0]!.count}
          hint="Predicted below 40%"
          icon={AlertTriangle}
          tone="high"
        />
        <StatCard
          label="Needs Support"
          value={counts[1]!.count}
          hint="Predicted 40–59%"
          icon={LifeBuoy}
          tone="mid"
        />
        <StatCard
          label="On Track"
          value={counts[2]!.count}
          hint="Predicted 60% and above"
          icon={CheckCircle2}
          tone="low"
        />
        <StatCard
          label="Average prediction"
          value={`${avgPredicted.toFixed(1)}%`}
          hint={`Across all ${records.length} records`}
          icon={Gauge}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Risk-band distribution
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Current standing of each tracked student, based on their most recent semester record.
          </p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={counts} margin={{ top: 8, right: 12, bottom: 28, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="band"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  label={{
                    value: "Risk band",
                    position: "insideBottom",
                    offset: -16,
                    fill: "var(--muted-foreground)",
                    fontSize: 12,
                  }}
                />
                <YAxis
                  allowDecimals={false}
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  label={{
                    value: "Students",
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
                  formatter={(v: number) => [`${v} students`, "Count"]}
                />
                <Bar dataKey="count" name="Students" radius={[6, 6, 0, 0]}>
                  {counts.map((c) => (
                    <Cell key={c.band} fill={riskChartColor(c.band)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Average predicted score by semester
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cohort trend across the semesters held in the database.
          </p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 12, bottom: 28, left: 4 }}>
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
                    value: "Predicted score (%)",
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
                  dataKey="average"
                  name="Average predicted score"
                  stroke="var(--chart-2)"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-6">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Students needing attention first
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The eight lowest current predictions in the cohort.
            </p>
          </div>
          <Link to="/students" className="text-sm font-medium text-accent hover:underline">
            View full register →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-semibold">Student</th>
                <th className="px-6 py-3 font-semibold">Department</th>
                <th className="px-6 py-3 font-semibold">Semester</th>
                <th className="px-6 py-3 font-semibold">Predicted</th>
                <th className="px-6 py-3 font-semibold">Risk band</th>
              </tr>
            </thead>
            <tbody>
              {mostAtRisk.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-border transition-colors hover:bg-secondary/60"
                >
                  <td className="px-6 py-3">
                    <Link
                      to="/students/$id"
                      params={{ id: r.student_id }}
                      className="font-medium text-foreground hover:text-accent"
                    >
                      {r.student?.full_name ?? "Unknown student"}
                    </Link>
                    <p className="text-xs text-muted-foreground">{r.student?.matric_number}</p>
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">{r.student?.department}</td>
                  <td className="px-6 py-3 text-muted-foreground">{r.semester}</td>
                  <td className="px-6 py-3 font-semibold text-foreground">
                    {Number(r.predicted_score).toFixed(1)}%
                  </td>
                  <td className="px-6 py-3">
                    <RiskBadge band={r.risk_band} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
