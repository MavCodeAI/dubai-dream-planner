import { StepContainer } from './StepIndicator';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DollarSign, Wallet, Calculator, Minus, Plus } from 'lucide-react';
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
        {/* Budget input with plus/minus buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-xl shrink-0"
            onClick={() => onBudgetChange(Math.max(100, budgetUSD - 100))}
            disabled={budgetUSD <= 100}
          >
            <Minus className="w-5 h-5" />
          </Button>
          
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full gradient-bg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary-foreground" />
            </div>
            <Input
              type="number"
              value={budgetUSD}
              onChange={(e) => onBudgetChange(Math.max(100, Math.min(50000, Number(e.target.value))))}
              className="pl-20 h-14 text-2xl font-bold rounded-xl border-2 focus:border-primary"
              min={100}
              max={50000}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
              USD
            </span>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-xl shrink-0"
            onClick={() => onBudgetChange(Math.min(50000, budgetUSD + 100))}
            disabled={budgetUSD >= 50000}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
        
        <p className="text-center text-sm text-muted-foreground">
          We keep activities under your comfort range. You control everything.
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
