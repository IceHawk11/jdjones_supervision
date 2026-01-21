import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductionEntrySchema, type InsertProductionEntry } from "@shared/schema";
import { useCreateProductionEntry } from "@/hooks/use-production";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MACHINES = ["Press A", "Press B", "Lathe 1", "Lathe 2", "Assembly 1", "Other"];
const SHIFTS = ["Morning", "Afternoon", "Night"];

export function ProductionForm() {
  const { toast } = useToast();
  const createMutation = useCreateProductionEntry();
  
  const form = useForm<InsertProductionEntry>({
    resolver: zodResolver(insertProductionEntrySchema),
    defaultValues: {
      machineName: "",
      productCode: "",
      quantityProduced: 0,
      quantityRejected: 0,
      operatorName: "",
      shift: "Morning",
    },
  });

  const onSubmit = (data: InsertProductionEntry) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast({ title: "Entry Saved", description: "Production data recorded successfully." });
        form.reset({
          machineName: data.machineName, // Keep machine selected for speed
          productCode: data.productCode, // Keep product selected
          operatorName: data.operatorName, // Keep operator
          shift: data.shift, // Keep shift
          quantityProduced: 0,
          quantityRejected: 0,
        });
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Error", description: err.message });
      },
    });
  };

  return (
    <Card className="industrial-card h-full">
      <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b">
        <CardTitle className="flex items-center gap-2">
          <span className="w-2 h-6 bg-primary rounded-sm" />
          New Production Entry
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="machineName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Machine</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select machine" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MACHINES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shift"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shift</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select shift" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SHIFTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. GL-105" {...field} className="font-mono" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="operatorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operator</FormLabel>
                    <FormControl>
                      <Input placeholder="Name or ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantityProduced"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qty Produced</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        className="font-mono text-lg"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantityRejected"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qty Rejected</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        className="font-mono text-lg text-destructive"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full mt-6" 
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Entry
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
