import { Link, useLocation } from "wouter";
import { LayoutDashboard, PlusCircle, Users, Car } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

export function Navigation() {
  const [location] = useLocation();
  const { user } = useUser();
  
  const isBodyshopContext = location === "/bodyshop" || location.startsWith("/vehicle/") || location === "/add";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 nav-glass pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-[72px] px-6 max-w-md mx-auto">
        <Link href="/" className={`
          flex flex-col items-center justify-center w-16 h-14 space-y-1 transition-all duration-200 rounded-2xl
          ${location === "/" 
            ? "text-primary bg-primary/10" 
            : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"}
        `} data-testid="nav-master">
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-medium tracking-wide uppercase">Master</span>
        </Link>
        
        <Link href="/bodyshop" className={`
          flex flex-col items-center justify-center w-16 h-14 space-y-1 transition-all duration-200 rounded-2xl
          ${isBodyshopContext 
            ? "text-primary bg-primary/10" 
            : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"}
        `} data-testid="nav-bodyshop">
          <Car className="w-6 h-6" />
          <span className="text-[10px] font-medium tracking-wide uppercase">Bodyshop</span>
        </Link>
        
        {isBodyshopContext && (
          <Link href="/add" className={`
            flex flex-col items-center justify-center w-16 h-14 space-y-1 transition-all duration-200 rounded-2xl
            ${location === "/add" 
              ? "text-primary bg-primary/10" 
              : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"}
          `} data-testid="nav-add">
            <PlusCircle className="w-6 h-6" />
            <span className="text-[10px] font-medium tracking-wide uppercase">Add</span>
          </Link>
        )}
        
        {user?.isAdmin && (
          <Link href="/users" className={`
            flex flex-col items-center justify-center w-16 h-14 space-y-1 transition-all duration-200 rounded-2xl
            ${location === "/users" 
              ? "text-primary bg-primary/10" 
              : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"}
          `} data-testid="nav-users">
            <Users className="w-6 h-6" />
            <span className="text-[10px] font-medium tracking-wide uppercase">Users</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
