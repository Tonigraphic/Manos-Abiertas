import { Home, Bot, Target, BookOpen, Languages, Video, MessageSquare } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

// Importaciones con la profundidad de ruta correcta para tu estructura de carpetas
import logoPrincipal from '../../../assets/logo.png';
import iconoProyecto from '../../../assets/icon.png';

interface NavigationProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export function DesktopNavbar({ currentView, onNavigate }: NavigationProps) {
  const navItems = [
    { id: 'translator', label: 'Traductor', icon: Languages },
    { id: 'practice', label: 'Práctica', icon: Target },
    { id: 'feedback', label: 'Sugerencias', icon: MessageSquare },
  ];

  return (
    <nav className="bg-white border-b border-[var(--color-neutral-200)] shadow-sm sticky top-0 z-50 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* SECCIÓN DE MARCA: AJUSTADA PARA MÓVIL */}
          <div 
            className="flex items-center gap-2 md:gap-3 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
            onClick={() => onNavigate('home')}
          >
            {/* El Icono: Visible siempre (Laptop y Móvil) */}
            <img 
              src={iconoProyecto} 
              alt="Icono LSC" 
              className="w-8 h-8 md:w-10 md:h-10 object-contain" 
            />
            
            {/* El Logo y Texto: SE OCULTAN EN MÓVIL (hidden) y aparecen en PC (md:flex) */}
            <div className="hidden md:flex flex-col">
              <img 
                src={logoPrincipal} 
                alt="Manos Abiertas" 
                className="h-6 w-auto object-contain" 
              />
              <p className="text-[9px] font-bold text-[var(--color-text-secondary)] uppercase tracking-tighter mt-0.5">
                Universidad de Nariño
              </p>
            </div>
          </div>

          {/* Menú de Navegación Superior */}
          <div className="flex gap-1 md:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`
                    flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-xl font-medium transition-all duration-150 text-sm
                    ${isActive
                      ? 'bg-[var(--color-primary-600)] text-white shadow-md'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-100)]'
                    }
                  `}
                >
                  <Icon size={18} />
                  {/* El texto desaparece en pantallas muy pequeñas para evitar el scroll lateral */}
                  <span className="hidden sm:inline">{item.label}</span>
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
    { id: 'translator', label: 'Traductor', icon: Languages },
    { id: 'practice', label: 'Práctica', icon: Target },
    { id: 'feedback', label: 'Sugerencias', icon: MessageSquare },
  ];

  const [tooltip, setTooltip] = useState<string | null>(null);
  const [tooltipAlign, setTooltipAlign] = useState<'center' | 'left' | 'right'>('center');
  const touchTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (touchTimer.current) window.clearTimeout(touchTimer.current);
    };
  }, []);

  const handleTouchStart = (id: string, e: React.TouchEvent | React.MouseEvent) => {
    setTooltip(id);

    // determine alignment based on element position to avoid overflow
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const vw = window.innerWidth || document.documentElement.clientWidth;

    if (rect.left < 56) setTooltipAlign('left');
    else if (rect.right > vw - 56) setTooltipAlign('right');
    else setTooltipAlign('center');

    // hide after 2.5s
    if (touchTimer.current) window.clearTimeout(touchTimer.current);
    touchTimer.current = window.setTimeout(() => setTooltip(null), 2500);
  };

  const handleTouchEnd = (id: string) => {
    // keep short delay so user sees it
    if (touchTimer.current) window.clearTimeout(touchTimer.current);
    touchTimer.current = window.setTimeout(() => setTooltip(null), 900);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--color-neutral-200)] shadow-lg md:hidden z-50">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <div key={item.id} className="relative flex-1 flex justify-center">
              <button
                onClick={() => onNavigate(item.id)}
                onTouchStart={(e) => handleTouchStart(item.id, e)}
                onTouchEnd={() => handleTouchEnd(item.id)}
                onMouseEnter={(e) => { setTooltip(item.id); setTooltipAlign('center'); }}
                onMouseLeave={() => setTooltip(null)}
                className={`
                  w-full max-w-[84px] flex flex-col items-center gap-1 py-2 rounded-xl transition-all duration-150 mx-1
                  ${isActive
                    ? 'text-[var(--color-primary-600)]'
                    : 'text-[var(--color-text-tertiary)]'
                  }
                `}
              >
                {/* Usamos el icono del proyecto para el botón de inicio en móvil */}
                {item.id === 'home' ? (
                   <img 
                     src={iconoProyecto} 
                     className={`w-6 h-6 object-contain ${isActive ? '' : 'grayscale opacity-60'}`} 
                     alt="Inicio" 
                   />
                ) : (
                   <Icon size={24} className="flex-shrink-0" />
                )}
                <span className="text-[10px] font-bold truncate text-center uppercase tracking-tighter">
                  {item.label}
                </span>
              </button>

              {/* Tooltip only visible on mobile (md:hidden) and positioned above the icon */}
              {tooltip === item.id && (
                <div className={`md:hidden absolute bottom-full mb-2 px-3 py-1 rounded-full bg-black text-white text-xs z-50 shadow-lg whitespace-nowrap pointer-events-none
                  ${tooltipAlign === 'center' ? 'left-1/2 transform -translate-x-1/2' : ''}
                  ${tooltipAlign === 'left' ? 'left-0 -translate-x-0' : ''}
                  ${tooltipAlign === 'right' ? 'right-0 translate-x-0' : ''}
                `}>
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
