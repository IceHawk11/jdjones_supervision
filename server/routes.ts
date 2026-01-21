
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertProductionEntrySchema, insertBomItemSchema, insertBomRelationshipSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // === Production Routes ===
  app.get(api.production.list.path, async (req, res) => {
    const entries = await storage.getProductionEntries();
    res.json(entries);
  });

  app.post(api.production.create.path, async (req, res) => {
    try {
      const input = api.production.create.input.parse(req.body);
      const entry = await storage.createProductionEntry(input);
      res.status(201).json(entry);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.production.update.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.production.update.input.parse(req.body);
      const entry = await storage.updateProductionEntry(id, input);
      if (!entry) return res.status(404).json({ message: "Not found" });
      res.json(entry);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: err.errors[0].message });
        }
        res.status(500).json({ message: "Server error" });
    }
  });

  app.delete(api.production.delete.path, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteProductionEntry(id);
    res.status(204).send();
  });

  app.get(api.production.stats.path, async (req, res) => {
    const entries = await storage.getProductionEntries();
    
    let totalOutput = 0;
    let totalRejected = 0;
    const byShift: Record<string, number> = {};
    const byMachineMap: Record<string, { output: number, rejected: number }> = {};

    entries.forEach(e => {
      totalOutput += e.quantityProduced;
      totalRejected += e.quantityRejected;
      
      byShift[e.shift] = (byShift[e.shift] || 0) + e.quantityProduced;
      
      if (!byMachineMap[e.machineName]) {
        byMachineMap[e.machineName] = { output: 0, rejected: 0 };
      }
      byMachineMap[e.machineName].output += e.quantityProduced;
      byMachineMap[e.machineName].rejected += e.quantityRejected;
    });

    const rejectionRate = totalOutput > 0 ? (totalRejected / (totalOutput + totalRejected)) * 100 : 0;
    const byMachine = Object.entries(byMachineMap).map(([name, stats]) => ({
      name,
      output: stats.output,
      rejected: stats.rejected
    }));

    res.json({
      totalOutput,
      totalRejected,
      rejectionRate,
      byShift,
      byMachine
    });
  });

 app.post("/api/production/import", async (req, res) => {
  try {
    // expecting array of production entries
    const input = req.body;

    if (!Array.isArray(input)) {
      return res.status(400).json({ message: "Expected an array of entries" });
    }

    let count = 0;
    for (const entry of input) {
      await storage.createProductionEntry(entry);
      count++;
    }

    res.status(201).json({ count });
  } catch (err) {
    res.status(500).json({ message: "Import failed" });
  }
});

  // === BOM Routes ===
  app.get(api.bom.items.list.path, async (req, res) => {
    const items = await storage.getBomItems();
    res.json(items);
  });

  app.post(api.bom.items.create.path, async (req, res) => {
    try {
      const input = api.bom.items.create.input.parse(req.body);
      const item = await storage.createBomItem(input);
      res.status(201).json(item);
    } catch (err) {
       if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      } 
      // Handle unique constraint error
      res.status(400).json({ message: "Item might already exist or invalid data" });
    }
  });

  app.get(api.bom.relationships.list.path, async (req, res) => {
    const rels = await storage.getBomRelationships();
    res.json(rels);
  });

  app.post(api.bom.relationships.create.path, async (req, res) => {
    try {
      const input = api.bom.relationships.create.input.parse(req.body);
      const rel = await storage.createBomRelationship(input);
      res.status(201).json(rel);
    } catch (err) {
       if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Error creating relationship" });
    }
  });

  // Recursive BOM calculation
  app.post(api.bom.calculate.path, async (req, res) => {
    const { productCode, quantity } = req.body;
    
    // Find the root item
    const rootItem = await storage.getBomItemByName(productCode);
    if (!rootItem) {
      return res.status(404).json({ message: "Product not found" });
    }

    const rawMaterials: Record<string, number> = {};

    async function traverse(itemId: number, qtyMultiplier: number) {
      const children = await storage.getChildren(itemId);
      
      if (children.length === 0) {
        // Leaf node (Raw Material)
        const item = await storage.getBomItem(itemId);
        if (item) {
          rawMaterials[item.name] = (rawMaterials[item.name] || 0) + qtyMultiplier;
        }
        return;
      }

      for (const childRel of children) {
        await traverse(childRel.childItemId, qtyMultiplier * childRel.quantity);
      }
    }

    await traverse(rootItem.id, quantity);

    const result = Object.entries(rawMaterials).map(([materialName, totalQuantity]) => ({
      materialName,
      totalQuantity
    }));

    res.json(result);
  });

  app.get(api.bom.exportBom.path, async (req, res) => {
    const items = await storage.getBomItems();
    const relationships = await storage.getBomRelationships();
    res.json({ items, relationships });
  });

  app.post(api.bom.importBom.path, async (req, res) => {
    try {
      const input = api.bom.importBom.input.parse(req.body);
      let itemsCount = 0;
      let relationshipsCount = 0;
      
      for (const item of input.items) {
        // Check if item exists to avoid duplicates or update them?
        // For simplicity, we create only if not exists
        const existing = await storage.getBomItemByName(item.name);
        if (!existing) {
          await storage.createBomItem(item);
          itemsCount++;
        }
      }

      for (const rel of input.relationships) {
        await storage.createBomRelationship(rel);
        relationshipsCount++;
      }

      res.status(201).json({ itemsCount, relationshipsCount });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "BOM Import failed" });
    }
  });

  app.get(api.bom.materialsConsumedToday.path, async (req, res) => {
    const entries = await storage.getProductionEntries();
    const today = new Date().setHours(0,0,0,0);
    const todayEntries = entries.filter(e => new Date(e.timestamp).getTime() >= today);
    
    const aggregatedMaterials: Record<string, number> = {};

    for (const entry of todayEntries) {
      const rootItem = await storage.getBomItemByName(entry.productCode);
      if (!rootItem) continue;

      async function traverse(itemId: number, qtyMultiplier: number) {
        const children = await storage.getChildren(itemId);
        if (children.length === 0) {
          const item = await storage.getBomItem(itemId);
          if (item) {
            aggregatedMaterials[item.name] = (aggregatedMaterials[item.name] || 0) + qtyMultiplier;
          }
          return;
        }
        for (const childRel of children) {
          await traverse(childRel.childItemId, qtyMultiplier * childRel.quantity);
        }
      }

      await traverse(rootItem.id, entry.quantityProduced);
    }

    const result = Object.entries(aggregatedMaterials).map(([materialName, totalQuantity]) => ({
      materialName,
      totalQuantity
    }));

    res.json(result);
  });

  return httpServer;
}

