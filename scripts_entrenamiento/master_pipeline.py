import cv2
import numpy as np
import os
import mediapipe as mp
import tensorflow as tf
from sklearn.model_selection import train_test_split
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, Input, Lambda, BatchNormalization
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from tensorflow.keras.regularizers import l2
import tf2onnx

# ==========================================
# CONFIGURACIÓN GENERAL
# ==========================================
DATA_PATH = r"D:\Proyecto VS\nuevos datos crudos"
EXPORT_PATH = r"D:\Proyecto VS\datos_extraidos_npy"
PUBLIC_MODELS_PATH = r"D:\Proyecto VS\Manos-Abiertas\public\models"
SEQUENCE_LENGTH = 30

# Mapeo exacto de las categorías y las carpetas de los videos.
# IMPORTANTE: Los nombres aquí deben coincidir EXACTAMENTE con el nombre de las carpetas
# en tu disco duro (en minúsculas, sin tildes preferiblemente, respetando espacios).
# El script se encargará de ordenarlas alfabéticamente para que coincidan con React.
# Mapeo exacto PRE-ORDENADO.
# El orden aquí es EXACTAMENTE el mismo orden en el que React (JavaScript) ordena las palabras.
# NO debemos ordenarlas en Python porque JavaScript ordena las tildes de forma diferente.
CATEGORIAS = {
    "greetings": [
        "GRACIAS", "HOLA", "MI NOMBRE", "MI SEÑA", "PROFESOR"
    ],
    "design": [
        "AGUA", "CAPAS", "HOJAS", "LAPIZ", "MATERIALES", 
        "PERSPECTIVA", "PINCEL", "SEPARAR", "TEXTURA", "VOLUMEN"
    ],
    "colors": [
        "AMARILLO", "AMARILLO NARANJA", "AMARILLO VERDE", "AZUL", "AZUL VERDE", 
        "AZUL VIOLETA", "BLANCO", "CAFE", "COLORES", "CREMA", "GRIS", "MEZCLAR", 
        "MORADO", "NARANJA", "NEGRO", "ROJO", "ROJO NARANJA", "ROJO VIOLETA", 
        "VERDE", "VIOLETA"
    ],
    "office": [
        # Nota técnica: En JavaScript, MATRICULA FINANCIERA (sin tilde) va antes que MATRÍCULA ACADÉMICA (con tilde).
        # Por eso este orden específico garantiza que el modelo mapee perfectamente a la pantalla.
        "ENVIAR TAREA", "HORARIO", "HORARIO DE CLASE", "HORARIO DE MATERIA", 
        "MATRICULA FINANCIERA", "MATRICULA ACADEMICA", "MATRICULA MATERIAS", 
        "PROCESO DE MATRICULA", "SOLICITAR CERTIFICADO"
    ],
    "alphabet": [
        # JavaScript manda la Ñ al final del abecedario.
        "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "LL", 
        "M", "N", "O", "P", "Q", "R", "RR", "S", "T", "U", "V", "W", "X", 
        "Y", "Z", "Ñ"
    ]
}

# Mapeo adicional para buscar en las subcarpetas correctas (Español)
CARPETAS_ORIGEN = {
    "greetings": "Saludos",
    "design": "Diseño",
    "office": "Oficina",
    "colors": "Colores",
    "alphabet": "Abecedario"
}

# ==========================================
# 1. EXTRACCIÓN DE DATOS (MEDIAPIPE)
# ==========================================
mp_holistic = mp.solutions.holistic

def extract_keypoints(results):
    pose = np.array([[res.x, res.y, res.z, res.visibility] for res in results.pose_landmarks.landmark]).flatten() if results.pose_landmarks else np.zeros(33*4)
    face = np.array([[res.x, res.y, res.z] for res in results.face_landmarks.landmark]).flatten() if results.face_landmarks else np.zeros(468*3)
    lh = np.array([[res.x, res.y, res.z] for res in results.left_hand_landmarks.landmark]).flatten() if results.left_hand_landmarks else np.zeros(21*3)
    rh = np.array([[res.x, res.y, res.z] for res in results.right_hand_landmarks.landmark]).flatten() if results.right_hand_landmarks else np.zeros(21*3)
    return np.concatenate([pose, face, lh, rh])

