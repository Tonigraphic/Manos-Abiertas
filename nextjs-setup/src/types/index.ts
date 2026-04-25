// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Sign Recognition Types
export interface RecognizedSign {
  id: string;
  sign: string;
  confidence: number;
  timestamp: string;
  videoFrame?: string;
}

export interface RecognitionSession {
  sessionId: string;
  startTime: string;
  endTime?: string;
  recognizedSigns: RecognizedSign[];
  accuracy: number;
}

// Dictionary Types
export interface Sign {
  id: string;
  word: string;
  category: SignCategory;
  difficulty: 'Fácil' | 'Medio' | 'Difícil';
  videoUrl: string;
  thumbnailUrl?: string;
  description?: string;
  relatedSigns?: string[];
}

export type SignCategory = 'alphabet' | 'numbers' | 'greetings' | 'common' | 'advanced';

export interface SignCategory {
  id: string;
  name: string;
  count: number;
  icon: string;
}

// Practice Types
export interface Exercise {
  id: string;
  title: string;
  description: string;
  difficulty: 'Fácil' | 'Medio' | 'Difícil';
  points: number;
  signs: string[];
  completed: boolean;
  accuracy?: number;
}

export interface UserProgress {
  userId: string;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  dailyGoal: number;
  dailyProgress: number;
  achievements: Achievement[];
  completedExercises: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress?: number;
  required?: number;
}

// WebSocket Types
export interface WebSocketMessage {
  type: 'recognition' | 'error' | 'status' | 'ping';
  payload: any;
  timestamp: string;
}

export interface RecognitionResult {
  sign: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks?: number[][];
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  progress: UserProgress;
  createdAt: string;
}

// Video Types
export interface VideoMetadata {
  duration: number;
  format: string;
  resolution: {
    width: number;
    height: number;
  };
  fps: number;
}

// Settings Types
export interface AppSettings {
  cameraEnabled: boolean;
  audioEnabled: boolean;
  videoQuality: 'low' | 'medium' | 'high';
  recognitionThreshold: number;
  autoSave: boolean;
  theme: 'light' | 'dark';
}
