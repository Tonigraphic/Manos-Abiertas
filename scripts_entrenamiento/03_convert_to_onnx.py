import tensorflow as tf
import tf2onnx
import os

MODEL_PATH = 'colores_model_best.keras'
ONNX_MODEL_PATH = 'colores_model_best.onnx'

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

if __name__ == '__main__':
    if not os.path.exists(MODEL_PATH):
        print(f"Error: El modelo {MODEL_PATH} no existe. Ejecuta el entrenamiento primero.")
        exit()

    print(f"Cargando modelo desde {MODEL_PATH}...")
    model = tf.keras.models.load_model(MODEL_PATH)
    
    # El input signature sigue siendo 1662 para que tu código web no se rompa
    input_signature = [tf.TensorSpec(shape=(1, 30, 1662), dtype=tf.float32, name='input_1')]
    
    @tf.function(input_signature=input_signature)
    def model_func(inputs):
        return model(inputs)
    
    print("Convirtiendo a ONNX via tf.function (Compatibilidad Keras 3)...")
    onnx_model, _ = tf2onnx.convert.from_function(
        model_func, 
        input_signature=input_signature, 
        opset=13 
    )
    
    with open(ONNX_MODEL_PATH, "wb") as f:
        f.write(onnx_model.SerializeToString())
        
    print(f"¡Éxito! Modelo ONNX guardado en: {os.path.abspath(ONNX_MODEL_PATH)}")