def mediapipe_detection(image, model):
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    image.flags.writeable = False
    results = model.process(image)
    image.flags.writeable = True
    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    return image, results

def extract_data_for_category(category_key, actions):
    if not os.path.exists(EXPORT_PATH):
        os.makedirs(EXPORT_PATH)

    carpeta_origen = CARPETAS_ORIGEN[category_key]
    base_category_path = os.path.join(DATA_PATH, carpeta_origen)

    with mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
        for action in actions:
            action_path = os.path.join(base_category_path, action)
            export_action_path = os.path.join(EXPORT_PATH, action)
            
            if not os.path.exists(action_path):
                print(f"  [!] ADVERTENCIA: No se encontró '{action_path}'. Saltando...")
                continue
                
            if not os.path.exists(export_action_path):
                os.makedirs(export_action_path)

            videos = [f for f in os.listdir(action_path) if f.endswith(('.mp4', '.avi', '.mov'))]
            
            npy_existentes = [f for f in os.listdir(export_action_path) if f.endswith('.npy')]
            if len(npy_existentes) >= len(videos) and len(videos) > 0:
                print(f"  [>] {action}: Ya extraído ({len(npy_existentes)} archivos).")
                continue

            print(f"  [>] Extrayendo '{action}' ({len(videos)} videos)...")
            for video_idx, video_name in enumerate(videos):
                npy_path = os.path.join(export_action_path, f"{video_idx}.npy")
                if os.path.exists(npy_path):
                    continue
                    
                video_path = os.path.join(action_path, video_name)
                cap = cv2.VideoCapture(video_path)
                total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                if total_frames == 0: continue

                frame_indices = np.linspace(0, total_frames - 1, SEQUENCE_LENGTH, dtype=int)
                video_keypoints = []
                current_frame_idx = 0
                
                while cap.isOpened() and len(video_keypoints) < SEQUENCE_LENGTH:
                    ret, frame = cap.read()
                    if not ret: break
                    if current_frame_idx in frame_indices:
                        image, results = mediapipe_detection(frame, holistic)
                        video_keypoints.append(extract_keypoints(results))
                        frame_indices = np.delete(frame_indices, np.where(frame_indices == current_frame_idx)[0][:1])
                    current_frame_idx += 1
                
                while len(video_keypoints) < SEQUENCE_LENGTH:
                    if len(video_keypoints) > 0: video_keypoints.append(video_keypoints[-1])
                    else: video_keypoints.append(np.zeros(1662))

                cap.release()
                np.save(npy_path, np.array(video_keypoints))

# ==========================================
# 2. ENTRENAMIENTO (KERAS)
# ==========================================
@tf.keras.utils.register_keras_serializable()
def center_landmarks(inputs):
    pose = inputs[:, :, 0:132]
    pose_reshaped = tf.reshape(pose, [-1, 30, 33, 4])
    nose_xyz = pose_reshaped[:, :, 0:1, 0:3]
    pose_xyz = pose_reshaped[:, :, :, 0:3]
    pose_vis = pose_reshaped[:, :, :, 3:4]
    pose_xyz_centered = pose_xyz - nose_xyz
    pose_centered = tf.concat([pose_xyz_centered, pose_vis], axis=-1)
    pose_flat = tf.reshape(pose_centered, [-1, 30, 132])
    
    hands = inputs[:, :, 1536:1662]
    hands_reshaped = tf.reshape(hands, [-1, 30, 42, 3])
    hands_xyz_centered = hands_reshaped - nose_xyz
    hands_flat = tf.reshape(hands_xyz_centered, [-1, 30, 126])
    return tf.concat([pose_flat, hands_flat], axis=2)

