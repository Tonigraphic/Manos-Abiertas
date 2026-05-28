import { useState } from 'react';
import { Card, CardBody } from '../components/lsc/Card';
import { Button } from '../components/lsc/Button';
import { Languages, Volume2, Search, CheckCircle, XCircle, Play, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translateLSCtoSpanish } from '../../lib/translationEngine';
import { LSC_VOCABULARY } from '../../lib/lscData';
import { InstructionsModal } from '../components/lsc/InstructionsModal';

type VocabularyEntry = {
  label: string;
  url: string;
};

type TranslationOption = {
  text: string;
  description: string;
};

type PreviewSign = VocabularyEntry & {
  group: string;
};

const INDIVIDUAL_SIGN_ENTRIES: VocabularyEntry[] = Object.values(LSC_VOCABULARY).flat();
const INDIVIDUAL_SIGN_GROUPS = Object.entries(LSC_VOCABULARY) as [string, VocabularyEntry[]][];

const SPECIAL_PHRASES = [
  { pattern: /\bhorario de clase\b/, label: 'HORARIO DE CLASE' },
  { pattern: /\bhorario de materia\b/, label: 'HORARIO DE MATERIA' },
  { pattern: /\bhorario\b/, label: 'HORARIO' },
  { pattern: /\bproceso de matricula\b/, label: 'PROCESO DE MATRÍCULA' },
  { pattern: /\bmatricula academica\b/, label: 'MATRÍCULA ACADÉMICA' },
  { pattern: /\bmatricula financiera\b/, label: 'MATRICULA FINANCIERA' },
  { pattern: /\bmatricula materias\b/, label: 'MATRÍCULA MATERIAS' },
  { pattern: /\bsolicitar certificado\b/, label: 'SOLICITAR CERTIFICADO' },
  { pattern: /\benviar tarea\b/, label: 'ENVIAR TAREA' },
  { pattern: /\bmi nombre\b/, label: 'MI NOMBRE' },
  { pattern: /\bmi sena\b/, label: 'MI SEÑA' },
  { pattern: /\bhola\b/, label: 'HOLA' },
  { pattern: /\bgracias\b/, label: 'GRACIAS' },
  { pattern: /\bprofesor(a)?\b/, label: 'PROFESOR' },
];

