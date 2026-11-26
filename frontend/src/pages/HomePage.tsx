import React, { lazy, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import { HomeHero } from '../features/home/HomeHero';
import { HomeDiscoverySection } from '../features/home/HomeDiscoverySection';
import { HomeHowItWorks } from '../features/home/HomeHowItWorks';
import { HomeCtaSection } from '../features/home/HomeCtaSection';
import { useHomeDiscovery } from '../features/home/useHomeDiscovery';

const HomeConnectedView = lazy(() =>
  import('../features/home/HomeConnectedView').then((m) => ({
    default: m.HomeConnectedView,
  }))
);

const PublicHomeView: React.FC = () => {
  const demoCode = import.meta.env.VITE_DEMO_CODE || 'ZIG-KBG-8454';
  const discovery = useHomeDiscovery(6);

  return (
    <div className="flex-1 w-full flex flex-col bg-canvas">
      <HomeHero demoCode={demoCode} />
      <HomeDiscoverySection discovery={discovery} />
      <HomeHowItWorks />
      <HomeCtaSection />
    </div>
  );
};

export const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return (
      <Suspense
        fallback={
          <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-6 animate-pulse">
            <div className="h-44 rounded-3xl bg-surface border border-border" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="h-64 rounded-2xl bg-surface border border-border" />
              <div className="h-64 rounded-2xl bg-surface border border-border" />
              <div className="h-64 rounded-2xl bg-surface border border-border" />
            </div>
          </div>
        }
      >
        <HomeConnectedView user={user} />
      </Suspense>
    );
  }

  return <PublicHomeView />;
};
