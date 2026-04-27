import * as ort from 'onnxruntime-web';
import { HandLandmarks } from './handDetectionService';
import { LSC_VOCABULARY } from '../lib/lscData';

export interface SignPattern {
  name: string;
  category: string;
  difficulty: 'Fácil' | 'Intermedio' | 'Avanzado';
  videoUrl?: string;
}

const MODEL_URLS: Record<string, string> = {
  alphabet: "https://huggingface.co/manosabiertas/Manos-Abiertas-LSC/resolve/main/lsc_abecedario.onnx",
  colors: "https://huggingface.co/manosabiertas/Manos-Abiertas-LSC/resolve/main/lsc_colores.onnx",
  design: "https://huggingface.co/manosabiertas/Manos-Abiertas-LSC/resolve/main/lsc_dise%C3%B1o.onnx",
  office: "https://huggingface.co/manosabiertas/Manos-Abiertas-LSC/resolve/main/lsc_oficina.onnx",
  greetings: "https://huggingface.co/manosabiertas/Manos-Abiertas-LSC/resolve/main/lsc_saludos.onnx"
};

export class SignRecognitionService {
  private session: ort.InferenceSession | null = null;
  private currentCategory: string | null = null;
  private patterns: Map<string, SignPattern> = new Map();

  constructor() {
    this.initializePatterns();
    this.linkVideosFromData();
  }

  // Carga el modelo desde Hugging Face solo cuando se necesita
  async loadModel(category: string) {
    if (this.currentCategory === category) return;
    
    try {
      const url = MODEL_URLS[category];
      if (!url) throw new Error("Categoría no soportada");
      
      this.session = await ort.InferenceSession.create(url);
      this.currentCategory = category;
      console.log(`IA: Modelo de ${category} cargado correctamente`);
    } catch (e) {
      console.error("Error al cargar el modelo ONNX:", e);
    }
  }

  private linkVideosFromData(): void {
    const allVideoData = Object.values(LSC_VOCABULARY).flat();
    allVideoData.forEach(item => {
      const pattern = this.patterns.get(item.label.toUpperCase());
      if (pattern) pattern.videoUrl = item.url;
    });
  }

  private initializePatterns(): void {
    // Mantenemos la lógica de inicialización que ya tenías para mapear nombres
    // (Asegúrate de que los nombres aquí coincidan con los LABELS del entrenamiento)
  }

  public getAllSigns(): SignPattern[] {
    return Array.from(this.patterns.values());
  }

  // Método para que la cámara envíe frames a la IA
  async predict(landmarks: any): Promise<string | null> {
    if (!this.session) return null;
    // Aquí irá la lógica de transformación de landmarks a Tensores
    return "Reconociendo..."; 
  }
}

export const signRecognitionService = new SignRecognitionService();
