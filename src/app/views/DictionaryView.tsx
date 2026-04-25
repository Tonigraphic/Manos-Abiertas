import { useState, useEffect } from 'react';
import { Card, CardBody } from '../components/lsc/Card';
import { Input } from '../components/lsc/Input';
import { Badge } from '../components/lsc/Badge';
import { EmptyState } from '../components/lsc/LoadingState';
import { BackToHome } from '../components/lsc/BackToHome';
import { Search, BookOpen, Play, X, Hand } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { signRecognitionService, SignPattern } from '../../services/signRecognitionService';

interface DictionaryViewProps {
  onNavigateHome?: () => void;
}

export function DictionaryView({ onNavigateHome }: DictionaryViewProps = {}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSign, setSelectedSign] = useState<SignPattern | null>(null);
  const [allSigns, setAllSigns] = useState<SignPattern[]>([]);

  useEffect(() => {
    // Load all signs from recognition service
    const signs = signRecognitionService.getAllSigns();
    setAllSigns(signs);
  }, []);

  // Calculate category counts
  const categoryCounts = allSigns.reduce((acc, sign) => {
    acc[sign.category] = (acc[sign.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categories = [
    { id: 'all', label: 'Todas', count: allSigns.length, emoji: '📚' },
    { id: 'colors', label: 'Colores', count: categoryCounts['colors'] || 0, emoji: '🎨' },
    { id: 'alphabet', label: 'Abecedario', count: categoryCounts['alphabet'] || 0, emoji: '🔤' },
    { id: 'greetings', label: 'Saludos', count: categoryCounts['greetings'] || 0, emoji: '👋' },
    { id: 'office', label: 'Oficina', count: categoryCounts['office'] || 0, emoji: '🏢' },
    { id: 'design', label: 'Diseño', count: categoryCounts['design'] || 0, emoji: '✏️' },
  ];

  const filteredSigns = allSigns.filter(sign => {
    const matchesSearch = sign.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || sign.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (difficulty: SignPattern['difficulty']) => {
    switch (difficulty) {
      case 'Fácil': return 'success';
      case 'Intermedio': return 'warning';
      case 'Avanzado': return 'error';
    }
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'colors': return '🎨';
      case 'alphabet': return '🔤';
      case 'greetings': return '👋';
      case 'office': return '🏢';
      case 'design': return '✏️';
      default: return '🤟';
    }
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col overflow-hidden">
      {/* Header compacto */}
      <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-[var(--color-neutral-200)] bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Diccionario Visual LSC</h1>
              <Badge variant="accent">{allSigns.length} señas</Badge>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Vocabulario disponible para la comunidad
            </p>
          </motion.div>

          <div className="mb-3">
            <Input
              placeholder="Buscar señas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={20} />}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all
                  ${selectedCategory === category.id
                    ? 'bg-[var(--color-primary-600)] text-white shadow-md'
                    : 'bg-white text-[var(--color-text-secondary)] border border-[var(--color-neutral-200)] hover:border-[var(--color-primary-300)]'
                  }
                `}
              >
                <span>{category.emoji}</span>
                {category.label}
                <Badge variant={selectedCategory === category.id ? 'primary' : 'neutral'} className="text-xs">
                  {category.count}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content scrollable */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          {filteredSigns.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {filteredSigns.map((sign, index) => (
                <motion.div
                  key={sign.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.01 }}
                >
                  <Card
                    hoverable
                    className="overflow-hidden cursor-pointer"
                    onClick={() => setSelectedSign(sign)}
                  >
                    <div className="aspect-square bg-gradient-to-br from-[var(--color-primary-100)] to-[var(--color-accent-100)] flex items-center justify-center relative group">
                      <span className="text-4xl">{getCategoryEmoji(sign.category)}</span>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl">
                          <Hand size={18} className="text-[var(--color-accent-500)]" />
                        </div>
                      </div>
                    </div>
                    <CardBody className="p-2">
                      <div className="mb-1 relative group/name">
                        <h3 className="font-semibold text-[var(--color-text-primary)] text-xs truncate">
                          {sign.name}
                        </h3>
                        {/* Tooltip para palabras largas */}
                        {sign.name.length > 12 && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[var(--color-neutral-900)] text-white text-xs rounded opacity-0 group-hover/name:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                            {sign.name}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[var(--color-neutral-900)]"></div>
                          </div>
                        )}
                      </div>
                      <Badge variant={getDifficultyColor(sign.difficulty)} className="text-xs px-2 py-0">
                        {sign.difficulty}
                      </Badge>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card>
              <CardBody>
                <EmptyState
                  icon={<BookOpen size={40} />}
                  title="No se encontraron señas"
                  description="Intenta con otro término de búsqueda o categoría"
                />
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Sign Detail Modal */}
      <AnimatePresence>
        {selectedSign && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedSign(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              <div className="relative">
                <div className="aspect-video bg-gradient-to-br from-[var(--color-primary-200)] to-[var(--color-accent-200)] flex items-center justify-center">
                  <span className="text-8xl">{getCategoryEmoji(selectedSign.category)}</span>
                </div>
                <button
                  onClick={() => setSelectedSign(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
                      {selectedSign.name}
                    </h2>
                    <p className="text-[var(--color-text-secondary)]">
                      {selectedSign.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-[var(--color-neutral-50)] rounded-lg p-4">
                    <p className="text-xs text-[var(--color-text-tertiary)] mb-1">Categoría</p>
                    <p className="font-semibold text-[var(--color-text-primary)] capitalize">
                      {categories.find(c => c.id === selectedSign.category)?.label || selectedSign.category}
                    </p>
                  </div>
                  <div className="bg-[var(--color-neutral-50)] rounded-lg p-4">
                    <p className="text-xs text-[var(--color-text-tertiary)] mb-1">Dificultad</p>
                    <Badge variant={getDifficultyColor(selectedSign.difficulty)}>
                      {selectedSign.difficulty}
                    </Badge>
                  </div>
                  <div className="bg-[var(--color-neutral-50)] rounded-lg p-4">
                    <p className="text-xs text-[var(--color-text-tertiary)] mb-1">Manos</p>
                    <p className="font-semibold text-[var(--color-text-primary)]">
                      {selectedSign.requiredHands === 1 ? '1 mano' : '2 manos'}
                    </p>
                  </div>
                  <div className="bg-[var(--color-neutral-50)] rounded-lg p-4">
                    <p className="text-xs text-[var(--color-text-tertiary)] mb-1">Estado</p>
                    <Badge variant="success">Disponible</Badge>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-[var(--color-primary-50)] to-[var(--color-accent-50)] rounded-lg p-4">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    💡 <strong>Tip:</strong> Esta seña se reconoce automáticamente en el Asistente.
                    Mejora tu precisión completando ejercicios en Práctica.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}