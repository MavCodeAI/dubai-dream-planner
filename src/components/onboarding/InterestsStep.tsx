import { INTERESTS } from '@/types';
import { cn } from '@/lib/utils';
import { StepContainer } from './StepIndicator';
import { DynamicIcon } from '../DynamicIcon';
import { Check } from 'lucide-react';

interface InterestsStepProps {
  selectedInterests: string[];
  onToggleInterest: (interestId: string) => void;
}

export function InterestsStep({ selectedInterests, onToggleInterest }: InterestsStepProps) {
  return (
    <StepContainer
      title="What interests you most?"
      subtitle="Select at least 1 interest to personalize your trip"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
        {INTERESTS.map((interest) => {
          const isSelected = selectedInterests.includes(interest.id);
          return (
            <button
              key={interest.id}
              onClick={() => onToggleInterest(interest.id)}
              className={cn(
                "relative p-5 rounded-2xl border-2 transition-all duration-300 card-hover",
                isSelected
                  ? "border-primary bg-primary/5 shadow-glow"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full gradient-bg flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
              <DynamicIcon
                name={interest.icon}
                className={cn(
                  "w-8 h-8 mx-auto mb-3 transition-colors duration-300",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "font-medium text-sm block text-center",
                  isSelected ? "text-primary" : "text-foreground"
                )}
              >
                {interest.name}
              </span>
            </button>
          );
        })}
      </div>
    </StepContainer>
  );
}
