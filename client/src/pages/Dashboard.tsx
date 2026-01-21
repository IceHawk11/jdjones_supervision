import { useProduction, useProductionStats, useDeleteProductionEntry } from "@/hooks/use-production";
import { ProductionForm } from "@/components/ProductionForm";
import { StatCard } from "@/components/StatCard";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from "recharts";
import { 
  Activity, 
  AlertTriangle, 
  Archive, 
  Trash2, 
  Users 
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { data: entries, isLoading: loadingEntries } = useProduction();
  const { data: stats, isLoading: loadingStats } = useProductionStats();
  const deleteMutation = useDeleteProductionEntry();
  const { toast } = useToast();

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      deleteMutation.mutate(id, {
        onSuccess: () => toast({ title: "Deleted", description: "Entry removed successfully." }),
        onError: () => toast({ variant: "destructive", title: "Error", description: "Could not delete entry." })
      });
    }
  };

  if (loadingEntries || loadingStats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-mono animate-pulse">LOADING SYSTEM DATA...</p>
        </div>
      </div>
    );
  }

  // Calculate trends for chart (last 10 entries)
  const chartData = entries?.slice(0, 20).reverse().map(entry => ({
    time: format(new Date(entry.timestamp), 'HH:mm'),
    produced: entry.quantityProduced,
    rejected: entry.quantityRejected
  })) || [];

  const machineData = stats?.byMachine || [];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Output Today" 
          value={stats?.totalOutput.toLocaleString() || 0} 
          icon={<Archive className="h-4 w-4" />}
          description="Units produced"
          trend="up"
        />
        <StatCard 
          title="Rejection Rate" 
          value={`${(stats?.rejectionRate || 0).toFixed(2)}%`}
          icon={<AlertTriangle className="h-4 w-4" />}
          alert={(stats?.rejectionRate || 0) > 5}
          description="Target: < 5%"
        />
        <StatCard 
          title="Active Machines" 
          value={machineData.length} 
          icon={<Activity className="h-4 w-4" />}
          description="Reporting data"
        />
        <StatCard 
          title="Top Shift" 
          value="Morning" // In a real app, calculate this
          icon={<Users className="h-4 w-4" />}
          description="Highest efficiency"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Entry Form */}
        <div className="lg:col-span-1">
          <ProductionForm />
        </div>

        {/* Right Col: Charts & Data */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card p-4 rounded-lg border shadow-sm h-[300px]">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Real-time Output
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="time" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="produced" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="rejected" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card p-4 rounded-lg border shadow-sm h-[300px]">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Archive className="w-4 h-4 text-primary" />
                Output by Machine
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={machineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                  />
                  <Bar dataKey="output" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rejected" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Entries Table */}
          <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
              <h3 className="font-semibold">Recent Production Logs</h3>
              <span className="text-xs text-muted-foreground font-mono">LIVE FEED</span>
            </div>
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Machine</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Produced</TableHead>
                    <TableHead className="text-right">Rejected</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries?.slice(0, 50).map((entry) => {
                    const isHighReject = entry.quantityProduced > 0 && (entry.quantityRejected / entry.quantityProduced) > 0.05;
                    return (
                      <TableRow key={entry.id} className={cn(isHighReject && "bg-destructive/5 hover:bg-destructive/10")}>
                        <TableCell className="font-mono text-xs">{format(new Date(entry.timestamp), "HH:mm:ss")}</TableCell>
                        <TableCell className="font-medium">{entry.machineName}</TableCell>
                        <TableCell><span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs font-mono">{entry.productCode}</span></TableCell>
                        <TableCell className="text-right font-mono">{entry.quantityProduced}</TableCell>
                        <TableCell className={cn("text-right font-mono", isHighReject ? "text-destructive font-bold" : "text-muted-foreground")}>
                          {entry.quantityRejected}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{entry.operatorName}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(entry.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!entries?.length && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No data recorded today</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
