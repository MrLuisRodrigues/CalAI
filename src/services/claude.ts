import { db } from "@/lib/db";
import type { MealAnalysis } from "@/types/meal";

export async function analyzeMealImage(base64: string, mediaType = "image/jpeg"): Promise<MealAnalysis> {
  const { data, error } = await db.functions.invoke("analyze-meal", {
    body: { imageBase64: base64, mediaType },
  });
  if (error) throw new Error(error.message);
  if (data?.error === "no_food") throw new Error("No detecté comida en la imagen. Intenta con otra foto.");
  if (data?.error) throw new Error(data.error);
  if (!data?.ingredientes || !data?.totales) throw new Error("Respuesta inválida de la IA");
  return data as MealAnalysis;
}
