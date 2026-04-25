import { Home, Bot, Target, BookOpen } from 'lucide-react';

interface NavigationProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export function DesktopNavbar({ currentView, onNavigate }: NavigationProps) {
  const navItems = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'assistant', label: 'Asistente', icon: Bot },
    { id: 'practice', label: 'Práctica', icon: Target },
    { id: 'dictionary', label: 'Diccionario', icon: BookOpen },
  ];

  return (
    <nav className="bg-white border-b border-[var(--color-neutral-200)] shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-primary-600)] to-[var(--color-accent-500)] rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🤟</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Manos Abiertas</h1>
              <p className="text-xs text-[var(--color-text-secondary)]">Universidad de Nariño</p>
            </div>
          </div>

          <div className="flex gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-150
                    ${isActive
                      ? 'bg-[var(--color-primary-600)] text-white shadow-md'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-100)]'
                    }
                  `}
                >
                  <Icon size={20} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

export function MobileBottomNav({ currentView, onNavigate }: NavigationProps) {
  const navItems = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'assistant', label: 'Asistente', icon: Bot },
    { id: 'practice', label: 'Práctica', icon: Target },
    { id: 'dictionary', label: 'Diccionario', icon: BookOpen },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--color-neutral-200)] shadow-lg md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-150 min-w-0
                ${isActive
                  ? 'text-[var(--color-primary-600)]'
                  : 'text-[var(--color-text-tertiary)]'
                }
              `}
            >
              <Icon size={24} className="flex-shrink-0" />
              <span className="text-xs font-medium truncate w-full text-center">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
