import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from "@/components/Navigation";
import { PinGate } from "@/components/PinGate";
import { useUser } from "@/contexts/UserContext";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import MasterDashboard from "@/pages/MasterDashboard";
import DriverSIXT from "@/pages/DriverSIXT";
import Dashboard from "@/pages/Dashboard";
import AddVehicle from "@/pages/AddVehicle";
import VehicleDetail from "@/pages/VehicleDetail";
import Users from "@/pages/Users";
import TimeDriver from "@/pages/TimeDriver";
import FlowSIXT from "@/pages/FlowSIXT";
import TodoList from "@/pages/TodoList";
import QualityCheck from "@/pages/QualityCheck";
import NotFound from "@/pages/not-found";

function HomeRedirect() {
  const { user } = useUser();
  const isDriverOnly = user?.roles?.includes("Driver") && !user?.roles?.includes("Counter") && !user?.isAdmin;
  
  if (isDriverOnly) {
    return <Redirect to="/driver" />;
  }
  return <MasterDashboard />;
}

function Router() {
  const [location] = useLocation();
  const showNavigation = location === "/" || location === "/bodyshop" || location.startsWith("/vehicle/");
  
  useRealtimeUpdates();

  return (
    <div className="w-full max-w-md mx-auto relative bg-background min-h-screen shadow-2xl overflow-hidden border-x border-white/5">
      <Switch>
        <Route path="/" component={HomeRedirect} />
        <Route path="/driver" component={DriverSIXT} />
        <Route path="/bodyshop" component={Dashboard} />
        <Route path="/add" component={AddVehicle} />
        <Route path="/vehicle/:id" component={VehicleDetail} />
        <Route path="/users" component={Users} />
        <Route path="/timedriver" component={TimeDriver} />
        <Route path="/flow" component={FlowSIXT} />
        <Route path="/todo" component={TodoList} />
        <Route path="/quality" component={QualityCheck} />
        <Route component={NotFound} />
      </Switch>
      {showNavigation && <Navigation />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <PinGate>
        <Router />
      </PinGate>
    </QueryClientProvider>
  );
}

export default App;
