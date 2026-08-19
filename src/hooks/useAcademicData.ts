import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PerformanceRow, StudentRow } from "@/lib/prediction";

export type RecordWithStudent = PerformanceRow & { student: StudentRow | null };

export function useStudents() {
  return useQuery({
    queryKey: ["students"],
    queryFn: async (): Promise<StudentRow[]> => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("full_name", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as StudentRow[];
    },
  });
}

export function useRecords() {
  return useQuery({
    queryKey: ["performance_records"],
    queryFn: async (): Promise<RecordWithStudent[]> => {
      const { data, error } = await supabase
        .from("performance_records")
        .select("*, student:students(*)")
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as RecordWithStudent[];
    },
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: ["student", id],
    queryFn: async () => {
      const [{ data: student, error: sErr }, { data: records, error: rErr }] = await Promise.all([
        supabase.from("students").select("*").eq("id", id).maybeSingle(),
        supabase
          .from("performance_records")
          .select("*")
          .eq("student_id", id)
          .order("created_at", { ascending: true }),
      ]);
      if (sErr) throw new Error(sErr.message);
      if (rErr) throw new Error(rErr.message);
      return {
        student: (student ?? null) as StudentRow | null,
        records: (records ?? []) as PerformanceRow[],
      };
    },
  });
}

/**
 * Fetches a student's most recent saved performance record, if any, so the
 * Predict form can auto-populate "previous semester average" instead of
 * asking the lecturer to re-enter information the system already has.
 */
export function useLatestRecordForStudent(studentId: string | undefined) {
  return useQuery({
    queryKey: ["latest-record", studentId],
    enabled: Boolean(studentId),
    queryFn: async (): Promise<PerformanceRow | null> => {
      const { data, error } = await supabase
        .from("performance_records")
        .select("*")
        .eq("student_id", studentId as string)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data ?? null) as PerformanceRow | null;
    },
  });
}
