import { Progress } from "@/components/ui/progress";

export function MacroBar({ label, value, goal }: { label: string; value: number; goal: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{Math.round(value)} / {goal} g</span>
      </div>
      <Progress value={Math.min((value / Math.max(goal, 1)) * 100, 100)} className="h-2" />
    </div>
  );
}
