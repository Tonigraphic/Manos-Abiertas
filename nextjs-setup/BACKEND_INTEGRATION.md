# Guía de Integración Backend FastAPI

## Estructura del Backend Recomendada

```
backend/
├── main.py                 # App principal FastAPI
├── models/
│   ├── __init__.py
│   ├── sign.py            # Modelos de señas
│   ├── user.py            # Modelos de usuario
│   └── exercise.py        # Modelos de ejercicios
├── routers/
│   ├── __init__.py
│   ├── recognition.py     # Endpoints reconocimiento
│   ├── dictionary.py      # Endpoints diccionario
│   ├── practice.py        # Endpoints práctica
│   └── user.py           # Endpoints usuario
├── services/
│   ├── __init__.py
│   ├── ml_service.py     # Servicio ML/IA
│   ├── video_service.py  # Procesamiento video
│   └── db_service.py     # Base de datos
├── ml/
│   ├── __init__.py
│   ├── model.py          # Modelo entrenado
│   ├── preprocessor.py   # Preprocesamiento
│   └── postprocessor.py  # Postprocesamiento
└── requirements.txt
```

## Instalación Backend

```bash
# requirements.txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
websockets==12.0
opencv-python==4.8.1.78
numpy==1.26.2
tensorflow==2.15.0  # o pytorch
mediapipe==0.10.8
pydantic==2.5.0
python-multipart==0.0.6
sqlalchemy==2.0.23
pillow==10.1.0
```

## Configuración Inicial

```python
# main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn

app = FastAPI(
    title="LSC Recognition API",
    description="API para reconocimiento de Lengua de Señas Colombiana",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-domain.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montar carpeta de videos
app.mount("/videos", StaticFiles(directory="videos"), name="videos")

# Importar routers
from routers import recognition, dictionary, practice, user

app.include_router(recognition.router, prefix="/api/recognition", tags=["recognition"])
app.include_router(dictionary.router, prefix="/api/dictionary", tags=["dictionary"])
app.include_router(practice.router, prefix="/api/practice", tags=["practice"])
app.include_router(user.router, prefix="/api/user", tags=["user"])

@app.get("/")
async def root():
    return {"message": "LSC Recognition API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
```

## Modelo de Reconocimiento

```python
# services/ml_service.py
import cv2
import numpy as np
import mediapipe as mp
from typing import Tuple, Optional

class LSCRecognitionModel:
    def __init__(self, model_path: str):
        self.model = self.load_model(model_path)
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
    def load_model(self, path: str):
        """Cargar modelo entrenado (TensorFlow/PyTorch)"""
        # import tensorflow as tf
        # return tf.keras.models.load_model(path)
        pass
    
    def preprocess_frame(self, frame_bytes: bytes) -> np.ndarray:
        """Preprocesar frame de video"""
        nparr = np.frombuffer(frame_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        return frame_rgb
    
    def extract_landmarks(self, frame: np.ndarray) -> Optional[np.ndarray]:
        """Extraer landmarks de manos usando MediaPipe"""
        results = self.hands.process(frame)
        
        if not results.multi_hand_landmarks:
            return None
        
        landmarks = []
        for hand_landmarks in results.multi_hand_landmarks:
            for landmark in hand_landmarks.landmark:
                landmarks.extend([landmark.x, landmark.y, landmark.z])
        
        return np.array(landmarks)
    
    def predict(self, landmarks: np.ndarray) -> Tuple[str, float]:
        """Predecir seña a partir de landmarks"""
        # Normalizar landmarks
        # normalized = self.normalize(landmarks)
        
        # Hacer predicción con el modelo
        # prediction = self.model.predict(normalized)
        # sign = self.decode_prediction(prediction)
        # confidence = float(np.max(prediction))
        
        # Mock para desarrollo
        import random
        signs = ['Hola', 'Gracias', 'Por favor', 'Adiós', 'Sí', 'No']
        sign = random.choice(signs)
        confidence = random.uniform(0.85, 0.99)
        
        return sign, confidence
    
    async def recognize_sign(self, frame_bytes: bytes) -> dict:
        """Pipeline completo de reconocimiento"""
        frame = self.preprocess_frame(frame_bytes)
        landmarks = self.extract_landmarks(frame)
        
        if landmarks is None:
            return {
                "success": False,
                "error": "No se detectaron manos"
            }
        
        sign, confidence = self.predict(landmarks)
        
        return {
            "success": True,
            "sign": sign,
            "confidence": confidence,
            "landmarks": landmarks.tolist()
        }

# Instancia global
ml_model = LSCRecognitionModel("models/lsc_model.h5")
```

## WebSocket para Reconocimiento en Tiempo Real

