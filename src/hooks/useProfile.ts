import { useCallback, useEffect, useState } from "react";
import { db } from "@/lib/db";
import { useAuth } from "./useAuth";
import type { Profile } from "@/types/meal";

const DEFAULTS = { daily_calories: 2000, daily_protein: 150, daily_carbs: 200, daily_fat: 65 };

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    db.from("profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      setProfile((data as Profile) ?? { user_id: user.id, ...DEFAULTS });
      setLoading(false);
    });
  }, [user]);

  const save = useCallback(async (values: Omit<Profile, "user_id">) => {
    if (!user) return;
    const row = { user_id: user.id, ...values, updated_at: new Date().toISOString() };
    const { error } = await db.from("profiles").upsert(row);
    if (error) throw error;
    setProfile(row);
  }, [user]);

  return { profile, loading, save };
}
