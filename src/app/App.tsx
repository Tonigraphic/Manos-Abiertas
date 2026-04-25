import { useState } from 'react';
import { DesktopNavbar, MobileBottomNav } from './components/lsc/Navigation';
import { LandingView } from './views/LandingView';
import { AssistantView } from './views/AssistantView';
import { PracticeView } from './views/PracticeView';
import { DictionaryView } from './views/DictionaryView';

type View = 'home' | 'assistant' | 'practice' | 'dictionary';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');

  const renderView = () => {
    const navigateHome = () => setCurrentView('home');

    switch (currentView) {
      case 'home':
        return <LandingView onNavigate={(view) => setCurrentView(view as View)} />;
      case 'assistant':
        return <AssistantView onNavigateHome={navigateHome} />;
      case 'practice':
        return <PracticeView onNavigateHome={navigateHome} />;
      case 'dictionary':
        return <DictionaryView onNavigateHome={navigateHome} />;
      default:
        return <LandingView onNavigate={(view) => setCurrentView(view as View)} />;
    }
  };

  // Show navigation only on internal views, not on landing
  const showNavigation = currentView !== 'home';

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)]">
      {showNavigation && (
        <DesktopNavbar currentView={currentView} onNavigate={(view) => setCurrentView(view as View)} />
      )}

      <main className={showNavigation ? 'min-h-[calc(100vh-5rem)]' : 'min-h-screen'}>
        {renderView()}
      </main>

      {showNavigation && (
        <MobileBottomNav currentView={currentView} onNavigate={(view) => setCurrentView(view as View)} />
      )}
    </div>
  );
}