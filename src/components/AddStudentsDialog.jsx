import { useState } from "react";
import Papa from "papaparse";
import { UserPlus, UploadCloud, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { notifyAcademicDataChanged } from "@/hooks/useAcademicData";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
const EMPTY = { full_name: "", matric_number: "", department: "", level: "" };
const REQUIRED_HEADERS = ["full_name", "matric_number", "department", "level"];
function normaliseHeader(h) {
    return h.trim().toLowerCase().replace(/\s+/g, "_");
}
export function AddStudentsDialog() {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState("single");
    const [form, setForm] = useState(EMPTY);
    const [csvFile, setCsvFile] = useState(null);
    const [csvRows, setCsvRows] = useState([]);
    const [csvError, setCsvError] = useState(null);
    const [parsing, setParsing] = useState(false);
    const [addingOne, setAddingOne] = useState(false);
    const [addingMany, setAddingMany] = useState(false);
    async function addOne(student) {
        setAddingOne(true);
        try {
            const { error } = await supabase.from("students").insert(student);
            if (error)
                throw new Error(error.message);
            notifyAcademicDataChanged();
            toast.success("Student added.");
            setForm(EMPTY);
            setOpen(false);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "Unknown error";
            toast.error(message.includes("duplicate") || message.includes("unique")
                ? "That matric number is already in the register."
                : `Could not add student: ${message}`);
        }
        finally {
            setAddingOne(false);
        }
    }
    async function addMany(students) {
        setAddingMany(true);
        try {
            const { error, data } = await supabase.from("students").insert(students).select("id");
            if (error)
                throw new Error(error.message);
            const count = data?.length ?? 0;
            notifyAcademicDataChanged();
            toast.success(`Imported ${count} student${count === 1 ? "" : "s"}.`);
            setCsvFile(null);
            setCsvRows([]);
            setOpen(false);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "Unknown error";
            toast.error(message.includes("duplicate") || message.includes("unique")
                ? "One or more matric numbers already exist in the register. No rows were imported — remove the duplicates and try again."
                : `Import failed: ${message}`);
        }
        finally {
            setAddingMany(false);
        }
    }
    function handleSingleSubmit(e) {
        e.preventDefault();
        if (!form.full_name.trim() ||
            !form.matric_number.trim() ||
            !form.department.trim() ||
            !form.level.trim()) {
            toast.error("Every field is required.");
            return;
        }
        addOne({
            full_name: form.full_name.trim(),
            matric_number: form.matric_number.trim(),
            department: form.department.trim(),
            level: form.level.trim(),
        });
    }
    function handleFile(file) {
        setCsvFile(file);
        setCsvRows([]);
        setCsvError(null);
        setParsing(true);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: normaliseHeader,
            complete: (results) => {
                setParsing(false);
                const fields = results.meta.fields ?? [];
                const missing = REQUIRED_HEADERS.filter((h) => !fields.includes(h));
                if (missing.length > 0) {
                    setCsvError(`Missing column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. Expected headers: full_name, matric_number, department, level.`);
                    return;
                }
                const rows = [];
                const seen = new Set();
                for (const row of results.data) {
                    const student = {
                        full_name: (row["full_name"] ?? "").trim(),
                        matric_number: (row["matric_number"] ?? "").trim(),
                        department: (row["department"] ?? "").trim(),
                        level: (row["level"] ?? "").trim(),
                    };
                    if (!student.full_name || !student.matric_number || !student.department || !student.level)
                        continue;
                    if (seen.has(student.matric_number))
                        continue;
                    seen.add(student.matric_number);
                    rows.push(student);
                }
                if (rows.length === 0) {
                    setCsvError("No valid, complete rows were found in this file.");
                    return;
                }
                setCsvRows(rows);
            },
            error: (err) => {
                setParsing(false);
                setCsvError(err.message);
            },
        });
    }
    return (<Dialog open={open} onOpenChange={(next) => {
            setOpen(next);
            if (!next) {
                setForm(EMPTY);
                setCsvFile(null);
                setCsvRows([]);
                setCsvError(null);
                setTab("single");
            }
        }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserPlus className="h-4 w-4"/>
          Add students
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add students</DialogTitle>
          <DialogDescription>
            Add one student, or upload a CSV to bring in your own list. New students can then be
            scored from the Predict page.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Add one</TabsTrigger>
            <TabsTrigger value="csv">Bulk upload (CSV)</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="pt-4">
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Full name</Label>
                <Input id="full_name" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} placeholder="e.g. Chidinma Okafor"/>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="matric_number">Matric number</Label>
                <Input id="matric_number" value={form.matric_number} onChange={(e) => setForm((f) => ({ ...f, matric_number: e.target.value }))} placeholder="e.g. U2022/5570123"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} placeholder="e.g. Computer Science"/>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="level">Level</Label>
                  <Input id="level" value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))} placeholder="e.g. 300L"/>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={addingOne}>
                {addingOne ? (<>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/> Adding…
                  </>) : ("Add student")}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="csv" className="space-y-4 pt-4">
            <div className="rounded-lg border border-dashed border-border bg-secondary/50 p-4 text-center">
              <UploadCloud className="mx-auto h-6 w-6 text-muted-foreground"/>
              <label htmlFor="csv-upload" className="mt-2 block cursor-pointer text-sm font-medium text-foreground">
                {csvFile ? csvFile.name : "Choose a CSV file"}
                <input id="csv-upload" type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file)
                handleFile(file);
        }}/>
              </label>
              <p className="mt-1 text-xs text-muted-foreground">
                Required columns: full_name, matric_number, department, level
              </p>
            </div>

            {parsing && <p className="text-sm text-muted-foreground">Reading file…</p>}
            {csvError && <p className="text-sm text-destructive">{csvError}</p>}
            {csvRows.length > 0 && (<>
                <div className="max-h-48 overflow-y-auto rounded-md border border-border">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-secondary text-left uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Name</th>
                        <th className="px-3 py-2 font-semibold">Matric No.</th>
                        <th className="px-3 py-2 font-semibold">Dept.</th>
                        <th className="px-3 py-2 font-semibold">Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvRows.map((r) => (<tr key={r.matric_number} className="border-t border-border">
                          <td className="px-3 py-1.5">{r.full_name}</td>
                          <td className="px-3 py-1.5">{r.matric_number}</td>
                          <td className="px-3 py-1.5">{r.department}</td>
                          <td className="px-3 py-1.5">{r.level}</td>
                        </tr>))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground">
                  {csvRows.length} student{csvRows.length === 1 ? "" : "s"} ready to import.
                </p>
                <Button className="w-full" disabled={addingMany} onClick={() => addMany(csvRows)}>
                  {addingMany ? (<>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin"/> Importing…
                    </>) : (`Import ${csvRows.length} student${csvRows.length === 1 ? "" : "s"}`)}
                </Button>
              </>)}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>);
}
