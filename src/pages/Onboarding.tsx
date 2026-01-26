import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StepIndicator } from '@/components/onboarding/StepIndicator';
import { CitiesStep } from '@/components/onboarding/CitiesStep';
import { DatesStep } from '@/components/onboarding/DatesStep';
import { TravelersStep } from '@/components/onboarding/TravelersStep';
import { BudgetStep } from '@/components/onboarding/BudgetStep';
import { InterestsStep } from '@/components/onboarding/InterestsStep';
import { ItinerarySkeleton } from '@/components/LoadingStates';
import { OnboardingData } from '@/types';
import { saveOnboardingData, saveCurrentTrip, getOnboardingData } from '@/lib/storage';
import { generateItinerary } from '@/lib/itinerary-generator';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const STEP_LABELS = ['Cities', 'Dates', 'Travelers', 'Budget', 'Interests'];

export default function Onboarding() {
  const navigate = useNavigate();
  const existingData = getOnboardingData();
  
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [data, setData] = useState<OnboardingData>(() => ({
    cities: existingData?.cities || [],
    startDate: existingData?.startDate || '',
    endDate: existingData?.endDate || '',
    adults: existingData?.adults || 1,
    children: existingData?.children || 0,
    tripType: existingData?.tripType || 'solo',
    budgetUSD: existingData?.budgetUSD || 2000,
    interests: existingData?.interests || [],
    pace: existingData?.pace || 'standard',
  }));

  const updateData = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCity = (cityId: string) => {
    setData((prev) => ({
      ...prev,
      cities: prev.cities.includes(cityId)
        ? prev.cities.filter((c) => c !== cityId)
        : [...prev.cities, cityId],
    }));
  };

  const toggleInterest = (interestId: string) => {
    setData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter((i) => i !== interestId)
        : [...prev.interests, interestId],
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.cities.length > 0;
      case 2:
        return data.startDate && data.endDate;
      case 3:
        return data.adults >= 1;
      case 4:
        return data.budgetUSD >= 100;
      case 5:
        return data.interests.length > 0;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      // Generate itinerary with loading state
      setIsGenerating(true);
      saveOnboardingData(data);
      
      // Add fake delay for UX polish
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const trip = generateItinerary(data);
      saveCurrentTrip(trip);
      toast.success('Your perfect UAE itinerary has been generated! 🎉', {
        description: 'Get ready for an amazing adventure through the Emirates'
      });
      navigate('/itinerary');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container max-w-4xl mx-auto">
        {/* Loading state */}
        {isGenerating && (
          <div className="text-center py-12">
            <div className="loading-spinner mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-navy mb-2">Creating Your Perfect Itinerary...</h2>
            <p className="text-muted-foreground">This will just take a moment while we craft your UAE adventure.</p>
          </div>
        )}

        {/* Normal content */}
        {!isGenerating && (
          <>
            {/* Intro text */}
            <div className="text-center mb-8">
              <p className="text-lg text-muted-foreground font-medium">
                Plan your UAE trip in 2 minutes. No signup required.
              </p>
            </div>

            {/* Step indicator */}
            <div className="mb-8">
              <StepIndicator
                currentStep={step}
                totalSteps={5}
                labels={STEP_LABELS}
              />
            </div>

            {/* Step content */}
            <div className="mb-8">
              {step === 1 && (
                <CitiesStep
                  selectedCities={data.cities}
                  onToggleCity={toggleCity}
                />
              )}
              {step === 2 && (
                <DatesStep
                  startDate={data.startDate}
                  endDate={data.endDate}
                  onDateChange={(start, end) => {
                    updateData('startDate', start);
                    updateData('endDate', end);
                  }}
                />
              )}
              {step === 3 && (
                <TravelersStep
                  adults={data.adults}
                  children={data.children}
                  tripType={data.tripType}
                  onAdultsChange={(v) => updateData('adults', v)}
                  onChildrenChange={(v) => updateData('children', v)}
                  onTripTypeChange={(v) => updateData('tripType', v)}
                />
              )}
              {step === 4 && (
                <BudgetStep
                  budgetUSD={data.budgetUSD}
                  onBudgetChange={(v) => updateData('budgetUSD', v)}
                  startDate={data.startDate}
                  endDate={data.endDate}
                  totalTravelers={data.adults + data.children}
                />
              )}
              {step === 5 && (
                <InterestsStep
                  selectedInterests={data.interests}
                  onToggleInterest={toggleInterest}
                />
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 1}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isGenerating}
                className={step === 5 ? "btn-gradient gap-2 px-8" : "gap-2"}
              >
                {step === 5 ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Itinerary
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
