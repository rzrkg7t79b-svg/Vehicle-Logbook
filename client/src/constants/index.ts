// Frontend-safe constants
// These are copied from shared/schema.ts to avoid importing backend code

export const flowTaskTypes = [
  "refuelling",
  "cleaning", 
  "AdBlue",
  "delivery",
  "collection",
  "water",
  "fast cleaning",
  "Bodyshop collection",
  "Bodyshop delivery",
  "LiveCheckin",
  "only CheckIN & Parking"
] as const;

export type FlowTaskType = typeof flowTaskTypes[number];

// Role constants
export const userRoles = ["Counter", "Driver"] as const;
export type UserRole = typeof userRoles[number];

// KPI keys
export const kpiKeys = ["irpd", "ses"] as const;
export type KpiKey = typeof kpiKeys[number];

// Priority levels for todos
export const priorityLevels = [0, 1, 2, 3] as const;
export type PriorityLevel = typeof priorityLevels[number];
