import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Compass, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Sparkles,
  ArrowRight,
  Waves,
  Building2,
  Mountain
} from 'lucide-react';
import { isFirstVisit } from '@/lib/storage';
import { useAnalytics } from '@/lib/analytics';
import { useEffect } from 'react';

const features = [
  {
    icon: MapPin,
    title: 'All 7 Emirates',
    description: 'Explore Dubai, Abu Dhabi, Sharjah, and more',
  },
  {
    icon: Calendar,
    title: 'Smart Planning',
    description: 'AI-curated activities matched to your interests',
  },
  {
    icon: DollarSign,
    title: 'Budget Tracking',
    description: 'Stay on budget with real-time cost estimates',
  },
  {
    icon: Sparkles,
    title: 'Personalized',
    description: 'Itineraries tailored to your travel style',
  },
];

const stats = [
  { value: '7', label: 'Emirates' },
  { value: '50+', label: 'Activities' },
  { value: '100%', label: 'Free' },
];

export default function Index() {
  const navigate = useNavigate();
  const analytics = useAnalytics();
  const showFirstTimeBanner = isFirstVisit();

  useEffect(() => {
    analytics.page('home');
  }, [analytics]);

  const handleStartPlanning = () => {
    analytics.trackClick('start_planning_button', 'hero_section');
    analytics.trackFeature('trip_planning', 'start');
    navigate('/onboarding');
  };

  const handleViewTrips = () => {
    analytics.trackClick('view_saved_trips_button', 'hero_section');
    navigate('/trips');
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 gradient-hero-bg opacity-90" />
        
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-24 h-24 rounded-full bg-white/5 blur-2xl" />
        </div>

        {/* Floating icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Waves className="absolute top-1/4 left-[10%] w-8 h-8 text-white/20 animate-pulse" />
          <Building2 className="absolute top-1/3 right-[15%] w-10 h-10 text-white/20 animate-pulse delay-100" />
          <Mountain className="absolute bottom-1/4 left-[20%] w-8 h-8 text-white/20 animate-pulse delay-200" />
          <Compass className="absolute bottom-1/3 right-[25%] w-12 h-12 text-white/20 animate-pulse delay-300" />
        </div>

        <div className="relative container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            Plan your perfect UAE adventure
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 animate-slide-up">
            Discover the Magic of
            <br />
            <span className="text-white/90">United Arab Emirates</span>
          </h1>

          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8 animate-slide-up">
            Create personalized itineraries for your UAE trip. From Dubai's skyline to Abu Dhabi's culture, 
            we help you plan the perfect adventure.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Button
              size="lg"
              onClick={handleStartPlanning}
              className="bg-white text-primary hover:bg-white/90 gap-2 text-lg px-8 py-6 rounded-xl shadow-xl"
            >
              Start Planning
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleViewTrips}
              className="border-white/30 text-white hover:bg-white/10 gap-2 text-lg px-8 py-6 rounded-xl"
            >
              View Saved Trips
            </Button>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 md:gap-16 mt-16 animate-fade-in">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">{stat.value}</div>
                <div className="text-white/60 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 rounded-full bg-white/60" />
          </div>
        </div>
      </section>

      {/* First-time user banner */}
      {showFirstTimeBanner && (
        <section className="py-12 px-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="container max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
              <Sparkles className="w-3 h-3 mr-1" />
              New Here?
            </Badge>
            <h2 className="text-2xl font-bold text-navy mb-4">
              Plan your UAE trip in 2 minutes. No signup required.
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Get a personalized itinerary tailored to your interests, budget, and travel style. 
              Everything stays on your device - no accounts needed.
            </p>
            <Button
              onClick={() => navigate('/onboarding')}
              className="btn-gradient gap-2"
              size="lg"
            >
              Start Planning Now
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 px-4 bg-background">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
              Plan Your Trip with Ease
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our smart planner takes care of the details so you can focus on making memories.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-card rounded-2xl border border-border p-6 card-hover"
              >
                <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-navy mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto">
          <div className="gradient-navy-bg rounded-3xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to explore the UAE?
            </h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              Start planning your dream vacation today. It only takes 5 minutes to create 
              a personalized itinerary.
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/onboarding')}
              className="bg-white text-navy hover:bg-white/90 gap-2 text-lg px-8 py-6 rounded-xl"
            >
              Create Your Itinerary
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
