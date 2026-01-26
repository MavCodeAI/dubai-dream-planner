import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Plus,
  X,
  Clock,
  DollarSign,
  Users,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { aiClient, AIClientError, SuggestionResponse } from '@/lib/ai-client';
import { Activity } from '@/types';
import { toast } from 'sonner';

interface AISuggestCardProps {
  city: string;
  dayNumber: number;
  currentActivities: Activity[];
  remainingBudget: number;
  interests?: string[];
  hasChildren?: boolean;
  onAddActivity: (activity: Activity) => void;
  className?: string;
}

const AISuggestCard: React.FC<AISuggestCardProps> = ({
  city,
  dayNumber,
  currentActivities,
  remainingBudget,
  interests = [],
  hasChildren = false,
  onAddActivity,
  className,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleGetSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    setShowSuggestions(true);

    try {
      const response = await aiClient.getSuggestions({
        currentActivities,
        remainingBudget,
        city,
        dayNumber,
        interests,
        hasChildren,
      });
      setSuggestions(response);
    } catch (err) {
      console.error('Failed to get suggestions:', err);
      const errorMessage = err instanceof AIClientError
        ? err.message
        : 'Failed to get AI suggestions. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSuggestion = (suggestion: SuggestionResponse['suggestions'][0]) => {
    const activity: Activity = {
      id: suggestion.id || `ai-${Date.now()}`,
      name: suggestion.name,
      city,
      description: suggestion.description,
      durationHours: suggestion.durationHours,
      estimatedCostUSD: suggestion.estimatedCostUSD,
      tags: suggestion.tags || [],
      timeOfDay: suggestion.timeOfDay,
      familyFriendly: suggestion.familyFriendly,
      luxuryLevel: 'mid',
    };

    onAddActivity(activity);
    toast.success(`Added "${suggestion.name}" to Day ${dayNumber}`);
    
    // Remove the added suggestion from the list
    if (suggestions) {
      setSuggestions({
        ...suggestions,
        suggestions: suggestions.suggestions.filter((s) => s.id !== suggestion.id),
      });
    }
  };

  const handleClose = () => {
    setShowSuggestions(false);
    setSuggestions(null);
    setError(null);
  };

  if (!showSuggestions) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleGetSuggestions}
        className={cn('gap-2', className)}
      >
        <Sparkles className="h-4 w-4" />
        AI Suggest
      </Button>
    );
  }

  return (
    <Card className={cn('mt-4 border-primary/20 bg-primary/5', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h4 className="font-semibold">AI Suggestions</h4>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="h-7 w-7">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Getting AI suggestions...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {suggestions && !isLoading && (
          <>
            {/* Budget Analysis */}
            {suggestions.budgetAnalysis && (
              <div className="mb-4 p-3 bg-background rounded-lg border">
                <p className="text-sm text-muted-foreground">
                  {suggestions.budgetAnalysis.recommendation}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Remaining: ${suggestions.budgetAnalysis.remainingBudget}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-primary" />
                    Suggested: ${suggestions.budgetAnalysis.suggestedSpend}
                  </span>
                </div>
              </div>
            )}

            {/* Suggestions List */}
            <div className="space-y-3">
              {suggestions.suggestions.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No more suggestions available
                </p>
              ) : (
                suggestions.suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="p-3 bg-background rounded-lg border hover:border-primary transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-sm">{suggestion.name}</h5>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {suggestion.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {suggestion.durationHours}h
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${suggestion.estimatedCostUSD}
                          </span>
                          {suggestion.familyFriendly && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              Family
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {suggestion.tags?.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        {suggestion.reasoning && (
                          <p className="text-xs text-primary mt-2 italic">
                            {suggestion.reasoning}
                          </p>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => handleAddSuggestion(suggestion)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleGetSuggestions}
              className="w-full mt-4 gap-2"
              disabled={isLoading}
            >
              <Sparkles className="h-4 w-4" />
              Get More Suggestions
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AISuggestCard;
