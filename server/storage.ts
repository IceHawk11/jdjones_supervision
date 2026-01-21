import {
  type ProductionEntry,
  type InsertProductionEntry,
  type BomItem,
  type InsertBomItem,
  type BomRelationship,
  type InsertBomRelationship,
} from "@shared/schema";

export interface IStorage {
  // Production
  getProductionEntries(): Promise<ProductionEntry[]>;
  createProductionEntry(entry: InsertProductionEntry): Promise<ProductionEntry>;
  updateProductionEntry(
    id: number,
    entry: Partial<InsertProductionEntry>,
  ): Promise<ProductionEntry | null>;
  deleteProductionEntry(id: number): Promise<void>;

  // BOM
  getBomItems(): Promise<BomItem[]>;
  getBomItem(id: number): Promise<BomItem | undefined>;
  getBomItemByName(name: string): Promise<BomItem | undefined>;
  createBomItem(item: InsertBomItem): Promise<BomItem>;

  getBomRelationships(): Promise<BomRelationship[]>;
  createBomRelationship(rel: InsertBomRelationship): Promise<BomRelationship>;
  getChildren(parentId: number): Promise<BomRelationship[]>;
}

// ✅ In-memory data (temporary, resets on restart)
let productionEntriesData: ProductionEntry[] = [];
let bomItemsData: BomItem[] = [];
let bomRelationshipsData: BomRelationship[] = [];

let productionId = 1;
let bomItemId = 1;
let bomRelId = 1;

class MemoryStorage implements IStorage {
  // ===== Production =====
  async getProductionEntries(): Promise<ProductionEntry[]> {
    // latest first (like desc(timestamp))
    return productionEntriesData.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  async createProductionEntry(entry: InsertProductionEntry): Promise<ProductionEntry> {
    const newEntry: ProductionEntry = {
      id: productionId++,
      timestamp: entry.timestamp ?? new Date(),
      ...entry,
    } as ProductionEntry;

    productionEntriesData.push(newEntry);
    return newEntry;
  }

  async updateProductionEntry(
    id: number,
    entry: Partial<InsertProductionEntry>,
  ): Promise<ProductionEntry | null> {
    const idx = productionEntriesData.findIndex((e) => e.id === id);
    if (idx === -1) return null;

    productionEntriesData[idx] = {
      ...productionEntriesData[idx],
      ...entry,
    };

    return productionEntriesData[idx];
  }

  async deleteProductionEntry(id: number): Promise<void> {
    productionEntriesData = productionEntriesData.filter((e) => e.id !== id);
  }

  // ===== BOM Items =====
  async getBomItems(): Promise<BomItem[]> {
    return bomItemsData;
  }

  async getBomItem(id: number): Promise<BomItem | undefined> {
    return bomItemsData.find((x) => x.id === id);
  }

  async getBomItemByName(name: string): Promise<BomItem | undefined> {
    return bomItemsData.find((x) => x.name === name);
  }

  async createBomItem(item: InsertBomItem): Promise<BomItem> {
    const newItem: BomItem = {
      id: bomItemId++,
      ...item,
    } as BomItem;

    bomItemsData.push(newItem);
    return newItem;
  }

  // ===== BOM Relationships =====
  async getBomRelationships(): Promise<BomRelationship[]> {
    return bomRelationshipsData;
  }

  async createBomRelationship(rel: InsertBomRelationship): Promise<BomRelationship> {
    const newRel: BomRelationship = {
      id: bomRelId++,
      ...rel,
    } as BomRelationship;

    bomRelationshipsData.push(newRel);
    return newRel;
  }

  async getChildren(parentId: number): Promise<BomRelationship[]> {
    return bomRelationshipsData.filter((r) => r.parentItemId === parentId);
  }
}

export const storage: IStorage = new MemoryStorage();