// Seed function
async function seed() {
  const existing = await storage.getBomItems();
  if (existing.length === 0) {
    // Seed BOM Data from the example: Gland Packing Set
    // "Gland Packing Set" = 5x PTFE Rings + 2x Metal Washers + 1x Gasket
    // "PTFE Ring" = 50g PTFE Raw Material + 2g Lubricant
    
    const set = await storage.createBomItem({ name: "Gland Packing Set", type: "assembly", description: "Finished Product" });
    const ptfeRing = await storage.createBomItem({ name: "PTFE Ring", type: "assembly", description: "Sub-assembly" });
    const washer = await storage.createBomItem({ name: "Metal Washer", type: "raw_material", description: "Component" });
    const gasket = await storage.createBomItem({ name: "Gasket", type: "raw_material", description: "Component" });
    
    const ptfeRaw = await storage.createBomItem({ name: "PTFE Raw Material", type: "raw_material", description: "Raw material (grams)" });
    const lubricant = await storage.createBomItem({ name: "Lubricant", type: "raw_material", description: "Consumable (grams)" });

    // Relationships
    await storage.createBomRelationship({ parentItemId: set.id, childItemId: ptfeRing.id, quantity: 5 });
    await storage.createBomRelationship({ parentItemId: set.id, childItemId: washer.id, quantity: 2 });
    await storage.createBomRelationship({ parentItemId: set.id, childItemId: gasket.id, quantity: 1 });

    await storage.createBomRelationship({ parentItemId: ptfeRing.id, childItemId: ptfeRaw.id, quantity: 50 });
    await storage.createBomRelationship({ parentItemId: ptfeRing.id, childItemId: lubricant.id, quantity: 2 });
    
    console.log("Seeded BOM data");
  }
}

// Run seed
seed().catch(console.error);
