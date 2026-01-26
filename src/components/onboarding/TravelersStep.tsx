import { StepContainer } from './StepIndicator';
import { Button } from '@/components/ui/button';
import { User, Users, Heart, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TRIP_TYPES } from '@/types';
import { DynamicIcon } from '../DynamicIcon';

interface TravelersStepProps {
  adults: number;
  children: number;
  tripType: 'solo' | 'couple' | 'family' | 'group';
  onAdultsChange: (value: number) => void;
  onChildrenChange: (value: number) => void;
  onTripTypeChange: (type: 'solo' | 'couple' | 'family' | 'group') => void;
}

export function TravelersStep({
  adults,
  children,
  tripType,
  onAdultsChange,
  onChildrenChange,
  onTripTypeChange,
}: TravelersStepProps) {
  return (
    <StepContainer
      title="Who's traveling?"
      subtitle="Tell us about your travel group"
    >
      <div className="max-w-lg mx-auto space-y-8">
        {/* Traveler counts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="font-medium text-foreground">Adults</span>
                <span className="text-sm text-muted-foreground block">Age 12+</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => onAdultsChange(Math.max(1, adults - 1))}
                disabled={adults <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-8 text-center font-semibold text-lg">{adults}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => onAdultsChange(Math.min(10, adults + 1))}
                disabled={adults >= 10}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <span className="font-medium text-foreground">Children</span>
                <span className="text-sm text-muted-foreground block">Under 12</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => onChildrenChange(Math.max(0, children - 1))}
                disabled={children <= 0}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-8 text-center font-semibold text-lg">{children}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => onChildrenChange(Math.min(10, children + 1))}
                disabled={children >= 10}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Trip type */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Trip Type</h3>
          <div className="grid grid-cols-4 gap-3">
            {TRIP_TYPES.map((type) => {
              const isSelected = tripType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => onTripTypeChange(type.id as typeof tripType)}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all duration-300",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-glow"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <DynamicIcon
                    name={type.icon}
                    className={cn(
                      "w-6 h-6 mx-auto mb-2",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs font-medium block",
                      isSelected ? "text-primary" : "text-foreground"
                    )}
                  >
                    {type.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </StepContainer>
  );
}
