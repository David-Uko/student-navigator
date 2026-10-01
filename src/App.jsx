import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthGuard } from "@/components/AuthGuard";
import Landing from "@/pages/Landing";
import About from "@/pages/About";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Predict from "@/pages/Predict";
import Students from "@/pages/Students";
import StudentProfile from "@/pages/StudentProfile";
import Reports from "@/pages/Reports";

const TITLES = {
  "/": "Student Result Prediction System | Early Academic Warning",
  "/about": "Methodology | Student Result Prediction System",
  "/login": "Adviser Sign In | Student Result Prediction System",
  "/dashboard": "Dashboard | Student Result Prediction System",
  "/predict": "Run a Prediction | Student Result Prediction System",
  "/students": "Student Register | Student Result Prediction System",
  "/reports": "Reports & Insights | Student Result Prediction System",
};

function PageTitleManager() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title =
      TITLES[pathname] ??
      (pathname.startsWith("/students/")
        ? "Student Profile | Student Result Prediction System"
        : "Student Result Prediction System");
  }, [pathname]);
  return null;
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go home
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <PageTitleManager />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />

        <Route element={<AuthGuard />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/predict" element={<Predict />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/:id" element={<StudentProfile />} />
          <Route path="/reports" element={<Reports />} />
        </Route>

        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster position="top-right" richColors />
    </>
  );
}
