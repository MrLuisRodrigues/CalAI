import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { prepareImage } from "@/lib/image";
import { analyzeMealImage } from "@/services/claude";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AIIngredient } from "@/types/meal";

interface Item { id: string; nombre: string; qty: number; unit: string; baseQty: number; cal: number; p: number; c: number; g: number; }

const parseQty = (s: string) => {
  const m = s.match(/([\d.,]+)\s*(.*)/);
  return { qty: m ? parseFloat(m[1].replace(",", ".")) || 1 : 1, unit: (m?.[2] || "g").trim() };
};
const toItem = (i: AIIngredient): Item => {
  const { qty, unit } = parseQty(i.cantidad);
  return { id: crypto.randomUUID(), nombre: i.nombre, qty, unit, baseQty: qty, cal: i.calorias, p: i.proteinas, c: i.carbohidratos, g: i.grasas };
};
const scaled = (i: Item) => { const f = i.qty / (i.baseQty || 1); return { cal: i.cal * f, p: i.p * f, c: i.c * f, g: i.g * f }; };

export default function NewMeal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const file = (useLocation().state as { file?: File } | null)?.file;

  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ nombre: "", qty: "100", cal: "", p: "", c: "", g: "" });

  useEffect(() => {
    if (!file) return;
    let url = "";
    (async () => {
      try {
        const img = await prepareImage(file);
        setBlob(img.blob);
        url = URL.createObjectURL(img.blob);
        setPreview(url);
        const r = await analyzeMealImage(img.base64, img.mediaType);
        setName(r.plato); setSummary(r.resumen); setItems(r.ingredientes.map(toItem));
        setPhase("ready");
      } catch (e) { setError(e instanceof Error ? e.message : "Error al analizar"); setPhase("error"); }
    })();
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [file]);

  const totals = useMemo(() => items.reduce((a, i) => {
    const s = scaled(i); return { cal: a.cal + s.cal, p: a.p + s.p, c: a.c + s.c, g: a.g + s.g };
  }, { cal: 0, p: 0, c: 0, g: 0 }), [items]);

  if (!file) return <Navigate to="/" replace />;

  const addItem = () => {
    const qty = parseFloat(draft.qty) || 100;
    if (!draft.nombre.trim()) return;
    setItems((p) => [...p, { id: crypto.randomUUID(), nombre: draft.nombre.trim(), qty, unit: "g", baseQty: qty,
      cal: +draft.cal || 0, p: +draft.p || 0, c: +draft.c || 0, g: +draft.g || 0 }]);
    setDraft({ nombre: "", qty: "100", cal: "", p: "", c: "", g: "" });
    setAdding(false);
  };

  const save = async () => {
    if (!user || !blob) return;
    setSaving(true);
    try {
      const path = `${user.id}/${crypto.randomUUID()}.jpg`;
      const up = await db.storage.from("meal-images").upload(path, blob, { contentType: "image/jpeg" });
      if (up.error) throw up.error;
      const ingredients: AIIngredient[] = items.map((i) => {
        const s = scaled(i);
        return { nombre: i.nombre, cantidad: `${i.qty}${i.unit}`, calorias: Math.round(s.cal), proteinas: +s.p.toFixed(1), carbohidratos: +s.c.toFixed(1), grasas: +s.g.toFixed(1) };
      });
      const { error } = await db.from("meals").insert({
        user_id: user.id, name, summary, image_path: path, ingredients,
        calories: Math.round(totals.cal), protein: +totals.p.toFixed(1), carbs: +totals.c.toFixed(1), fat: +totals.g.toFixed(1),
      });
      if (error) throw error;
      navigate("/", { replace: true });
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo guardar"); setSaving(false); }
  };

  return (
    <div className="space-y-4 p-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" />Volver</button>
      {preview && <img src={preview} alt="Comida" className="h-56 w-full rounded-2xl object-cover" />}

      {phase === "loading" && (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="relative"><Sparkles className="h-10 w-10 animate-pulse text-primary" /><Loader2 className="absolute -inset-2 h-14 w-14 animate-spin text-primary/30" /></div>
          <p className="font-medium">Analizando tu comida...</p>
          <p className="text-sm text-muted-foreground">Identificando alimentos y porciones</p>
        </div>
      )}

      {phase === "error" && (
        <div className="space-y-3 py-6 text-center">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" onClick={() => navigate("/", { replace: true })}>Volver al diario</Button>
        </div>
      )}

      {phase === "ready" && (
        <>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="text-lg font-semibold" />
          {summary && <p className="text-sm text-muted-foreground">{summary}</p>}

          <div className="grid grid-cols-4 gap-2 rounded-2xl bg-muted p-3 text-center">
            {[["kcal", totals.cal], ["Prot", totals.p], ["Carb", totals.c], ["Grasa", totals.g]].map(([l, v]) => (
              <div key={l as string}><p className="text-lg font-bold">{Math.round(v as number)}</p><p className="text-xs text-muted-foreground">{l}</p></div>
            ))}
          </div>

          <div className="space-y-2">
            {items.map((i) => {
              const s = scaled(i);
              return (
                <div key={i.id} className="flex items-center gap-2 rounded-xl border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{i.nombre}</p>
                    <p className="text-xs text-muted-foreground">{Math.round(s.cal)} kcal · P {s.p.toFixed(0)} · C {s.c.toFixed(0)} · G {s.g.toFixed(0)}</p>
                  </div>
                  <Input type="number" inputMode="decimal" min={0} value={i.qty} className="w-20 text-right"
                    onChange={(e) => setItems((p) => p.map((x) => x.id === i.id ? { ...x, qty: Math.max(0, parseFloat(e.target.value) || 0) } : x))} />
                  <span className="w-8 text-xs text-muted-foreground">{i.unit}</span>
                  <button onClick={() => setItems((p) => p.filter((x) => x.id !== i.id))} aria-label="Quitar" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              );
            })}
          </div>

          {adding ? (
            <div className="space-y-2 rounded-xl border border-dashed p-3">
              <Input placeholder="Alimento" value={draft.nombre} onChange={(e) => setDraft({ ...draft, nombre: e.target.value })} />
              <div className="grid grid-cols-5 gap-2">
                {(["qty", "cal", "p", "c", "g"] as const).map((k) => (
                  <Input key={k} type="number" inputMode="decimal" value={draft[k]}
                    placeholder={{ qty: "gramos", cal: "kcal", p: "P", c: "C", g: "G" }[k]}
                    onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Valores para la cantidad indicada.</p>
              <div className="flex gap-2"><Button size="sm" onClick={addItem}>Añadir</Button><Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancelar</Button></div>
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setAdding(true)}><Plus className="mr-2 h-4 w-4" />Añadir ingrediente</Button>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" size="lg" disabled={saving || items.length === 0} onClick={save}>
            {saving ? "Guardando..." : "Guardar en mi Diario"}
          </Button>
        </>
      )}
    </div>
  );
}
