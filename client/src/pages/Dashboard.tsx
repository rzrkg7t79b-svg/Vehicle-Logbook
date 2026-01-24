import { useState } from "react";
import { useVehicles } from "@/hooks/use-vehicles";
import { CountdownTimer } from "@/components/CountdownTimer";
import { GermanPlate } from "@/components/GermanPlate";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Search, Filter, Car, BatteryCharging } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { isToday } from "date-fns";

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<'all' | 'expired'>('all');
  
  const { data: vehicles, isLoading, isError } = useVehicles({ 
    search: search || undefined, 
    filter: filter === 'all' ? undefined : filter 
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-muted"></div>
          <div className="h-4 w-32 rounded bg-muted"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center text-center">
        <h2 className="text-xl font-bold text-destructive mb-2">Something went wrong</h2>
        <p className="text-muted-foreground">Could not load vehicle database.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-white/5 px-4 pt-12 pb-4">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">
              Bodyshop<span className="text-primary">SIXT</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Active Vehicles: <span className="text-white font-mono">{vehicles?.length || 0}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search Plate..." 
              className="pl-9 bg-card border-white/5 focus:border-primary/50 transition-colors h-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setFilter(prev => prev === 'all' ? 'expired' : 'all')}
            className={`
              h-11 px-4 rounded-lg border flex items-center gap-2 font-medium transition-all
              ${filter === 'expired' 
                ? 'bg-red-500/10 border-red-500/50 text-red-500' 
                : 'bg-card border-white/5 text-muted-foreground hover:text-white'}
            `}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Expired</span>
          </button>
        </div>
      </header>

      {/* Vehicle List */}
      <main className="p-4 space-y-3">
        {!vehicles || vehicles.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <Car className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-medium text-muted-foreground">No vehicles found</h3>
            <p className="text-sm text-muted-foreground/50 mt-1">
              {search ? "Try a different search term" : "Add a new vehicle to get started"}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {vehicles.map((vehicle, index) => (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/vehicle/${vehicle.id}`}>
                  <div className="group glass-card rounded-xl p-4 active:scale-[0.98] transition-all hover:border-primary/30 relative overflow-hidden">
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <GermanPlate plate={vehicle.licensePlate} size="sm" />
                        {vehicle.isEv && (
                          <div className="flex items-center gap-1 text-green-400">
                            <BatteryCharging className="w-4 h-4" />
                            <span className="text-xs font-bold">EV</span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground font-medium truncate">
                          {vehicle.name || "Unknown Model"}
                        </p>
                        <CountdownTimer 
                          startDate={vehicle.countdownStart} 
                          hasCommentToday={vehicle.comments?.some(c => isToday(new Date(c.createdAt!)))}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
