import { useMemo } from "react";
import { ProgressRing } from "@/components/ProgressRing";
import { MacroBar } from "@/components/MacroBar";
import { MealCard } from "@/components/MealCard";
import { useProfile } from "@/hooks/useProfile";
import { useTodayMeals } from "@/hooks/useMeals";

export default function Dashboard() {
  const { profile } = useProfile();
  const { meals, loading, remove } = useTodayMeals();

  const t = useMemo(() => meals.reduce(
    (a, m) => ({ cal: a.cal + m.calories, p: a.p + m.protein, c: a.c + m.carbs, f: a.f + m.fat }),
    { cal: 0, p: 0, c: 0, f: 0 }), [meals]);

  if (!profile) return null;
  return (
    <div className="space-y-6 p-4">
      <header>
        <h1 className="text-xl font-bold">Hoy</h1>
        <p className="text-sm capitalize text-muted-foreground">
          {new Date().toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </header>
      <div className="flex justify-center"><ProgressRing value={t.cal} goal={profile.daily_calories} /></div>
      <section className="space-y-3 rounded-2xl border bg-card p-4">
        <MacroBar label="Proteínas" value={t.p} goal={profile.daily_protein} />
        <MacroBar label="Carbohidratos" value={t.c} goal={profile.daily_carbs} />
        <MacroBar label="Grasas" value={t.f} goal={profile.daily_fat} />
      </section>
      <section className="space-y-3">
        <h2 className="font-semibold">Comidas de hoy</h2>
        {loading ? <p className="text-sm text-muted-foreground">Cargando...</p>
          : meals.length === 0 ? <p className="text-sm text-muted-foreground">Aún no registras nada. Toca la cámara 📸</p>
          : meals.map((m) => <MealCard key={m.id} meal={m} onDelete={() => remove(m)} />)}
      </section>
    </div>
  );
}