const STOP_WORDS = new Set(['a', 'al', 'de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'o', 'en']);

const VERB_TO_GLOSS: Record<string, string> = {
  voy: 'IR', vas: 'IR', va: 'IR', vamos: 'IR', van: 'IR',
  fui: 'IR', fuiste: 'IR', fue: 'IR', fuimos: 'IR', fueron: 'IR',
  iré: 'IR', iras: 'IR', irá: 'IR', iremos: 'IR', irán: 'IR',
  tengo: 'TENER', tienes: 'TENER', tiene: 'TENER', tenemos: 'TENER', tienen: 'TENER',
  quiero: 'QUERER', quieres: 'QUERER', quiere: 'QUERER', queremos: 'QUERER', quieren: 'QUERER',
  necesito: 'NECESITAR', necesitas: 'NECESITAR', necesita: 'NECESITAR', necesitamos: 'NECESITAR', necesitan: 'NECESITAR',
  puedo: 'PODER', puedes: 'PODER', puede: 'PODER', podemos: 'PODER', pueden: 'PODER',
  hago: 'HACER', haces: 'HACER', hace: 'HACER', hacemos: 'HACER', hacen: 'HACER',
  estudio: 'ESTUDIAR', estudias: 'ESTUDIAR', estudia: 'ESTUDIAR', estudiamos: 'ESTUDIAR', estudian: 'ESTUDIAR',
  explico: 'EXPLICAR', explicas: 'EXPLICAR', explica: 'EXPLICAR', explicamos: 'EXPLICAR', explican: 'EXPLICAR',
};

function normalizeValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function findVocabularyEntry(label: string): VocabularyEntry | undefined {
  const normalized = normalizeValue(label);
  return INDIVIDUAL_SIGN_ENTRIES.find(entry => normalizeValue(entry.label) === normalized);
}

function buildSpanishToLscGloss(input: string): { gloss: string; matches: VocabularyEntry[] } {
  const normalizedInput = normalizeValue(input).replace(/[¿?¡!.,;:_]/g, ' ');
  const matchedEntries: VocabularyEntry[] = [];
  let working = normalizedInput;

  for (const phrase of SPECIAL_PHRASES) {
    phrase.pattern.lastIndex = 0;
    if (phrase.pattern.test(working)) {
      const entry = findVocabularyEntry(phrase.label);
      if (entry && !matchedEntries.some(item => normalizeValue(item.label) === normalizeValue(entry.label))) {
        matchedEntries.push(entry);
      }
      working = working.replace(phrase.pattern, ' ');
    }
  }

  const tokens = working.split(/\s+/).filter(Boolean);
  const glossTokens: string[] = [];

  for (const token of tokens) {
    if (STOP_WORDS.has(token)) continue;

    const mappedVerb = VERB_TO_GLOSS[token];
    if (mappedVerb) {
      glossTokens.push(mappedVerb);
      continue;
    }

    const entry = findVocabularyEntry(token);
    if (entry) {
      glossTokens.push(entry.label);
      if (!matchedEntries.some(item => normalizeValue(item.label) === normalizeValue(entry.label))) {
        matchedEntries.push(entry);
      }
      continue;
    }

    if (/^\d+$/.test(token)) {
      glossTokens.push(token);
      continue;
    }

    glossTokens.push(token.toUpperCase());
  }

  const uniqueGlossTokens = glossTokens.filter((token, index) => glossTokens.indexOf(token) === index);

  return {
    gloss: uniqueGlossTokens.join(' '),
    matches: matchedEntries,
  };
}

function buildSpanishSuggestions(input: string, primary: string): TranslationOption[] {
  const normalized = normalizeValue(input);
  const options: TranslationOption[] = [
    { text: primary, description: 'Versión más directa' },
  ];

  const timeWord = ['mañana', 'hoy', 'ayer', 'ahora'].find(word => normalized.includes(word));
  const barePrimary = primary.replace(/^Yo\s+/i, '').replace(/^No\s+/i, '').trim();

  if (timeWord && barePrimary) {
    options.push({
      text: `${capitalize(timeWord)} ${barePrimary}`.replace(/\s+/g, ' ').trim(),
      description: 'Con marcador temporal al inicio',
    });
  }

  if (/\byo\b/.test(normalized) && barePrimary) {
    options.push({
      text: `Yo ${barePrimary}`.replace(/\s+/g, ' ').trim(),
      description: 'Estructura más explícita',
    });
  }

  if (options.length < 3 && barePrimary) {
    options.push({
      text: `${barePrimary}`,
      description: 'Versión corta de validación',
    });
  }

  return options.filter((option, index, array) => array.findIndex(item => item.text.toLowerCase() === option.text.toLowerCase()) === index).slice(0, 3);
}

function speakText(text: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-CO';
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

async function translateLSCToSpanishText(input: string): Promise<string> {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: input }),
    });

    if (!response.ok) {
      throw new Error(`Translation response ${response.status}`);
    }

    const payload = await response.json();
    const translatedText = String(payload?.translatedText || '').trim();
    if (translatedText) return translatedText;
  } catch (error) {
    console.warn('Endpoint de traducción no disponible, usando el motor local.', error);
  }

  return translateLSCtoSpanish(input);
}

interface TranslatorViewProps {
  onNavigateHome?: () => void;
}

