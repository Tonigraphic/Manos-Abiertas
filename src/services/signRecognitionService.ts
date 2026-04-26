/**
 * Sign Recognition Service
 * Recognizes LSC signs from hand landmarks using pattern matching and ML models
 */

import { HandLandmarks } from './handDetectionService';
// Importamos tus URLs desde el archivo de datos que creamos
import { LSC_VOCABULARY } from '../lib/lscData';

export interface RecognizedSign {
  sign: string;
  confidence: number;
  timestamp: number;
  handedness: 'Left' | 'Right' | 'Both';
}

export interface SignPattern {
  name: string;
  description: string;
  category: string;
  difficulty: 'Fácil' | 'Intermedio' | 'Avanzado';
  requiredHands: 1 | 2;
  videoUrl?: string; // Propiedad para vincular tus videos de GitHub
  pattern: (landmarks: HandLandmarks[]) => number;
}

/**
 * Sign Recognition Service
 */
export class SignRecognitionService {
  private patterns: Map<string, SignPattern> = new Map();
  private recognitionHistory: RecognizedSign[] = [];
  private confidenceThreshold = 0.75;

  constructor() {
    this.initializePatterns();
    this.linkVideosFromData(); // Vinculamos las URLs al inicializar
  }

  /**
   * Vincula las URLs de lscData.ts con los patrones de señas
   */
  private linkVideosFromData(): void {
    // Aplanamos todas las categorías del diccionario en una sola lista para buscar
    const allVideoData = Object.values(LSC_VOCABULARY).flat();
    
    allVideoData.forEach(item => {
      // Buscamos si existe un patrón con ese nombre (ej: "A", "AMARILLO", "LÁPIZ")
      const pattern = this.patterns.get(item.label);
      if (pattern) {
        pattern.videoUrl = item.url;
      }
    });
  }

  /**
   * Initialize sign patterns for LSC
   */
  private initializePatterns(): void {
    // CATEGORÍA: COLORES
    const colorSigns = [
      { name: 'COLORES', sub: 'Concepto' }, { name: 'MEZCLAR', sub: 'Concepto' },
      { name: 'AMARILLO', sub: 'Primario' }, { name: 'ROJO', sub: 'Primario' }, 
      { name: 'AZUL', sub: 'Primario' }, { name: 'NARANJA', sub: 'Secundario' },
      { name: 'VERDE', sub: 'Secundario' }, { name: 'VIOLETA', sub: 'Secundario' },
      { name: 'MORADO', sub: 'Secundario' }, { name: 'AMARILLO NARANJA', sub: 'Mezcla' },
      { name: 'ROJO NARANJA', sub: 'Mezcla' }, { name: 'ROJO VIOLETA', sub: 'Mezcla' },
      { name: 'AZUL VIOLETA', sub: 'Mezcla' }, { name: 'AZUL VERDE', sub: 'Mezcla' },
      { name: 'AMARILLO VERDE', sub: 'Mezcla' }, { name: 'BLANCO', sub: 'Neutro' },
      { name: 'NEGRO', sub: 'Neutro' }, { name: 'GRIS', sub: 'Neutro' },
      { name: 'CAFÉ', sub: 'Neutro' }, { name: 'CREMA', sub: 'Neutro' }
    ];

    colorSigns.forEach(({ name, sub }) => {
      this.patterns.set(name, {
        name,
        description: `${sub} ${name} en LSC`,
        category: 'colors',
        difficulty: 'Fácil',
        requiredHands: 1,
        pattern: (landmarks) => 0.8 // Placeholder hasta integrar ONNX
      });
    });

    // CATEGORÍA: SALUDOS
    const greetingSigns = [
      { name: 'HOLA', hands: 1 }, { name: 'MI NOMBRE', hands: 2 },
      { name: 'MI SEÑA', hands: 2 }, { name: 'GRACIAS', hands: 1 },
      { name: 'PROFESOR', hands: 1 }
    ];

    greetingSigns.forEach(({ name, hands }) => {
      this.patterns.set(name, {
        name,
        description: `${name} en LSC`,
        category: 'greetings',
        difficulty: 'Fácil',
        requiredHands: hands as 1 | 2,
        pattern: (landmarks) => 0.8
      });
    });

    // CATEGORÍA: ABECEDARIO
    const alphabet = [
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'LL', 
      'M', 'N', 'Ñ', 'O', 'P', 'Q', 'R', 'RR', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
    ];

    alphabet.forEach(letter => {
      this.patterns.set(letter, {
        name: letter,
        description: `Letra ${letter} en LSC`,
        category: 'alphabet',
        difficulty: 'Fácil',
        requiredHands: 1,
        pattern: (landmarks) => 0.8
      });
    });

    // CATEGORÍA: OFICINA
    const officeSigns = [
      'HORARIO', 'HORARIO DE CLASE', 'HORARIO DE MATERIA', 'PROCESO DE MATRÍCULA',
      'MATRÍCULA ACADÉMICA', 'MATRICULA FINANCIERA', 'MATRÍCULA MATERIAS',
      'ENVIAR TAREA', 'SOLICITAR CERTIFICADO'
    ];

    officeSigns.forEach(name => {
      this.patterns.set(name, {
        name,
        description: `${name} en LSC`,
        category: 'office',
        difficulty: 'Intermedio',
        requiredHands: 2,
        pattern: (landmarks) => 0.8
      });
    });

    // CATEGORÍA: DISEÑO
    const designSigns = [
      'MATERIALES', 'LÁPIZ', 'PINCEL', 'AGUA', 'HOJAS', 
      'TEXTURA', 'VOLUMEN', 'PERSPECTIVA', 'CAPAS', 'SEPARAR'
    ];

    designSigns.forEach(name => {
      this.patterns.set(name, {
        name,
        description: `${name} en LSC`,
        category: 'design',
        difficulty: 'Intermedio',
        requiredHands: 2,
        pattern: (landmarks) => 0.8
      });
    });
  }

  public getAllSigns(): SignPattern[] {
    return Array.from(this.patterns.values());
  }

  public getSign(name: string): SignPattern | undefined {
    return this.patterns.get(name);
  }
}

export const signRecognitionService = new SignRecognitionService();
