import { Trash2, UtensilsCrossed } from "lucide-react";
import type { Meal } from "@/types/meal";

export function MealCard({ meal, onDelete }: { meal: Meal; onDelete: () => void }) {
  const time = new Date(meal.eaten_at).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-3">
      {meal.image_url
        ? <img src={meal.image_url} alt={meal.name} className="h-16 w-16 rounded-xl object-cover" />
        : <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted"><UtensilsCrossed className="h-6 w-6 text-muted-foreground" /></div>}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate font-semibold">{meal.name}</p>
          <span className="shrink-0 text-xs text-muted-foreground">{time}</span>
        </div>
        <p className="text-sm font-medium">{Math.round(meal.calories)} kcal</p>
        <p className="text-xs text-muted-foreground">
          P {Math.round(meal.protein)}g · C {Math.round(meal.carbs)}g · G {Math.round(meal.fat)}g
        </p>
      </div>
      <button onClick={onDelete} aria-label="Eliminar" className="p-2 text-muted-foreground hover:text-destructive">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
