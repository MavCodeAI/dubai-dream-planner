import { Button } from '@/components/ui/button';
import { Check, X, Crown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { isProUser, upgradeToPro } from '@/lib/storage';
import UpgradeModal from '@/components/UpgradeModal';

const getPlans = (isPro: boolean) => [
  {
    name: 'Free',
    price: 0,
    description: 'Perfect for trying out the planner',
    features: [
      { name: '1 saved trip', included: true },
      { name: 'View itinerary', included: true },
      { name: 'Basic planning features', included: true },
      { name: 'Unlimited trips', included: false },
      { name: 'Export PDF', included: false },
      { name: 'Edit activities freely', included: false },
    ],
    cta: 'Current Plan',
    popular: false,
  },
  {
    name: 'Pro',
    price: 9,
    description: 'For serious travelers',
    features: [
      { name: 'Unlimited trips', included: true },
      { name: 'Export PDF', included: true },
      { name: 'Edit activities freely', included: true },
      { name: 'Priority support', included: true },
      { name: 'All premium features', included: true },
    ],
    cta: isPro ? 'Current Plan' : 'Upgrade to Pro',
    popular: true,
  },
];

export default function Pricing() {
  const [isPro, setIsPro] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    setIsPro(isProUser());
  }, []);

  const handleUpgrade = (planName: string) => {
    if (planName === 'Pro') {
      setShowUpgradeModal(true);
    } else {
      toast.info(`${planName} plan coming soon! This is a demo.`);
    }
  };

  const handleUpgradeSuccess = () => {
    setIsPro(true);
    setShowUpgradeModal(false);
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-navy mb-4">
            Choose your plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start for free and upgrade when you need more. All plans include our core features.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {getPlans(isPro).map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative bg-card rounded-2xl border-2 p-8 shadow-lg transition-all duration-300",
                plan.popular
                  ? "border-primary shadow-glow scale-105"
                  : "border-border hover:border-primary/50"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-4 py-1 rounded-full gradient-bg text-primary-foreground text-sm font-semibold">
                  <Crown className="w-4 h-4" />
                  Most Popular
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-navy mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-navy">${plan.price}</span>
                  {plan.price > 0 && <span className="text-muted-foreground">/one-time</span>}
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature.name} className="flex items-center gap-3">
                    {feature.included ? (
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                        <X className="w-3 h-3 text-gray-400" />
                      </div>
                    )}
                    <span
                      className={cn(
                        "text-sm",
                        feature.included ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleUpgrade(plan.name)}
                className={cn(
                  "w-full",
                  plan.popular ? "btn-gradient" : "",
                  plan.price === 0 || (plan.name === 'Pro' && isPro) ? "cursor-default" : ""
                )}
                variant={plan.popular ? "default" : "outline"}
                disabled={plan.price === 0 || (plan.name === 'Pro' && isPro)}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        {/* Trust Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-navy mb-4">Why Travelers Trust Us</h3>
            <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold mb-2">No signup required</h4>
                <p className="text-sm text-muted-foreground">Start planning immediately without creating an account</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-2">Your data stays on your device</h4>
                <p className="text-sm text-muted-foreground">Complete privacy - nothing is stored on our servers</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-semibold mb-2">Export a clean PDF itinerary</h4>
                <p className="text-sm text-muted-foreground">Get a beautiful, printable PDF of your trip plan</p>
              </div>
            </div>
          </div>
          
          {/* Social Proof */}
          <div className="text-center border-t pt-8">
            <p className="text-sm text-muted-foreground italic">
              "Used by travelers planning family and couple trips to UAE"
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-navy mb-4">Questions?</h2>
          <p className="text-muted-foreground">
            This is a demo pricing page. The full product is coming soon!
          </p>
        </div>
      </div>

      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
      />
    </div>
  );
}
