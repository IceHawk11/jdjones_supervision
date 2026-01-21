import { useState } from "react";
import { useBomItems, useCreateBomItem, useBomRelationships, useCreateBomRelationship, useCalculateMaterials } from "@/hooks/use-bom";
import { InsertBomItem, InsertBomRelationship } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Link as LinkIcon, Calculator, Package, Box, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BomMaster() {
  const [activeTab, setActiveTab] = useState("items");
  
  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">BOM Master</h2>
          <p className="text-muted-foreground">Manage bill of materials, components, and calculate requirements.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-card border shadow-sm p-1 h-12">
          <TabsTrigger value="items" className="h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Package className="w-4 h-4 mr-2" />
            Items Registry
          </TabsTrigger>
          <TabsTrigger value="structure" className="h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <LinkIcon className="w-4 h-4 mr-2" />
            Product Structure
          </TabsTrigger>
          <TabsTrigger value="calculator" className="h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Calculator className="w-4 h-4 mr-2" />
            Material Calculator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <ItemsTab />
        </TabsContent>

        <TabsContent value="structure" className="space-y-4">
          <StructureTab />
        </TabsContent>

        <TabsContent value="calculator" className="space-y-4">
          <CalculatorTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ItemsTab() {
  const { data: items, isLoading } = useBomItems();
  const createItem = useCreateBomItem();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<InsertBomItem>>({ type: 'raw_material' });

  const handleCreate = () => {
    if (!newItem.name || !newItem.type) return;
    createItem.mutate(newItem as InsertBomItem, {
      onSuccess: () => {
        toast({ title: "Created", description: "Item added to registry" });
        setOpen(false);
        setNewItem({ type: 'raw_material', name: '', description: '' });
      }
    });
  };

  return (
    <Card className="industrial-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Item Registry</CardTitle>
          <CardDescription>All raw materials and assemblies</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input 
                  placeholder="e.g. PTFE Ring" 
                  value={newItem.name} 
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select 
                  value={newItem.type} 
                  onValueChange={(val) => setNewItem({...newItem, type: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raw_material">Raw Material</SelectItem>
                    <SelectItem value="assembly">Assembly / Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input 
                  placeholder="Optional details" 
                  value={newItem.description || ''} 
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})} 
                />
              </div>
              <Button onClick={handleCreate} disabled={createItem.isPending} className="w-full">
                {createItem.isPending ? "Creating..." : "Create Item"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3}>Loading...</TableCell></TableRow>
            ) : items?.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                    item.type === 'assembly' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {item.type.replace('_', ' ')}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{item.description || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function StructureTab() {
  const { data: items } = useBomItems();
  const { data: relationships, isLoading } = useBomRelationships();
  const createRel = useCreateBomRelationship();
  const { toast } = useToast();
  
  const [parentId, setParentId] = useState<string>("");
  const [childId, setChildId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  const handleLink = () => {
    if (!parentId || !childId) return;
    createRel.mutate({
      parentItemId: parseInt(parentId),
      childItemId: parseInt(childId),
      quantity
    }, {
      onSuccess: () => {
        toast({ title: "Linked", description: "Relationship created successfully" });
        setChildId("");
        setQuantity(1);
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Error", description: err.message });
      }
    });
  };

  const assemblies = items?.filter(i => i.type === 'assembly') || [];
  
  // Helper to get name from ID
  const getName = (id: number) => items?.find(i => i.id === id)?.name || id;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="industrial-card md:col-span-1">
        <CardHeader>
          <CardTitle>Link Components</CardTitle>
          <CardDescription>Define what goes into what</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Parent Assembly</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select parent..." />
              </SelectTrigger>
              <SelectContent>
                {assemblies.map(i => <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center text-muted-foreground">
            <ArrowRight className="w-4 h-4 rotate-90" />
          </div>

          <div className="space-y-2">
            <Label>Child Component</Label>
            <Select value={childId} onValueChange={setChildId}>
              <SelectTrigger>
                <SelectValue placeholder="Select child..." />
              </SelectTrigger>
              <SelectContent>
                {items?.filter(i => String(i.id) !== parentId).map(i => (
                  <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Quantity Required</Label>
            <Input 
              type="number" 
              min={1} 
              value={quantity} 
              onChange={(e) => setQuantity(parseInt(e.target.value))} 
            />
          </div>

          <Button className="w-full mt-4" onClick={handleLink} disabled={createRel.isPending}>
            {createRel.isPending ? "Linking..." : "Create Link"}
          </Button>
        </CardContent>
      </Card>

      <Card className="industrial-card md:col-span-2">
        <CardHeader>
          <CardTitle>Relationships</CardTitle>
          <CardDescription>Existing BOM structures</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parent Item</TableHead>
                <TableHead>Requires Child Item</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={3}>Loading...</TableCell></TableRow>
              ) : relationships?.map((rel) => (
                <TableRow key={rel.id}>
                  <TableCell className="font-medium text-primary">{getName(rel.parentItemId)}</TableCell>
                  <TableCell>{getName(rel.childItemId)}</TableCell>
                  <TableCell className="text-right font-mono">{rel.quantity}</TableCell>
                </TableRow>
              ))}
              {!relationships?.length && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No relationships defined yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function CalculatorTab() {
  const { data: items } = useBomItems();
  const calculate = useCalculateMaterials();
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);

  const handleCalculate = () => {
    if (!selectedProduct) return;
    const product = items?.find(i => String(i.id) === selectedProduct);
    if (product) {
      calculate.mutate({ productCode: product.name, quantity });
    }
  };

  const assemblies = items?.filter(i => i.type === 'assembly') || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="industrial-card md:col-span-1 h-fit">
        <CardHeader>
          <CardTitle>Requirement Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Product to Produce</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Select product..." />
              </SelectTrigger>
              <SelectContent>
                {assemblies.map(i => <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Quantity Needed</Label>
            <Input 
              type="number" 
              min={1} 
              value={quantity} 
              onChange={(e) => setQuantity(parseInt(e.target.value))} 
            />
          </div>
          <Button onClick={handleCalculate} disabled={calculate.isPending} className="w-full">
            <Calculator className="w-4 h-4 mr-2" />
            Calculate Raw Materials
          </Button>
        </CardContent>
      </Card>

      <Card className="industrial-card md:col-span-2">
        <CardHeader>
          <CardTitle>Material Requirements</CardTitle>
          <CardDescription>
            {calculate.data ? `Total raw materials needed for ${quantity} units` : "Results will appear here"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {calculate.isPending && (
            <div className="flex justify-center py-8"><div className="animate-spin border-4 border-primary border-t-transparent rounded-full w-8 h-8" /></div>
          )}
          
          {calculate.data && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Raw Material</TableHead>
                  <TableHead className="text-right">Total Quantity Required</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculate.data.map((req, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{req.materialName}</TableCell>
                    <TableCell className="text-right font-mono text-lg">{req.totalQuantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!calculate.data && !calculate.isPending && (
             <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
               <Box className="w-12 h-12 mb-2 opacity-20" />
               <p>Select a product to calculate requirements</p>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
