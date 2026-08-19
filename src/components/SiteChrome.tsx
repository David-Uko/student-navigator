import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 font-display text-base font-semibold text-foreground"
        >
          <GraduationCap className="h-5 w-5 text-accent" />
          Student Result Prediction
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-secondary text-foreground" }}
            className="rounded-md px-3 py-2 font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Home
          </Link>
          <Link
            to="/about"
            activeProps={{ className: "bg-secondary text-foreground" }}
            className="rounded-md px-3 py-2 font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Methodology
          </Link>
          <Link
            to="/login"
            className="ml-2 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-10 sm:px-6">
        <p className="font-display text-lg font-semibold">Student Result Prediction System</p>
        <p className="max-w-2xl text-sm text-primary-foreground/70">
          A final-year Computer Science academic project. The system uses a linear regression model
          trained on sample academic data to give lecturers and academic advisers an early view of
          which students may struggle.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-primary-foreground/80">
          <Link to="/" className="hover:text-primary-foreground">
            Home
          </Link>
          <Link to="/about" className="hover:text-primary-foreground">
            Methodology
          </Link>
          <Link to="/login" className="hover:text-primary-foreground">
            Adviser sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}
