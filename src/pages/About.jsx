
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
function Section({ title, children }) {
    return (<section className="mt-12">
      <h2 className="font-display text-2xl font-semibold text-foreground">{title}</h2>
      <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">{children}</div>
    </section>);
}
export default function About() {
    return (<div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">Project methodology</p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-foreground">About the Student Result Prediction System</h1>
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
            Advisers then spend their time on remediation and probation meetings rather than prevention.
          </p>
          <p>
            The warning signs usually appear much earlier: attendance drops, assignments go missing,
            assessment scores start trending down. This system brings those signals together — plus
            the student's academic history, engagement, and course context — into a single early
            prediction, at whichever stage of the semester the department wants to check in.
          </p>
        </Section>

        <Section title="What goes into a prediction">
          <p>Thirteen inputs feed the model, grouped the same way they're grouped on the Predict page:</p>
          <ul className="list-disc space-y-2 pl-5 text-sm">
            <li><strong className="text-foreground">Previous performance:</strong> previous semester average, previously failed courses</li>
            <li><strong className="text-foreground">Current performance:</strong> current test/exam average, assignment average, assignment completion rate, late-submission rate</li>
            <li><strong className="text-foreground">Recent trend:</strong> the change between a student's earlier and most recent assessment scores — calculated automatically from the scores entered, not selected manually</li>
            <li><strong className="text-foreground">Attendance &amp; study habits:</strong> attendance rate, and a composite study-habits score from weekly study hours and consistency</li>
            <li><strong className="text-foreground">Engagement:</strong> class participation and LMS/online activity, each Low/Medium/High</li>
            <li><strong className="text-foreground">Course context:</strong> course load and weeks remaining until final exams</li>
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
                  <td className="px-4 py-2">0.869</td><td className="px-4 py-2">4.37</td><td className="px-4 py-2">0.71</td>
                </tr>
                <tr className="border-t border-border"><td className="px-4 py-2">Linear Regression</td><td className="px-4 py-2">0.869</td><td className="px-4 py-2">4.37</td><td className="px-4 py-2">0.67</td></tr>
                <tr className="border-t border-border"><td className="px-4 py-2">Gradient Boosting</td><td className="px-4 py-2">0.763</td><td className="px-4 py-2">5.53</td><td className="px-4 py-2">0.71</td></tr>
                <tr className="border-t border-border"><td className="px-4 py-2">Random Forest</td><td className="px-4 py-2">0.702</td><td className="px-4 py-2">6.23</td><td className="px-4 py-2">0.57</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            <strong className="text-foreground">Ridge Regression was selected for deployment.</strong>{" "}
            It matched Linear Regression's accuracy while being more stable when input features are
            correlated with each other, while the interface presents concrete, rule-based positive
            and risk factors to lecturers.
          </p>
        </Section>

        <Section title="How the model works">
          <p>
            The deployed model is a <strong className="text-foreground">Ridge Regression</strong>,
            trained offline in Python with scikit-learn. Every coefficient below was learned from data:
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
            error (±5.6 points), and classified into a risk band: <strong className="text-risk-high">At Risk</strong> below 40,{" "}
            <strong className="text-risk-mid">Needs Support</strong> from 40 to 59, and{" "}
            <strong className="text-risk-low">On Track</strong> from 60 upward. Python is used offline to train and evaluate the model. The trained coefficients are then copied into a JavaScript module in the React application.
          </p>
        </Section>

        <Section title="How risk bands are evaluated">
          <p>
            Overall risk-band accuracy is 87.5%. The most important number for an early-warning
            system is <strong className="text-foreground">At Risk recall — 0.71</strong>: of the
            students who were genuinely at risk in the test set, 71% were correctly flagged.
          </p>
        </Section>

        <Section title="How explanations and recommendations are generated">
          <p>
            Every prediction is accompanied by plain-language positive and risk factors. These are
            generated by checking the student's actual input values against a set of academically
            meaningful rules. Each risk factor maps to a specific recommended action.
          </p>
        </Section>

        <Section title="Early-warning stages">
          <p>
            A prediction can be tagged with the stage it was made at — Week 3, Week 6, Week 10, or
            Near Final Exams — and every saved record keeps that stage alongside the semester it belongs to.
          </p>
        </Section>

        <Section title="System architecture">
          <p>
            The system has three main technical parts. <strong className="text-foreground">React and JavaScript</strong> build the website, handle navigation and apply the trained Ridge Regression equation. <strong className="text-foreground">Supabase</strong> handles lecturer authentication and stores students and prediction history. <strong className="text-foreground">Python with scikit-learn</strong> is used offline to generate the training dataset, train and compare the four candidate models, and export the final coefficients.
          </p>
        </Section>

        <Section title="Known limitations">
          <ul className="list-disc space-y-2 pl-5">
            <li><strong className="text-foreground">Synthetic training data.</strong> The model was trained on 400 generated student-semester records, not real institutional history.</li>
            <li><strong className="text-foreground">At Risk is the hardest class.</strong> Its recall is 0.71.</li>
            <li><strong className="text-foreground">A linear model.</strong> Ridge Regression cannot represent every non-linear interaction in real academic outcomes.</li>
            <li><strong className="text-foreground">Self-reported inputs.</strong> Study habits and some engagement indicators rely on judgement.</li>
            <li><strong className="text-foreground">No live portal integration.</strong> Data is entered manually or auto-filled from this app's own previous records.</li>
            <li><strong className="text-foreground">A prediction, not a verdict.</strong> The output is decision support, not an administrative judgement.</li>
          </ul>
        </Section>

        <Section title="Retraining on real data">
          <p>
            Replace the synthetic dataset with real records using the same column names, rerun{" "}
            <code className="rounded bg-secondary px-1 py-0.5 text-xs">ml/train_model.py</code>, and
            copy the new coefficients from{" "}
            <code className="rounded bg-secondary px-1 py-0.5 text-xs">ml/model_coefficients.json</code>{" "}
            into <code className="rounded bg-secondary px-1 py-0.5 text-xs">src/lib/predictPerformance.js</code>.
          </p>
        </Section>
      </main>
      <SiteFooter />
    </div>);
}
