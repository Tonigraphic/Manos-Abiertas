import { useState } from 'react';
import { Card, CardBody } from '../components/lsc/Card';
import { Button } from '../components/lsc/Button';
import { Languages, Volume2, Search, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TranslatorViewProps {
  onNavigateHome?: () => void;
}

export function TranslatorView({ onNavigateHome }: TranslatorViewProps = {}) {
  const [role, setRole] = useState<'sordo' | 'oyente'>('oyente');
  const [inputText, setInputText] = useState('');

  // Estados Simulados
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleTranslate = () => {
    setIsTranslating(true);
    setTimeout(() => {
      setIsTranslating(false);
      if (role === 'oyente') {
         setTranslatedText("YO IR UNIVERSIDAD MAÑANA");
      }
    }, 1000);
  };

  const mockOptions = [
    "Mañana iré a la universidad.",
    "Voy a la universidad por la mañana.",
    "Yo fui a la universidad ayer." // Opcion incorrecta simulada
  ];

  return (
    <div className="min-h-[calc(100vh-8rem)] md:min-h-[calc(100vh-5rem)] pb-20 md:pb-0 flex flex-col bg-[var(--color-surface)] relative">
      <div className="flex-shrink-0 p-6 sm:p-8 bg-white border-b border-[var(--color-neutral-200)] shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="bg-[var(--color-primary-100)] p-3 rounded-2xl text-[var(--color-primary-600)] shadow-inner">
            <Languages size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Traductor Bidireccional</h1>
            <p className="text-sm text-[var(--color-text-secondary)] font-medium mt-1">Facilitando la comunicación entre sordos y oyentes</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Tabs Selector */}
          <div className="flex bg-[var(--color-neutral-200)] p-1 rounded-xl w-full sm:w-fit mx-auto shadow-inner">
             <button
                onClick={() => { setRole('oyente'); setInputText(''); setTranslatedText(''); }}
                className={`flex-1 sm:w-48 py-2 px-4 rounded-lg text-sm font-bold transition-all ${role === 'oyente' ? 'bg-white text-[var(--color-primary-600)] shadow' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
             >
                Soy Oyente
             </button>
             <button
                onClick={() => { setRole('sordo'); setInputText(''); setTranslatedText(''); setSelectedOption(null); }}
                className={`flex-1 sm:w-48 py-2 px-4 rounded-lg text-sm font-bold transition-all ${role === 'sordo' ? 'bg-white text-[var(--color-primary-600)] shadow' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
             >
                Soy Sordo
             </button>
          </div>

          <AnimatePresence mode="wait">
            {role === 'oyente' ? (
              /* VISTA OYENTE */
              <motion.div key="oyente" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                 {/* Input Español */}
                 <Card className="border-none shadow-lg bg-white overflow-hidden">
                   <CardBody className="p-6">
                     <label className="block text-sm font-bold text-[var(--color-primary-600)] uppercase tracking-widest mb-4">
                       1. Escribe en Español
                     </label>
                     <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Ej: Mañana iré a la universidad..."
                        className="w-full h-32 p-4 bg-[var(--color-neutral-50)] border-2 rounded-xl focus:bg-white focus:border-[var(--color-primary-400)] outline-none resize-none text-lg transition-colors border-[var(--color-neutral-200)] text-[var(--color-text-primary)]"
                     />
                     <Button 
                        onClick={handleTranslate} 
                        className="w-full mt-4 py-4 text-base font-bold shadow-md bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] rounded-xl"
                        disabled={!inputText || isTranslating}
                     >
                        {isTranslating ? 'Traduciendo...' : 'Traducir a LSC'}
                     </Button>
                   </CardBody>
                 </Card>

                 {/* Output LSC */}
                 {translatedText && (
                   <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                     <Card className="border-2 border-[var(--color-accent-300)] shadow-xl bg-[var(--color-accent-50)]">
                        <CardBody className="p-6">
                          <label className="block text-sm font-bold text-[var(--color-accent-700)] uppercase tracking-widest mb-2">
                             2. Estructura LSC (Glosa)
                          </label>
                          <p className="text-2xl font-black text-[var(--color-accent-900)] tracking-wide mb-6">
                             {translatedText}
                          </p>

                          {/* Señas Disponibles (Thumbnails) */}
                          <label className="block text-xs font-bold text-[var(--color-accent-600)] uppercase tracking-widest mb-3">
                             Señas Individuales
                          </label>
                          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                             {translatedText.split(' ').map((word, i) => (
                               <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2">
                                  <div className="w-24 h-24 bg-white rounded-xl border border-[var(--color-accent-200)] shadow-sm flex items-center justify-center overflow-hidden">
                                    {/* Placeholder para la imagen de la seña */}
                                    <span className="text-[var(--color-neutral-400)] text-xs text-center px-2">Img: {word}</span>
                                  </div>
                                  <span className="text-xs font-bold text-[var(--color-accent-800)]">{word}</span>
                               </div>
                             ))}
                          </div>
                        </CardBody>
                     </Card>
                   </motion.div>
                 )}
              </motion.div>
            ) : (
              /* VISTA SORDO */
              <motion.div key="sordo" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                 {/* Input LSC (Glosa) */}
                 <Card className="border-none shadow-lg bg-white overflow-hidden">
                   <CardBody className="p-6">
                     <label className="block text-sm font-bold text-[var(--color-accent-600)] uppercase tracking-widest mb-4">
                       1. Escribe tus señas (Glosa)
                     </label>
                     <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Ej: YO IR UNIVERSIDAD MAÑANA..."
                        className="w-full h-32 p-4 bg-[var(--color-neutral-50)] border-2 rounded-xl focus:bg-white focus:border-[var(--color-accent-400)] outline-none resize-none text-lg transition-colors border-[var(--color-neutral-200)] text-[var(--color-text-primary)] font-bold uppercase"
                     />
                     <Button 
                        onClick={() => { setIsTranslating(true); setTimeout(() => setIsTranslating(false), 800); }} 
                        className="w-full mt-4 py-4 text-base font-bold shadow-md bg-[var(--color-accent-500)] text-white hover:bg-[var(--color-accent-600)] rounded-xl"
                        disabled={!inputText || isTranslating}
                     >
                        {isTranslating ? 'Generando...' : 'Obtener Sugerencias en Español'}
                     </Button>
                   </CardBody>
                 </Card>

                 {/* Sugerencias Español */}
                 {inputText && !isTranslating && (
                   <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                     <Card className="border-2 border-[var(--color-primary-300)] shadow-xl bg-white">
                        <CardBody className="p-6">
                          <label className="block text-sm font-bold text-[var(--color-primary-600)] uppercase tracking-widest mb-4">
                             2. Elige lo que quieres decir
                          </label>
                          
                          <div className="space-y-3 mb-6">
                            {mockOptions.map((opt, i) => (
                              <div 
                                key={i} 
                                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedOption === i ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]' : 'border-[var(--color-neutral-200)] hover:border-[var(--color-primary-200)]'}`}
                                onClick={() => setSelectedOption(i)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedOption === i ? 'border-[var(--color-primary-500)]' : 'border-[var(--color-neutral-300)]'}`}>
                                    {selectedOption === i && <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary-500)]" />}
                                  </div>
                                  <span className={`font-semibold text-base ${selectedOption === i ? 'text-[var(--color-primary-800)]' : 'text-[var(--color-text-primary)]'}`}>
                                    {opt}
                                  </span>
                                </div>
                                <button className="p-2 text-[var(--color-primary-500)] hover:bg-[var(--color-primary-100)] rounded-lg transition-colors">
                                   <Volume2 size={20} />
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="pt-4 border-t border-[var(--color-neutral-100)]">
                             <p className="text-center text-sm font-bold text-[var(--color-text-secondary)] mb-4">¿Es correcta alguna de estas opciones?</p>
                             <div className="flex gap-4 justify-center">
                                <Button className="w-32 bg-[var(--color-success-500)] hover:bg-[var(--color-success-700)] text-white shadow flex items-center justify-center gap-2">
                                   <CheckCircle size={18} /> Sí
                                </Button>
                                <Button className="w-32 bg-[var(--color-error-500)] hover:bg-[var(--color-error-700)] text-white shadow flex items-center justify-center gap-2">
                                   <XCircle size={18} /> No
                                </Button>
                             </div>
                          </div>

                        </CardBody>
                     </Card>
                   </motion.div>
                 )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
