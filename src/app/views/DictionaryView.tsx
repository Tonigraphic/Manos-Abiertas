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
    const signs = signRecognitionService.getAllSigns();
    setAllSigns(signs);
  }, []);

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
      default: return 'neutral';
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
    <div className="h-[calc(100vh-5rem)] flex flex-col overflow-hidden bg-[var(--color-neutral-50)]">
      <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-[var(--color-neutral-200)] bg-white shadow-sm">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Diccionario Visual LSC</h1>
                <Badge variant="accent">{allSigns.length} señas</Badge>
              </div>
            </motion.div>
            {onNavigateHome && <BackToHome onClick={onNavigateHome} />}
          </div>

          <div className="mb-4">
            <Input
              placeholder="Buscar señas por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={20} className="text-[var(--color-text-secondary)]" />}
              className="bg-[var(--color-neutral-50)]"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${selectedCategory === category.id ? 'bg-[var(--color-primary-600)] text-white shadow-lg scale-105' : 'bg-white text-[var(--color-text-secondary)] border border-[var(--color-neutral-200)] hover:border-[var(--color-primary-300)]'}`}
              >
                <span>{category.emoji}</span>
                {category.label}
                <Badge variant={selectedCategory === category.id ? 'primary' : 'neutral'} className="ml-1">
                  {category.count}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          {filteredSigns.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredSigns.map((sign, index) => (
                <motion.div key={sign.name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.02 }}>
                  <Card hoverable className="overflow-hidden cursor-pointer h-full border-[var(--color-neutral-200)]" onClick={() => setSelectedSign(sign)}>
                    <div className="aspect-square bg-gradient-to-br from-[var(--color-primary-50)] to-[var(--color-accent-50)] flex items-center justify-center relative group">
                      <span className="text-4xl group-hover:scale-110 transition-transform duration-300">{getCategoryEmoji(sign.category)}</span>
                      <div className="absolute inset-0 bg-[var(--color-primary-600)]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl">
                          <Play size={20} className="text-[var(--color-primary-600)] ml-1" />
                        </div>
                      </div>
                    </div>
                    <CardBody className="p-3">
                      <h3 className="font-bold text-[var(--color-text-primary)] text-sm mb-2 truncate uppercase">{sign.name}</h3>
                      <Badge variant={getDifficultyColor(sign.difficulty)} className="text-[10px] uppercase tracking-tighter">{sign.difficulty}</Badge>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<BookOpen size={48} className="text-[var(--color-neutral-300)]" />} title="No encontramos esa seña" description="Intenta buscar con otra palabra o cambia de categoría." />
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedSign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[var(--color-neutral-900)]/80 backdrop-blur-md" onClick={() => setSelectedSign(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden relative z-10">
              <button onClick={() => setSelectedSign(null)} className="absolute top-4 right-4 z-20 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-transform active:scale-90">
                <X size={20} className="text-[var(--color-neutral-900)]" />
              </button>
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-3/5 bg-black aspect-video flex items-center justify-center">
                  {selectedSign.videoUrl ? (
                    <video
                      key={selectedSign.videoUrl}
                      src={selectedSign.videoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      controls
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-white text-center p-10">
                      <Play size={48} className="mx-auto mb-4 opacity-20" />
                      <p className="text-sm opacity-60">Video cargando...</p>
                    </div>
                  )}
                </div>
                <div className="p-8 flex-1 bg-white">
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{getCategoryEmoji(selectedSign.category)}</span>
                      <Badge variant="accent" className="uppercase tracking-widest text-[10px]">{selectedSign.category}</Badge>
                    </div>
                    <h2 className="text-3xl font-black text-[var(--color-neutral-900)] uppercase mb-2">{selectedSign.name}</h2>
                    <Badge variant={getDifficultyColor(selectedSign.difficulty)}>{selectedSign.difficulty}</Badge>
                  </div>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-8">
                    Observa detenidamente la forma de la mano y el movimiento. Esta seña es fundamental para el contexto de {selectedSign.category}.
                  </p>
                  <button className="w-full py-4 bg-[var(--color-primary-600)] text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[var(--color-primary-700)] transition-all shadow-xl active:scale-95">
                    <Hand size={20} /> Practicar con Cámara
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
