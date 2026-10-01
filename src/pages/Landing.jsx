import { Link } from "react-router-dom";
import { ArrowRight, ClipboardList, LineChart, BellRing, ShieldCheck, Clock, Users, } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
const STEPS = [
    {
        icon: ClipboardList,
        title: "Enter student data",
        body: "Select a student and enter their academic history, current assessments, attendance, study habits, assignment activity and engagement.",
    },
    {
        icon: LineChart,
        title: "The system predicts performance",
        body: "The JavaScript app applies coefficients learned by a Python-trained Ridge Regression model to estimate the final score and risk level.",
    },
    {
        icon: BellRing,
        title: "Get an early warning",
        body: "Each student is placed in a risk band — At Risk, Needs Support or On Track — so advisers know exactly who to call in this week.",
    },
];
export default function Landing() {
    return (<div className="flex min-h-screen flex-col">
      <SiteHeader />

      <section className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:py-28">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 px-3 py-1 text-xs font-medium uppercase tracking-wider text-accent">
              Academic analytics
            </p>
            <h1 className="mt-6 font-display text-4xl leading-tight font-semibold sm:text-5xl">
              Know which students are heading for a fail — while there is still time to help.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-primary-foreground/80">
              The Student Result Prediction System combines academic history, attendance, continuous
              assessment, study habits, assignment activity and engagement into a predicted
              end-of-semester score and a clear risk band for every student on the register.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90">
                Open the dashboard
                <ArrowRight className="h-4 w-4"/>
              </Link>
              <Link to="/predict" className="inline-flex items-center gap-2 rounded-md border border-primary-foreground/25 px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10">
                Run a prediction
              </Link>
            </div>
            <p className="mt-4 text-xs text-primary-foreground/60">
              Built for lecturers, course coordinators and academic advisers.
            </p>
          </div>

          <div className="rounded-xl border border-primary-foreground/15 bg-primary-foreground/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/60">
              Sample prediction
            </p>
            <p className="mt-4 font-display text-5xl font-semibold">42.5%</p>
            <p className="mt-1 text-sm text-primary-foreground/70">
              Predicted score · 2025/2026 Harmattan
            </p>
            <span className="mt-4 inline-flex rounded-full bg-risk-mid px-3 py-1 text-xs font-semibold text-primary">
              Needs Support
            </span>
            <dl className="mt-6 space-y-3 text-sm">
              {[
            ["Attendance rate", "36.2%"],
            ["Average test score", "25.6%"],
            ["Study habits score", "19.5%"],
        ].map(([k, v]) => (<div key={k} className="flex items-center justify-between border-b border-primary-foreground/10 pb-2">
                  <dt className="text-primary-foreground/70">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>))}
            </dl>
            <p className="mt-5 text-xs leading-relaxed text-primary-foreground/70">
              Low attendance is one of the risk factors the system checks. In the trained Ridge model, a 10-point attendance increase contributes about 1.3 points to the predicted score when the other inputs stay the same.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="font-display text-3xl font-semibold text-foreground">How it works</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Three simple steps, repeated whenever a lecturer wants an early-warning check.
        </p>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (<li key={step.title} className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <step.icon className="h-5 w-5"/>
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Step {i + 1}
                </span>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </li>))}
        </ol>
      </section>

      <section className="border-y border-border bg-secondary">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold text-foreground">Why it matters</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Most departments only discover that a student is failing when the results are
              released. By then the semester is over: the carry-over is recorded, the student's CGPA
              is damaged, and counselling arrives too late to change the outcome. That is a reactive
              system.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              The signals that predict a poor result — falling attendance, weak test scores,
              unstructured study — are visible weeks earlier. This project makes those signals
              actionable, shifting the department from reacting to results to preventing them.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
            {
                icon: Clock,
                title: "Early",
                body: "Warnings appear mid-semester, while remediation is still possible.",
            },
            {
                icon: Users,
                title: "Targeted",
                body: "Advisers see a ranked list of who needs attention first.",
            },
            {
                icon: ShieldCheck,
                title: "Transparent",
                body: "A simple linear model — every prediction can be explained to the student.",
            },
            {
                icon: LineChart,
                title: "Measurable",
                body: "Predicted scores are compared against actual results to track accuracy.",
            },
        ].map((c) => (<div key={c.title} className="rounded-xl border border-border bg-card p-5">
                <c.icon className="h-5 w-5 text-accent"/>
                <h3 className="mt-3 font-display text-base font-semibold text-foreground">
                  {c.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{c.body}</p>
              </div>))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-20 text-center sm:px-6">
        <h2 className="font-display text-3xl font-semibold text-foreground">
          See the system with sample department data
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          The demonstration database holds 28 students across three departments and three semesters,
          already scored by the model.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Go to dashboard <ArrowRight className="h-4 w-4"/>
          </Link>
          <Link to="/about" className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground hover:bg-secondary">
            Read the methodology
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>);
}
