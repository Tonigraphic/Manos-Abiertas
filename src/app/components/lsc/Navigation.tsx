import { Home, Bot, Target, BookOpen } from 'lucide-react';

// 1. Importamos las imágenes desde la carpeta assets
import logoPrincipal from '../../assets/logo.png';
import iconoProyecto from '../../assets/icon.png';

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
    <nav className="bg-white border-b border-[var(--color-neutral-200)] shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          
          {/* SECCIÓN DE MARCA: REEMPLAZADA POR LOGO E ICONO */}
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onNavigate('home')}
          >
            {/* El Icono del Proyecto */}
            <img 
              src={iconoProyecto} 
              alt="Icono LSC" 
              className="w-10 h-10 object-contain" 
            />
            
            <div className="flex flex-col">
              {/* El Logo de "Manos Abiertas" */}
              <img 
                src={logoPrincipal} 
                alt="Manos Abiertas" 
                className="h-6 w-auto object-contain" 
              />
              <p className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-tighter mt-1">
                Universidad de Nariño
              </p>
            </div>
          </div>

          {/* Menú de Navegación */}
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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--color-neutral-200)] shadow-lg md:hidden z-50">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          // Para el botón de Inicio en móvil, podemos usar el icono personalizado
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
              {item.id === 'home' ? (
                 <img src={iconoProyecto} className={`w-6 h-6 object-contain ${isActive ? '' : 'grayscale opacity-70'}`} alt="Home" />
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
