import { useState } from 'react';
import { StepContainer } from './StepIndicator';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

interface DatesStepProps {
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string) => void;
}

export function DatesStep({ startDate, endDate, onDateChange }: DatesStepProps) {
  const [date, setDate] = useState<DateRange | undefined>(() => {
    if (startDate && endDate) {
      return {
        from: new Date(startDate),
        to: new Date(endDate),
      };
    }
    return undefined;
  });

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range);
    if (range?.from && range?.to) {
      // Check max 30 days
      const days = differenceInDays(range.to, range.from);
      if (days <= 30) {
        onDateChange(
          format(range.from, 'yyyy-MM-dd'),
          format(range.to, 'yyyy-MM-dd')
        );
      } else {
        // Limit to 30 days
        const limitedEnd = addDays(range.from, 30);
        setDate({ from: range.from, to: limitedEnd });
        onDateChange(
          format(range.from, 'yyyy-MM-dd'),
          format(limitedEnd, 'yyyy-MM-dd')
        );
      }
    }
  };

  const numberOfDays = date?.from && date?.to 
    ? differenceInDays(date.to, date.from) + 1 
    : 0;

  return (
    <StepContainer
      title="When are you traveling?"
      subtitle="Select your travel dates (maximum 30 days)"
    >
      <div className="flex flex-col items-center gap-6">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full max-w-md justify-start text-left font-normal h-14 text-base rounded-xl border-2",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-3 h-5 w-5 text-primary" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "MMM d, yyyy")} - {format(date.to, "MMM d, yyyy")}
                  </>
                ) : (
                  format(date.from, "MMM d, yyyy")
                )
              ) : (
                <span>Pick your travel dates</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-card" align="center">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleSelect}
              numberOfMonths={2}
              disabled={(date) => date < new Date()}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {numberOfDays > 0 && (
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full gradient-bg text-primary-foreground">
              <CalendarIcon className="w-5 h-5" />
              <span className="font-semibold">
                {numberOfDays} {numberOfDays === 1 ? 'day' : 'days'} of adventure
              </span>
            </div>
          </div>
        )}
      </div>
    </StepContainer>
  );
}
