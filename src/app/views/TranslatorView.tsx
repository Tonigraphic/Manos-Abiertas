import { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardBody } from '../components/lsc/Card';
import { Button } from '../components/lsc/Button';
import { Badge } from '../components/lsc/Badge';
import { Send, Languages, Mic, Volume2, MicOff, User, Hand, Play, VolumeX, CheckCircle2, Video, Maximize } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InstructionOverlay } from '../components/InstructionOverlay';
import { translateLSCtoSpanish } from '../../lib/translationEngine';
import { signRecognitionService, SignPattern } from '../../services/signRecognitionService';
import { resolveVideoUrl } from '@/lib/videoUtils';

function cleanTranslationOptions(options: string[]): string[] {
  return options
    .map(opt => {
      // Remover prefijos comunes como "Opción X:", "X.", "1-", etc.
      return opt
        .replace(/^(opci[oó]n\s+\d+:?|opc\s+\d+:?|\d+[\s.-]+)/i, '')
        .trim();
    })
    .filter(opt => {
      // Filtrar opciones que son textos explicativos del LLM
      const lower = opt.toLowerCase();
      if (lower.startsWith('aquí tienes') || 
          lower.startsWith('estas son') || 
          lower.startsWith('opciones de') || 
          (lower.includes('traducción') && lower.length < 35) ||
          lower.includes('intérprete') ||
          lower.length < 3) {
        return false;
      }
      return true;
    });
}

