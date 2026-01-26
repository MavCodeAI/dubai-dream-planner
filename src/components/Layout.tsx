import { ReactNode } from 'react';
import { Header } from './Header';
import { useLocation } from 'react-router-dom';
import { getCurrentTrip } from '@/lib/storage';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isPrintPage = location.pathname === '/print';
  
  // Get current trip for feedback link
  const currentTrip = getCurrentTrip();
  const tripName = currentTrip?.name || '';

  if (isPrintPage) {
    return <>{children}</>;
  }

  // Create feedback mailto link with trip name
  const feedbackEmail = 'feedback@uaetourplanner.com';
  const feedbackSubject = 'UAE Tour Planner Feedback';
  const feedbackBody = tripName 
    ? `I'm using the UAE Tour Planner and my current trip is: "${tripName}".\n\nMy feedback:\n`
    : 'I\'m using the UAE Tour Planner.\n\nMy feedback:\n';
  const feedbackMailto = `mailto:${feedbackEmail}?subject=${encodeURIComponent(feedbackSubject)}&body=${encodeURIComponent(feedbackBody)}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        {children}
      </main>
      <footer className="py-8 px-4 border-t border-border bg-background">
        <div className="container max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © 2024 UAE Tour Planner. All rights reserved.
          </p>
          <a 
            href={feedbackMailto}
            className="text-muted-foreground text-sm hover:text-primary transition-colors"
          >
            Feedback
          </a>
        </div>
      </footer>
    </div>
  );
}
