
import { z } from 'zod';
import { insertVehicleSchema, insertCommentSchema, vehicles, comments } from './schema';

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
  vehicles: {
    list: {
      method: 'GET' as const,
      path: '/api/vehicles',
      input: z.object({
        search: z.string().optional(),
        filter: z.enum(['all', 'expired']).optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof vehicles.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/vehicles/:id',
      responses: {
        200: z.custom<typeof vehicles.$inferSelect & { comments: typeof comments.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/vehicles',
      input: insertVehicleSchema,
      responses: {
        201: z.custom<typeof vehicles.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/vehicles/:id',
      input: z.object({
        readyForCollection: z.boolean().optional(),
      }),
      responses: {
        200: z.custom<typeof vehicles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/vehicles/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    createComment: {
      method: 'POST' as const,
      path: '/api/vehicles/:id/comments',
      input: insertCommentSchema.omit({ vehicleId: true }),
      responses: {
        201: z.custom<typeof comments.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    listComments: {
        method: 'GET' as const,
        path: '/api/vehicles/:id/comments',
        responses: {
            200: z.array(z.custom<typeof comments.$inferSelect>()),
            404: errorSchemas.notFound
        }
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