export function TranslatorView({ onNavigateHome }: TranslatorViewProps = {}) {
  const [role, setRole] = useState<'sordo' | 'oyente'>('oyente');
  const [inputText, setInputText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [availableSigns, setAvailableSigns] = useState<VocabularyEntry[]>([]);
  const [translationOptions, setTranslationOptions] = useState<TranslationOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [selectedPreview, setSelectedPreview] = useState<PreviewSign | null>(null);

  const resetRoleState = () => {
    setTranslatedText('');
    setAvailableSigns([]);
    setTranslationOptions([]);
    setSelectedOption(null);
    setConfirmationMessage('');
    setSelectedPreview(null);
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    setIsTranslating(true);
    setConfirmationMessage('');

    try {
      if (role === 'oyente') {
        const result = buildSpanishToLscGloss(inputText);
        setTranslatedText(result.gloss || inputText.toUpperCase());
        setAvailableSigns(result.matches);
        setTranslationOptions([]);
        setSelectedOption(null);
      } else {
        const primaryTranslation = await translateLSCToSpanishText(inputText);
        const options = buildSpanishSuggestions(inputText, primaryTranslation || inputText);
        setTranslatedText(primaryTranslation || inputText);
        setTranslationOptions(options);
        setSelectedOption(0);
        setAvailableSigns([]);
      }
    } finally {
      setIsTranslating(false);
    }
  };

  const handleConfirmSelection = (accepted: boolean) => {
    if (accepted && selectedOption !== null && translationOptions[selectedOption]) {
      setTranslatedText(translationOptions[selectedOption].text);
      setConfirmationMessage('La sugerencia seleccionada quedó confirmada.');
    } else if (!accepted) {
      setConfirmationMessage('Selecciona otra sugerencia o ajusta tu entrada.');
    }
  };

  const openPreview = (group: string, sign: VocabularyEntry) => {
    setSelectedPreview({ ...sign, group });
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] md:min-h-[calc(100vh-5rem)] pb-20 md:pb-0 flex flex-col bg-[var(--color-surface)] relative">
      <InstructionsModal
        id="translator"
        title="Traductor LSC"
        instructions={[
          'Para señas individuales, el traductor usa el vocabulario completo del diccionario, con sus 75 clases disponibles.',
          'En modo oyente, escribe una frase en español para verla convertida a glosa LSC y señas disponibles.',
          'En modo sordo, escribe la estructura LSC para recibir sugerencias en español correcto.',
          'Puedes escuchar en voz alta la sugerencia seleccionada cuando lo necesites.',
          'Usa la confirmación para validar la opción que mejor represente lo que deseas decir.'
        ]}
      />
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
               onClick={() => { setRole('oyente'); setInputText(''); resetRoleState(); }}
                className={`flex-1 sm:w-48 py-2 px-4 rounded-lg text-sm font-bold transition-all ${role === 'oyente' ? 'bg-white text-[var(--color-primary-600)] shadow' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
             >
                Soy Oyente
             </button>
             <button
               onClick={() => { setRole('sordo'); setInputText(''); resetRoleState(); }}
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
                              {availableSigns.length > 0 ? availableSigns.map((sign, i) => (
                               <button
                                 type="button"
                                 key={`${sign.label}-${i}`}
                                 onClick={() => openPreview('Seña detectada', sign)}
                                 className="flex-shrink-0 flex flex-col items-center gap-2 text-left"
                               >
                                 <div className="w-24 h-24 bg-white rounded-xl border border-[var(--color-accent-200)] shadow-sm flex items-center justify-center overflow-hidden relative group">
                                  <video src={sign.url} autoPlay loop muted playsInline className="w-full h-full object-contain bg-black" />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <span className="opacity-0 group-hover:opacity-100 bg-white text-[var(--color-neutral-900)] rounded-full p-2 shadow-lg transition-opacity">
                                      <Play size={16} />
                                    </span>
                                  </div>
                                 </div>
                                 <span className="text-xs font-bold text-[var(--color-accent-800)]">{sign.label}</span>
                               </button>
                              )) : (
                               <div className="text-sm text-[var(--color-text-secondary)]">No se encontraron señas exactas en el vocabulario para esta frase.</div>
                              )}
                          </div>

                          <div className="mt-8 pt-6 border-t border-[var(--color-accent-100)]">
                            <label className="block text-xs font-bold text-[var(--color-accent-600)] uppercase tracking-widest mb-4">
                              Catálogo individual completo
                            </label>
                            <div className="space-y-5 max-h-[34rem] overflow-y-auto pr-2 custom-scrollbar">
                              {INDIVIDUAL_SIGN_GROUPS.map(([category, signs]) => (
                                <div key={category} className="space-y-3">
                                  <div className="flex items-center justify-between gap-3">
                                    <h4 className="text-sm font-black text-[var(--color-text-primary)] uppercase tracking-wide">{category}</h4>
                                    <span className="text-[11px] font-bold text-[var(--color-text-secondary)]">{signs.length} señas</span>
                                  </div>
                                  <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                    {signs.map((sign) => (
                                      <button
                                        type="button"
                                        key={`${category}-${sign.label}`}
                                        onClick={() => openPreview(category, sign)}
                                        className="flex-shrink-0 w-24 flex flex-col items-center gap-2 text-left"
                                      >
                                        <div className="w-24 h-24 bg-white rounded-xl border border-[var(--color-accent-200)] shadow-sm flex items-center justify-center overflow-hidden relative group">
                                          <video src={sign.url} autoPlay loop muted playsInline className="w-full h-full object-contain bg-black" />
                                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                            <span className="opacity-0 group-hover:opacity-100 bg-white text-[var(--color-neutral-900)] rounded-full p-2 shadow-lg transition-opacity">
                                              <Play size={16} />
                                            </span>
                                          </div>
                                        </div>
                                        <span className="text-[11px] font-bold text-[var(--color-accent-800)] text-center leading-tight">{sign.label}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
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
                        onClick={handleTranslate} 
                        className="w-full mt-4 py-4 text-base font-bold shadow-md bg-[var(--color-accent-500)] text-white hover:bg-[var(--color-accent-600)] rounded-xl"
                        disabled={!inputText || isTranslating}
                     >
                        {isTranslating ? 'Generando...' : 'Obtener Sugerencias en Español'}
                     </Button>
                   </CardBody>
                 </Card>

                 {/* Sugerencias Español */}
                 {translationOptions.length > 0 && !isTranslating && (
                   <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                     <Card className="border-2 border-[var(--color-primary-300)] shadow-xl bg-white">
                        <CardBody className="p-6">
                          <label className="block text-sm font-bold text-[var(--color-primary-600)] uppercase tracking-widest mb-4">
                             2. Elige lo que quieres decir
                          </label>
                          
                          <div className="space-y-3 mb-6">
                            {translationOptions.map((opt, i) => (
                              <div 
                                key={i} 
                                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedOption === i ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]' : 'border-[var(--color-neutral-200)] hover:border-[var(--color-primary-200)]'}`}
                                onClick={() => setSelectedOption(i)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedOption === i ? 'border-[var(--color-primary-500)]' : 'border-[var(--color-neutral-300)]'}`}>
                                    {selectedOption === i && <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary-500)]" />}
                                  </div>
                                  <div>
                                    <span className={`block font-semibold text-base ${selectedOption === i ? 'text-[var(--color-primary-800)]' : 'text-[var(--color-text-primary)]'}`}>
                                      {opt.text}
                                    </span>
                                    <span className="block text-xs text-[var(--color-text-secondary)] mt-1">{opt.description}</span>
                                  </div>
                                </div>
                                <button type="button" onClick={(e) => { e.stopPropagation(); speakText(opt.text); }} className="p-2 text-[var(--color-primary-500)] hover:bg-[var(--color-primary-100)] rounded-lg transition-colors">
                                   <Volume2 size={20} />
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="pt-4 border-t border-[var(--color-neutral-100)]">
                             <p className="text-center text-sm font-bold text-[var(--color-text-secondary)] mb-4">¿Es correcta alguna de estas opciones?</p>
                             <div className="flex gap-4 justify-center">
                                <Button type="button" onClick={() => handleConfirmSelection(true)} className="w-32 bg-[var(--color-success-500)] hover:bg-[var(--color-success-700)] text-white shadow flex items-center justify-center gap-2">
                                   <CheckCircle size={18} /> Sí
                                </Button>
                                <Button type="button" onClick={() => handleConfirmSelection(false)} className="w-32 bg-[var(--color-error-500)] hover:bg-[var(--color-error-700)] text-white shadow flex items-center justify-center gap-2">
                                   <XCircle size={18} /> No
                                </Button>
                             </div>
                             {confirmationMessage && (
                               <p className="mt-4 text-center text-sm text-[var(--color-text-secondary)]">{confirmationMessage}</p>
                             )}
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

      <AnimatePresence>
        {selectedPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[var(--color-neutral-900)]/80 backdrop-blur-md"
              onClick={() => setSelectedPreview(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-y-auto max-h-[85vh] md:overflow-hidden relative z-10"
            >
              <button
                onClick={() => setSelectedPreview(null)}
                className="absolute top-4 right-4 z-20 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-transform active:scale-90"
                aria-label="Cerrar vista ampliada"
              >
                <X size={20} className="text-[var(--color-neutral-900)]" />
              </button>
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-3/5 bg-black aspect-video flex items-center justify-center">
                  <video
                    key={selectedPreview.url}
                    src={selectedPreview.url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-8 flex-1 bg-white">
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">🤟</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">{selectedPreview.group}</span>
                    </div>
                    <h2 className="text-3xl font-black text-[var(--color-neutral-900)] uppercase mb-2">{selectedPreview.label}</h2>
                  </div>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-8">
                    Observa el movimiento y la configuración manual de esta seña del vocabulario individual.
                  </p>
                  <button
                    onClick={() => setSelectedPreview(null)}
                    className="w-full py-4 bg-[var(--color-primary-600)] text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[var(--color-primary-700)] transition-all shadow-xl active:scale-95"
                  >
                    Cerrar
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
