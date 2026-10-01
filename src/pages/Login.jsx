import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { GraduationCap, Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
const schema = z.object({
    email: z.string().trim().email({ message: "Enter a valid email address" }).max(255),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(72),
});
export default function LoginPage() {
    const navigate = useNavigate();
    const [mode, setMode] = useState("signin");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [checkEmail, setCheckEmail] = useState(false);
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session)
                navigate("/dashboard", { replace: true });
        });
    }, [navigate]);
    async function handleSubmit(e) {
        e.preventDefault();
        const parsed = schema.safeParse({ email, password });
        if (!parsed.success) {
            const next = {};
            for (const issue of parsed.error.issues)
                next[String(issue.path[0])] = issue.message;
            setErrors(next);
            return;
        }
        setErrors({});
        setLoading(true);
        try {
            if (mode === "signin") {
                const { error } = await supabase.auth.signInWithPassword(parsed.data);
                if (error)
                    throw error;
                navigate("/dashboard", { replace: true });
            }
            else {
                const { data, error } = await supabase.auth.signUp({
                    ...parsed.data,
                    options: { emailRedirectTo: window.location.origin + "/login" },
                });
                if (error)
                    throw error;
                if (data.session) {
                    navigate("/dashboard", { replace: true });
                }
                else {
                    setCheckEmail(true);
                }
            }
        }
        catch (err) {
            toast.error(err instanceof Error ? err.message : "Sign in failed. Please try again.");
        }
        finally {
            setLoading(false);
        }
    }
    return (<div className="flex min-h-screen flex-col bg-secondary">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2 font-display text-lg font-semibold text-foreground">
          <GraduationCap className="h-6 w-6 text-accent"/>
          Student Result Prediction
        </Link>

        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <h1 className="font-display text-2xl font-semibold text-foreground">
            {mode === "signin" ? "Adviser sign in" : "Create an adviser account"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The dashboard, student register, prediction tool and reports are restricted to lecturers
            and academic advisers.
          </p>

          {checkEmail ? (<div className="mt-6 rounded-lg border border-accent/30 bg-accent/10 p-4 text-sm text-foreground">
              <p className="font-medium">Confirm your email address</p>
              <p className="mt-1 text-muted-foreground">
                We sent a confirmation link to <strong>{email}</strong>. Open it to activate the
                account, then return here to sign in.
              </p>
            </div>) : (<form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Institutional email
                </label>
                <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" placeholder="adviser@university.edu.ng"/>
                {errors["email"] && (<p className="mt-1 text-xs text-destructive">{errors["email"]}</p>)}
              </div>
              <div>
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <input id="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" placeholder="At least 6 characters"/>
                {errors["password"] && (<p className="mt-1 text-xs text-destructive">{errors["password"]}</p>)}
              </div>

              <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60">
                {loading && <Loader2 className="h-4 w-4 animate-spin"/>}
                {mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>)}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "No account yet?" : "Already registered?"}{" "}
            <button onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setCheckEmail(false);
            setErrors({});
        }} className="font-medium text-accent hover:underline">
              {mode === "signin" ? "Create one" : "Sign in instead"}
            </button>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Final-year Computer Science academic project ·{" "}
          <Link to="/about" className="underline hover:text-foreground">
            Read the methodology
          </Link>
        </p>
      </div>
    </div>);
}
