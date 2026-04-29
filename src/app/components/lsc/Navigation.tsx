import { Home, Bot, Target, BookOpen, Languages, Video, MessageSquare } from 'lucide-react';

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
    { id: 'assistant', label: 'Asistente LSC', icon: Video },
    { id: 'practice', label: 'Práctica', icon: Target },
    { id: 'dictionary', label: 'Diccionario', icon: BookOpen },
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
    { id: 'assistant', label: 'Asistente', icon: Video },
    { id: 'practice', label: 'Práctica', icon: Target },
    { id: 'dictionary', label: 'Diccionario', icon: BookOpen },
    { id: 'feedback', label: 'Sugerencias', icon: MessageSquare },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--color-neutral-200)] shadow-lg md:hidden z-50">
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
              <span className="text-[10px] font-bold truncate w-full text-center uppercase tracking-tighter">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
