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
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}