```python
# routers/recognition.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from datetime import datetime
from services.ml_service import ml_model
import json

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}
    
    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[session_id] = websocket
    
    def disconnect(self, session_id: str):
        self.active_connections.pop(session_id, None)
    
    async def send_message(self, session_id: str, message: dict):
        websocket = self.active_connections.get(session_id)
        if websocket:
            await websocket.send_json(message)

manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, session: str = None):
    session_id = session or f"session_{datetime.now().timestamp()}"
    await manager.connect(session_id, websocket)
    
    try:
        while True:
            # Recibir frame de video como bytes
            frame_bytes = await websocket.receive_bytes()
            
            # Procesar con modelo ML
            result = await ml_model.recognize_sign(frame_bytes)
            
            # Enviar resultado al cliente
            if result["success"]:
                await manager.send_message(session_id, {
                    "type": "recognition",
                    "payload": {
                        "sign": result["sign"],
                        "confidence": result["confidence"],
                    },
                    "timestamp": datetime.now().isoformat()
                })
            else:
                await manager.send_message(session_id, {
                    "type": "error",
                    "payload": {"message": result.get("error", "Error desconocido")},
                    "timestamp": datetime.now().isoformat()
                })
    
    except WebSocketDisconnect:
        manager.disconnect(session_id)
        print(f"Client {session_id} disconnected")
    except Exception as e:
        print(f"Error in WebSocket: {e}")
        manager.disconnect(session_id)

@router.get("/history")
async def get_recognition_history():
    """Obtener historial de reconocimientos"""
    # Implementar consulta a BD
    return {
        "success": True,
        "data": []
    }
```

## Endpoints de Diccionario

```python
# routers/dictionary.py
from fastapi import APIRouter, Query
from typing import List, Optional
from models.sign import Sign

router = APIRouter()

# Mock data (reemplazar con BD)
SIGNS_DB = [
    {
        "id": "1",
        "word": "Hola",
        "category": "greetings",
        "difficulty": "Fácil",
        "videoUrl": "/videos/hola.mp4",
        "description": "Saludo básico"
    },
    # ... más señas
]

@router.get("/signs")
async def get_signs(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    limit: int = Query(50, le=100)
):
    """Obtener todas las señas"""
    signs = SIGNS_DB
    
    if category:
        signs = [s for s in signs if s["category"] == category]
    
    if difficulty:
        signs = [s for s in signs if s["difficulty"] == difficulty]
    
    return {
        "success": True,
        "data": signs[:limit]
    }

@router.get("/signs/{sign_id}")
async def get_sign_by_id(sign_id: str):
    """Obtener seña por ID"""
    sign = next((s for s in SIGNS_DB if s["id"] == sign_id), None)
    
    if not sign:
        return {
            "success": False,
            "error": "Seña no encontrada"
        }
    
    return {
        "success": True,
        "data": sign
    }

@router.get("/categories")
async def get_categories():
    """Obtener categorías disponibles"""
    categories = [
        {"id": "alphabet", "name": "Alfabeto", "count": 27},
        {"id": "numbers", "name": "Números", "count": 10},
        {"id": "greetings", "name": "Saludos", "count": 8},
        {"id": "common", "name": "Comunes", "count": 12},
    ]
    
    return {
        "success": True,
        "data": categories
    }

@router.get("/search")
async def search_signs(q: str = Query(..., min_length=1)):
    """Buscar señas por palabra"""
    results = [s for s in SIGNS_DB if q.lower() in s["word"].lower()]
    
    return {
        "success": True,
        "data": results
    }
```

## Procesamiento de Videos

```python
# services/video_service.py
import cv2
from pathlib import Path
from typing import Tuple

class VideoProcessor:
    def __init__(self, output_dir: str = "videos"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
    
    def extract_thumbnail(self, video_path: str, output_path: str, timestamp: float = 0.5):
        """Extraer thumbnail de video"""
        cap = cv2.VideoCapture(video_path)
        
        # Ir al timestamp
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_number = int(timestamp * total_frames)
        
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
        ret, frame = cap.read()
        
        if ret:
            cv2.imwrite(output_path, frame)
        
        cap.release()
        return ret
    
    def get_video_metadata(self, video_path: str) -> dict:
        """Obtener metadata de video"""
        cap = cv2.VideoCapture(video_path)
        
        metadata = {
            "duration": cap.get(cv2.CAP_PROP_FRAME_COUNT) / cap.get(cv2.CAP_PROP_FPS),
            "fps": cap.get(cv2.CAP_PROP_FPS),
            "resolution": {
                "width": int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
                "height": int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            },
            "format": "mp4"
        }
        
        cap.release()
        return metadata

video_processor = VideoProcessor()
```

## Ejecución del Backend

```bash
# Desarrollo
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Producción
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Testing

```bash
# Instalar dependencias de testing
pip install pytest httpx pytest-asyncio

# Ejecutar tests
pytest tests/
```

## Consideraciones de Producción

1. **Base de Datos**: Usar PostgreSQL o MongoDB para datos persistentes
2. **Almacenamiento**: S3 o similar para videos
3. **Caché**: Redis para mejorar performance
4. **Autenticación**: JWT tokens
5. **Rate Limiting**: Limitar requests por IP
6. **Monitoreo**: Sentry, DataDog, etc.
7. **CDN**: Para servir videos eficientemente
