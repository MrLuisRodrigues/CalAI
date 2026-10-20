export interface AIIngredient {
  nombre: string;
  cantidad: string;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
}
export interface MealAnalysis {
  plato: string;
  resumen: string;
  ingredientes: AIIngredient[];
  totales: { calorias: number; proteinas: number; carbohidratos: number; grasas: number };
}
export interface Meal {
  id: string;
  user_id: string;
  name: string;
  summary: string | null;
  image_path: string | null;
  image_url?: string | null;
  ingredients: AIIngredient[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  eaten_at: string;
}
export interface Profile {
  user_id: string;
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fat: number;
}
