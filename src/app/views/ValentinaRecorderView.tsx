import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardBody } from '../components/lsc/Card';
import { Button } from '../components/lsc/Button';
import { Badge } from '../components/lsc/Badge';
import { 
  Video, Camera, Play, CheckCircle2, AlertCircle, RefreshCw, UploadCloud, 
  ChevronLeft, ChevronRight, Search, Sparkles, Eye, Download, ShieldCheck, Heart, Hand, Sliders, Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LSC_VOCABULARY } from '../../lib/lscData';
import { handDetectionService } from '../../services/handDetectionService';
import { Results } from '@mediapipe/holistic';

interface VocabularyItem {
  label: string;
  category: string;
  originalUrl: string;
}

interface ValentinaRecorderViewProps {
  onNavigateHome?: () => void;
}

type BgFilterMode = 'none' | 'chroma_green' | 'chroma_blue' | 'segmentation';

const STORAGE_KEY_PROGRESS = 'valentina_recordings_progress';
const STORAGE_KEY_APPROVED = 'valentina_approved_videos';

export function ValentinaRecorderView({ onNavigateHome }: ValentinaRecorderViewProps = {}) {
  const [activeTab, setActiveTab] = useState<'record' | 'review'>('record');
  
  // Flatten vocabulary items
  const allVocabItems = useRef<VocabularyItem[]>([]);
  if (allVocabItems.current.length === 0) {
    const items: VocabularyItem[] = [];
    Object.entries(LSC_VOCABULARY).forEach(([cat, signs]) => {
      signs.forEach(s => {
        items.push({
          label: s.label,
          category: cat,
          originalUrl: s.url
        });
      });
    });
    allVocabItems.current = items;
  }

  // Selected State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Auto vs Manual Mode
  const [recordMode, setRecordMode] = useState<'auto' | 'manual'>('auto');

  // Background Filter State: 'none' | 'chroma_green' | 'chroma_blue' | 'segmentation'
  const [bgFilter, setBgFilter] = useState<BgFilterMode>('none');
  const [chromaSensitivity, setChromaSensitivity] = useState<number>(40);

  // Status map stored in localStorage
  const [progressMap, setProgressMap] = useState<Record<string, { status: 'recorded' | 'uploaded'; base64?: string; hfUrl?: string; timestamp?: string; duration?: number }>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROGRESS);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Approved map for platform override
  const [approvedMap, setApprovedMap] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_APPROVED);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Camera & Recording states
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isHandsDetected, setIsHandsDetected] = useState(false);
  const [recordingSecondsLeft, setRecordingSecondsLeft] = useState<number>(6);
  const [recordedDuration, setRecordedDuration] = useState<number>(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedBase64, setRecordedBase64] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('Enciende la cámara para comenzar');

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const animFrameRef = useRef<number>(0);
  
  // Hand detection logic refs
  const isRecordingRef = useRef(false);
  const isHandsDetectedRef = useRef(false);
  const noHandsCounterRef = useRef(0);
  const recordingStartTimeRef = useRef<number>(0);

  // Sync refs with state
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Ensure camera stream is assigned to video element immediately
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.warn("Error reproduciendo stream en video element:", e));
    }
  }, [stream]);

  // Filtered vocabulary items
  const filteredVocab = allVocabItems.current.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.label.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const currentItem = filteredVocab[currentIndex] || filteredVocab[0] || allVocabItems.current[0];

  // Save progress to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progressMap));
    } catch (e) {
      console.error("Error al guardar progreso en localStorage:", e);
    }
  }, [progressMap]);

  // Save approved map to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_APPROVED, JSON.stringify(approvedMap));
      window.dispatchEvent(new Event('valentina_videos_updated'));
    } catch (e) {
      console.error("Error al guardar aprobados en localStorage:", e);
    }
  }, [approvedMap]);

  // Render video frame on canvas + background filter + hand landmarks
  const renderCanvasFrame = useCallback((results?: Results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video || video.readyState < 2 || video.videoWidth === 0) return;

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.save();
    
    // Mirror horizontal for natural webcam view
    ctx.translate(w, 0);
    ctx.scale(-1, 1);

    if (bgFilter === 'none') {
      ctx.drawImage(video, 0, 0, w, h);
    } else if (bgFilter === 'segmentation') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);

      if (results?.segmentationMask) {
        ctx.drawImage(results.segmentationMask, 0, 0, w, h);
        ctx.globalCompositeOperation = 'source-in';
        ctx.drawImage(video, 0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.drawImage(video, 0, 0, w, h);
      }
    } else if (bgFilter === 'chroma_green' || bgFilter === 'chroma_blue') {
      ctx.drawImage(video, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      const sensFactor = (100 - chromaSensitivity) / 100;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        let isKeyColor = false;
        if (bgFilter === 'chroma_green') {
          isKeyColor = (g > 45 && g > r * (1.05 + sensFactor * 0.25) && g > b * (1.05 + sensFactor * 0.25));
        } else if (bgFilter === 'chroma_blue') {
          isKeyColor = (b > 45 && b > r * (1.05 + sensFactor * 0.25) && b > g * (1.05 + sensFactor * 0.25));
        }

        if (isKeyColor) {
          data[i] = 255;     // R -> White
          data[i + 1] = 255; // G -> White
          data[i + 2] = 255; // B -> White
        }
      }
      ctx.putImageData(imgData, 0, 0);
    } else {
      ctx.drawImage(video, 0, 0, w, h);
    }

    // Draw hand landmarks (mirrored coordinates)
    if (results) {
      if (results.leftHandLandmarks) {
        ctx.fillStyle = '#a855f7';
        for (const p of results.leftHandLandmarks) {
          ctx.beginPath();
          ctx.arc(p.x * w, p.y * h, 5, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
      if (results.rightHandLandmarks) {
        ctx.fillStyle = '#a855f7';
        for (const p of results.rightHandLandmarks) {
          ctx.beginPath();
          ctx.arc(p.x * w, p.y * h, 5, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }, [bgFilter, chromaSensitivity]);

  // Handle MediaPipe Results callback
  const handleMediaPipeResults = useCallback((results: Results) => {
    renderCanvasFrame(results);

    const hasLeft = !!results.leftHandLandmarks && results.leftHandLandmarks.length > 0;
    const hasRight = !!results.rightHandLandmarks && results.rightHandLandmarks.length > 0;
    const handsInFrame = hasLeft || hasRight;

    setIsHandsDetected(handsInFrame);
    isHandsDetectedRef.current = handsInFrame;

    // AUTO RECORDING LOGIC
    if (recordMode === 'auto') {
      if (handsInFrame) {
        noHandsCounterRef.current = 0;
        
        // If not recording, automatically start recording!
        if (!isRecordingRef.current && !previewUrl && !recordedBase64) {
          triggerAutoStartRecording();
        }
      } else {
        // Hands leave the frame
        if (isRecordingRef.current) {
          noHandsCounterRef.current += 1;
          // After ~15 consecutive frames without hands (~0.5s), stop recording!
          if (noHandsCounterRef.current > 15) {
            triggerAutoStopRecording();
          }
        }
      }
    }
  }, [renderCanvasFrame, recordMode, previewUrl, recordedBase64]);

  // MediaPipe frame loop
  useEffect(() => {
    let isRunning = true;

    const runDetectionLoop = async () => {
      if (!isRunning) return;
      if (stream && videoRef.current && videoRef.current.readyState >= 2) {
        try {
          if (!handDetectionService.initialized) {
            await handDetectionService.initialize();
          }
          handDetectionService.onResults(handleMediaPipeResults);
          await handDetectionService.detectHands(videoRef.current);
        } catch (e) {
          renderCanvasFrame();
        }
      } else if (stream && videoRef.current) {
        renderCanvasFrame();
      }

      if (isRunning) {
        animFrameRef.current = requestAnimationFrame(runDetectionLoop);
      }
    };

    if (stream) {
      runDetectionLoop();
    }

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [stream, handleMediaPipeResults, renderCanvasFrame]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } 
      });
      setStream(s);

      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.play().catch(e => console.warn(e));
      }

      setStatusMessage(
        recordMode === 'auto' 
          ? '🖐️ Detección activa: Levanta las manos al encuadre para empezar a grabar.' 
          : 'Presiona "Iniciar Grabación" cuando estés lista.'
      );
    } catch (err) {
      alert("No se pudo acceder a la cámara. Por favor verifica los permisos.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
  };

  const triggerAutoStartRecording = () => {
    if (!stream || isRecordingRef.current) return;
    executeRecording();
  };

  const triggerAutoStopRecording = () => {
    if (isRecordingRef.current) {
      stopRecording();
    }
  };

  const executeRecording = () => {
    if (!stream && !canvasRef.current) return;
    chunksRef.current = [];

    let mimeType = 'video/webm';
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      mimeType = 'video/webm;codecs=vp9';
    } else if (MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/mp4';
    }

    // Capture stream from Canvas to preserve white background / chroma filter
    let recordStream: MediaStream = stream!;
    if (canvasRef.current) {
      try {
        recordStream = (canvasRef.current as any).captureStream(30);
      } catch (e) {
        recordStream = stream!;
      }
    }

    const mediaRecorder = new MediaRecorder(recordStream, { mimeType });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recordingStartTimeRef.current = Date.now();

    mediaRecorder.onstop = async () => {
      const durationMs = Date.now() - recordingStartTimeRef.current;
      const durationSec = Math.min(6.0, Math.max(0.5, parseFloat((durationMs / 1000).toFixed(1))));
      setRecordedDuration(durationSec);

      const blob = new Blob(chunksRef.current, { type: mimeType });
      setRecordedBlob(blob);

      // Instant preview URL using ObjectURL
      const objUrl = URL.createObjectURL(blob);
      setPreviewUrl(objUrl);

      // Convert to base64 for upload
      const reader = new FileReader();
      reader.onloadend = () => {
        const b64 = reader.result as string;
        setRecordedBase64(b64);
        if (currentItem) {
          setProgressMap(prev => ({
            ...prev,
            [currentItem.label]: {
              status: 'recorded',
              base64: b64,
              duration: durationSec,
              timestamp: new Date().toISOString()
            }
          }));
        }
      };
      reader.readAsDataURL(blob);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(100);
    setIsRecording(true);
    isRecordingRef.current = true;
    setRecordingSecondsLeft(6);
    setStatusMessage('🔴 GRABANDO SEÑA... Baja las manos cuando termines.');

    // Countdown 6s down to 0s max limit
    let secondsLeft = 6;
    recordingTimerRef.current = setInterval(() => {
      secondsLeft -= 1;
      setRecordingSecondsLeft(secondsLeft);
      if (secondsLeft <= 0) {
        stopRecording();
      }
    }, 1000);
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    isRecordingRef.current = false;
    setStatusMessage('✅ Grabación finalizada. Previsualiza y sube a Hugging Face.');
  };

  const retakeRecording = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setRecordedBlob(null);
    setRecordedBase64(null);
    setUploadSuccess(false);
    noHandsCounterRef.current = 0;
    setStatusMessage(
      recordMode === 'auto' 
        ? '🖐️ Detección activa: Levanta las manos al encuadre para empezar a grabar.' 
        : 'Presiona "Iniciar Grabación" cuando estés lista.'
    );
  };

  const handleUploadToHuggingFace = async () => {
    const b64 = recordedBase64 || progressMap[currentItem?.label]?.base64;
    if (!currentItem || !b64) {
      alert("No hay video grabado para esta seña.");
      return;
    }

    setIsUploading(true);
    const token = import.meta.env.VITE_HF_SUGGESTIONS_TOKEN || import.meta.env.VITE_HF_TRANSLATION_TOKEN || import.meta.env.VITE_HF_TOKEN;
    const repoId = import.meta.env.VITE_HF_SUGGESTIONS_REPO || 'manosabiertas/Manos-Abiertas-LSC';

    try {
      const response = await fetch('/api/valentina-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: currentItem.label,
          category: currentItem.category,
          videoBase64: b64,
          fileName: `${currentItem.label.toUpperCase()}.webm`
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.simulated) {
          throw new Error('BACKEND_SIMULATED');
        }
        setUploadSuccess(true);
      } else {
        throw new Error('BACKEND_FAILED');
      }
    } catch (err) {
      console.warn("Intentando subida directa a Hugging Face desde el cliente...");
      if (!token) {
        alert("⚠️ No se encontró token de Hugging Face. El progreso quedó guardado localmente.");
        setUploadSuccess(true);
        setIsUploading(false);
        return;
      }

      const cleanCat = currentItem.category.toLowerCase().replace(/\s+/g, '_');
      const cleanWord = currentItem.label.toUpperCase().replace(/\s+/g, '_');
      const folderPath = `grabaciones_valentina/${cleanCat}/${cleanWord}`;

      const operations = [
        {
          key: 'header',
          value: {
            summary: `Grabación Valentina Mora: ${currentItem.label} (${currentItem.category})`,
            description: `Seña para ${currentItem.label} grabada por Valentina Mora.`
          }
        },
        {
          key: 'file',
          value: {
            path: `${folderPath}/metadata.json`,
            content: JSON.stringify({
              word: currentItem.label,
              category: currentItem.category,
              recordedBy: 'Valentina Mora',
              duration: recordedDuration,
              recordedAt: new Date().toISOString(),
              videoBase64: b64
            }, null, 2)
          }
        }
      ];

      try {
        const hfRes = await fetch(`https://huggingface.co/api/models/${repoId}/commit/main?create_pr=1`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/x-ndjson',
          },
          body: operations.map(x => JSON.stringify(x)).join('\n'),
        });

        if (hfRes.ok) {
          setUploadSuccess(true);
          const computedUrl = `https://huggingface.co/${repoId}/raw/main/${folderPath}/metadata.json`;
          
          setProgressMap(prev => ({
            ...prev,
            [currentItem.label]: {
              status: 'uploaded',
              base64: b64,
              hfUrl: computedUrl,
              duration: recordedDuration,
              timestamp: new Date().toISOString()
            }
          }));
        } else {
          const errTxt = await hfRes.text();
          console.error(errTxt);
          alert(`❌ Error subiendo a Hugging Face (${hfRes.status}).`);
        }
      } catch (clientErr) {
        console.error(clientErr);
        alert("❌ Error de red al conectar con Hugging Face.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleNextWord = () => {
    if (currentIndex < filteredVocab.length - 1) {
      setCurrentIndex(currentIndex + 1);
      retakeRecording();
    }
  };

  const handlePrevWord = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      retakeRecording();
    }
  };

  const toggleApproveVideo = (wordLabel: string, videoUrl: string) => {
    setApprovedMap(prev => {
      const next = { ...prev };
      if (next[wordLabel]) {
        delete next[wordLabel];
      } else {
        next[wordLabel] = videoUrl;
      }
      return next;
    });
  };

  const categories = [
    { id: 'all', label: 'Todas' },
    { id: 'Abecedario', label: 'Abecedario' },
    { id: 'Colores', label: 'Colores' },
    { id: 'Saludos', label: 'Saludos' },
    { id: 'Oficina', label: 'Oficina' },
    { id: 'Diseño', label: 'Diseño' },
  ];

  // Stats calculation
  const totalCount = allVocabItems.current.length;
  const recordedCount = Object.values(progressMap).filter(v => v.status === 'recorded' || v.status === 'uploaded').length;
  const uploadedCount = Object.values(progressMap).filter(v => v.status === 'uploaded').length;
  const progressPercent = Math.round((recordedCount / (totalCount || 1)) * 100);

  const hasCurrentRecording = !!(previewUrl || recordedBase64 || progressMap[currentItem?.label]?.base64);

  return (
    <div className="min-h-[calc(100vh-8rem)] md:min-h-[calc(100vh-5rem)] pb-20 md:pb-0 flex flex-col bg-slate-900 text-slate-100">
      
      {/* Header Superior Principal */}
      <div className="flex-shrink-0 p-4 sm:p-6 bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-3 rounded-2xl text-white shadow-lg shadow-purple-500/20">
              <Heart size={28} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white">Estudio de Grabación - Valentina Mora</h1>
                <Badge variant="accent">Señas LSC</Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                Detección inteligente de manos & Filtro de Fondo Blanco (Croma Key / IA).
              </p>
            </div>
          </div>

          {/* Selector de Pestañas */}
          <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-700">
            <button
              onClick={() => setActiveTab('record')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'record' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video size={18} />
              Grabación
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'review' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck size={18} />
              Revisión & Aplicar ({Object.keys(approvedMap).length})
            </button>
          </div>
        </div>

        {/* Tarjeta de Progreso General */}
        <div className="max-w-7xl mx-auto mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-700/50">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Total Vocabulario</span>
            <p className="text-xl font-bold text-white mt-0.5">{totalCount} señas</p>
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Grabadas</span>
            <p className="text-xl font-bold text-yellow-400 mt-0.5">{recordedCount} señas</p>
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Subidas a Hugging Face</span>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">{uploadedCount} señas</p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Progreso</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-slate-700 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-emerald-400 h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-bold text-white">{progressPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {activeTab === 'record' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Columna Izquierda: Lista de Vocabulario y Filtros */}
            <div className="lg:col-span-4 bg-slate-800 rounded-3xl p-4 border border-slate-700 flex flex-col h-[620px]">
              <div className="mb-3 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input 
                    type="text"
                    placeholder="Buscar seña o palabra..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentIndex(0); }}
                    className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => { setSelectedCategory(cat.id); setCurrentIndex(0); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                        selectedCategory === cat.id 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista Desplazable de Palabras */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {filteredVocab.map((item, idx) => {
                  const statusInfo = progressMap[item.label];
                  const isSelected = idx === currentIndex;
                  
                  return (
                    <button
                      key={item.label}
                      onClick={() => { setCurrentIndex(idx); retakeRecording(); }}
                      className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-all ${
                        isSelected 
                          ? 'bg-purple-600/30 border-2 border-purple-500 text-white shadow-md' 
                          : 'bg-slate-900/50 hover:bg-slate-900 text-slate-300 border border-transparent'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-sm tracking-wide">{item.label}</p>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">{item.category}</span>
                      </div>
                      
                      {statusInfo?.status === 'uploaded' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 size={12} /> HF Subido
                        </span>
                      ) : statusInfo?.status === 'recorded' ? (
                        <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-[10px] font-bold border border-yellow-500/30 flex items-center gap-1">
                          <Video size={12} /> {statusInfo.duration ? `${statusInfo.duration}s` : 'Grabado'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 text-[10px] font-bold border border-slate-700">
                          Pendiente
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Columna Derecha: Grabador de Video & Viewport con Filtros */}
            <div className="lg:col-span-8 bg-slate-800 rounded-3xl p-6 border border-slate-700 flex flex-col justify-between min-h-[620px]">
              
              {/* Header de la Seña Actual y Controles de Navegación */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div>
                  <span className="text-xs text-purple-400 font-bold uppercase tracking-widest">{currentItem?.category}</span>
                  <h2 className="text-3xl font-extrabold text-white mt-0.5 tracking-wider">{currentItem?.label}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    onClick={handlePrevWord} 
                    disabled={currentIndex === 0}
                    variant="outline" 
                    className="bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-700 px-3 py-2 text-sm"
                  >
                    <ChevronLeft size={18} /> Anterior
                  </Button>

                  <span className="text-xs font-bold text-slate-400 px-2">
                    {currentIndex + 1} / {filteredVocab.length}
                  </span>

                  <Button 
                    onClick={handleNextWord} 
                    disabled={currentIndex === filteredVocab.length - 1}
                    variant="outline" 
                    className="bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-700 px-3 py-2 text-sm"
                  >
                    Siguiente <ChevronRight size={18} />
                  </Button>
                </div>
              </div>

              {/* Panel de Controles: Modo y Filtro de Fondo Blanco / Croma */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-900/80 p-3 rounded-2xl my-2 border border-slate-700">
                {/* Selector de Modo */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Hand size={16} className="text-purple-400" /> Detección:
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setRecordMode('auto')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                        recordMode === 'auto' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      🖐️ Auto
                    </button>
                    <button
                      onClick={() => setRecordMode('manual')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                        recordMode === 'manual' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      👆 Botón
                    </button>
                  </div>
                </div>

                {/* Selector de Filtro de Fondo Blanco */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Palette size={16} className="text-emerald-400" /> Fondo Blanco:
                  </span>
                  <select
                    value={bgFilter}
                    onChange={(e) => setBgFilter(e.target.value as BgFilterMode)}
                    className="bg-slate-800 text-white text-xs font-bold px-2.5 py-1 rounded-xl border border-slate-700 focus:outline-none focus:border-purple-500"
                  >
                    <option value="none">📷 Original (Sin Filtro)</option>
                    <option value="chroma_green">🟩 Croma Verde → Blanco</option>
                    <option value="chroma_blue">🟦 Croma Azul → Blanco</option>
                    <option value="segmentation">🤖 Silueta IA → Blanco</option>
                  </select>
                </div>
              </div>

              {/* Ajuste de Sensibilidad Croma Key cuando está activo */}
              {(bgFilter === 'chroma_green' || bgFilter === 'chroma_blue') && (
                <div className="flex items-center gap-3 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-700/60 mb-2">
                  <span className="text-[11px] font-bold text-slate-300">Sensibilidad Croma:</span>
                  <input 
                    type="range" 
                    min="10" 
                    max="80" 
                    value={chromaSensitivity} 
                    onChange={(e) => setChromaSensitivity(Number(e.target.value))}
                    className="flex-1 accent-purple-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                  />
                  <span className="text-[11px] font-mono font-bold text-purple-400">{chromaSensitivity}%</span>
                </div>
              )}

              {/* Mensaje de Estado / Guía */}
              <div className="bg-purple-950/40 border border-purple-500/30 text-purple-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-between mb-2">
                <span>{statusMessage}</span>
                {isHandsDetected && stream && !hasCurrentRecording && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 animate-pulse">
                    ✓ Manos en encuadre
                  </span>
                )}
              </div>

              {/* AREA DEL VIEWPORT (CÁMARA Y CANVAS EN TIEMPO REAL / PREVIEW) */}
              <div className="relative flex-1 bg-black rounded-3xl overflow-hidden border-2 border-slate-700 flex items-center justify-center min-h-[340px]">
                
                {/* Elemento Video Oculto fuera de pantalla para mantener la decodificación de la webcam a 30fps */}
                <video 
                  ref={videoRef}
                  autoPlay 
                  muted 
                  playsInline 
                  style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0.001, pointerEvents: 'none', top: '-9999px', left: '-9999px' }}
                />

                {/* Indicador superior durante la grabación */}
                {isRecording && (
                  <div className="absolute top-0 left-0 right-0 z-30 p-4 bg-gradient-to-b from-black/80 to-transparent">
                    <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                      <span className="flex items-center gap-2 text-red-400 animate-pulse">
                        <span className="w-3 h-3 rounded-full bg-red-500" /> GRABANDO SEÑA...
                      </span>
                      <span className="text-xs font-mono bg-red-600/80 px-3 py-0.5 rounded-full">
                        {recordingSecondsLeft}.0s restante (máx 6s)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
                      <div 
                        className="bg-red-500 h-full transition-all duration-1000 ease-linear"
                        style={{ width: `${(recordingSecondsLeft / 6) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* PREVISUALIZACIÓN DEL VIDEO GRABADO (REPETIR O ACEPTAR/SUBIR) */}
                {hasCurrentRecording ? (
                  <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950 p-2 rounded-2xl z-20">
                    <video 
                      src={previewUrl || recordedBase64 || progressMap[currentItem?.label]?.base64 || ''} 
                      autoPlay 
                      loop 
                      controls 
                      playsInline
                      className="max-h-[320px] w-full rounded-2xl object-contain bg-black border border-slate-700 shadow-2xl" 
                    />
                    <div className="mt-2 flex items-center justify-between w-full px-3">
                      <span className="text-emerald-400 text-xs font-bold flex items-center gap-1 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
                        <CheckCircle2 size={14} /> Duración de seña: {recordedDuration || progressMap[currentItem?.label]?.duration || '2.5'}s
                      </span>
                      <span className="text-slate-400 text-xs font-medium hidden sm:inline">
                        Previsualiza tu video antes de subirlo
                      </span>
                    </div>
                  </div>
                ) : stream ? (
                  <div className="relative w-full h-full flex items-center justify-center bg-black">
                    {/* Canvas principal que renderiza la cámara en tiempo real + Filtro Croma/Fondo Blanco */}
                    <canvas 
                      ref={canvasRef}
                      className="w-full h-full object-contain max-h-[340px]"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                    <Camera size={64} className="mb-4 text-purple-400 opacity-80" />
                    <p className="text-lg font-bold text-white mb-2">Cámara Apagada</p>
                    <p className="text-xs text-slate-400 max-w-sm mb-6">
                      Haz clic abajo para encender la cámara y visualizar la seña <strong className="text-purple-300">{currentItem?.label}</strong> en tiempo real con fondo blanco opcional.
                    </p>
                    <Button onClick={startCamera} className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3 rounded-2xl shadow-lg">
                      <Camera size={20} className="mr-2" /> Activar Cámara
                    </Button>
                  </div>
                )}
              </div>

              {/* Botones de Control de Grabación / Previsualización */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-700">
                {hasCurrentRecording ? (
                  <div className="w-full flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={retakeRecording} 
                      variant="outline" 
                      className="flex-1 bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700 font-bold py-3 rounded-2xl flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={18} /> Volver a Grabar (Repetir)
                    </Button>

                    <Button 
                      onClick={handleUploadToHuggingFace} 
                      disabled={isUploading || uploadSuccess}
                      className={`flex-1 font-bold py-3 rounded-2xl text-white shadow-lg flex items-center justify-center gap-2 transition-all ${
                        uploadSuccess 
                          ? 'bg-emerald-600 hover:bg-emerald-500' 
                          : 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/30'
                      }`}
                    >
                      {isUploading ? (
                        <>Subiendo a Hugging Face...</>
                      ) : uploadSuccess ? (
                        <><CheckCircle2 size={20} /> ¡Subido con Éxito!</>
                      ) : (
                        <><UploadCloud size={20} /> Subir a Hugging Face</>
                      )}
                    </Button>
                  </div>
                ) : isRecording ? (
                  <Button 
                    onClick={stopRecording} 
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-2xl shadow-lg animate-pulse"
                  >
                    ⏹️ Detener Grabación (O baja las manos)
                  </Button>
                ) : stream && recordMode === 'manual' ? (
                  <div className="w-full flex gap-3">
                    <Button 
                      onClick={stopCamera} 
                      variant="outline" 
                      className="bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-700 font-bold"
                    >
                      Apagar Cámara
                    </Button>
                    <Button 
                      onClick={executeRecording} 
                      className="flex-1 bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500 text-white font-bold py-3 rounded-2xl shadow-lg"
                    >
                      <Video size={20} className="mr-2" /> Iniciar Grabación Manual
                    </Button>
                  </div>
                ) : stream && recordMode === 'auto' ? (
                  <div className="w-full flex items-center justify-between text-xs text-slate-400 font-bold bg-slate-900/60 p-3 rounded-2xl border border-slate-700">
                    <span className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${isHandsDetected ? 'bg-emerald-500 animate-ping' : 'bg-yellow-500'}`} />
                      {isHandsDetected ? 'Manos detectadas: ¡Grabación iniciándose!' : 'Esperando a que subas las manos al encuadre...'}
                    </span>
                    <Button onClick={stopCamera} variant="outline" className="text-slate-400 hover:text-white px-3 py-1 text-xs">
                      Apagar Cámara
                    </Button>
                  </div>
                ) : null}
              </div>

            </div>
          </div>
        ) : (
          /* Pestaña de Revisión & Aplicar a la Plataforma */
          <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="text-emerald-400" /> Panel de Revisión y Reemplazo de Videos
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Aquí puedes revisar todas las grabaciones realizadas por Valentina Mora y activarlas para reemplazar los videos de prueba en el Traductor, Práctica y Diccionario.
                </p>
              </div>

              <Button 
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(approvedMap, null, 2));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute("href", dataStr);
                  downloadAnchor.setAttribute("download", "mapeo_videos_valentina.json");
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                }}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2"
              >
                <Download size={16} /> Exportar JSON de Reemplazo
              </Button>
            </div>

            {/* Grid de Señas Grabadas para Revisión */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allVocabItems.current.map(item => {
                const recordedData = progressMap[item.label];
                const isApproved = !!approvedMap[item.label];

                return (
                  <div key={item.label} className="bg-slate-900 rounded-2xl p-4 border border-slate-700 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-purple-400 font-bold uppercase">{item.category}</span>
                        {isApproved ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                            ✓ Activo en la App
                          </span>
                        ) : recordedData ? (
                          <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold border border-yellow-500/30">
                            {recordedData.duration ? `${recordedData.duration}s` : 'Grabado'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 text-xs font-bold">
                            Sin Grabar
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-white mb-2">{item.label}</h3>

                      {recordedData?.base64 ? (
                        <div className="relative bg-black rounded-xl overflow-hidden aspect-video border border-slate-800 mb-3">
                          <video src={recordedData.base64} controls loop className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="bg-slate-800 rounded-xl p-4 text-center text-xs text-slate-500 mb-3">
                          Video original predeterminado
                        </div>
                      )}
                    </div>

                    {recordedData?.base64 && (
                      <Button
                        onClick={() => toggleApproveVideo(item.label, recordedData.base64!)}
                        className={`w-full font-bold py-2 rounded-xl text-sm transition-all ${
                          isApproved 
                            ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {isApproved ? 'Desactivar Reemplazo' : 'Aprobar y Aplicar a la App'}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
