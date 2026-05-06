import numpy as np
import os
from sklearn.model_selection import train_test_split
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, Input, Lambda, BatchNormalization
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
import tensorflow as tf

EXPORT_PATH = r"D:\Proyecto VS\datos_extraidos_npy"
ACTIONS = np.array(['amarillo', 'azul', 'blanco', 'negro', 'rojo'])
SEQUENCE_LENGTH = 30

def load_data():
    label_map = {label:num for num, label in enumerate(ACTIONS)}
    sequences, labels = [], []
    
    for action in ACTIONS:
        action_path = os.path.join(EXPORT_PATH, action)
        if not os.path.exists(action_path):
            continue
            
        npy_files = [f for f in os.listdir(action_path) if f.endswith('.npy')]
        for file in npy_files:
            res = np.load(os.path.join(action_path, file))
            if res.shape == (SEQUENCE_LENGTH, 1662):
                sequences.append(res)
                labels.append(label_map[action])
                
    X = np.array(sequences)
    y = to_categorical(labels, num_classes=len(ACTIONS)).astype(int)
    
    # Data Augmentation (Ruido)
    X_noise = X + np.random.normal(0, 0.005, X.shape)
    X_augmented = np.concatenate((X, X_noise), axis=0)
    y_augmented = np.concatenate((y, y), axis=0)
    
    return X_augmented, y_augmented

@tf.keras.utils.register_keras_serializable()
def center_landmarks(inputs):
    """
    MAGIA MATEMÁTICA: Traslación Invariante.
    Esta función toma los 1662 puntos, ignora la cara, y RESTA la posición de la nariz 
    a todos los demás puntos del cuerpo y las manos.
    Resultado: El modelo creerá que la persona siempre está exactamente en el centro de la cámara,
    inmune a si en un video estaba a la derecha o a la izquierda.
    """
    # 1. Cuerpo (Pose)
    pose = inputs[:, :, 0:132]
    pose_reshaped = tf.reshape(pose, [-1, 30, 33, 4])
    nose_xyz = pose_reshaped[:, :, 0:1, 0:3] # La nariz es el punto 0
    
    pose_xyz = pose_reshaped[:, :, :, 0:3]
    pose_vis = pose_reshaped[:, :, :, 3:4]
    pose_xyz_centered = pose_xyz - nose_xyz # Restar la nariz
    
    pose_centered = tf.concat([pose_xyz_centered, pose_vis], axis=-1)
    pose_flat = tf.reshape(pose_centered, [-1, 30, 132])
    
    # 2. Manos
    hands = inputs[:, :, 1536:1662]
    hands_reshaped = tf.reshape(hands, [-1, 30, 42, 3])
    hands_xyz_centered = hands_reshaped - nose_xyz # Restar la nariz a las manos
    hands_flat = tf.reshape(hands_xyz_centered, [-1, 30, 126])
    
    # Unir (132 + 126 = 258 puntos normalizados)
    return tf.concat([pose_flat, hands_flat], axis=2)

def build_model():
    model = Sequential()
    model.add(Input(shape=(SEQUENCE_LENGTH, 1662)))
    
    # Aplicar la función de centrado absoluto
    model.add(Lambda(center_landmarks, output_shape=(SEQUENCE_LENGTH, 258)))
    
    model.add(LSTM(64, return_sequences=True, activation='relu'))
    model.add(BatchNormalization())
    model.add(Dropout(0.4)) # Mantenemos Dropout alto para forzar aprendizaje
    
    model.add(LSTM(128, return_sequences=False, activation='relu'))
    model.add(BatchNormalization())
    model.add(Dropout(0.4))
    
    model.add(Dense(64, activation='relu'))
    model.add(BatchNormalization())
    model.add(Dropout(0.4))
    
    model.add(Dense(len(ACTIONS), activation='softmax'))
    
    optimizer = tf.keras.optimizers.Adam(learning_rate=0.001)
    model.compile(optimizer=optimizer, loss='categorical_crossentropy', metrics=['categorical_accuracy'])
    return model

if __name__ == '__main__':
    print("Cargando datos con Data Augmentation...")
    X, y = load_data()

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = build_model()
    
    early_stopping = EarlyStopping(monitor='val_loss', patience=40, restore_best_weights=True)
    checkpoint = ModelCheckpoint('colores_model_best.keras', monitor='val_categorical_accuracy', save_best_only=True, mode='max')
    reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=15, min_lr=0.00001)

    print("Iniciando entrenamiento con Traslación Invariante...")
    model.fit(
        X_train, y_train, 
        validation_data=(X_test, y_test), 
        epochs=250, 
        callbacks=[early_stopping, checkpoint, reduce_lr],
        batch_size=32 
    )

    print("Entrenamiento finalizado.")
    loss, accuracy = model.evaluate(X_test, y_test)
    print(f"Precisión final en datos de prueba: {accuracy * 100:.2f}%")
