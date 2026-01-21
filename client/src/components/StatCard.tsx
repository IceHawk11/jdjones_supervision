import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: "up" | "down" | "neutral";
  alert?: boolean;
}

export function StatCard({ title, value, icon, description, trend, alert }: StatCardProps) {
  return (
    <Card className={cn("industrial-card relative overflow-hidden", alert && "border-destructive/50 bg-destructive/5")}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold font-mono", alert && "text-destructive")}>
          {value}
        </div>
        {(description || trend) && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            {trend === "up" && <span className="text-green-500">↑</span>}
            {trend === "down" && <span className="text-destructive">↓</span>}
            {description}
          </p>
        )}
      </CardContent>
      {alert && (
        <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-destructive m-2 animate-pulse" />
      )}
    </Card>
  );
}
