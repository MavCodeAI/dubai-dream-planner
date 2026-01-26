import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Sparkles } from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  feature?: string;
}

export function PricingModal({ isOpen, onClose, onUpgrade, feature }: PricingModalProps) {
  const handleUpgrade = () => {
    onUpgrade();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Crown className="w-6 h-6 text-yellow-500" />
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription>
            {feature ? `Unlock ${feature} and more premium features` : 'Get unlimited access to all features'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Free Plan */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Free</h3>
              <Badge variant="secondary">Current</Badge>
            </div>
            <div className="text-2xl font-bold">$0<span className="text-sm font-normal text-muted-foreground">/forever</span></div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                1 saved trip
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                View itinerary
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Basic planning features
              </li>
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="rounded-lg border-2 border-primary p-4 space-y-3 relative">
            <div className="absolute -top-3 left-4">
              <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                <Sparkles className="w-3 h-3 mr-1" />
                MOST POPULAR
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Pro</h3>
              <Badge variant="default">Recommended</Badge>
            </div>
            <div className="text-2xl font-bold">$9<span className="text-sm font-normal text-muted-foreground">/one-time</span></div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="font-medium">Unlimited trips</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="font-medium">Export to PDF</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="font-medium">Edit activities freely</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Priority support
              </li>
            </ul>
          </div>

          {/* Trust badges */}
          <div className="text-center space-y-2 pt-4 border-t">
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span>✓ No signup required</span>
              <span>✓ One-time payment</span>
              <span>✓ 30-day refund</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Built for UAE travelers • Your data stays on your device
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Maybe later
            </Button>
            <Button onClick={handleUpgrade} className="flex-1 btn-gradient">
              Upgrade Now - $9
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
