import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSavedTrips, deleteTrip, saveCurrentTrip } from '@/lib/storage';
import { Trip, EMIRATES } from '@/types';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyTripsState } from '@/components/EmptyStates';
import {
  Calendar,
  Users,
  DollarSign,
  MapPin,
  Trash2,
  Eye,
  Compass,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

export default function Trips() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    setTrips(getSavedTrips());
  }, []);

  const handleViewTrip = (trip: Trip) => {
    saveCurrentTrip(trip);
    navigate('/itinerary');
  };

  const handleDeleteTrip = () => {
    if (!deleteConfirm) return;
    deleteTrip(deleteConfirm);
    setTrips(getSavedTrips());
    setDeleteConfirm(null);
    toast.success('Trip deleted successfully', {
      description: 'The trip has been removed from your collection'
    });
  };

  const getCityNames = (cityIds: string[]) => {
    return cityIds
      .map((id) => EMIRATES.find((e) => e.id === id)?.name || id)
      .join(', ');
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-navy mb-2">Saved Trips</h1>
          <p className="text-muted-foreground">Your UAE travel collection</p>
          <p className="text-xs text-muted-foreground mt-1">
            Trips are saved on this device (localStorage).
          </p>
        </div>

        {trips.length === 0 ? (
          <EmptyTripsState />
        ) : (
          <div className="space-y-4">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className="bg-card rounded-2xl border border-border p-6 shadow-md card-hover"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-navy mb-2">{trip.name}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>
                          {format(parseISO(trip.onboardingData.startDate), 'MMM d')} -{' '}
                          {format(parseISO(trip.onboardingData.endDate), 'd')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-primary" />
                        <span>
                          {trip.onboardingData.adults + trip.onboardingData.children} travelers
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>{trip.onboardingData.cities.length} cities</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-primary" />
                        <span>${trip.totalCostUSD.toLocaleString()}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {getCityNames(trip.onboardingData.cities)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => handleViewTrip(trip)} className="gap-2">
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setDeleteConfirm(trip.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trip?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this trip from your collection. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTrip} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
