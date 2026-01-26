import { Link, useLocation } from 'react-router-dom';
import { 
  Compass, 
  Map, 
  Calendar, 
  Bookmark, 
  DollarSign,
  Printer
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/onboarding', label: 'Plan', icon: Compass },
  { path: '/itinerary', label: 'Itinerary', icon: Calendar },
  { path: '/map', label: 'Map', icon: Map },
  { path: '/trips', label: 'Saved', icon: Bookmark },
  { path: '/pricing', label: 'Pricing', icon: DollarSign },
];

export function Header() {
  const location = useLocation();
  
  // Hide header on print page
  if (location.pathname === '/print') return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <Compass className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-navy hidden sm:block">
              UAE Tour Planner
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
