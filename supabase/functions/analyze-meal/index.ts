import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Analiza esta imagen de comida. Identifica todos los alimentos visibles, estima sus porciones en gramos/unidades y calcula las calorías y macronutrientes totales. Devuelve ÚNICAMENTE una estructura JSON estricta con el siguiente esquema sin texto explicativo adicional:
{
  "plato": "Nombre representativo del plato",
  "resumen": "Breve descripción",
  "ingredientes": [
    { "nombre": "Alimento", "cantidad": "150g", "calorias": 250, "proteinas": 30, "carbohidratos": 0, "grasas": 5 }
  ],
  "totales": { "calorias": 250, "proteinas": 30, "carbohidratos": 0, "grasas": 5 }
}
Todos los valores numéricos son números (no strings). "cantidad" siempre incluye número y unidad (ej. "150g", "2 unidades"). Si la imagen no contiene comida, devuelve {"error":"no_food"}.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    const { imageBase64, mediaType = "image/jpeg" } = await req.json();
    if (!imageBase64) return json({ error: "imageBase64 requerido" }, 400);

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-5-5",
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
            { type: "text", text: "Analiza esta comida y responde solo con el JSON." },
          ],
        }],
      }),
    });

    if (!res.ok) return json({ error: `Anthropic ${res.status}: ${await res.text()}` }, 502);

    const data = await res.json();
    const text: string = data.content?.find((b: { type: string }) => b.type === "text")?.text ?? "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean.slice(clean.indexOf("{"), clean.lastIndexOf("}") + 1));
    return json(parsed);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Error desconocido" }, 500);
  }
});
