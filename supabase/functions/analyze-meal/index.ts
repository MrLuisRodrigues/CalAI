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

    const model = Deno.env.get("GEMINI_MODEL") ?? "gemini-3.5-flash";
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": Deno.env.get("GEMINI_API_KEY")!,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{
            role: "user",
            parts: [
              { inline_data: { mime_type: mediaType, data: imageBase64 } },
              { text: "Analiza esta comida y responde solo con el JSON." },
            ],
          }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.2, maxOutputTokens: 4096 },
        }),
      },
    );

    if (!res.ok) return json({ error: `Gemini ${res.status}: ${await res.text()}` }, 502);

    const data = await res.json();
    const text: string = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
    if (!text) return json({ error: `Gemini no devolvió contenido (${data.promptFeedback?.blockReason ?? "sin detalle"})` }, 502);

    const clean = text.replace(/```json|```/g, "").trim();
    return json(JSON.parse(clean.slice(clean.indexOf("{"), clean.lastIndexOf("}") + 1)));
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Error desconocido" }, 500);
  }
});
