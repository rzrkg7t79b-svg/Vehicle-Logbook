import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useVehicle, useCreateComment, useDeleteVehicle } from "@/hooks/use-vehicles";
import { CountdownTimer } from "@/components/CountdownTimer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Trash2, Send, Clock, User, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function VehicleDetail() {
  const [, params] = useRoute("/vehicle/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const id = Number(params?.id);
  
  const { data: vehicle, isLoading, isError } = useVehicle(id);
  const deleteMutation = useDeleteVehicle();
  const createComment = useCreateComment();
  
  const [commentText, setCommentText] = useState("");

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary"/></div>;
  if (isError || !vehicle) return <div className="p-8 text-center text-red-500">Vehicle not found</div>;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await createComment.mutateAsync({ vehicleId: id, content: commentText });
      setCommentText("");
    } catch (error) {
      toast({ title: "Failed to add comment", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      setLocation("/");
      toast({ title: "Vehicle deleted" });
    } catch (error) {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-white/5 px-4 h-16 flex items-center justify-between">
        <button 
          onClick={() => setLocation("/")}
          className="p-2 -ml-2 rounded-full hover:bg-white/5 active:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <span className="font-mono font-bold tracking-wider">{vehicle.licensePlate}</span>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="p-2 -mr-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-xs rounded-2xl bg-card border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Vehicle?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove this vehicle and all its history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white rounded-xl">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </header>

      <main className="p-4 space-y-6">
        {/* Countdown Hero */}
        <section className="flex justify-center py-4">
          <CountdownTimer startDate={vehicle.countdownStart} size="lg" />
        </section>

        {/* Info Card */}
        <section className="glass-card rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-xs uppercase font-bold text-muted-foreground tracking-widest mb-1">Vehicle</h3>
            <p className="text-xl font-medium text-white">{vehicle.name || "Unnamed Model"}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div>
               <h3 className="text-xs uppercase font-bold text-muted-foreground tracking-widest mb-1">Started</h3>
               <p className="font-mono text-sm">{format(new Date(vehicle.countdownStart), "MMM dd, yyyy")}</p>
             </div>
             <div>
               <h3 className="text-xs uppercase font-bold text-muted-foreground tracking-widest mb-1">Status</h3>
               <p className="text-sm font-medium">{vehicle.isEv ? "Electric (EV)" : "Standard ICE"}</p>
             </div>
          </div>

          {vehicle.notes && (
            <div className="pt-2 border-t border-white/5">
              <h3 className="text-xs uppercase font-bold text-muted-foreground tracking-widest mb-2">Initial Notes</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{vehicle.notes}</p>
            </div>
          )}
        </section>

        {/* Comments Section */}
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            History Log
          </h2>

          <form onSubmit={handleAddComment} className="mb-6 relative">
            <Textarea 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a progress update..."
              className="bg-card border-white/10 pr-12 min-h-[80px] rounded-xl resize-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
            <button 
              type="submit"
              disabled={createComment.isPending || !commentText.trim()}
              className="absolute bottom-3 right-3 p-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              {createComment.isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />}
            </button>
          </form>

          <div className="space-y-4">
            {vehicle.comments && vehicle.comments.length > 0 ? (
              vehicle.comments.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()).map((comment) => (
                <div key={comment.id} className="bg-card/50 border border-white/5 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <span className="text-xs font-bold text-muted-foreground">User Log</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {format(new Date(comment.createdAt!), "MMM dd, hh:mm a")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-200">{comment.content}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground/50 border-2 border-dashed border-white/5 rounded-xl">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No updates recorded yet</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
