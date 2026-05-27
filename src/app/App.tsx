import { useEffect, useState } from 'react';
import { DesktopNavbar, MobileBottomNav } from './components/lsc/Navigation';
import { LandingView } from './views/LandingView';
import { PracticeView } from './views/PracticeView';
import { TranslatorView } from './views/TranslatorView';
import { FeedbackView } from './views/FeedbackView';

type View = 'home' | 'translator' | 'practice' | 'feedback';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');

  useEffect(() => {
    if (currentView === 'practice' || currentView === 'feedback') return;

    const videos = Array.from(document.querySelectorAll('video')) as HTMLVideoElement[];
    videos.forEach((video) => {
      const stream = video.srcObject as MediaStream | null;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
      }
    });
  }, [currentView]);

  const renderView = () => {
    const navigateHome = () => setCurrentView('home');

    switch (currentView) {
      case 'home':
        return <LandingView onNavigate={(view) => setCurrentView(view as View)} />;
      case 'translator':
        return <TranslatorView onNavigateHome={navigateHome} />;
      case 'practice':
        return <PracticeView onNavigateHome={navigateHome} />;
      case 'feedback':
        return <FeedbackView onNavigateHome={navigateHome} />;
      default:
        return <LandingView onNavigate={(view) => setCurrentView(view as View)} />;
    }
  };

  // Show navigation only on internal views, not on landing
  const showNavigation = currentView !== 'home';

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)] flex flex-col">
      {showNavigation && (
        <DesktopNavbar currentView={currentView} onNavigate={(view) => setCurrentView(view as View)} />
      )}

      <main className={showNavigation ? 'flex-1 pb-16 md:pb-0' : 'min-h-screen flex flex-col'}>
        {renderView()}
      </main>

      {showNavigation && (
        <MobileBottomNav currentView={currentView} onNavigate={(view) => setCurrentView(view as View)} />
      )}
    </div>
  );
}