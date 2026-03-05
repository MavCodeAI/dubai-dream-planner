import { Button } from '@/components/ui/button';
import { Plane, MapPin, Calendar, DollarSign, Users } from 'lucide-react';

interface ItineraryCardProps {
  itinerary: {
    title: string;
    city: string;
    days: Array<{ dayNumber: number }>;
    totalCost: number;
    summary: {
      activities: number;
    };
  };
  onViewFullItinerary: () => void;
}

const ItineraryCard: React.FC<ItineraryCardProps> = ({ itinerary, onViewFullItinerary }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 mb-3">
      <Plane className="w-5 h-5 text-green-600" />
      <h3 className="font-semibold">{itinerary.title}</h3>
    </div>
    
    <div className="grid grid-cols-2 gap-2 text-sm">
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        <span>{itinerary.city}</span>
      </div>
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        <span>{itinerary.days.length} days</span>
      </div>
      <div className="flex items-center gap-2">
        <DollarSign className="w-4 h-4" />
        <span>USD {itinerary.totalCost}</span>
      </div>
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4" />
        <span>{itinerary.summary.activities} activities</span>
      </div>
    </div>
    
    <div className="flex gap-2 mt-3">
      <Button size="sm" onClick={onViewFullItinerary}>
        View Full Itinerary
      </Button>
      <Button size="sm" variant="outline">
        Edit Plan
      </Button>
    </div>
  </div>
);

export default ItineraryCard;
