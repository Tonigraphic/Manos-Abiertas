import cv2
import numpy as np
import os
import mediapipe as mp

mp_holistic = mp.solutions.holistic

# Configuración de rutas
DATA_PATH = r"D:\Proyecto VS\nuevos datos crudos"
EXPORT_PATH = r"D:\Proyecto VS\datos_extraidos_npy"
ACTIONS = np.array(['amarillo', 'azul', 'blanco', 'negro', 'rojo'])
SEQUENCE_LENGTH = 30 # Número de frames por video

def extract_keypoints(results):
    # Pose: 33 landmarks x 4 valores (x, y, z, visibility) = 132
    pose = np.array([[res.x, res.y, res.z, res.visibility] for res in results.pose_landmarks.landmark]).flatten() if results.pose_landmarks else np.zeros(33*4)
    # Face: 468 landmarks x 3 valores (x, y, z) = 1404
    face = np.array([[res.x, res.y, res.z] for res in results.face_landmarks.landmark]).flatten() if results.face_landmarks else np.zeros(468*3)
    # Left hand: 21 landmarks x 3 valores = 63
    lh = np.array([[res.x, res.y, res.z] for res in results.left_hand_landmarks.landmark]).flatten() if results.left_hand_landmarks else np.zeros(21*3)
    # Right hand: 21 landmarks x 3 valores = 63
    rh = np.array([[res.x, res.y, res.z] for res in results.right_hand_landmarks.landmark]).flatten() if results.right_hand_landmarks else np.zeros(21*3)
    
    # Total: 132 + 1404 + 63 + 63 = 1662 valores
    return np.concatenate([pose, face, lh, rh])

def process_videos():
    if not os.path.exists(EXPORT_PATH):
        os.makedirs(EXPORT_PATH)

    with mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
        for action in ACTIONS:
            action_path = os.path.join(DATA_PATH, action)
            if not os.path.exists(action_path):
                print(f"ADVERTENCIA: La carpeta {action_path} no existe.")
                continue

            export_action_path = os.path.join(EXPORT_PATH, action)
            if not os.path.exists(export_action_path):
                os.makedirs(export_action_path)

            videos = [f for f in os.listdir(action_path) if f.endswith(('.mp4', '.avi', '.mov'))]
            print(f"Procesando {len(videos)} videos para la clase '{action}'...")

            for video_idx, video_name in enumerate(videos):
                video_path = os.path.join(action_path, video_name)
                cap = cv2.VideoCapture(video_path)
                
                total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                if total_frames == 0:
                    continue

                # Seleccionar 30 frames espaciados uniformemente a lo largo del video
                # Esto es MUY IMPORTANTE para captar toda la seña, independientemente de la duración del video
                frame_indices = np.linspace(0, total_frames - 1, SEQUENCE_LENGTH, dtype=int)
                
                video_keypoints = []
                current_frame_idx = 0
                
                while cap.isOpened() and len(video_keypoints) < SEQUENCE_LENGTH:
                    ret, frame = cap.read()
                    if not ret:
                        break
                    
                    if current_frame_idx in frame_indices:
                        # Procesar con MediaPipe
                        image, results = mediapipe_detection(frame, holistic)
                        keypoints = extract_keypoints(results)
                        video_keypoints.append(keypoints)
                        
                        # Si por temas de redondeo hay índices duplicados, aseguramos no pasarnos
                        # o eliminamos del frame_indices el que ya procesamos
                        frame_indices = np.delete(frame_indices, np.where(frame_indices == current_frame_idx)[0][:1])

                    current_frame_idx += 1
                
                # Padding en caso de que el video sea muy corto o haya fallado la lectura
                while len(video_keypoints) < SEQUENCE_LENGTH:
                    if len(video_keypoints) > 0:
                        video_keypoints.append(video_keypoints[-1]) # Repetir el último frame
                    else:
                        video_keypoints.append(np.zeros(1662)) # Si todo falló, llenar con ceros

                cap.release()
                
                # Guardar en .npy
                npy_path = os.path.join(export_action_path, f"{video_idx}.npy")
                np.save(npy_path, np.array(video_keypoints))

def mediapipe_detection(image, model):
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB) # COLOR CONVERSION BGR 2 RGB
    image.flags.writeable = False                  # Image is no longer writeable
    results = model.process(image)                 # Make prediction
    image.flags.writeable = True                   # Image is now writeable 
    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR) # COLOR COVERSION RGB 2 BGR
    return image, results

if __name__ == '__main__':
    print("Iniciando extracción de datos. Esto puede tardar varios minutos...")
    process_videos()
    print("¡Extracción completada!")
