import React from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Define the Step component props
interface StepProps {
  title: string;
  description?: string;
  completed?: boolean;
  current?: boolean;
}

export function Step({
  title,
  description,
  completed = false,
  current = false,
}: StepProps) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center border text-sm font-medium",
          completed
            ? "bg-primary text-primary-foreground border-transparent"
            : current
            ? "border-primary text-primary"
            : "border-muted text-muted-foreground"
        )}
      >
        {completed ? <CheckCircle2 className="h-4 w-4" /> : current ? "•" : ""}
      </div>
      <div className="mt-2 text-center">
        <h3
          className={cn(
            "text-sm font-medium",
            current ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {title}
        </h3>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 max-w-[140px]">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

// Define the Stepper component props
interface StepperProps {
  currentStep: number;
  children: React.ReactNode;
  className?: string;
}

export function Stepper({
  currentStep,
  children,
  className,
}: StepperProps) {
  // Count the total number of steps
  const steps = React.Children.toArray(children);
  const stepsCount = steps.length;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex relative justify-between">
        {/* Line connecting steps */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted -z-10">
          <div
            className="absolute top-0 left-0 h-full bg-primary transition-all"
            style={{
              width: `${(currentStep / (stepsCount - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Steps */}
        {steps}
      </div>
    </div>
  );
} 