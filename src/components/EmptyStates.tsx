import { Button } from '@/components/ui/button';
import { Compass, Plus, MapPin, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function EmptyTripsState() {
  const navigate = useNavigate();

  return (
    <div className="bg-card rounded-2xl border border-border p-12 text-center shadow-lg">
      <Compass className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
      <h2 className="text-xl font-semibold text-navy mb-2">No saved trips yet</h2>
      <p className="text-muted-foreground mb-6">
        Start planning your UAE adventure and save your itinerary here.
      </p>
      <Button onClick={() => navigate('/onboarding')} className="btn-gradient">
        Plan Your Trip
      </Button>
    </div>
  );
}

export function EmptyActivitiesState({ onAddActivity }: { onAddActivity: () => void }) {
  return (
    <div className="text-center py-8 px-4">
      <div className="bg-muted/30 rounded-xl p-8 border border-border/50">
        <Plus className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-navy mb-2">No activities planned</h3>
        <p className="text-muted-foreground mb-4">
          Add activities to make this day more exciting!
        </p>
        <Button onClick={onAddActivity} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Activity
        </Button>
      </div>
    </div>
  );
}

export function EmptyMapState() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-navy mb-2">Trip Map</h1>
          <p className="text-muted-foreground">Your journey through the UAE</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-12 text-center shadow-lg">
          <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-navy mb-2">No trip loaded</h2>
          <p className="text-muted-foreground mb-6">
            Plan your UAE adventure first to see your route on the map.
          </p>
          <Button onClick={() => navigate('/onboarding')} className="btn-gradient gap-2">
            <Calendar className="w-4 h-4" />
            Plan Your Trip
          </Button>
        </div>
      </div>
    </div>
  );
}
