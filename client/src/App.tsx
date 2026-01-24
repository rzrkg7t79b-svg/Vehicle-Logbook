import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from "@/components/Navigation";
import { PinGate } from "@/components/PinGate";
import Dashboard from "@/pages/Dashboard";
import AddVehicle from "@/pages/AddVehicle";
import VehicleDetail from "@/pages/VehicleDetail";
import Users from "@/pages/Users";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="w-full max-w-md mx-auto relative bg-background min-h-screen shadow-2xl overflow-hidden border-x border-white/5">
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/add" component={AddVehicle} />
        <Route path="/vehicle/:id" component={VehicleDetail} />
        <Route path="/users" component={Users} />
        <Route component={NotFound} />
      </Switch>
      <Navigation />
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
