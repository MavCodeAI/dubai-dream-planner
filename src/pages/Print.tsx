import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentTrip, isProUser } from '@/lib/storage';
import { Trip, EMIRATES } from '@/types';
import { format, parseISO } from 'date-fns';
import { Crown, Calendar, Users, MapPin, DollarSign, Clock } from 'lucide-react';

export default function Print() {
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const currentTrip = getCurrentTrip();
    if (!currentTrip) {
      navigate('/itinerary');
      return;
    }
    setTrip(currentTrip);
    setIsPro(isProUser());
    
    // Auto-trigger print for Pro users after content loads
    if (isProUser()) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [navigate]);

  if (!trip) return null;

  const getCityName = (cityId: string) => {
    return EMIRATES.find((e) => e.id === cityId)?.name || cityId;
  };

  const { onboardingData, days, totalCostUSD } = trip;
  const remainingBudget = onboardingData.budgetUSD - totalCostUSD;
  const budgetStatus = remainingBudget >= 0 ? 'positive' : 'negative';

  return (
    <div className="print-container">
      {/* Header Section */}
      <header className="print-header">
        <div className="header-content">
          <div className="trip-title">
            <h1>{trip.name}</h1>
            <div className="trip-dates">
              <Calendar className="w-4 h-4" />
              {format(parseISO(onboardingData.startDate), 'MMMM d, yyyy')} - {' '}
              {format(parseISO(onboardingData.endDate), 'MMMM d, yyyy')}
            </div>
          </div>
          <div className="brand-mark">
            <div className="logo">
              <span className="logo-text">UAE Tour Planner</span>
            </div>
          </div>
        </div>
      </header>

      {/* Trip Summary */}
      <section className="trip-summary">
        <h2>Trip Overview</h2>
        <div className="summary-grid">
          <div className="summary-item">
            <Users className="icon" />
            <div>
              <label>Travelers</label>
              <span>{onboardingData.adults} adults, {onboardingData.children} children</span>
            </div>
          </div>
          <div className="summary-item">
            <MapPin className="icon" />
            <div>
              <label>Cities</label>
              <span>{onboardingData.cities.map(getCityName).join(', ')}</span>
            </div>
          </div>
          <div className="summary-item">
            <DollarSign className="icon" />
            <div>
              <label>Total Budget</label>
              <span>${onboardingData.budgetUSD.toLocaleString()}</span>
            </div>
          </div>
          <div className="summary-item">
            <DollarSign className="icon" />
            <div>
              <label>Estimated Cost</label>
              <span className={budgetStatus === 'positive' ? 'positive' : 'negative'}>
                ${totalCostUSD.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Budget Overview */}
      <section className="budget-overview">
        <h2>Budget Summary</h2>
        <div className="budget-cards">
          <div className="budget-card total">
            <div className="card-label">Total Budget</div>
            <div className="card-value">${onboardingData.budgetUSD.toLocaleString()}</div>
          </div>
          <div className="budget-card spent">
            <div className="card-label">Estimated Spend</div>
            <div className="card-value">${totalCostUSD.toLocaleString()}</div>
          </div>
          <div className={`budget-card remaining ${budgetStatus}`}>
            <div className="card-label">Remaining</div>
            <div className="card-value">
              ${Math.abs(remainingBudget).toLocaleString()}
              {budgetStatus === 'negative' && ' over'}
            </div>
          </div>
        </div>
      </section>

      {/* Day-by-Day Itinerary */}
      <section className="itinerary">
        <h2>Detailed Itinerary</h2>
        {days.map((day, dayIndex) => (
          <div key={day.dayNumber} className={`day-section ${dayIndex > 0 ? 'page-break' : ''}`}>
            <div className="day-header">
              <div className="day-info">
                <h3>Day {day.dayNumber}</h3>
                <div className="day-details">
                  <span>{format(parseISO(day.date), 'EEEE, MMMM d, yyyy')}</span>
                  <span>•</span>
                  <span>{getCityName(day.city)}</span>
                </div>
              </div>
              <div className="day-cost">
                <span className="cost-label">Day Cost</span>
                <span className="cost-value">${day.dailyCostUSD}</span>
              </div>
            </div>

            <div className="activities">
              {day.activities.length === 0 ? (
                <div className="no-activities">
                  <p>No activities planned for this day</p>
                </div>
              ) : (
                <div className="activity-list">
                  {day.activities.map((activity, index) => (
                    <div key={activity.id} className="activity-item">
                      <div className="activity-time">
                        <Clock className="w-4 h-4" />
                        <span className="time-slot">{activity.timeOfDay}</span>
                        <span className="duration">{activity.durationHours}h</span>
                      </div>
                      <div className="activity-content">
                        <h4 className="activity-name">{activity.name}</h4>
                        <p className="activity-description">{activity.description}</p>
                      </div>
                      <div className="activity-cost">
                        <span>${activity.estimatedCostUSD}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="print-footer">
        <div className="footer-content">
          <div className="brand-info">
            <span className="brand-name">UAE Tour Planner</span>
            <span className="separator">•</span>
            <span className="date">{format(new Date(), 'MMMM d, yyyy')}</span>
          </div>
          <div className="tagline">Your Perfect UAE Adventure Awaits</div>
        </div>
      </footer>

      {/* Non-print controls */}
      <div className="no-print-controls">
        {isPro ? (
          <button onClick={() => window.print()} className="print-btn">
            Print Document
          </button>
        ) : (
          <div className="upgrade-prompt">
            <Crown className="w-5 h-5" />
            <span>Upgrade to Pro to print your itinerary</span>
            <button onClick={() => navigate('/pricing')} className="upgrade-btn">
              Upgrade Now
            </button>
          </div>
        )}
        <button onClick={() => navigate('/itinerary')} className="back-btn">
          Back to Itinerary
        </button>
      </div>
    </div>
  );
}
