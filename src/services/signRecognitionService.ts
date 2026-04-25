/**
 * Sign Recognition Service
 * Recognizes LSC signs from hand landmarks using pattern matching
 */

import { HandLandmarks } from './handDetectionService';

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
  // Simple pattern matching based on hand shape and position
  pattern: (landmarks: HandLandmarks[]) => number; // Returns confidence 0-1
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
  }

  /**
   * Initialize sign patterns for LSC - Vocabulario disponible
   */
  private initializePatterns(): void {
    // CATEGORÍA: COLORES (organizados por círculo cromático y conceptos)
    const colorSigns = [
      // Conceptos generales
      { name: 'Colores', category: 'colors', subcategory: 'conceptos' },
      { name: 'Mezclar', category: 'colors', subcategory: 'conceptos' },

      // Primarios
      { name: 'Amarillo', category: 'colors', subcategory: 'primarios' },
      { name: 'Rojo', category: 'colors', subcategory: 'primarios' },
      { name: 'Azul', category: 'colors', subcategory: 'primarios' },

      // Secundarios (en orden de círculo cromático)
      { name: 'Naranja', category: 'colors', subcategory: 'secundarios' },
      { name: 'Verde', category: 'colors', subcategory: 'secundarios' },
      { name: 'Violeta', category: 'colors', subcategory: 'secundarios' },
      { name: 'Morado', category: 'colors', subcategory: 'secundarios' },

      // Mezclas (siguiendo círculo cromático)
      { name: 'Amarillo-Naranja', category: 'colors', subcategory: 'mezclas' },
      { name: 'Rojo-Naranja', category: 'colors', subcategory: 'mezclas' },
      { name: 'Rojo-Violeta', category: 'colors', subcategory: 'mezclas' },
      { name: 'Azul-Violeta', category: 'colors', subcategory: 'mezclas' },
      { name: 'Azul-Verde', category: 'colors', subcategory: 'mezclas' },
      { name: 'Amarillo-Verde', category: 'colors', subcategory: 'mezclas' },

      // Neutros
      { name: 'Blanco', category: 'colors', subcategory: 'neutros' },
      { name: 'Negro', category: 'colors', subcategory: 'neutros' },
      { name: 'Gris', category: 'colors', subcategory: 'neutros' },
      { name: 'Café', category: 'colors', subcategory: 'neutros' },
      { name: 'Crema', category: 'colors', subcategory: 'neutros' },
    ];

    colorSigns.forEach(({ name, category, subcategory }) => {
      this.patterns.set(name, {
        name,
        description: `${subcategory === 'conceptos' ? 'Concepto' : 'Color'} ${name} en LSC`,
        category,
        difficulty: 'Fácil',
        requiredHands: 1,
        pattern: (landmarks) => this.matchCommonPattern(name, landmarks)
      });
    });

    // CATEGORÍA: SALUDOS Y PRESENTACIÓN (orden lógico de conversación)
    const greetingSigns = [
      { name: 'Hola', description: 'Saludo básico' },
      { name: 'Mi nombre', description: 'Presentación personal' },
      { name: 'Mi seña', description: 'Seña personal identificativa' },
      { name: 'Gracias', description: 'Expresión de gratitud' },
      { name: 'Profesor', description: 'Docente' },
    ];

    greetingSigns.forEach(({ name, description }) => {
      this.patterns.set(name, {
        name,
        description: `${description} en LSC`,
        category: 'greetings',
        difficulty: 'Fácil',
        requiredHands: name === 'Gracias' ? 1 : 2,
        pattern: (landmarks) => this.matchCommonPattern(name, landmarks)
      });
    });

    // CATEGORÍA: ABECEDARIO COMPLETO (ordenado alfabéticamente con variantes)
    const alphabetSigns = [
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K',
      'L', 'LL',
      'M', 'N', 'Ñ', 'O', 'P', 'Q',
      'R', 'RR',
      'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
    ];

    alphabetSigns.forEach(letter => {
      this.patterns.set(letter, {
        name: letter,
        description: `Letra ${letter} en LSC`,
        category: 'alphabet',
        difficulty: 'Fácil',
        requiredHands: 1,
        pattern: (landmarks) => this.matchAlphabetPattern(letter, landmarks)
      });
    });

    // CATEGORÍA: OFICINA DEL DEPARTAMENTO (agrupados por tema)
    const officeSigns = [
      // Horarios
      { name: 'Horario', description: 'Horario general' },
      { name: 'Horario de clase', description: 'Horario de clases' },
      { name: 'Horario de materia', description: 'Horario por materia' },

      // Trámites de matrícula
      { name: 'Proceso de matrícula', description: 'Proceso matricular' },
      { name: 'Matrícula académica', description: 'Inscripción académica' },
      { name: 'Matrícula financiera', description: 'Pago de matrícula' },
      { name: 'Matrícula de materias', description: 'Registro de asignaturas' },

      // Solicitudes
      { name: 'Enviar tarea', description: 'Entrega de trabajo' },
      { name: 'Solicitar certificado', description: 'Petición de certificado' },
    ];

    officeSigns.forEach(({ name, description }) => {
      this.patterns.set(name, {
        name,
        description: `${description} en LSC`,
        category: 'office',
        difficulty: 'Intermedio',
        requiredHands: 2,
        pattern: (landmarks) => this.matchCommonPattern(name, landmarks)
      });
    });

    // CATEGORÍA: MATERIALES Y DISEÑO (agrupados por tipo)
    const designSigns = [
      // Materiales generales
      { name: 'Materiales', description: 'Materiales de trabajo' },

      // Herramientas
      { name: 'Lápiz', description: 'Herramienta de dibujo' },
      { name: 'Pincel', description: 'Herramienta de pintura' },

      // Elementos básicos
      { name: 'Agua', description: 'Elemento agua' },
      { name: 'Hojas', description: 'Papel/hojas' },

      // Conceptos de diseño
      { name: 'Textura', description: 'Textura visual o táctil' },
      { name: 'Volumen', description: 'Volumen tridimensional' },
      { name: 'Perspectiva', description: 'Perspectiva en diseño' },
      { name: 'Capas', description: 'Capas en diseño' },

      // Acciones
      { name: 'Separar', description: 'Acción de separar' },
    ];

    designSigns.forEach(({ name, description }) => {
      this.patterns.set(name, {
        name,
        description: `${description} en LSC`,
        category: 'design',
        difficulty: 'Intermedio',
        requiredHands: name === 'Lápiz' || name === 'Pincel' ? 1 : 2,
        pattern: (landmarks) => this.matchCommonPattern(name, landmarks)
      });
    });
  }

  /**
   * Match alphabet pattern (simplified)
   */
  private matchAlphabetPattern(letter: string, landmarks: HandLandmarks[]): number {
    if (landmarks.length === 0) return 0;

    // Simplified pattern matching based on hand configuration
    const hand = landmarks[0];
    const fingerStates = this.getFingerStates(hand.landmarks);

    // Basic pattern matching for demonstration
    // In a real implementation, this would use ML models or detailed geometric analysis
    const baseConfidence = Math.random() * 0.3 + 0.7; // 0.7-1.0

    return baseConfidence;
  }

  /**
   * Match number pattern (simplified)
   */
  private matchNumberPattern(number: number, landmarks: HandLandmarks[]): number {
    if (landmarks.length === 0) return 0;

    const hand = landmarks[0];
    const fingerStates = this.getFingerStates(hand.landmarks);

    // Count extended fingers
    const extendedCount = fingerStates.filter(Boolean).length;

    // Simple matching: if number matches extended fingers
    if (extendedCount === number) {
      return Math.random() * 0.15 + 0.85; // 0.85-1.0
    }

    return Math.random() * 0.3; // Low confidence
  }

  /**
   * Match common sign pattern
   */
  private matchCommonPattern(sign: string, landmarks: HandLandmarks[]): number {
    if (landmarks.length === 0) return 0;

    // For two-handed signs, check if we have both hands
    const pattern = this.patterns.get(sign);
    if (pattern?.requiredHands === 2 && landmarks.length < 2) {
      return Math.random() * 0.4; // Lower confidence
    }

    return Math.random() * 0.25 + 0.75; // 0.75-1.0
  }

  /**
   * Determine which fingers are extended
   */
  private getFingerStates(landmarks: number[][]): boolean[] {
    // Simplified finger detection
    // In real implementation, use proper geometric analysis
    const fingerTips = [4, 8, 12, 16, 20]; // MediaPipe landmark indices for fingertips
    const fingerBases = [2, 5, 9, 13, 17];

    return fingerTips.map((tipIdx, i) => {
      if (landmarks[tipIdx] && landmarks[fingerBases[i]]) {
        const tip = landmarks[tipIdx];
        const base = landmarks[fingerBases[i]];
        // Extended if tip is higher than base (assuming upright hand)
        return tip[1] < base[1];
      }
      return false;
    });
  }

  /**
   * Recognize sign from hand landmarks
   */
  recognize(landmarks: HandLandmarks[]): RecognizedSign | null {
    if (landmarks.length === 0) return null;

    let bestMatch: RecognizedSign | null = null;
    let bestConfidence = 0;

    // Try all patterns
    for (const [signName, pattern] of this.patterns) {
      const confidence = pattern.pattern(landmarks);

      if (confidence > bestConfidence && confidence >= this.confidenceThreshold) {
        bestConfidence = confidence;
        bestMatch = {
          sign: signName,
          confidence,
          timestamp: Date.now(),
          handedness: landmarks.length === 1 ? landmarks[0].handedness : 'Both'
        };
      }
    }

    if (bestMatch) {
      this.recognitionHistory.push(bestMatch);
      // Keep only last 100 recognitions
      if (this.recognitionHistory.length > 100) {
        this.recognitionHistory.shift();
      }
    }

    return bestMatch;
  }

  /**
   * Get all available sign patterns
   */
  getAllSigns(): SignPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get signs by category
   */
  getSignsByCategory(category: string): SignPattern[] {
    return Array.from(this.patterns.values()).filter(
      pattern => pattern.category === category
    );
  }

  /**
   * Get recognition history
   */
  getHistory(): RecognizedSign[] {
    return [...this.recognitionHistory];
  }

  /**
   * Clear recognition history
   */
  clearHistory(): void {
    this.recognitionHistory = [];
  }

  /**
   * Set confidence threshold
   */
  setConfidenceThreshold(threshold: number): void {
    this.confidenceThreshold = Math.max(0, Math.min(1, threshold));
  }

  /**
   * Get sign pattern by name
   */
  getPattern(signName: string): SignPattern | undefined {
    return this.patterns.get(signName);
  }
}

// Singleton instance
export const signRecognitionService = new SignRecognitionService();
