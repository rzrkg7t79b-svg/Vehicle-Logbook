import { Link, useLocation } from "wouter";
import { LayoutDashboard, PlusCircle, Users } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

export function Navigation() {
  const [location] = useLocation();
  const { user } = useUser();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-white/5 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16 px-4 max-w-md mx-auto">
        <Link href="/" className={`
          flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200
          ${location === "/" ? "text-primary" : "text-muted-foreground hover:text-foreground"}
        `}>
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-medium tracking-wide uppercase">Dashboard</span>
        </Link>
        
        <Link href="/add" className={`
          flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200
          ${location === "/add" ? "text-primary" : "text-muted-foreground hover:text-foreground"}
        `}>
          <PlusCircle className="w-6 h-6" />
          <span className="text-[10px] font-medium tracking-wide uppercase">Add New</span>
        </Link>
        
        {user?.isAdmin && (
          <Link href="/users" className={`
            flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200
            ${location === "/users" ? "text-primary" : "text-muted-foreground hover:text-foreground"}
          `} data-testid="nav-users">
            <Users className="w-6 h-6" />
            <span className="text-[10px] font-medium tracking-wide uppercase">Users</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
