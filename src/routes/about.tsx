import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Methodology | Student Result Prediction System" },
      {
        name: "description",
        content:
          "How the Student Result Prediction System works: the inputs, the model comparison, the evaluation results and its limitations.",
      },
      { property: "og:title", content: "Methodology | Student Result Prediction System" },
      {
        property: "og:description",
        content:
          "A plain-language account of the prediction model, the variables it uses and the limits of the approach.",
      },
    ],
  }),
  component: About,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl font-semibold text-foreground">{title}</h2>
      <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function About() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          Project methodology
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-foreground">
          About the Student Result Prediction System
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          This is a final-year Computer Science project: an academic early-warning and
          decision-support tool. It does not try to know a student's future with certainty — it
          combines the academic signals a department already has, and turns them into an early,
          explainable estimate a lecturer can act on.
        </p>

        <Section title="The problem it solves">
          <p>
            Academic support in most departments is reactive. A student's difficulty becomes visible
            at the point of failure — after the examination, when the grade is already recorded.
            Advisers then spend their time on remediation and probation meetings rather than
            prevention.
          </p>
          <p>
            The warning signs usually appear much earlier: attendance drops, assignments go missing,
            assessment scores start trending down. This system brings those signals together — plus
            the student's academic history, engagement, and course context — into a single early
            prediction, at whichever stage of the semester the department wants to check in.
          </p>
        </Section>

        <Section title="What goes into a prediction">
          <p>
            Thirteen inputs feed the model, grouped the same way they're grouped on the Predict
            page:
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm">
            <li>
              <strong className="text-foreground">Previous performance:</strong> previous semester
              average, previously failed courses
            </li>
            <li>
              <strong className="text-foreground">Current performance:</strong> current test/exam
              average, assignment average, assignment completion rate, late-submission rate
            </li>
            <li>
              <strong className="text-foreground">Recent trend:</strong> the change between a
              student's earlier and most recent assessment scores — calculated automatically from
              the scores entered, not selected manually
            </li>
            <li>
              <strong className="text-foreground">Attendance &amp; study habits:</strong> attendance
              rate, and a composite study-habits score from weekly study hours and consistency
            </li>
            <li>
              <strong className="text-foreground">Engagement:</strong> class participation and
              LMS/online activity, each Low/Medium/High
            </li>
            <li>
              <strong className="text-foreground">Course context:</strong> course load and weeks
              remaining until final exams
            </li>
          </ul>
          <p>
            Two derived numbers are calculated automatically rather than asked of the lecturer:
            assignment completion/late rates from the raw assignment counts, and the recent
            performance trend from the assessment scores entered.
          </p>
        </Section>

        <Section title="Comparing models">
          <p>
            Four regression models were trained on the same 400-record dataset and the same 80/20
            train/test split, and evaluated on data none of them saw during training: Linear
            Regression, Ridge Regression, Random Forest, and Gradient Boosting.
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-semibold">Model</th>
                  <th className="px-4 py-2 font-semibold">R²</th>
                  <th className="px-4 py-2 font-semibold">MAE</th>
                  <th className="px-4 py-2 font-semibold">At Risk recall</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                <tr className="border-t border-border bg-accent/10">
                  <td className="px-4 py-2 font-medium">Ridge Regression (deployed)</td>
                  <td className="px-4 py-2">0.869</td>
                  <td className="px-4 py-2">4.37</td>
                  <td className="px-4 py-2">0.71</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-2">Linear Regression</td>
                  <td className="px-4 py-2">0.869</td>
                  <td className="px-4 py-2">4.37</td>
                  <td className="px-4 py-2">0.71</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-2">Gradient Boosting</td>
                  <td className="px-4 py-2">0.765</td>
                  <td className="px-4 py-2">5.50</td>
                  <td className="px-4 py-2">0.71</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-2">Random Forest</td>
                  <td className="px-4 py-2">0.748</td>
                  <td className="px-4 py-2">5.79</td>
                  <td className="px-4 py-2">0.62</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            <strong className="text-foreground">
              Ridge Regression was selected for deployment.
            </strong>{" "}
            It matched Linear Regression's accuracy while being more stable when input features are
            correlated with each other (several of these thirteen inputs are) — which matters here
            because the model's own coefficients are what the app shows lecturers as an explanation.
            The tree-based models were not worse across the board, but a Random Forest or Gradient
            Boosting model is a large ensemble of decision trees, not a short list of numbers —
            using one would mean either running Python in production (which this application
            deliberately avoids, see below) or porting dozens of trees into the web app's server
            code, for models that did not outperform the simpler option here.
          </p>
        </Section>

        <Section title="How the model works">
          <p>
            The deployed model is a <strong className="text-foreground">Ridge Regression</strong>,
            trained offline in Python with scikit-learn. Every coefficient below was learned from
            data, not chosen by hand:
          </p>
          <pre className="overflow-x-auto rounded-lg border border-border bg-secondary p-4 text-xs leading-relaxed text-foreground">
            {`predicted_score = -0.21
  + (0.1501 × previous_semester_average)
  + (-2.3203 × previous_failed_courses)
  + (0.1290 × attendance_rate)
  + (0.2383 × avg_test_score)
  + (0.1117 × study_habits_score)
  + (0.0212 × assignment_average)
  + (0.1756 × assignment_completion_rate)
  + (-0.0503 × assignment_late_rate)
  + (0.5239 × performance_change)
  + (1.9150 × engagement_score)      // Low=0, Medium=1, High=2
  + (2.7689 × lms_activity_score)    // Low=0, Medium=1, High=2
  + (-0.1535 × course_load)
  + (-0.1210 × weeks_remaining)`}
          </pre>
          <p>
            The result is clamped to 0–100, shown with an estimated range of ± the model's test-set
            error (±5.6 points) rather than a single falsely-precise number, and classified into a
            risk band: <strong className="text-risk-high">At Risk</strong> below 40,{" "}
            <strong className="text-risk-mid">Needs Support</strong> from 40 to 59, and{" "}
            <strong className="text-risk-low">On Track</strong> from 60 upward — the same thresholds
            as the original model, unchanged. The calculation runs on the server, not in the
            browser, so every adviser sees the same model, and it runs without a Python process in
            production: the training happens offline in Python, and only the coefficients above are
            shipped into the application.
          </p>
        </Section>

        <Section title="How risk bands are evaluated">
          <p>
            Because the predicted score is ultimately used as a risk band, not just a number, the
            model is also evaluated as a 3-way classifier (At Risk / Needs Support / On Track) on
            the same held-out test data. Overall risk-band accuracy is 87.5%. The most important
            number in that breakdown for an early-warning system is{" "}
            <strong className="text-foreground">At Risk recall — 0.71</strong>: of the students who
            were genuinely at risk in the test set, 71% were correctly flagged. The remaining 29%
            were the model's most costly error (predicted as "Needs Support" when they were actually
            failing), which is why At Risk recall, not overall accuracy, is the number to watch if
            this model is retrained on real data.
          </p>
        </Section>

        <Section title="How explanations and recommendations are generated">
          <p>
            Every prediction is accompanied by plain-language positive and risk factors. These are
            not raw model coefficients — they're generated by checking the student's actual input
            values against a set of academically meaningful rules (for example: attendance below
            60%, three or more missing assignments, a declining recent-assessment trend, low LMS
            activity). Each risk factor maps to a specific recommended action — a low-attendance
            flag suggests reviewing attendance and contacting the student directly, a declining
            trend suggests academic tutoring, and so on — so the recommendation always traces back
            to a concrete, checkable reason.
          </p>
        </Section>

        <Section title="Early-warning stages">
          <p>
            A prediction can be tagged with the stage it was made at — Week 3, Week 6, Week 10, or
            Near Final Exams — and every saved record keeps that stage alongside the semester it
            belongs to. A student's profile page orders every prediction made for them
            chronologically, so a lecturer can see whether a flagged risk is easing or worsening as
            the semester progresses, not just their most recent score.
          </p>
        </Section>

        <Section title="Known limitations">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-foreground">Synthetic training data.</strong> The model was
              trained on 400 generated student-semester records (see{" "}
              <code className="rounded bg-secondary px-1 py-0.5 text-xs">
                ml/generate_dataset.py
              </code>
              ), not real institutional history. Course load and weeks-remaining were deliberately
              generated independently of the outcome in that synthetic data, so their small
              coefficients reflect the synthetic data design, not a real-world claim that timing
              doesn't matter.
            </li>
            <li>
              <strong className="text-foreground">At Risk is the hardest class.</strong> It's also
              the smallest in the training data, which is exactly why its recall (0.71) is reported
              on its own rather than folded into overall accuracy.
            </li>
            <li>
              <strong className="text-foreground">A linear model.</strong> Ridge Regression assumes
              each input's effect is a straight line and adds up independently. Real academic
              outcomes involve interaction effects and thresholds a linear model can't represent —
              the model comparison above exists specifically to keep that trade-off honest rather
              than assumed.
            </li>
            <li>
              <strong className="text-foreground">Self-reported inputs.</strong> Study habits and,
              in the demo data, engagement levels rely on self-report or lecturer judgement rather
              than a system of record.
            </li>
            <li>
              <strong className="text-foreground">No live portal integration.</strong> Data is
              entered manually or auto-filled from this app's own previous records; it does not read
              from a school portal or LMS.
            </li>
            <li>
              <strong className="text-foreground">A prediction, not a verdict.</strong> The output —
              including the estimated range, not a single confident number — is a prompt for a
              conversation with a student, never a basis for an administrative decision.
            </li>
          </ul>
        </Section>

        <Section title="Retraining on real data">
          <p>
            Everything above was designed so a real institutional dataset can replace the synthetic
            one without rewriting the application:{" "}
            <code className="rounded bg-secondary px-1 py-0.5 text-xs">ml/generate_dataset.py</code>{" "}
            is only used to produce{" "}
            <code className="rounded bg-secondary px-1 py-0.5 text-xs">ml/dataset.csv</code> — swap
            that file for real records with the same column names, run{" "}
            <code className="rounded bg-secondary px-1 py-0.5 text-xs">ml/train_model.py</code>, and
            copy the new coefficients it writes to{" "}
            <code className="rounded bg-secondary px-1 py-0.5 text-xs">
              ml/model_coefficients.json
            </code>{" "}
            into the <code className="rounded bg-secondary px-1 py-0.5 text-xs">MODEL</code>{" "}
            constant in{" "}
            <code className="rounded bg-secondary px-1 py-0.5 text-xs">
              src/lib/prediction.functions.ts
            </code>
            . No other part of the application needs to change.
          </p>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}
