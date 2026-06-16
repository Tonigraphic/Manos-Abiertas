import { Card, CardBody } from '../components/lsc/Card';
import { Button } from '../components/lsc/Button';
import { Badge } from '../components/lsc/Badge';
import { Languages, Target, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface HomeViewProps {
  onNavigate: (view: string) => void;
}

export function HomeView({ onNavigate }: HomeViewProps) {
  const features = [
    {
      id: 'translator',
      title: 'Traductor LSC',
      description: 'Comunicación bidireccional con IA para sordo y oyente',
      icon: Languages,
      color: 'from-blue-500 to-blue-600',
      badge: 'Principal',
    },
    {
      id: 'practice',
      title: 'Práctica y Señas',
      description: 'Mejora tus habilidades y consulta el catálogo visual',
      icon: Target,
      color: 'from-orange-500 to-orange-600',
      badge: 'Popular',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary-50)] rounded-full mb-6">
          <Sparkles size={18} className="text-[var(--color-primary-600)]" />
          <span className="text-sm font-medium text-[var(--color-primary-700)]">
            Expresión - Universidad de Nariño - Programa de Diseño Gráfico
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-[var(--color-text-primary)] mb-4">
          Manos Abiertas<br />Comunicación en LSC
        </h1>
        <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto">
          Herramienta digital integral orientada a fortalecer la comunicación
          entre la comunidad sorda y oyente de Artes
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                hoverable
                className="h-full"
                onClick={() => onNavigate(feature.id)}
              >
                <CardBody className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center shadow-lg`}>
                      <Icon size={28} className="text-white" />
                    </div>
                    <Badge variant={feature.id === 'translator' ? 'primary' : 'accent'}>
                      {feature.badge}
                    </Badge>
                  </div>

                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-[var(--color-text-secondary)] mb-6 flex-grow">
                    {feature.description}
                  </p>

                  <Button
                    variant={feature.id === 'translator' ? 'primary' : 'ghost'}
                    className="w-full"
                  >
                    {feature.id === 'translator' ? 'Comenzar' : 'Explorar'}
                  </Button>
                </CardBody>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
