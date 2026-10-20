import { useCallback, useEffect, useState } from "react";
import { db } from "@/lib/db";
import { useAuth } from "./useAuth";
import type { Meal } from "@/types/meal";

export function useTodayMeals() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const { data, error } = await db.from("meals").select("*")
      .eq("user_id", user.id).gte("eaten_at", start.toISOString()).order("eaten_at", { ascending: false });
    if (error || !data) { setLoading(false); return; }

    const paths = (data as Meal[]).map((m) => m.image_path).filter(Boolean) as string[];
    const urlMap = new Map<string, string>();
    if (paths.length) {
      const { data: signed } = await db.storage.from("meal-images").createSignedUrls(paths, 3600);
      signed?.forEach((s: { path: string | null; signedUrl: string }) => s.path && urlMap.set(s.path, s.signedUrl));
    }
    setMeals((data as Meal[]).map((m) => ({ ...m, image_url: m.image_path ? urlMap.get(m.image_path) ?? null : null })));
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const remove = async (m: Meal) => {
    await db.from("meals").delete().eq("id", m.id);
    if (m.image_path) await db.storage.from("meal-images").remove([m.image_path]);
    setMeals((prev) => prev.filter((x) => x.id !== m.id));
  };

  return { meals, loading, refresh, remove };
}
