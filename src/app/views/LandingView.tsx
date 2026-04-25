import { Card, CardBody } from '../components/lsc/Card';
import { Button } from '../components/lsc/Button';
import { Badge } from '../components/lsc/Badge';
import { Bot, Target, BookOpen, Sparkles, Video, CheckCircle, Users, Award, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';

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
      highlights: ['Colores primarios', 'Abecedario', 'Oficina del Departamento de Diseño', 'Saludos básicos'],
    },
    {
      id: 'practice',
      title: 'Práctica Gamificada',
      description: 'Sistema de puntos, rachas diarias y ejercicios progresivos para mejorar habilidades',
      icon: Target,
      gradient: 'from-orange-500 to-orange-600',
      badge: 'Popular',
      highlights: ['Sistema de puntos', 'Racha de días', 'Logros desbloqueables'],
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

  const howItWorks = [
    {
      step: '01',
      title: 'Selecciona un módulo',
      description: 'Elige entre Asistente, Práctica o Diccionario según tus necesidades de aprendizaje',
      icon: Sparkles,
    },
    {
      step: '02',
      title: 'Interactúa con el sistema',
      description: 'Realiza señas frente a la cámara o practica con ejercicios guiados',
      icon: Video,
    },
    {
      step: '03',
      title: 'Recibe retroalimentación',
      description: 'Obtén puntos, visualiza tu progreso y mejora continuamente',
      icon: Award,
    },
  ];

  const scope = [
    { icon: Users, title: 'Público objetivo', text: 'Estudiantes sordos usuarios de LSC y comunidad académica de la Universidad de Nariño' },
    { icon: GraduationCap, title: 'Materia', text: 'Expresión - Primer Semestre' },
    { icon: Award, title: 'Alcance', text: 'Demo funcional en la Universidad de Nariño - Facultad de Artes' },
    { icon: CheckCircle, title: 'Tecnología', text: 'React + IA para reconocimiento de señas' },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-surface)] relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-orange-200/30 to-pink-200/30 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-gradient-to-br from-green-200/20 to-blue-200/20 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full mb-8 shadow-md border border-[var(--color-neutral-200)]">
              <GraduationCap size={20} className="text-[var(--color-primary-600)]" />
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                Universidad de Nariño - Programa de Diseño Gráfico
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--color-text-primary)] mb-6 leading-tight">
              <span className="bg-gradient-to-r from-[var(--color-primary-600)] to-[var(--color-accent-500)] bg-clip-text text-transparent">
                Manos Abiertas
              </span>
              <br />
              Asistente para la comunicación en LSC
            </h1>

            <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto mb-10 leading-relaxed">
              Herramienta digital integral desde el enfoque del diseño gráfico, orientada a fortalecer
              los procesos de comunicación entre la comunidad sorda y oyente de la Facultad de Artes de la Universidad de Nariño.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                variant="primary"
                size="lg"
                onClick={() => onNavigate('assistant')}
                rightIcon={<Bot size={22} />}
                className="w-full sm:w-auto"
              >
                Probar Asistente
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto border border-[var(--color-neutral-300)]"
              >
                Ver Características
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16"
          >
            <div className="relative mx-auto max-w-4xl">
              <div className="aspect-video bg-gradient-to-br from-[var(--color-primary-100)] to-[var(--color-accent-100)] rounded-2xl shadow-2xl overflow-hidden border-8 border-white">
                <div className="w-full h-full flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20" />
                  <div className="relative z-10 text-center">
                    <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                      <span className="text-5xl">🤟</span>
                    </div>
                    <p className="text-xl font-semibold text-[var(--color-primary-700)]">
                      Demo Interactivo
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[var(--color-accent-500)] rounded-2xl shadow-xl transform rotate-12 hidden lg:block" />
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-[var(--color-primary-500)] rounded-2xl shadow-xl transform -rotate-12 hidden lg:block" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-20 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="primary" className="mb-4 text-base px-4 py-2">
              Módulos principales
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
              Tres formas de aprender LSC
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
              Cada módulo está diseñado para ofrecer una experiencia de aprendizaje única y complementaria
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card hoverable className="h-full group">
                    <CardBody className="p-8">
                      <div className="flex items-start justify-between mb-6">
                        <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                          <Icon size={32} className="text-white" />
                        </div>
                        <Badge variant="neutral">{feature.badge}</Badge>
                      </div>

                      <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-[var(--color-text-secondary)] mb-6 leading-relaxed">
                        {feature.description}
                      </p>

                      <ul className="space-y-3 mb-6">
                        {feature.highlights.map((highlight, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                            <CheckCircle size={16} className="text-[var(--color-success-500)] flex-shrink-0" />
                            {highlight}
                          </li>
                        ))}
                      </ul>

                      <Button
                        variant="ghost"
                        className="w-full border border-[var(--color-neutral-200)]"
                        onClick={() => onNavigate(feature.id)}
                      >
                        Explorar módulo
                      </Button>
                    </CardBody>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="accent" className="mb-4 text-base px-4 py-2">
              Proceso simple
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
              ¿Cómo funciona?
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
              Tres pasos para comenzar tu aprendizaje de Lengua de Señas Colombiana
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className="relative"
                >
                  <Card className="h-full">
                    <CardBody className="p-8 text-center">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[var(--color-primary-100)] to-[var(--color-accent-100)] rounded-2xl mb-6 relative">
                        <span className="text-3xl font-bold bg-gradient-to-r from-[var(--color-primary-600)] to-[var(--color-accent-500)] bg-clip-text text-transparent">
                          {item.step}
                        </span>
                        <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center border border-[var(--color-neutral-200)]">
                          <Icon size={20} className="text-[var(--color-primary-600)]" />
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-3">
                        {item.title}
                      </h3>
                      <p className="text-[var(--color-text-secondary)] leading-relaxed">
                        {item.description}
                      </p>
                    </CardBody>
                  </Card>

                  {index < howItWorks.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                      <div className="w-8 h-1 bg-gradient-to-r from-[var(--color-primary-300)] to-[var(--color-accent-300)]" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Scope Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[var(--color-primary-50)] to-[var(--color-accent-50)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="success" className="mb-4 text-base px-4 py-2">
              Contexto académico
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
              Alcance del demo
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
              Proyecto desarrollado como demostración funcional en la Universidad de Nariño - Facultad de Artes
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {scope.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardBody className="p-6 text-center">
                      <div className="w-14 h-14 bg-gradient-to-br from-[var(--color-primary-600)] to-[var(--color-accent-500)] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Icon size={28} className="text-white" />
                      </div>
                      <h4 className="font-bold text-[var(--color-text-primary)] mb-2">
                        {item.title}
                      </h4>
                      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                        {item.text}
                      </p>
                    </CardBody>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12"
          >
            <Card className="bg-white">
              <CardBody className="p-8 sm:p-12 text-center">
                <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
                  ¿Listo para comenzar?
                </h3>
                <p className="text-lg text-[var(--color-text-secondary)] mb-8 max-w-2xl mx-auto">
                  Explora el asistente de reconocimiento en tiempo real y descubre cómo
                  la tecnología puede facilitar el aprendizaje de LSC
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => onNavigate('assistant')}
                    rightIcon={<Bot size={20} />}
                  >
                    Iniciar Asistente
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => onNavigate('practice')}
                    rightIcon={<Target size={20} />}
                  >
                    Ver Ejercicios
                  </Button>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-4 sm:px-6 lg:px-8 bg-[var(--color-neutral-900)] text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-accent-500)] rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🤟</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Manos Abiertas</h3>
                  <p className="text-xs text-neutral-400">Demo Institucional</p>
                </div>
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Herramienta digital integral para fortalecer la comunicación entre la comunidad sorda y oyente
                de la Facultad de Artes de la Universidad de Nariño.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Módulos</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li>
                  <button onClick={() => onNavigate('assistant')} className="hover:text-white transition-colors">
                    Asistente de Reconocimiento
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('practice')} className="hover:text-white transition-colors">
                    Práctica con Puntos
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('dictionary')} className="hover:text-white transition-colors">
                    Diccionario Visual
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Información</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li>Universidad de Nariño</li>
                <li>Programa: Diseño Gráfico</li>
                <li>Materia: Expresión</li>
                <li>Nivel: Primer Semestre</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-neutral-800 text-center">
            <p className="text-sm text-neutral-500">
              © 2026 Manos Abiertas. Desarrollado como proyecto académico para la Universidad de Nariño.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
