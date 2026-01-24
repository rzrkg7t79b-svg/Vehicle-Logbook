import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4 text-center">
      <div className="bg-card/50 p-8 rounded-full mb-6">
        <AlertTriangle className="h-16 w-16 text-orange-500" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-2">404</h1>
      <p className="text-muted-foreground mb-8 text-lg">Page not found</p>
      
      <Link href="/">
        <Button size="lg" className="rounded-xl font-bold bg-white text-black hover:bg-gray-200">
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
