// client/src/api-types.ts

export type Vehicle = {
  id: number;
  licensePlate: string;
  // usw – nur Felder, die das UI benutzt
};

export type User = {
  id: number;
  initials: string;
  roles: ("Counter" | "Driver")[];
};
