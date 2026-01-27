import type { User, InsertUser } from "@/types";

const USERS_STORAGE_KEY = "mastersixt_users";

export interface LocalUser extends Omit<User, 'createdAt'> {
  createdAt: string | null;
}

const DEFAULT_USERS: LocalUser[] = [
  {
    id: 1,
    initials: "BM",
    pin: "4266",
    roles: ["Counter", "Driver"],
    isAdmin: true,
    maxDailyHours: null,
    hourlyRate: null,
    createdAt: new Date().toISOString(),
  },
];

function getNextId(users: LocalUser[]): number {
  if (users.length === 0) return 1;
  return Math.max(...users.map(u => u.id)) + 1;
}

export function getUsers(): LocalUser[] {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as LocalUser[];
    } catch {
      localStorage.removeItem(USERS_STORAGE_KEY);
    }
  }
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
  return DEFAULT_USERS;
}

export function saveUsers(users: LocalUser[]): void {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export function getUserByPin(pin: string): LocalUser | null {
  const users = getUsers();
  return users.find(u => u.pin === pin) || null;
}

export function getUserById(id: number): LocalUser | null {
  const users = getUsers();
  return users.find(u => u.id === id) || null;
}

export function createUser(data: InsertUser): LocalUser {
  const users = getUsers();
  
  if (users.some(u => u.pin === data.pin)) {
    throw new Error("PIN already in use");
  }
  
  const newUser: LocalUser = {
    id: getNextId(users),
    initials: data.initials,
    pin: data.pin,
    roles: data.roles || [],
    isAdmin: data.isAdmin || false,
    maxDailyHours: data.maxDailyHours ?? null,
    hourlyRate: data.hourlyRate ?? null,
    createdAt: new Date().toISOString(),
  };
  
  users.push(newUser);
  saveUsers(users);
  return newUser;
}

export function updateUser(id: number, data: Partial<InsertUser>): LocalUser {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  
  if (index === -1) {
    throw new Error("User not found");
  }
  
  if (data.pin && data.pin !== users[index].pin) {
    if (users.some(u => u.pin === data.pin && u.id !== id)) {
      throw new Error("PIN already in use");
    }
  }
  
  users[index] = {
    ...users[index],
    ...data,
    maxDailyHours: data.maxDailyHours !== undefined ? data.maxDailyHours : users[index].maxDailyHours,
    hourlyRate: data.hourlyRate !== undefined ? data.hourlyRate : users[index].hourlyRate,
  };
  
  saveUsers(users);
  return users[index];
}

export function deleteUser(id: number): void {
  const users = getUsers();
  const filtered = users.filter(u => u.id !== id);
  
  if (filtered.length === users.length) {
    throw new Error("User not found");
  }
  
  saveUsers(filtered);
}

export function getDrivers(): Pick<LocalUser, 'id' | 'initials' | 'maxDailyHours' | 'hourlyRate'>[] {
  const users = getUsers();
  return users
    .filter(u => u.roles.includes("Driver"))
    .map(u => ({
      id: u.id,
      initials: u.initials,
      maxDailyHours: u.maxDailyHours,
      hourlyRate: u.hourlyRate,
    }));
}

export function isPinUnique(pin: string, excludeId?: number): boolean {
  const users = getUsers();
  return !users.some(u => u.pin === pin && u.id !== excludeId);
}

export function localUserToUser(localUser: LocalUser): User {
  return {
    ...localUser,
    createdAt: localUser.createdAt ? new Date(localUser.createdAt) : null,
  };
}
