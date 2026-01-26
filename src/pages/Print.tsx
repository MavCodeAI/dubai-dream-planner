import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentTrip } from '@/lib/storage';
import { Trip, EMIRATES } from '@/types';
import { format, parseISO } from 'date-fns';

export default function Print() {
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);

  useEffect(() => {
    const currentTrip = getCurrentTrip();
    if (!currentTrip) {
      navigate('/itinerary');
      return;
    }
    setTrip(currentTrip);
    
    // Trigger print dialog after a short delay
    setTimeout(() => {
      window.print();
    }, 500);
  }, [navigate]);

  if (!trip) return null;

  const getCityName = (cityId: string) => {
    return EMIRATES.find((e) => e.id === cityId)?.name || cityId;
  };

  const { onboardingData, days, totalCostUSD } = trip;

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white text-black print:text-black">
      {/* Header */}
      <div className="text-center mb-8 pb-6 border-b-2 border-gray-200">
        <h1 className="text-3xl font-bold mb-2">{trip.name}</h1>
        <p className="text-gray-600">
          {format(parseISO(onboardingData.startDate), 'MMMM d, yyyy')} -{' '}
          {format(parseISO(onboardingData.endDate), 'MMMM d, yyyy')}
        </p>
      </div>

      {/* Trip Summary */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Trip Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600 block">Travelers</span>
            <span className="font-medium">
              {onboardingData.adults} adults, {onboardingData.children} children
            </span>
          </div>
          <div>
            <span className="text-gray-600 block">Cities</span>
            <span className="font-medium">
              {onboardingData.cities.map(getCityName).join(', ')}
            </span>
          </div>
          <div>
            <span className="text-gray-600 block">Total Budget</span>
            <span className="font-medium">${onboardingData.budgetUSD.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-600 block">Estimated Cost</span>
            <span className="font-medium">${totalCostUSD.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Day by Day Itinerary */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Day-by-Day Itinerary</h2>
        
        {days.map((day) => (
          <div key={day.dayNumber} className="border border-gray-200 rounded-lg overflow-hidden print-break">
            <div className="bg-gray-100 px-4 py-3 flex justify-between items-center">
              <div>
                <span className="font-semibold">Day {day.dayNumber}</span>
                <span className="text-gray-600 ml-2">
                  {format(parseISO(day.date), 'EEEE, MMMM d')}
                </span>
                <span className="text-gray-600 ml-2">• {getCityName(day.city)}</span>
              </div>
              <span className="font-medium">${day.dailyCostUSD}</span>
            </div>
            
            <div className="p-4">
              {day.activities.length === 0 ? (
                <p className="text-gray-500 italic">No activities planned</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="pb-2 font-medium">Activity</th>
                      <th className="pb-2 font-medium">Time</th>
                      <th className="pb-2 font-medium">Duration</th>
                      <th className="pb-2 font-medium text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {day.activities.map((activity, index) => (
                      <tr key={activity.id} className="border-t border-gray-100">
                        <td className="py-2">
                          <span className="font-medium">{activity.name}</span>
                          <br />
                          <span className="text-gray-500 text-xs">{activity.description}</span>
                        </td>
                        <td className="py-2 capitalize">{activity.timeOfDay}</td>
                        <td className="py-2">{activity.durationHours}h</td>
                        <td className="py-2 text-right">${activity.estimatedCostUSD}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Budget Summary */}
      <div className="mt-8 pt-6 border-t-2 border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Budget Summary</h2>
        <table className="w-full text-sm">
          <tbody>
            {days.map((day) => (
              <tr key={day.dayNumber} className="border-b border-gray-100">
                <td className="py-2">Day {day.dayNumber} - {getCityName(day.city)}</td>
                <td className="py-2 text-right">${day.dailyCostUSD}</td>
              </tr>
            ))}
            <tr className="font-semibold text-lg">
              <td className="pt-4">Total Estimated Cost</td>
              <td className="pt-4 text-right">${totalCostUSD.toLocaleString()}</td>
            </tr>
            <tr className="text-gray-600">
              <td className="py-2">Total Budget</td>
              <td className="py-2 text-right">${onboardingData.budgetUSD.toLocaleString()}</td>
            </tr>
            <tr className={totalCostUSD <= onboardingData.budgetUSD ? 'text-green-600' : 'text-red-600'}>
              <td className="py-2 font-medium">Remaining</td>
              <td className="py-2 text-right font-medium">
                ${(onboardingData.budgetUSD - totalCostUSD).toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
        <p>Generated by UAE Tour Planner • {format(new Date(), 'MMMM d, yyyy')}</p>
      </div>

      {/* Back button - hidden in print */}
      <div className="mt-8 text-center no-print">
        <button
          onClick={() => navigate('/itinerary')}
          className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
        >
          Back to Itinerary
        </button>
      </div>
    </div>
  );
}