def train_model(actions, model_name):
    # ELIMINADO EL SORT() - Respetamos el orden exacto del diccionario para mapear con React
    label_map = {label:num for num, label in enumerate(actions)}
    sequences, labels = [], []
    
    for action in actions:
        action_path = os.path.join(EXPORT_PATH, action)
        if not os.path.exists(action_path): continue
        npy_files = [f for f in os.listdir(action_path) if f.endswith('.npy')]
        for file in npy_files:
            res = np.load(os.path.join(action_path, file))
            if res.shape == (SEQUENCE_LENGTH, 1662):
                sequences.append(res)
                labels.append(label_map[action])
                
    if len(sequences) == 0:
        print("  [!] Error: No hay datos para entrenar.")
        return None
        
    X = np.array(sequences)
    y = to_categorical(labels, num_classes=len(actions)).astype(int)
    
    # Data Augmentation
    X_noise = X + np.random.normal(0, 0.005, X.shape)
    X_augmented = np.concatenate((X, X_noise), axis=0)
    y_augmented = np.concatenate((y, y), axis=0)
    
    X_train, X_test, y_train, y_test = train_test_split(X_augmented, y_augmented, test_size=0.2, random_state=42)
    
    model = Sequential()
    model.add(Input(shape=(SEQUENCE_LENGTH, 1662)))
    model.add(Lambda(center_landmarks, output_shape=(SEQUENCE_LENGTH, 258)))
    
    # Aumentado a 128/256 para manejar más clases
    model.add(LSTM(128, return_sequences=True, activation='relu', kernel_regularizer=l2(0.005)))
    model.add(BatchNormalization())
    model.add(Dropout(0.4))
    
    model.add(LSTM(256, return_sequences=False, activation='relu', kernel_regularizer=l2(0.005)))
    model.add(BatchNormalization())
    model.add(Dropout(0.4))
    
    model.add(Dense(128, activation='relu', kernel_regularizer=l2(0.005)))
    model.add(BatchNormalization())
    model.add(Dropout(0.4))
    model.add(Dense(len(actions), activation='softmax'))
    
    optimizer = tf.keras.optimizers.Adam(learning_rate=0.001)
    model.compile(optimizer=optimizer, loss='categorical_crossentropy', metrics=['categorical_accuracy'])
    
    early_stopping = EarlyStopping(monitor='val_loss', patience=40, restore_best_weights=True)
    keras_path = f"{model_name}.keras"
    checkpoint = ModelCheckpoint(keras_path, monitor='val_categorical_accuracy', save_best_only=True, mode='max')
    reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=15, min_lr=0.00001)
    
    print(f"  [>] Entrenando {model_name}...")
    model.fit(X_train, y_train, validation_data=(X_test, y_test), epochs=250, 
              callbacks=[early_stopping, checkpoint, reduce_lr], batch_size=32, verbose=1)
              
    loss, accuracy = model.evaluate(X_test, y_test, verbose=0)
    print(f"  [✓] {model_name} - Precisión: {accuracy * 100:.2f}%")
    
    # Cargar el mejor modelo guardado
    return tf.keras.models.load_model(keras_path)

# ==========================================
# 3. EXPORTACIÓN A ONNX
# ==========================================
def convert_to_onnx(model, model_name):
    input_signature = [tf.TensorSpec(shape=(1, 30, 1662), dtype=tf.float32, name='input_1')]
    
    @tf.function(input_signature=input_signature)
    def model_func(inputs):
        return model(inputs)
    
    onnx_model, _ = tf2onnx.convert.from_function(model_func, input_signature=input_signature, opset=13)
    
    if not os.path.exists(PUBLIC_MODELS_PATH):
        os.makedirs(PUBLIC_MODELS_PATH)
        
    onnx_path = os.path.join(PUBLIC_MODELS_PATH, f"{model_name}.onnx")
    with open(onnx_path, "wb") as f:
        f.write(onnx_model.SerializeToString())
    print(f"  [✓] Guardado en: {onnx_path}")

# ==========================================
# FLUJO MAESTRO
# ==========================================
if __name__ == '__main__':
    print("==================================================")
    print("  INICIANDO ENTRENAMIENTO MASIVO (MANOS ABIERTAS)")
    print("==================================================")
    
    for category_name, words in CATEGORIAS.items():
        print(f"\n---> PROCESANDO CATEGORÍA: {category_name.upper()} ({len(words)} señas)")
        
        # 1. Extracción (Ahora pasamos el category_name para que sepa en qué carpeta buscar)
        extract_data_for_category(category_name, words)
        
        # 2. Entrenamiento
        trained_model = train_model(words, category_name)
        
        # 3. Conversión y guardado
        if trained_model:
            convert_to_onnx(trained_model, category_name)
            
    print("\n==================================================")
    print("  ¡TODOS LOS MODELOS HAN SIDO ENTRENADOS Y EXPORTADOS!")
    print("==================================================")
