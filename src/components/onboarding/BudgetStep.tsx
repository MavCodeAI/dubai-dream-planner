import { StepContainer } from './StepIndicator';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { DollarSign, Wallet, Calculator } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

interface BudgetStepProps {
  budgetUSD: number;
  onBudgetChange: (value: number) => void;
  startDate: string;
  endDate: string;
  totalTravelers: number;
}

export function BudgetStep({
  budgetUSD,
  onBudgetChange,
  startDate,
  endDate,
  totalTravelers,
}: BudgetStepProps) {
  const numberOfDays = startDate && endDate
    ? differenceInDays(parseISO(endDate), parseISO(startDate)) + 1
    : 1;

  const dailyBudgetPerPerson = Math.round(budgetUSD / numberOfDays / totalTravelers);

  return (
    <StepContainer
      title="What's your budget?"
      subtitle="Set your total trip budget in USD"
    >
      <div className="max-w-lg mx-auto space-y-8">
        {/* Budget input */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full gradient-bg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-primary-foreground" />
          </div>
          <Input
            type="number"
            value={budgetUSD}
            onChange={(e) => onBudgetChange(Math.max(100, Number(e.target.value)))}
            className="pl-20 h-16 text-2xl font-bold rounded-xl border-2 focus:border-primary"
            min={100}
            max={100000}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
            USD
          </span>
        </div>
        
        <p className="text-center text-sm text-muted-foreground">
          This helps us stay within your comfort range
        </p>

        {/* Slider */}
        <div className="space-y-4">
          <Slider
            value={[budgetUSD]}
            onValueChange={([value]) => onBudgetChange(value)}
            min={100}
            max={50000}
            step={100}
            className="py-4"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>$100</span>
            <span>$50,000</span>
          </div>
        </div>

        {/* Budget breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Wallet className="w-4 h-4" />
              <span className="text-sm">Total Budget</span>
            </div>
            <span className="text-2xl font-bold text-foreground">
              ${budgetUSD.toLocaleString()}
            </span>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calculator className="w-4 h-4" />
              <span className="text-sm">Daily/Person</span>
            </div>
            <span className="text-2xl font-bold text-primary">
              ${dailyBudgetPerPerson.toLocaleString()}
            </span>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Based on {numberOfDays} days for {totalTravelers} {totalTravelers === 1 ? 'traveler' : 'travelers'}
        </p>
      </div>
    </StepContainer>
  );
}
