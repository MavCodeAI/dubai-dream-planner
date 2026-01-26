import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export function StepIndicator({ currentStep, totalSteps, labels }: StepIndicatorProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className="flex items-center flex-1">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                i + 1 < currentStep
                  ? "gradient-bg text-primary-foreground"
                  : i + 1 === currentStep
                  ? "gradient-bg text-primary-foreground shadow-glow"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {i + 1}
            </div>
            {i < totalSteps - 1 && (
              <div
                className={cn(
                  "flex-1 h-1 mx-2 rounded-full transition-all duration-300",
                  i + 1 < currentStep ? "gradient-bg" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        {labels.map((label, i) => (
          <span
            key={i}
            className={cn(
              "text-xs font-medium transition-colors duration-300",
              i + 1 === currentStep ? "text-primary" : "text-muted-foreground"
            )}
            style={{ width: `${100 / totalSteps}%`, textAlign: 'center' }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

interface StepContainerProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function StepContainer({ title, subtitle, children }: StepContainerProps) {
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-navy mb-2">{title}</h2>
        {subtitle && (
          <p className="text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}
