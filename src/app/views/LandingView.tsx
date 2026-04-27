import { Card, CardBody } from '../components/lsc/Card';
import { Button } from '../components/lsc/Button';
import { Badge } from '../components/lsc/Badge';
import { Bot, Target, BookOpen, Sparkles, Video, CheckCircle, Users, Award, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';

// 1. IMPORTACIÓN DEL LOGO (Vite gestionará la ruta correcta para GitHub)
import logoPrincipal from '../assets/logo.png'; 

interface LandingViewProps {
  onNavigate: (view: string) => void;
}

export function LandingView({ onNavigate }: LandingViewProps) {
  const features = [
    {
      id: 'assistant',
      title: 'Asistente Inteligente',
      description: 'Reconocimiento en tiempo real de Lengua de Señas Colombiana para apoyo en clase',
      icon: Bot,
      gradient: 'from-blue-500 to-blue-600',
      badge: 'Módulo Principal',
      highlights: ['Colores', 'Abecedario', 'Oficina', 'Saludos'],
    },
    {
      id: 'practice',
      title: 'Práctica Gamificada',
      description: 'Sistema de puntos, rachas diarias y ejercicios progresivos para mejorar habilidades',
      icon: Target,
      gradient: 'from-orange-500 to-orange-600',
      badge: 'Popular',
      highlights: ['Sistema de puntos', 'Racha de días', 'Logros'],
    },
    {
      id: 'dictionary',
      title: 'Diccionario Visual',
      description: 'Catálogo completo de señas organizadas por categorías con videos demostrativos',
      icon: BookOpen,
      gradient: 'from-green-500 to-green-600',
      badge: 'Complementario',
      highlights: ['Búsqueda avanzada', 'Categorización', 'Videos HD'],
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-surface)] relative overflow-hidden">
      {/* Decoración de Fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-orange-200/30 to-pink-200/30 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge Institucional */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full mb-8 shadow-md border border-[var(--color-neutral-200)]">
              <GraduationCap size={20} className="text-[var(--color-primary-600)]" />
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                Universidad de Nariño - Programa de Diseño Gráfico
              </span>
            </div>

            {/* 2. REEMPLAZO DEL TEXTO POR EL LOGO IMPORTADO */}
            <div className="flex justify-center mb-6">
              <img 
                src={logoPrincipal} 
                alt="Logo Manos Abiertas" 
                className="h-28 sm:h-36 lg:h-48 w-auto object-contain" 
              />
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--color-text-primary)] mb-6 leading-tight">
              Asistente para la comunicación en LSC
            </h1>

            <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto mb-10 leading-relaxed">
              Herramienta digital integral desde el enfoque del diseño gráfico, orientada a fortalecer
              los procesos de comunicación entre la comunidad sorda y oyente de la Universidad de Nariño.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                variant="primary"
                size="lg"
                onClick={() => onNavigate('assistant')}
                rightIcon={<Bot size={22} />}
                className="w-full sm:w-auto px-8 py-6 text-lg font-bold shadow-xl"
              >
                Probar Asistente
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto border border-[var(--color-neutral-300)] px-8 py-6 text-lg font-bold"
              >
                Ver Características
              </Button>
            </div>
          </motion.div>

          {/* Imagen/Demo Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16"
          >
            <div className="relative mx-auto max-w-4xl">
              <div className="aspect-video bg-gradient-to-br from-[var(--color-primary-100)] to-[var(--color-accent-100)] rounded-3xl shadow-2xl overflow-hidden border-8 border-white">
                <div className="w-full h-full flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-purple-400/10" />
                  <div className="relative z-10 text-center">
                    <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-3xl shadow-lg flex items-center justify-center">
                      <span className="text-6xl">🤟</span>
                    </div>
                    <p className="text-2xl font-black text-[var(--color-primary-700)] uppercase tracking-widest">
                      Prototipo Funcional
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm border-t border-[var(--color-neutral-100)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="primary" className="mb-4 text-sm px-4 py-1 uppercase font-black tracking-widest">
              Módulos principales
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
              Tres formas de aprender y comunicar
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
              Diseñamos una experiencia complementaria para fortalecer la inclusión académica.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card hoverable className="h-full border-none shadow-lg hover:shadow-2xl transition-all">
                  <CardBody className="p-8">
                    <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                      <feature.icon size={28} className="text-white" />
                    </div>
                    <Badge variant="accent" className="mb-3">{feature.badge}</Badge>
                    <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-[var(--color-text-secondary)] mb-6 leading-relaxed">
                      {feature.description}
                    </p>
                    <ul className="space-y-2 mb-8">
                      {feature.highlights.map((h, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
                          <CheckCircle size={16} className="text-green-500" />
                          {h}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      variant="primary" 
                      className="w-full" 
                      onClick={() => onNavigate(feature.id)}
                    >
                      Explorar módulo
                    </Button>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
