// Frontend-safe type definitions
// These types mirror the database schema but contain no drizzle/zod/node dependencies

export interface User {
  id: number;
  initials: string;
  pin: string;
  roles: string[];
  isAdmin: boolean;
  maxDailyHours: number | null;
  hourlyRate: number | null;
  createdAt: Date | null;
}

export interface Vehicle {
  id: number;
  licensePlate: string;
  name: string | null;
  notes: string | null;
  isEv: boolean;
  readyForCollection: boolean;
  collectionTodoId: number | null;
  isPast: boolean;
  countdownStart: Date;
  createdAt: Date | null;
}

export interface VehicleWithComments extends Vehicle {
  comments: Comment[];
}

export interface Comment {
  id: number;
  vehicleId: number;
  content: string;
  userInitials: string | null;
  createdAt: Date | null;
}

export interface Todo {
  id: number;
  title: string;
  assignedTo: string[];
  completed: boolean;
  completedBy: string | null;
  completedAt: Date | null;
  vehicleId: number | null;
  isSystemGenerated: boolean;
  isRecurring: boolean;
  priority: number;
  postponedToDate: string | null;
  postponeCount: number;
  createdAt: Date | null;
}

export interface QualityCheck {
  id: number;
  licensePlate: string;
  isEv: boolean;
  passed: boolean;
  comment: string | null;
  checkedBy: string | null;
  createdAt: Date | null;
}

export interface FlowTask {
  id: number;
  licensePlate: string;
  isEv: boolean;
  taskType: string;
  priority: number;
  completed: boolean;
  completedBy: string | null;
  completedAt: Date | null;
  needsRetry: boolean;
  needAt: Date | null;
  createdBy: string | null;
  createdAt: Date | null;
}

export interface DriverTask {
  id: number;
  qualityCheckId: number;
  licensePlate: string;
  description: string;
  completed: boolean;
  completedBy: string | null;
  completedAt: Date | null;
  createdAt: Date | null;
}

export interface ModuleStatus {
  id: number;
  moduleName: string;
  isDone: boolean;
  doneAt: Date | null;
  doneBy: string | null;
  date: string;
}

export interface TimedriverCalculation {
  id: number;
  date: string;
  rentals: number;
  budgetPerRental: number;
  totalBudget: number;
  driversData: string;
  calculatedBy: string | null;
  calculatedAt: Date | null;
}

export interface VehicleDailyComment {
  id: number;
  vehicleId: number;
  date: string;
  hasComment: boolean;
  commentId: number | null;
}

export interface UpgradeVehicle {
  id: number;
  licensePlate: string;
  model: string;
  reason: string;
  isVan: boolean;
  isSold: boolean;
  soldAt: Date | null;
  soldBy: string | null;
  date: string;
  createdBy: string | null;
  createdAt: Date | null;
}

export interface FuturePlanning {
  id: number;
  date: string;
  reservationsTotal: number;
  reservationsCar: number;
  reservationsVan: number;
  reservationsTas: number;
  deliveriesTomorrow: number;
  collectionsOpen: number;
  carDayMin: number | null;
  vanDayMin: number | null;
  savedBy: string | null;
  savedAt: Date | null;
}

export interface KpiMetric {
  id: number;
  key: string;
  value: number;
  goal: number;
  yesterdayValue: number | null;
  updatedBy: string | null;
  updatedAt: Date | null;
}

export interface AppSettings {
  id: number;
  key: string;
  value: string;
  updatedAt: Date | null;
}

// Insert/Create types for API requests
export interface InsertUser {
  initials: string;
  pin: string;
  roles?: string[];
  isAdmin?: boolean;
  maxDailyHours?: number | null;
  hourlyRate?: number | null;
}

export interface InsertVehicle {
  licensePlate: string;
  name?: string | null;
  notes?: string | null;
  isEv?: boolean;
  readyForCollection?: boolean;
  collectionTodoId?: number | null;
  isPast?: boolean;
  countdownStart: Date;
}

export interface InsertComment {
  vehicleId: number;
  content: string;
  userInitials?: string | null;
}

export interface InsertTodo {
  title: string;
  assignedTo?: string[];
  completed?: boolean;
  completedBy?: string;
  vehicleId?: number | null;
  isSystemGenerated?: boolean;
  isRecurring?: boolean;
  priority?: number;
  postponedToDate?: string | null;
  postponeCount?: number;
}

export interface InsertQualityCheck {
  licensePlate: string;
  isEv?: boolean;
  passed: boolean;
  comment?: string;
  checkedBy?: string;
}

export interface InsertFlowTask {
  licensePlate: string;
  isEv?: boolean;
  taskType: string;
  priority?: number;
  completed?: boolean;
  completedBy?: string;
  needsRetry?: boolean;
  needAt?: Date | null;
  createdBy?: string;
}

export interface InsertDriverTask {
  qualityCheckId: number;
  licensePlate: string;
  description: string;
  completed?: boolean;
  completedBy?: string;
}

export interface InsertModuleStatus {
  moduleName: string;
  isDone?: boolean;
  doneBy?: string;
  date: string;
}

export interface InsertTimedriverCalculation {
  date: string;
  rentals: number;
  budgetPerRental: number;
  totalBudget: number;
  driversData: string;
  calculatedBy?: string;
}

export interface InsertUpgradeVehicle {
  licensePlate: string;
  model: string;
  reason: string;
  isVan?: boolean;
  isSold?: boolean;
  soldBy?: string;
  date: string;
  createdBy?: string;
}

export interface InsertFuturePlanning {
  date: string;
  reservationsTotal: number;
  reservationsCar: number;
  reservationsVan: number;
  reservationsTas: number;
  deliveriesTomorrow: number;
  collectionsOpen: number;
  carDayMin?: number | null;
  vanDayMin?: number | null;
  savedBy?: string;
}

export interface InsertKpiMetric {
  key: "irpd" | "ses" | "upmtd";
  value: number;
  goal: number;
  yesterdayValue?: number | null;
  updatedBy?: string;
}

// Legacy type aliases for backward compatibility
export type CreateUserRequest = InsertUser;
export type CreateVehicleRequest = InsertVehicle;
export type CreateCommentRequest = Omit<InsertComment, "vehicleId">;
