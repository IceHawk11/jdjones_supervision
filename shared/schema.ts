
import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === Production Module ===
export const productionEntries = pgTable("production_entries", {
  id: serial("id").primaryKey(),
  machineName: text("machine_name").notNull(),
  productCode: text("product_code").notNull(),
  quantityProduced: integer("quantity_produced").notNull(),
  quantityRejected: integer("quantity_rejected").notNull(),
  operatorName: text("operator_name").notNull(),
  shift: text("shift").notNull(), // Morning, Afternoon, Night
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// === BOM Module ===
export const bomItems = pgTable("bom_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g., "Gland Packing Set", "PTFE Ring"
  type: text("type").notNull(), // 'assembly' | 'raw_material'
  description: text("description"),
});

export const bomRelationships = pgTable("bom_relationships", {
  id: serial("id").primaryKey(),
  parentItemId: integer("parent_item_id").notNull(),
  childItemId: integer("child_item_id").notNull(),
  quantity: integer("quantity").notNull(), // How many children needed for one parent
});

// === Relations ===
export const bomItemsRelations = relations(bomItems, ({ many }) => ({
  parents: many(bomRelationships, { relationName: "childToParent" }),
  children: many(bomRelationships, { relationName: "parentToChild" }),
}));

export const bomRelationshipsRelations = relations(bomRelationships, ({ one }) => ({
  parent: one(bomItems, {
    fields: [bomRelationships.parentItemId],
    references: [bomItems.id],
    relationName: "parentToChild",
  }),
  child: one(bomItems, {
    fields: [bomRelationships.childItemId],
    references: [bomItems.id],
    relationName: "childToParent",
  }),
}));

// === Zod Schemas ===
export const insertProductionEntrySchema = createInsertSchema(productionEntries).omit({ id: true });
export const insertBomItemSchema = createInsertSchema(bomItems).omit({ id: true });
export const insertBomRelationshipSchema = createInsertSchema(bomRelationships).omit({ id: true });

// === Types ===
export type ProductionEntry = typeof productionEntries.$inferSelect;
export type InsertProductionEntry = z.infer<typeof insertProductionEntrySchema>;

export type BomItem = typeof bomItems.$inferSelect;
export type InsertBomItem = z.infer<typeof insertBomItemSchema>;

export type BomRelationship = typeof bomRelationships.$inferSelect;
export type InsertBomRelationship = z.infer<typeof insertBomRelationshipSchema>;

// Type for the Tree View
export interface BomNode extends BomItem {
  quantityRequired?: number; // Calculated field
  children?: BomNode[];
}

export interface MaterialRequirement {
  materialName: string;
  totalQuantity: number;
}
