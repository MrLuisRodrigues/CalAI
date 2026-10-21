import { cn } from "@/lib/utils";

export const Progress = ({ value = 0, className }: { value?: number; className?: string }) => (
  <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
  </div>
);
