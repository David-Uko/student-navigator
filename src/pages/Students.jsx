import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AddStudentsDialog } from "@/components/AddStudentsDialog";
import { RiskBadge } from "@/components/RiskBadge";
import { ErrorBlock, LoadingBlock, EmptyBlock } from "@/components/StateBlocks";
import { useRecords, useStudents } from "@/hooks/useAcademicData";
import { RISK_BANDS, sortSemesters } from "@/lib/prediction";
const PAGE_SIZE = 10;
export default function StudentsPage() {
    const students = useStudents();
    const records = useRecords();
    const [query, setQuery] = useState("");
    const [dept, setDept] = useState("All");
    const [level, setLevel] = useState("All");
    const [band, setBand] = useState("All");
    const [sort, setSort] = useState("name");
    const [page, setPage] = useState(1);
    const isLoading = students.isLoading || records.isLoading;
    const isError = students.isError || records.isError;
    const rows = useMemo(() => {
        if (!students.data || !records.data)
            return [];
        return students.data.map((s) => {
            const own = records.data
                .filter((r) => r.student_id === s.id)
                .sort((a, b) => sortSemesters(a.semester, b.semester));
            const current = own[own.length - 1];
            return {
                ...s,
                predicted: current ? Number(current.predicted_score) : null,
                band: current?.risk_band ?? "No record",
                semester: current?.semester ?? "—",
                recordCount: own.length,
            };
        });
    }, [students.data, records.data]);
    const departments = useMemo(() => ["All", ...new Set(rows.map((r) => r.department))].sort(), [rows]);
    const levels = useMemo(() => ["All", ...new Set(rows.map((r) => r.level))].sort(), [rows]);
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const result = rows.filter((r) => {
            if (q && !r.full_name.toLowerCase().includes(q) && !r.matric_number.toLowerCase().includes(q))
                return false;
            if (dept !== "All" && r.department !== dept)
                return false;
            if (level !== "All" && r.level !== level)
                return false;
            if (band !== "All" && r.band !== band)
                return false;
            return true;
        });
        result.sort((a, b) => {
            if (sort === "name")
                return a.full_name.localeCompare(b.full_name);
            if (sort === "department")
                return a.department.localeCompare(b.department) || a.full_name.localeCompare(b.full_name);
            return (a.predicted ?? 999) - (b.predicted ?? 999);
        });
        return result;
    }, [rows, query, dept, level, band, sort]);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const selectClass = "rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";
    return (<AppShell title="Student register" description="Every student tracked by the department, with their most recent predicted score and risk band." actions={<div className="flex items-center gap-3">
          <AddStudentsDialog />
          <Link to="/predict" className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            New prediction
          </Link>
        </div>}>
      {isLoading ? (<LoadingBlock label="Loading the student register…"/>) : isError ? (<ErrorBlock message={(students.error ?? records.error) instanceof Error
                ? (students.error ?? records.error).message
                : "Unknown error"} onRetry={() => {
                students.refetch();
                records.refetch();
            }}/>) : (<div className="space-y-5">
          <div className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[1.5fr_repeat(4,1fr)]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
              <input value={query} onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
            }} placeholder="Search name or matric number" className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" aria-label="Search students"/>
            </div>
            <select value={dept} onChange={(e) => {
                setDept(e.target.value);
                setPage(1);
            }} className={selectClass} aria-label="Filter by department">
              {departments.map((d) => (<option key={d} value={d}>
                  {d === "All" ? "All departments" : d}
                </option>))}
            </select>
            <select value={level} onChange={(e) => {
                setLevel(e.target.value);
                setPage(1);
            }} className={selectClass} aria-label="Filter by level">
              {levels.map((l) => (<option key={l} value={l}>
                  {l === "All" ? "All levels" : l}
                </option>))}
            </select>
            <select value={band} onChange={(e) => {
                setBand(e.target.value);
                setPage(1);
            }} className={selectClass} aria-label="Filter by risk band">
              <option value="All">All risk bands</option>
              {RISK_BANDS.map((b) => (<option key={b} value={b}>
                  {b}
                </option>))}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className={selectClass} aria-label="Sort students">
              <option value="name">Sort: name (A–Z)</option>
              <option value="predicted">Sort: lowest prediction</option>
              <option value="department">Sort: department</option>
            </select>
          </div>

          {filtered.length === 0 ? (<EmptyBlock title="No students match these filters" hint="Try clearing the search box or widening the department, level or risk-band filters.">
              <button onClick={() => {
                    setQuery("");
                    setDept("All");
                    setLevel("All");
                    setBand("All");
                }} className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary">
                Clear all filters
              </button>
            </EmptyBlock>) : (<>
              <div className="overflow-x-auto rounded-xl border border-border bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Student</th>
                      <th className="px-5 py-3 font-semibold">Department</th>
                      <th className="px-5 py-3 font-semibold">Level</th>
                      <th className="px-5 py-3 font-semibold">Latest semester</th>
                      <th className="px-5 py-3 font-semibold">Predicted</th>
                      <th className="px-5 py-3 font-semibold">Risk band</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((r) => (<tr key={r.id} className="border-t border-border transition-colors hover:bg-secondary/60">
                        <td className="px-5 py-3">
                          <Link to={`/students/${r.id}`} className="font-medium text-foreground hover:text-accent">
                            {r.full_name}
                          </Link>
                          <p className="text-xs text-muted-foreground">{r.matric_number}</p>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{r.department}</td>
                        <td className="px-5 py-3 text-muted-foreground">{r.level}</td>
                        <td className="px-5 py-3 text-muted-foreground">{r.semester}</td>
                        <td className="px-5 py-3 font-semibold text-foreground">
                          {r.predicted === null ? "—" : `${r.predicted.toFixed(1)}%`}
                        </td>
                        <td className="px-5 py-3">
                          {r.band === "No record" ? (<span className="text-xs text-muted-foreground">No record yet</span>) : (<RiskBadge band={r.band}/>)}
                        </td>
                      </tr>))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                <p>
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} students
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-md border border-border bg-card px-3 py-1.5 font-medium text-foreground disabled:opacity-40">
                    Previous
                  </button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-md border border-border bg-card px-3 py-1.5 font-medium text-foreground disabled:opacity-40">
                    Next
                  </button>
                </div>
              </div>
            </>)}
        </div>)}
    </AppShell>);
}
