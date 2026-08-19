import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  Line,
  ComposedChart,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { ErrorBlock, LoadingBlock, EmptyBlock } from "@/components/StateBlocks";
import { useRecords } from "@/hooks/useAcademicData";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Insights | Student Result Prediction System" },
      {
        name: "description",
        content:
          "Distribution of attendance and test scores, study habits against predicted score, and predicted versus actual results.",
      },
      { property: "og:title", content: "Reports & Insights | Student Result Prediction System" },
      {
        property: "og:description",
        content: "Aggregate analysis of the cohort and a visual check on model accuracy.",
      },
    ],
  }),
  component: Reports,
});

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
};

function bucket(values: number[]) {
  const buckets = [
    { range: "0–19", min: 0, max: 20 },
    { range: "20–39", min: 20, max: 40 },
    { range: "40–59", min: 40, max: 60 },
    { range: "60–79", min: 60, max: 80 },
    { range: "80–100", min: 80, max: 101 },
  ];
  return buckets.map((b) => ({
    range: b.range,
    count: values.filter((v) => v >= b.min && v < b.max).length,
  }));
}

function Reports() {
  const { data, isLoading, isError, error, refetch } = useRecords();

  return (
    <AppShell
      title="Reports & insights"
      description="Aggregate analysis across every performance record in the database, including a visual check on how closely predictions match released results."
    >
      {isLoading ? (
        <LoadingBlock label="Building the reports…" />
      ) : isError ? (
        <ErrorBlock
          message={error instanceof Error ? error.message : "Unknown error"}
          onRetry={() => refetch()}
        />
      ) : !data || data.length === 0 ? (
        <EmptyBlock
          title="No records to analyse"
          hint="Reports appear once performance records exist in the database."
        />
      ) : (
        <ReportsContent records={data} />
      )}
    </AppShell>
  );
}

function ReportsContent({
  records,
}: {
  records: NonNullable<ReturnType<typeof useRecords>["data"]>;
}) {
  const attendance = bucket(records.map((r) => Number(r.attendance_rate)));
  const tests = bucket(records.map((r) => Number(r.avg_test_score)));
  const scatter = records.map((r) => ({
    study: Number(Number(r.study_habits_score).toFixed(1)),
    predicted: Number(Number(r.predicted_score).toFixed(1)),
  }));
  const compared = records
    .filter((r) => r.actual_score !== null)
    .map((r) => ({
      predicted: Number(Number(r.predicted_score).toFixed(1)),
      actual: Number(Number(r.actual_score).toFixed(1)),
    }))
    .sort((a, b) => a.predicted - b.predicted);

  const meanAbsError =
    compared.length > 0
      ? compared.reduce((s, r) => s + Math.abs(r.predicted - r.actual), 0) / compared.length
      : 0;

  const lowAttendance = attendance[0]!.count + attendance[1]!.count;
  const lowTests = tests[0]!.count + tests[1]!.count;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Distribution of attendance rates
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            How many records fall into each attendance band.
          </p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendance} margin={{ top: 8, right: 12, bottom: 28, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="range"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  label={{
                    value: "Attendance rate (%)",
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
                    value: "Records",
                    angle: -90,
                    position: "insideLeft",
                    fill: "var(--muted-foreground)",
                    fontSize: 12,
                  }}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="count"
                  name="Number of records"
                  fill="var(--chart-1)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {lowAttendance} of {records.length} records show attendance below 40%. Attendance is the
            most reliably recorded input in the dataset, and this tail is where nearly every At Risk
            prediction originates — a student who is absent this often rarely recovers through
            revision alone.
          </p>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Distribution of average test scores
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Continuous-assessment performance across all records.
          </p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tests} margin={{ top: 8, right: 12, bottom: 28, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="range"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  label={{
                    value: "Average test score (%)",
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
                    value: "Records",
                    angle: -90,
                    position: "insideLeft",
                    fill: "var(--muted-foreground)",
                    fontSize: 12,
                  }}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="count"
                  name="Number of records"
                  fill="var(--chart-2)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Test scores sit lower than attendance overall, with {lowTests} records under 40%. In the
            trained model, current test average carries one of the strongest per-point effects among
            the continuous inputs — behind only previous-semester average in overall pull on the
            prediction — which makes early tests one of the most valuable intervention signals in
            the semester.
          </p>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Study habits against predicted score
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Each point is one semester record for one student.
        </p>
        <div className="mt-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 20, bottom: 28, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                type="number"
                dataKey="study"
                name="Study habits"
                domain={[0, 100]}
                stroke="var(--muted-foreground)"
                fontSize={12}
                label={{
                  value: "Study habits score (%)",
                  position: "insideBottom",
                  offset: -16,
                  fill: "var(--muted-foreground)",
                  fontSize: 12,
                }}
              />
              <YAxis
                type="number"
                dataKey="predicted"
                name="Predicted"
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
              <ZAxis range={[60, 60]} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: "3 3" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Scatter name="Performance record" data={scatter} fill="var(--chart-4)" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          The cloud slopes upward: students reporting more consistent study hours are predicted to
          score higher. The spread around that slope is wide, however, which is exactly what the
          model expects — study habits is one of thirteen inputs now, alongside attendance,
          assignment completion, and recent performance trend, so strong study alone cannot rescue a
          record with very low attendance and weak tests.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Predicted versus actual scores
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Records where the real result has been released ({compared.length} of {records.length}).
        </p>
        <div className="mt-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={compared} margin={{ top: 8, right: 20, bottom: 28, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="predicted"
                type="number"
                domain={[0, 100]}
                stroke="var(--muted-foreground)"
                fontSize={12}
                label={{
                  value: "Predicted score (%)",
                  position: "insideBottom",
                  offset: -16,
                  fill: "var(--muted-foreground)",
                  fontSize: 12,
                }}
              />
              <YAxis
                type="number"
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
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="predicted"
                name="Perfect-accuracy reference"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={false}
              />
              <Scatter dataKey="actual" name="Actual score released" fill="var(--chart-5)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Points sitting on the navy reference line are perfect predictions; points above it are
          students who outperformed the model, and points below it underperformed. The mean absolute
          error across these {compared.length} records is{" "}
          <strong className="text-foreground">{meanAbsError.toFixed(1)} percentage points</strong>,
          which is accurate enough to rank students for intervention but not to forecast an exact
          grade.
        </p>
      </section>
    </div>
  );
}
