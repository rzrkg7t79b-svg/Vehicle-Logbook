// Frontend API utilities
// No backend/drizzle/zod dependencies

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

// API path constants
export const API_PATHS = {
  vehicles: {
    list: '/api/vehicles',
    get: '/api/vehicles/:id',
    create: '/api/vehicles',
    update: '/api/vehicles/:id',
    delete: '/api/vehicles/:id',
    createComment: '/api/vehicles/:id/comments',
    listComments: '/api/vehicles/:id/comments',
  },
  users: {
    list: '/api/users',
    drivers: '/api/drivers',
    get: '/api/users/:id',
    authenticate: '/api/auth/login',
    create: '/api/users',
    update: '/api/users/:id',
    delete: '/api/users/:id',
    checkPin: '/api/users/check-pin',
  },
  todos: {
    list: '/api/todos',
    create: '/api/todos',
    update: '/api/todos/:id',
    delete: '/api/todos/:id',
    postpone: '/api/todos/:id/postpone',
  },
  qualityChecks: {
    list: '/api/quality-checks',
    create: '/api/quality-checks',
  },
  driverTasks: {
    list: '/api/driver-tasks',
    update: '/api/driver-tasks/:id',
  },
  moduleStatus: {
    list: '/api/module-status',
    update: '/api/module-status',
  },
  flowTasks: {
    list: '/api/flow-tasks',
    create: '/api/flow-tasks',
    update: '/api/flow-tasks/:id',
    delete: '/api/flow-tasks/:id',
    reorder: '/api/flow-tasks/reorder',
  },
  settings: {
    get: '/api/settings/:key',
    set: '/api/settings/:key',
  },
  timedriverCalculations: {
    get: '/api/timedriver-calculations/:date',
    save: '/api/timedriver-calculations',
    delete: '/api/timedriver-calculations/:date',
  },
  upgradeVehicles: {
    list: '/api/upgrade-vehicles',
    listForDate: '/api/upgrade-vehicles/date/:date',
    get: '/api/upgrade-vehicles/:id',
    create: '/api/upgrade-vehicles',
    update: '/api/upgrade-vehicles/:id',
    delete: '/api/upgrade-vehicles/:id',
    pending: '/api/upgrade-vehicles/pending/:date',
  },
  dashboard: {
    status: '/api/dashboard/status',
  },
  futurePlanning: {
    get: '/api/future-planning/:date',
    save: '/api/future-planning',
    delete: '/api/future-planning/:date',
  },
  kpiMetrics: {
    list: '/api/kpi-metrics',
    get: '/api/kpi-metrics/:key',
    update: '/api/kpi-metrics/:key',
  },
} as const;
