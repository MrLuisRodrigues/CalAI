import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FIELDS = [
  ["daily_calories", "Calorías diarias (kcal)"],
  ["daily_protein", "Proteínas (g)"],
  ["daily_carbs", "Carbohidratos (g)"],
  ["daily_fat", "Grasas (g)"],
] as const;

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { profile, save } = useProfile();
  const [form, setForm] = useState({ daily_calories: 2000, daily_protein: 150, daily_carbs: 200, daily_fat: 65 });
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (profile) setForm({ daily_calories: profile.daily_calories, daily_protein: profile.daily_protein, daily_carbs: profile.daily_carbs, daily_fat: profile.daily_fat });
  }, [profile]);

  const onSave = async () => {
    try { await save(form); setStatus("Guardado ✓"); } catch { setStatus("Error al guardar"); }
    setTimeout(() => setStatus(""), 2000);
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-xl font-bold">Ajustes</h1>
      <section className="space-y-4">
        <h2 className="font-semibold">Metas diarias</h2>
        {FIELDS.map(([k, label]) => (
          <div key={k} className="space-y-1">
            <Label htmlFor={k}>{label}</Label>
            <Input id={k} type="number" inputMode="numeric" min={0} value={form[k]}
              onChange={(e) => setForm({ ...form, [k]: Math.max(0, parseInt(e.target.value) || 0) })} />
          </div>
        ))}
        <Button className="w-full" onClick={onSave}>Guardar metas</Button>
        {status && <p className="text-center text-sm text-muted-foreground">{status}</p>}
      </section>
      <section className="space-y-3 border-t pt-4">
        <p className="text-sm text-muted-foreground">{user?.email}</p>
        <Button variant="outline" className="w-full" onClick={signOut}><LogOut className="mr-2 h-4 w-4" />Cerrar sesión</Button>
      </section>
    </div>
  );
}
