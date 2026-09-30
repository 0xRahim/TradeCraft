import type { SupabaseClient } from "@supabase/supabase-js";

export const SHOTS_BUCKET = "trade-shots";

/**
 * Remove stored screenshot objects for a trade. Best-effort: collects
 * `storage_path` refs plus anything under the `{user_id}/{trade_id}/`
 * prefix (covers abandoned pending uploads), then removes them.
 */
export async function removeTradeObjects(
  supabase: SupabaseClient,
  userId: string,
  tradeId: string,
  knownPaths: (string | null)[],
): Promise<void> {
  try {
    const prefix = `${userId}/${tradeId}`;
    const listed: string[] = [];
    // List up to two levels: {kind}/{filename} (+ pending direct files).
    const top = await supabase.storage.from(SHOTS_BUCKET).list(prefix);
    if (!top.error && top.data) {
      for (const entry of top.data) {
        if (entry.name) {
          if (entry.id) {
            listed.push(`${prefix}/${entry.name}`);
          } else {
            // Subfolder (entry|trade|pending) — list one level deeper.
            const sub = await supabase.storage
              .from(SHOTS_BUCKET)
              .list(`${prefix}/${entry.name}`);
            if (!sub.error && sub.data) {
              for (const f of sub.data) {
                if (f.id && f.name) listed.push(`${prefix}/${entry.name}/${f.name}`);
              }
            }
          }
        }
      }
    }
    const paths = new Set<string>([...listed, ...knownPaths.filter(Boolean) as string[]]);
    if (paths.size > 0) {
      await supabase.storage.from(SHOTS_BUCKET).remove([...paths]);
    }
  } catch (err) {
    console.error("storage cleanup failed:", (err as Error)?.message ?? err);
  }
}
