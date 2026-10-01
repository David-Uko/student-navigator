import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const DATA_CHANGED_EVENT = "student-navigator:data-changed";

export function notifyAcademicDataChanged() {
  window.dispatchEvent(new Event(DATA_CHANGED_EVENT));
}

function useSupabaseQuery(fetcher, dependencies = [], enabled = true) {
  const [data, setData] = useState(undefined);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(enabled));

  const refetch = useCallback(async () => {
    if (!enabled) {
      setData(undefined);
      setError(null);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    setError(null);
    try {
      const nextData = await fetcher();
      setData(nextData);
      return nextData;
    } catch (err) {
      const nextError = err instanceof Error ? err : new Error("Could not load data.");
      setError(nextError);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [enabled, ...dependencies]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!enabled) return undefined;
    const handleChange = () => refetch();
    window.addEventListener(DATA_CHANGED_EVENT, handleChange);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, handleChange);
  }, [enabled, refetch]);

  return {
    data,
    error,
    isLoading,
    isError: Boolean(error),
    refetch,
  };
}

export function useStudents() {
  return useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("full_name", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });
}

export function useRecords() {
  return useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from("performance_records")
      .select("*, student:students(*)")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });
}

export function useStudent(id) {
  return useSupabaseQuery(
    async () => {
      const [{ data: student, error: studentError }, { data: records, error: recordsError }] =
        await Promise.all([
          supabase.from("students").select("*").eq("id", id).maybeSingle(),
          supabase
            .from("performance_records")
            .select("*")
            .eq("student_id", id)
            .order("created_at", { ascending: true }),
        ]);

      if (studentError) throw new Error(studentError.message);
      if (recordsError) throw new Error(recordsError.message);
      return { student: student ?? null, records: records ?? [] };
    },
    [id],
    Boolean(id),
  );
}

export function useLatestRecordForStudent(studentId) {
  return useSupabaseQuery(
    async () => {
      const { data, error } = await supabase
        .from("performance_records")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ?? null;
    },
    [studentId],
    Boolean(studentId),
  );
}
