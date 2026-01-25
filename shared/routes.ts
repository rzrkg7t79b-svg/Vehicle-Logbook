
import { z } from 'zod';
import { insertVehicleSchema, insertCommentSchema, insertUserSchema, insertTodoSchema, insertQualityCheckSchema, insertFlowTaskSchema, insertUpgradeVehicleSchema, insertFuturePlanningSchema, insertKpiMetricSchema, flowTaskTypes, vehicles, comments, users, todos, qualityChecks, driverTasks, flowTasks, moduleStatus, appSettings, timedriverCalculations, upgradeVehicles, futurePlanning, kpiMetrics } from './schema';

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
    drivers: {
      method: 'GET' as const,
      path: '/api/drivers',
      responses: {
        200: z.array(z.object({
          id: z.number(),
          initials: z.string(),
          maxDailyHours: z.number().nullable(),
          hourlyRate: z.number().nullable(),
        })),
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
        maxDailyHours: z.number().min(1).max(24).optional().nullable(),
        hourlyRate: z.number().min(0).optional().nullable(),
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
    postpone: {
      method: 'POST' as const,
      path: '/api/todos/:id/postpone',
      responses: {
        200: z.custom<typeof todos.$inferSelect>(),
        400: errorSchemas.validation,
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
  settings: {
    get: {
      method: 'GET' as const,
      path: '/api/settings/:key',
      responses: {
        200: z.object({ value: z.string().nullable() }),
      },
    },
    set: {
      method: 'PUT' as const,
      path: '/api/settings/:key',
      input: z.object({
        value: z.string(),
      }),
      responses: {
        200: z.custom<typeof appSettings.$inferSelect>(),
        403: errorSchemas.forbidden,
      },
    },
  },
  timedriverCalculations: {
    get: {
      method: 'GET' as const,
      path: '/api/timedriver-calculations/:date',
      responses: {
        200: z.custom<typeof timedriverCalculations.$inferSelect>().nullable(),
      },
    },
    save: {
      method: 'POST' as const,
      path: '/api/timedriver-calculations',
      input: z.object({
        date: z.string(),
        rentals: z.number(),
        budgetPerRental: z.number(),
        totalBudget: z.number(),
        driversData: z.string(),
        calculatedBy: z.string().optional(),
      }),
      responses: {
        201: z.custom<typeof timedriverCalculations.$inferSelect>(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/timedriver-calculations/:date',
      responses: {
        204: z.void(),
      },
    },
  },
  upgradeVehicles: {
    list: {
      method: 'GET' as const,
      path: '/api/upgrade-vehicles',
      responses: {
        200: z.array(z.custom<typeof upgradeVehicles.$inferSelect>()),
      },
    },
    listForDate: {
      method: 'GET' as const,
      path: '/api/upgrade-vehicles/date/:date',
      responses: {
        200: z.array(z.custom<typeof upgradeVehicles.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/upgrade-vehicles/:id',
      responses: {
        200: z.custom<typeof upgradeVehicles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/upgrade-vehicles',
      input: insertUpgradeVehicleSchema,
      responses: {
        201: z.custom<typeof upgradeVehicles.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/upgrade-vehicles/:id',
      input: z.object({
        isSold: z.boolean().optional(),
        soldBy: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof upgradeVehicles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/upgrade-vehicles/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    pending: {
      method: 'GET' as const,
      path: '/api/upgrade-vehicles/pending/:date',
      responses: {
        200: z.custom<typeof upgradeVehicles.$inferSelect>().nullable(),
      },
    },
  },
  dashboard: {
    status: {
      method: 'GET' as const,
      path: '/api/dashboard/status',
      input: z.object({
        date: z.string(),
      }),
      responses: {
        200: z.object({
          timedriver: z.object({ isDone: z.boolean(), details: z.string().optional() }),
          upgrade: z.object({ isDone: z.boolean(), hasPending: z.boolean(), isOverdue: z.boolean(), pendingVehicle: z.any().optional() }),
          todo: z.object({ isDone: z.boolean(), completed: z.number(), total: z.number() }),
          quality: z.object({ isDone: z.boolean(), passedChecks: z.number(), incompleteTasks: z.number() }),
          bodyshop: z.object({ isDone: z.boolean(), vehiclesWithoutComment: z.number(), total: z.number() }),
          future: z.object({ isDone: z.boolean(), isLocked: z.boolean() }).optional(),
          overallProgress: z.number(),
        }),
      },
    },
  },
  futurePlanning: {
    get: {
      method: 'GET' as const,
      path: '/api/future-planning/:date',
      responses: {
        200: z.custom<typeof futurePlanning.$inferSelect>().nullable(),
      },
    },
    save: {
      method: 'POST' as const,
      path: '/api/future-planning',
      input: insertFuturePlanningSchema,
      responses: {
        201: z.custom<typeof futurePlanning.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/future-planning/:date',
      responses: {
        204: z.void(),
      },
    },
  },
  kpiMetrics: {
    list: {
      method: 'GET' as const,
      path: '/api/kpi-metrics',
      responses: {
        200: z.array(z.custom<typeof kpiMetrics.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/kpi-metrics/:key',
      responses: {
        200: z.custom<typeof kpiMetrics.$inferSelect>().nullable(),
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/kpi-metrics/:key',
      input: z.object({
        value: z.number().min(0),
        goal: z.number().min(0),
      }),
      responses: {
        200: z.custom<typeof kpiMetrics.$inferSelect>(),
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