export function TranslatorView({ onNavigateHome }: TranslatorViewProps = {}) {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [translatorInput, setTranslatorInput] = useState('');
  const [resultLSC, setResultLSC] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState<number | null>(null);
  
  const selectedSuggestion = selectedSuggestionIdx !== null ? suggestions[selectedSuggestionIdx] : null;
  const [matchedSigns, setMatchedSigns] = useState<SignPattern[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  
  const allSigns = useMemo(() => signRecognitionService.getAllSigns(), []);

  const handleVideoFullscreen = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const container = btn.parentElement;
    if (container) {
      const video = container.querySelector('video');
      if (video) {
        if (video.requestFullscreen) {
          video.requestFullscreen();
        } else if ((video as any).webkitRequestFullscreen) {
          (video as any).webkitRequestFullscreen();
        } else if ((video as any).mozRequestFullScreen) {
          (video as any).mozRequestFullScreen();
        } else if ((video as any).msRequestFullscreen) {
          (video as any).msRequestFullscreen();
        }
      }
    }
  };

  const processHearingTranslation = async (text: string) => {
    setIsTranslating(true);
    try {
      let result = text;
      try {
        const isLocalDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        if (isLocalDev) {
          throw new Error("Desarrollo local: Omitiendo backend para evitar error 404 en consola");
        }

        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, mode: 'hearing' }),
        });
        
        const contentType = response.headers.get('content-type');
        if (!response.ok || !contentType?.includes('application/json')) {
          throw new Error('El backend no respondió correctamente (JSON).');
        }
        
        const data = await response.json();
        if (data.success === false) throw new Error(data.reason);
        result = (data.translatedText || text).replace(/[\*"'“”`]/g, '').trim();
      } catch (apiError) {
        console.warn("Fallo el backend local o desarrollo local detectado, intentando conexión directa a Hugging Face...");
        const token = import.meta.env.VITE_HF_TRANSLATION_TOKEN || import.meta.env.VITE_HF_TOKEN;
        const hfModel = import.meta.env.VITE_HF_TRANSLATION_MODEL || "meta-llama/Meta-Llama-3-8B-Instruct";
        
        if (!token) {
          alert("⚠️ Falta configurar el token VITE_HF_TRANSLATION_TOKEN en tu archivo .env.local (recuerda reiniciar el servidor).");
          throw new Error("Token no configurado");
        }

        let hfRes;
        try {
          hfRes = await fetch("https://router.huggingface.co/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ 
              model: hfModel,
              messages: [
                { role: "system", content: "You are an expert Spanish to Colombian Sign Language (LSC) gloss translator. Your task is to translate the Spanish sentence into CSL/LSC gloss in Spanish words. Rules: 1. Preserve all key concepts, verbs, nouns, adjectives, colors, and especially temporal indicators/references (e.g., 'mañana', 'hoy', 'ayer'). Do NOT drop the temporal context. 2. Translate ONLY concepts present in the input sentence. Do NOT hallucinate or add extra objects/words (e.g., do not add 'pincel' if the input does not mention it). 3. Do NOT use CSL/LSC-omitted words such as connectors, prepositions, or articles. 4. Translate verbs to infinitive. 5. CSL/LSC gloss typically puts essential words in a conceptual order (often Time-Subject-Object-Verb). 6. Output the final gloss in lowercase with only the very first letter capitalized. 7. Output ONLY the clean gloss sentence without any introductions, explanations, quotes, or punctuation. Example: Input 'Necesito que traigas tus colores azul y rojo para la clase de mañana' -> Output 'Mañana clase colores azul rojo traer necesitar'" },
                { role: "user", content: text }
              ],
              temperature: 0.3,
              max_tokens: 50
            })
          });

          // Si falla y el modelo no es el por defecto, intentar con el modelo warm de respaldo
          if (!hfRes.ok && hfModel !== "meta-llama/Meta-Llama-3-8B-Instruct") {
            console.warn("Fallo con el modelo principal, reintentando con Llama 3-8B...");
            hfRes = await fetch("https://router.huggingface.co/v1/chat/completions", {
              method: "POST",
              headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify({ 
                model: "meta-llama/Meta-Llama-3-8B-Instruct",
                messages: [
                  { role: "system", content: "You are an expert Spanish to Colombian Sign Language (LSC) gloss translator. Translate the Spanish sentence to LSC gloss in Spanish words. Output the final gloss in lowercase with only the very first letter capitalized. Output ONLY the clean gloss sentence without any introductions, explanations, quotes, or punctuation." },
                  { role: "user", content: text }
                ],
                temperature: 0.3,
                max_tokens: 50
              })
            });
          }
        } catch (networkError) {
          alert("❌ Error de red: No se pudo conectar con Hugging Face. Revisa tu conexión a internet o tu configuración de DNS.");
          throw networkError;
        }

        if (!hfRes.ok) {
          const err = await hfRes.text();
          if (hfRes.status === 503) {
            alert("⏳ La Inteligencia Artificial se está despertando. Por favor, intenta de nuevo en 10 segundos.");
          } else {
            alert(`❌ Error de Hugging Face (${hfRes.status}). Revisa la consola (F12).`);
            console.error("Hugging Face API Error:", err);
          }
          throw new Error(`HF API status: ${hfRes.status}`);
        }

        const hfData = await hfRes.json();
        if (hfData.choices?.[0]?.message?.content) {
          result = hfData.choices[0].message.content.trim().replace(/^"|"$/g, '').replace(/[\*"'“”`]/g, '');
        }
      }

      setResultLSC(result);

      // Buscar coincidencias de video estrictas basadas en el resultado de la IA
      const cleanResult = result.replace(/[¿?¡!.,;:_"'“”]/g, '').toLowerCase().trim();
      const words = cleanResult.split(/\s+/).filter(Boolean);
      
      const matches = allSigns.filter(s => {
        const signNameLower = s.name.toLowerCase();
        
        // Evitar emparejar letras individuales (longitud 1) a menos que la palabra sea exactamente de longitud 1
        if (signNameLower.length === 1 && !words.includes(signNameLower)) {
          return false;
        }

        // Coincidencia exacta de frase o palabra completa en el resultado traducido
        if (cleanResult.includes(signNameLower)) {
          const regex = new RegExp(`\\b${signNameLower}\\b`, 'i');
          if (regex.test(cleanResult)) {
            return true;
          }
        }
        
        // O si alguna de las palabras de la traducción es exactamente igual al nombre de la seña
        return words.some(w => w === signNameLower);
      });
      setMatchedSigns(matches.slice(0, 4));
    } catch (error) {
      console.error(error);
      setResultLSC(text);
    } finally {
      setIsTranslating(false);
    }
  };

  const processDeafTranslation = async (text: string) => {
    setIsTranslating(true);
    try {
      let options: string[] = [];
      try {
        const isLocalDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        if (isLocalDev) {
          throw new Error("Desarrollo local: Omitiendo backend para evitar error 404 en consola");
        }

        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, mode: 'deaf' }),
        });
        
        const contentType = response.headers.get('content-type');
        if (!response.ok || !contentType?.includes('application/json')) {
          throw new Error('El backend no respondió correctamente (JSON).');
        }
        
        const data = await response.json();
        if (data.success === false) throw new Error(data.reason);
        
        const rawText = (data.translatedText || "").replace(/[\*"'“”`]/g, '');
        options = cleanTranslationOptions(rawText.split('|').map((s: string) => s.trim()).filter(Boolean));
      } catch (apiError) {
        console.warn("Fallo el backend local o desarrollo local detectado, intentando conexión directa a Hugging Face...");
        const token = import.meta.env.VITE_HF_TRANSLATION_TOKEN || import.meta.env.VITE_HF_TOKEN;
        const hfModel = import.meta.env.VITE_HF_TRANSLATION_MODEL || "Qwen/Qwen2.5-72B-Instruct";
        
        if (!token) {
          alert("⚠️ Falta configurar el token VITE_HF_TRANSLATION_TOKEN en tu archivo .env.local (recuerda reiniciar el servidor).");
          throw new Error("Token no configurado");
        }

        let hfRes;
        try {
          hfRes = await fetch("https://router.huggingface.co/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ 
              model: hfModel,
              messages: [
                { role: "system", content: "You are an expert Colombian Sign Language (LSC) to natural written Spanish translator. Translate CSL glosses into natural, grammatically correct written SPANISH. Provide EXACTLY THREE (3) options in Spanish only (no English vocabulary). Separate each option strictly with '|'. Do NOT use numbers, prefixes, introductory sentences, notes, or conversational text. Output ONLY the three translations separated by '|'." },
                { role: "user", content: text }
              ],
              temperature: 0.3,
              max_tokens: 60
            })
          });

          // Si falla y el modelo no es el por defecto, intentar con el modelo warm de respaldo
          if (!hfRes.ok && hfModel !== "meta-llama/Meta-Llama-3-8B-Instruct") {
            console.warn("Fallo con el modelo principal de traducción sorda, reintentando con Llama 3-8B...");
            hfRes = await fetch("https://router.huggingface.co/v1/chat/completions", {
              method: "POST",
              headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify({ 
                model: "meta-llama/Meta-Llama-3-8B-Instruct",
                messages: [
                  { role: "system", content: "You are an expert Colombian Sign Language (LSC) to natural written Spanish translator. Translate CSL glosses into natural, grammatically correct written SPANISH. Provide EXACTLY THREE (3) options in Spanish only (no English vocabulary). Separate each option strictly with '|'. Do NOT use numbers, prefixes, introductory sentences, notes, or conversational text. Output ONLY the three translations separated by '|'." },
                  { role: "user", content: text }
                ],
                temperature: 0.3,
                max_tokens: 60
              })
            });
          }
        } catch (networkError) {
          alert("❌ Error de red: No se pudo conectar con Hugging Face. Revisa tu conexión a internet o tu configuración de DNS.");
          throw networkError;
        }

        if (!hfRes.ok) {
          const err = await hfRes.text();
          if (hfRes.status === 503) {
            alert("⏳ La Inteligencia Artificial se está despertando. Por favor, intenta de nuevo en 10 segundos.");
          } else {
            alert(`❌ Error de Hugging Face (${hfRes.status}). Revisa la consola (F12).`);
            console.error("Hugging Face API Error:", err);
          }
          throw new Error(`HF API status: ${hfRes.status}`);
        }

        const hfData = await hfRes.json();
        if (hfData.choices?.[0]?.message?.content) {
          const generated = hfData.choices[0].message.content.trim().replace(/^"|"$/g, '').replace(/[\*"'“”`]/g, '');
          options = cleanTranslationOptions(generated.split('|').map((s: string) => s.trim()).filter(Boolean));
        }
      }

      const uniqueOptions = Array.from(new Set(options));
      if (uniqueOptions.length > 0) {
        setSuggestions(uniqueOptions);
        setSelectedSuggestionIdx(0);
      } else {
        const localFallback = translateLSCtoSpanish(text);
        setSuggestions([localFallback]);
        setSelectedSuggestionIdx(0);
      }
    } catch (error) {
      console.error(error);
      const localFallback = translateLSCtoSpanish(text);
      setSuggestions([localFallback]);
      setSelectedSuggestionIdx(0);
    } finally {
      setIsTranslating(false);
    }
  };

  const normalizeWord = (word: string) =>
    word
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/gi, '')
      .toLowerCase();

  const cleanRepeatedWords = (text: string) => {
    const words = text.split(/\s+/).filter(Boolean);
    const result: string[] = [];
    for (const word of words) {
      const prev = result[result.length - 1];
      if (prev && normalizeWord(prev) === normalizeWord(word)) continue;
      result.push(word);
    }
    return result.join(' ').replace(/\s+([,.;!?])/g, '$1').trim();
  };

  const SpeechRecognition = typeof window !== 'undefined' ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null;
  const recognitionRef = useRef<any>(null);
  const textBeforeDictationRef = useRef<string>('');

  useEffect(() => {
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-CO';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        const baseText = textBeforeDictationRef.current.trim();
        const dictationText = (finalTranscript + ' ' + interimTranscript).replace(/\s+/g, ' ').trim();
        setTranslatorInput(baseText ? `${baseText} ${dictationText}` : dictationText);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        textBeforeDictationRef.current = translatorInput;
        try {
          recognitionRef.current.start();
          setIsRecording(true);
        } catch (e) {
          console.error(e);
        }
      } else {
        alert("Tu navegador no soporta el reconocimiento de voz.");
      }
    }
  };

  const handleTranslate = async () => {
    const inputText = translatorInput.trim();
    if (!inputText) return;
    
    if (userRole === 'hearing') {
      processHearingTranslation(inputText);
    } else {
      processDeafTranslation(inputText);
    }
  };

  const playAudio = () => {
    const textToPlay = selectedSuggestion || translatorInput;
    if (!textToPlay) return;
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    const utterance = new SpeechSynthesisUtterance(textToPlay);
    utterance.lang = 'es-CO';
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="h-full flex flex-col bg-[var(--color-neutral-50)] relative overflow-hidden">
      <InstructionOverlay 
        show={showInstructions}
        onClose={() => setShowInstructions(false)}
        onToggle={() => setShowInstructions(prev => !prev)}
        title="Guía del Traductor LSC"
        subtitle="Usa esta herramienta para facilitar la comunicación entre personas sordas y oyentes:"
        instructions={[
          { 
            icon: "👂", 
            text: "Modo Oyente: Escribe en español para obtener la traducción a glosas LSC y ver videos de referencia." 
          },
          { 
            icon: "🤟", 
            text: "Modo Sordo: Escribe conceptos o glosas para obtener sugerencias gramaticales en español con IA." 
          },
          { 
            icon: "🔊", 
            text: "Reproducción: Usa el botón de audio para convertir el texto seleccionado en voz." 
          }
        ]}
        showAvatar={false}
      />

      <div className="flex-shrink-0 p-4 md:p-6 bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[var(--color-primary-100)] p-2.5 rounded-xl text-[var(--color-primary-600)]">
              <Languages size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-800">Traductor LSC a Español</h1>
              <p className="text-xs text-neutral-500 font-medium">Comunicación accesible para todos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-4 md:space-y-6">
          
          {/* Selección de Rol */}
          {!userRole ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-10">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                onClick={() => setUserRole('hearing')}
                className="bg-white p-8 rounded-[2.5rem] shadow-xl cursor-pointer border-2 border-transparent hover:border-[var(--color-primary-400)] text-center group"
              >
                <div className="w-16 h-16 bg-blue-50 text-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <User size={32} />
                </div>
                <h3 className="text-xl font-black mb-2">Soy Persona Oyente</h3>
                <p className="text-xs text-neutral-500">Escribe en español para ver la seña LSC.</p>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.02 }}
                onClick={() => setUserRole('deaf')}
                className="bg-white p-8 rounded-[2.5rem] shadow-xl cursor-pointer border-2 border-transparent hover:border-[var(--color-accent-400)] text-center group"
              >
                <div className="w-16 h-16 bg-orange-50 text-orange-700 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Hand size={32} />
                </div>
                <h3 className="text-xl font-black mb-2">Soy Persona Sorda</h3>
                <p className="text-xs text-neutral-500">Escribe tus señas para obtener sugerencias IA.</p>
              </motion.div>
            </div>
          ) : (
            <>
            <Button variant="ghost" size="sm" onClick={() => { setUserRole(null); setTranslatorInput(''); setResultLSC(''); setSuggestions([]); setSelectedSuggestionIdx(null); }} className="mb-2 text-neutral-700">
              ← Cambiar de perfil
            </Button>

            <Card className="border-none shadow-lg bg-white overflow-hidden">
              <CardBody className="p-5 md:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 gap-4 sm:gap-0">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                  {userRole === 'hearing' ? 'Escribe tu mensaje en Español' : 'Escribe las Señas (sin conectores)'}
                </label>
                {userRole === 'hearing' && (
                   <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={toggleRecording}
                      className={`p-2.5 rounded-xl transition-all flex items-center justify-center gap-2 px-4 flex-1 sm:flex-none ${isRecording ? 'bg-red-500 text-white shadow-md shadow-red-200 animate-pulse' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                    >
                      {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                      <span className="font-bold text-sm">{isRecording ? 'Detener' : 'Dictar'}</span>
                    </button>
                  </div>
                )}
              </div>
              
              <div className="relative">
                <textarea
                  value={translatorInput}
                  onChange={(e) => setTranslatorInput(e.target.value)}
                  placeholder={userRole === 'hearing' 
                    ? "Ej: Hola, voy a comprar colores para la clase..." 
                    : "Ej: yo ir universidad mañana..."}
                  className="w-full h-32 md:h-40 p-5 bg-neutral-50 border-2 rounded-2xl focus:bg-white focus:border-[var(--color-primary-400)] outline-none resize-none text-lg md:text-xl transition-colors border-neutral-100 text-neutral-800 leading-relaxed placeholder:text-neutral-300"
                />
              </div>

              <div className="mt-4 md:mt-6">
                <Button 
                  onClick={handleTranslate} 
                  className="w-full py-4 md:py-5 text-base md:text-lg font-bold shadow-lg" 
                  disabled={!translatorInput || isTranslating}
                >
                  <Send size={20} className="mr-2" /> {isTranslating ? 'Procesando...' : 'Traducir'}
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* RESULTADO OYENTE -> LSC */}
          <AnimatePresence>
            {userRole === 'hearing' && resultLSC && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="bg-blue-700 p-6 rounded-[2rem] text-white shadow-xl">
                  <p className="text-[10px] font-black uppercase text-blue-100 mb-2">Estructura LSC (Glosas)</p>
                  <p className="text-2xl font-black italic tracking-tighter">{resultLSC}</p>
                </div>

                {matchedSigns.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {matchedSigns.map(sign => (
                      <div key={sign.name} className="bg-white rounded-[2rem] overflow-hidden shadow-lg border border-neutral-100">
                        <div className="relative aspect-video bg-black">
                          <video src={resolveVideoUrl(sign.videoUrl)} autoPlay loop muted playsInline className="w-full h-full object-contain" />
                          <button
                            onClick={handleVideoFullscreen}
                            className="absolute bottom-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition-all active:scale-90 border border-white/10"
                            aria-label="Ver video en pantalla completa"
                            title="Pantalla completa"
                          >
                            <Maximize size={14} />
                          </button>
                        </div>
                        <div className="p-3 text-center">
                          <p className="text-xs font-black uppercase text-neutral-800">{sign.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* RESULTADO SORDO -> SUGERENCIAS IA */}
          <AnimatePresence>
            {userRole === 'deaf' && suggestions.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Escoge la mejor opción</label>
                  <Badge variant="accent" className="text-neutral-900">IA Generativa</Badge>
                </div>
                
                <div className="space-y-3">
                  {suggestions.map((opt, idx) => (
                    <motion.div
                      key={idx}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedSuggestionIdx(idx)}
                      className={`p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all flex items-center justify-between gap-4 ${selectedSuggestionIdx === idx ? 'border-orange-500 bg-orange-50 shadow-md' : 'border-white bg-white hover:border-neutral-200 shadow-sm'}`}
                    >
                      <p className={`text-base font-bold flex-1 text-left ${selectedSuggestionIdx === idx ? 'text-orange-900' : 'text-neutral-700'}`}>{opt}</p>
                      {selectedSuggestionIdx === idx && (
                        <div className="flex items-center gap-3 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playAudio(opt);
                            }}
                            className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${isPlaying ? 'bg-orange-500 text-white animate-pulse' : 'bg-orange-100 text-orange-600 hover:bg-orange-200'}`}
                            title="Reproducir Audio"
                          >
                            <Volume2 size={18} />
                          </button>
                          <CheckCircle2 className="text-orange-500 shrink-0" size={20} />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
