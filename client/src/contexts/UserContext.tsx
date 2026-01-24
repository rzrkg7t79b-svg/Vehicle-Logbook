import { createContext, useContext } from "react";
import type { User } from "@shared/schema";

interface UserContextType {
  user: User | null;
  logout: () => void;
}

export const UserContext = createContext<UserContextType>({
  user: null,
  logout: () => {},
});

export function useUser() {
  return useContext(UserContext);
}
