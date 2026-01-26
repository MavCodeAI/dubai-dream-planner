import { ReactNode } from 'react';
import { Header } from './Header';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isPrintPage = location.pathname === '/print';

  if (isPrintPage) {
    return <>{children}</>;
  }

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
            href="mailto:feedback@uaetourplanner.com?subject=UAE Tour Planner Feedback"
            className="text-muted-foreground text-sm hover:text-primary transition-colors"
          >
            Have feedback? Email us
          </a>
        </div>
      </footer>
    </div>
  );
}
