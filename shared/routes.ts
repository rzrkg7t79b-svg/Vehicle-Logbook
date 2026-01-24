
import { z } from 'zod';
import { insertVehicleSchema, insertCommentSchema, insertUserSchema, insertTodoSchema, insertQualityCheckSchema, insertFlowTaskSchema, flowTaskTypes, vehicles, comments, users, todos, qualityChecks, driverTasks, flowTasks, moduleStatus } from './schema';

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
  forbidden: z.object({
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
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users',
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/users/:id',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    authenticate: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: z.object({
        pin: z.string().length(4),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: z.object({ message: z.string() }),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/users',
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
        403: errorSchemas.forbidden,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/users/:id',
      input: z.object({
        initials: z.string().min(1).max(3).optional(),
        pin: z.string().length(4).regex(/^\d{4}$/).optional(),
        roles: z.array(z.enum(["Counter", "Driver"])).optional(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/users/:id',
      responses: {
        204: z.void(),
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
    checkPin: {
      method: 'POST' as const,
      path: '/api/users/check-pin',
      input: z.object({
        pin: z.string().length(4),
        excludeId: z.number().optional(),
      }),
      responses: {
        200: z.object({ available: z.boolean() }),
      },
    },
  },
  todos: {
    list: {
      method: 'GET' as const,
      path: '/api/todos',
      responses: {
        200: z.array(z.custom<typeof todos.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/todos',
      input: insertTodoSchema,
      responses: {
        201: z.custom<typeof todos.$inferSelect>(),
        400: errorSchemas.validation,
        403: errorSchemas.forbidden,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/todos/:id',
      input: z.object({
        title: z.string().optional(),
        completed: z.boolean().optional(),
        completedBy: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof todos.$inferSelect>(),
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/todos/:id',
      responses: {
        204: z.void(),
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
  },
  qualityChecks: {
    list: {
      method: 'GET' as const,
      path: '/api/quality-checks',
      responses: {
        200: z.array(z.custom<typeof qualityChecks.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/quality-checks',
      input: insertQualityCheckSchema,
      responses: {
        201: z.custom<typeof qualityChecks.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  driverTasks: {
    list: {
      method: 'GET' as const,
      path: '/api/driver-tasks',
      responses: {
        200: z.array(z.custom<typeof driverTasks.$inferSelect>()),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/driver-tasks/:id',
      input: z.object({
        completed: z.boolean().optional(),
        completedBy: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof driverTasks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  moduleStatus: {
    list: {
      method: 'GET' as const,
      path: '/api/module-status',
      input: z.object({
        date: z.string(),
      }),
      responses: {
        200: z.array(z.custom<typeof moduleStatus.$inferSelect>()),
      },
    },
    update: {
      method: 'POST' as const,
      path: '/api/module-status',
      input: z.object({
        moduleName: z.string(),
        date: z.string(),
        isDone: z.boolean(),
        doneBy: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof moduleStatus.$inferSelect>(),
      },
    },
  },
  flowTasks: {
    list: {
      method: 'GET' as const,
      path: '/api/flow-tasks',
      responses: {
        200: z.array(z.custom<typeof flowTasks.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/flow-tasks',
      input: insertFlowTaskSchema,
      responses: {
        201: z.custom<typeof flowTasks.$inferSelect>(),
        400: errorSchemas.validation,
        403: errorSchemas.forbidden,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/flow-tasks/:id',
      input: z.object({
        licensePlate: z.string().optional(),
        isEv: z.boolean().optional(),
        taskType: z.enum(flowTaskTypes).optional(),
        completed: z.boolean().optional(),
        completedBy: z.string().optional(),
        needsRetry: z.boolean().optional(),
      }),
      responses: {
        200: z.custom<typeof flowTasks.$inferSelect>(),
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/flow-tasks/:id',
      responses: {
        204: z.void(),
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
    reorder: {
      method: 'POST' as const,
      path: '/api/flow-tasks/reorder',
      input: z.object({
        taskIds: z.array(z.number()),
      }),
      responses: {
        200: z.object({ success: z.boolean() }),
        403: errorSchemas.forbidden,
      },
    },
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
