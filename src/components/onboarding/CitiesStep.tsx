import { EMIRATES } from '@/types';
import { cn } from '@/lib/utils';
import { StepContainer } from './StepIndicator';
import { DynamicIcon } from '../DynamicIcon';
import { Check } from 'lucide-react';

interface CitiesStepProps {
  selectedCities: string[];
  onToggleCity: (cityId: string) => void;
}

export function CitiesStep({ selectedCities, onToggleCity }: CitiesStepProps) {
  return (
    <StepContainer
      title="Where would you like to explore?"
      subtitle="Select the Emirates you want to visit (minimum 1)"
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {EMIRATES.map((emirate) => {
          const isSelected = selectedCities.includes(emirate.id);
          return (
            <button
              key={emirate.id}
              onClick={() => onToggleCity(emirate.id)}
              className={cn(
                "relative p-6 rounded-2xl border-2 transition-all duration-300 card-hover",
                isSelected
                  ? "border-primary bg-primary/5 shadow-glow"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full gradient-bg flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              <DynamicIcon
                name={emirate.icon}
                className={cn(
                  "w-10 h-10 mx-auto mb-3 transition-colors duration-300",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "font-semibold text-sm block",
                  isSelected ? "text-primary" : "text-foreground"
                )}
              >
                {emirate.name}
              </span>
            </button>
          );
        })}
      </div>
    </StepContainer>
  );
}
