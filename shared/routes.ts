
import { z } from 'zod';
import { insertProductionEntrySchema, insertBomItemSchema, insertBomRelationshipSchema, productionEntries, bomItems, bomRelationships } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  production: {
    list: {
      method: 'GET' as const,
      path: '/api/production',
      responses: {
        200: z.array(z.custom<typeof productionEntries.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/production',
      input: insertProductionEntrySchema,
      responses: {
        201: z.custom<typeof productionEntries.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/production/:id',
      input: insertProductionEntrySchema.partial(),
      responses: {
        200: z.custom<typeof productionEntries.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/production/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    stats: {
      method: 'GET' as const,
      path: '/api/production/stats',
      responses: {
        200: z.object({
          totalOutput: z.number(),
          totalRejected: z.number(),
          rejectionRate: z.number(),
          byShift: z.record(z.number()),
          byMachine: z.array(z.object({ name: z.string(), output: z.number(), rejected: z.number() })),
        }),
      },
    }
  },
  bom: {
    items: {
      list: {
        method: 'GET' as const,
        path: '/api/bom/items',
        responses: {
          200: z.array(z.custom<typeof bomItems.$inferSelect>()),
        },
      },
      create: {
        method: 'POST' as const,
        path: '/api/bom/items',
        input: insertBomItemSchema,
        responses: {
          201: z.custom<typeof bomItems.$inferSelect>(),
          400: errorSchemas.validation,
        },
      },
    },
    relationships: {
      list: {
        method: 'GET' as const,
        path: '/api/bom/relationships',
        responses: {
          200: z.array(z.custom<typeof bomRelationships.$inferSelect>()),
        },
      },
      create: {
        method: 'POST' as const,
        path: '/api/bom/relationships',
        input: insertBomRelationshipSchema,
        responses: {
          201: z.custom<typeof bomRelationships.$inferSelect>(),
          400: errorSchemas.validation,
        },
      },
    },
    // Endpoint to get the full tree for a product
    structure: {
        method: 'GET' as const,
        path: '/api/bom/structure/:id',
        responses: {
            200: z.any(), // Recursive type difficult to express in Zod purely
            404: errorSchemas.notFound
        }
    },
    calculate: {
        method: 'POST' as const,
        path: '/api/bom/calculate',
        input: z.object({
            productCode: z.string(), // Assuming mapping by name for now, or ID
            quantity: z.number()
        }),
        responses: {
            200: z.array(z.object({
                materialName: z.string(),
                totalQuantity: z.number()
            }))
        }
    },
    importProduction: {
      method: 'POST' as const,
      path: '/api/production/import',
      input: z.array(insertProductionEntrySchema),
      responses: {
        201: z.object({ count: z.number() }),
        400: errorSchemas.validation,
      },
    },
    exportBom: {
      method: 'GET' as const,
      path: '/api/bom/export',
      responses: {
        200: z.object({
          items: z.array(z.custom<typeof bomItems.$inferSelect>()),
          relationships: z.array(z.custom<typeof bomRelationships.$inferSelect>()),
        }),
      },
    },
    importBom: {
      method: 'POST' as const,
      path: '/api/bom/import',
      input: z.object({
        items: z.array(insertBomItemSchema),
        relationships: z.array(insertBomRelationshipSchema),
      }),
      responses: {
        201: z.object({ itemsCount: z.number(), relationshipsCount: z.number() }),
        400: errorSchemas.validation,
      },
    },
    materialsConsumedToday: {
      method: 'GET' as const,
      path: '/api/reports/materials-consumed-today',
      responses: {
        200: z.array(z.object({
          materialName: z.string(),
          totalQuantity: z.number()
        })),
      },
    }
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
