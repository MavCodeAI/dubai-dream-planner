import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentTrip } from '@/lib/storage';
import { Trip, EMIRATES } from '@/types';
import { Button } from '@/components/ui/button';
import { EmptyMapState } from '@/components/EmptyStates';
import { MapPin, ExternalLink, Navigation } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function MapPage() {
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);

  useEffect(() => {
    const currentTrip = getCurrentTrip();
    if (!currentTrip) {
      // Show empty state instead of redirecting
      return;
    }
    setTrip(currentTrip);
  }, [navigate]);

  if (!trip) {
    return <EmptyMapState />;
  }

  const getCityName = (cityId: string) => {
    return EMIRATES.find((e) => e.id === cityId)?.name || cityId;
  };

  // Collect all stops in order
  const allStops = trip.days.flatMap((day) =>
    day.activities.map((activity) => ({
      ...activity,
      dayNumber: day.dayNumber,
      date: day.date,
      city: getCityName(day.city),
    }))
  );

  const openInGoogleMaps = () => {
    // Create a route with all cities
    const uniqueCities = [...new Set(trip.days.map((d) => getCityName(d.city)))];
    const query = uniqueCities.join(' to ') + ', UAE';
    const url = `https://www.google.com/maps/dir/${encodeURIComponent(query)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-navy mb-2">Trip Map</h1>
          <p className="text-muted-foreground">Your journey through the UAE</p>
        </div>

        {/* Decorative Map Placeholder */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden mb-6 shadow-lg">
          <div className="relative h-64 md:h-80 gradient-hero-bg flex items-center justify-center">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-1/4 left-1/4 w-4 h-4 rounded-full bg-primary-foreground animate-pulse" />
              <div className="absolute top-1/3 right-1/3 w-3 h-3 rounded-full bg-primary-foreground animate-pulse delay-100" />
              <div className="absolute bottom-1/3 left-1/2 w-5 h-5 rounded-full bg-primary-foreground animate-pulse delay-200" />
              <div className="absolute top-1/2 right-1/4 w-4 h-4 rounded-full bg-primary-foreground animate-pulse delay-300" />
            </div>
            <div className="text-center text-primary-foreground z-10">
              <Navigation className="w-16 h-16 mx-auto mb-4 opacity-80" />
              <h2 className="text-2xl font-bold mb-2">Interactive Map</h2>
              <p className="opacity-80 mb-4">View your route on Google Maps</p>
              <Button
                onClick={openInGoogleMaps}
                variant="secondary"
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open in Google Maps
              </Button>
            </div>
          </div>
        </div>

        {/* Stop List */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-navy mb-4">All Stops ({allStops.length})</h3>
          
          <div className="space-y-3">
            {allStops.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">
                No activities planned yet.
              </p>
            ) : (
              allStops.map((stop, index) => (
                <div
                  key={`${stop.id}-${index}`}
                  className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/50"
                >
                  <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-primary-foreground font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{stop.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      <span>{stop.city}</span>
                      <span>•</span>
                      <span>Day {stop.dayNumber}</span>
                      <span>•</span>
                      <span>{format(parseISO(stop.date), 'MMM d')}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
