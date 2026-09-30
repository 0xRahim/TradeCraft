import type { SupabaseClient } from "@supabase/supabase-js";

export type DayRow = {
  id: string;
  day: string;
  grade: number | null;
  status: string;
};

export type FileRow = {
  id: string;
  name: string;
  body: string;
};

export type DayJson = {
  date: string;
  grade: number | null;
  status: string;
  files: { id: string; name: string; body?: string }[];
};

/** Fetch the caller's day row. Null when never touched. */
export async function loadDayRow(
  supabase: SupabaseClient,
  userId: string,
  date: string,
): Promise<DayRow | null> {
  const { data, error } = await supabase
    .from("journal_days")
    .select("id, day, grade, status")
    .eq("user_id", userId)
    .eq("day", date)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as { id: string; day: string; grade: number | null; status: string };
  return { id: row.id, day: row.day, grade: row.grade, status: row.status ?? "" };
}

export async function loadDayFiles(
  supabase: SupabaseClient,
  dayId: string,
  withBodies: boolean,
): Promise<FileRow[]> {
  const { data } = await supabase
    .from("journal_files")
    .select("id, name, body")
    .eq("day_id", dayId)
    .order("created_at", { ascending: true });
  const rows = (data ?? []) as { id: string; name: string; body: string | null }[];
  return rows.map((f) => ({
    id: String(f.id),
    name: f.name ?? "",
    body: withBodies ? (f.body ?? "") : "",
  }));
}

/** Assemble the day JSON. Null when the day was never touched. */
export async function loadDay(
  supabase: SupabaseClient,
  userId: string,
  date: string,
  withBodies: boolean,
): Promise<DayJson | null> {
  const day = await loadDayRow(supabase, userId, date);
  if (!day) return null;
  const files = await loadDayFiles(supabase, day.id, withBodies);
  return {
    date: day.day,
    grade: day.grade,
    status: day.status,
    files: files.map((f) =>
      withBodies ? f : { id: f.id, name: f.name },
    ),
  };
}

/**
 * Ensure the day row exists without touching an existing one.
 * Returns the day row id.
 */
export async function ensureDay(
  supabase: SupabaseClient,
  userId: string,
  date: string,
): Promise<string | null> {
  const existing = await loadDayRow(supabase, userId, date);
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from("journal_days")
    .upsert(
      { user_id: userId, day: date, grade: null, status: "pending" },
      { onConflict: "user_id,day", ignoreDuplicates: true },
    )
    .select("id")
    .single();
  if (error || !data) {
    // Lost a race with another request — re-read.
    const retry = await loadDayRow(supabase, userId, date);
    return retry ? retry.id : null;
  }
  return (data as { id: string }).id;
}
