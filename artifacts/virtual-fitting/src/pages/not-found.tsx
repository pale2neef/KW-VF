import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Scissors } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-background text-foreground p-6 selection:bg-primary/20 selection:text-primary">
      <div className="max-w-md w-full text-center flex flex-col items-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center text-primary mb-2">
          <Scissors className="w-8 h-8" />
        </div>
        
        <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight text-primary">
          Page Not Found
        </h1>
        
        <p className="text-muted-foreground text-lg leading-relaxed">
          The section you are looking for seems to have been misplaced in our atelier. Let's get you back to the fitting room.
        </p>

        <div className="pt-4">
          <Link href="/">
            <Button size="lg" className="w-full sm:w-auto font-serif tracking-wide">
              Return to Fitting Room
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
