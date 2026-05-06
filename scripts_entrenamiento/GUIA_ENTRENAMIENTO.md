# Guía Definitiva: Entrenamiento de Modelos LSC (Manos Abiertas)

Esta guía documenta el proceso exacto y los motivos técnicos detrás de nuestro pipeline de entrenamiento, el cual nos permitió pasar de un 12% a un **94.8% de precisión** al eliminar el sobreajuste y el ruido de fondo.

---

## 1. Sobre la Combinación de Videos (Antiguos + Nuevos)

**PREGUNTA CLAVE:** *¿Es necesario o recomendable mezclar los videos antiguos (con ángulos y distintas velocidades) con los nuevos (frontales)?*

**RESPUESTA: ¡Absolutamente SÍ! Es obligatorio si quieres un modelo robusto y perfecto.**

**¿Por qué?**
Las redes neuronales son perezosas; si solo ven videos frontales perfectos, memorizarán ese ángulo. Cuando un usuario use tu aplicación y se gire ligeramente, el modelo fallará.
Al agregar tus videos antiguos que incluyen:
- Perfil izquierdo
- Perfil derecho
- Movimientos lentos y rápidos
- Sin las líneas de tracking dibujadas (lo cual permite a MediaPipe extraer puntos más limpios).

Estás inyectando **Varianza de Datos**. Esto obliga al modelo a entender "cómo se mueve la mano", en lugar de memorizar "dónde está la mano en la pantalla". Mezcla ambas carpetas para cada una de tus 65 clases.

---

## 2. Preparación de Directorios

Antes de ejecutar los scripts, asegúrate de que tu carpeta de `datos crudos` tenga esta estructura:
```text
D:\Proyecto VS\nuevos datos crudos\
├── amarillo\
│   ├── video1.mp4
│   ├── video2.mp4
│   └── ... (antiguos y nuevos mezclados, hasta 90 videos)
├── azul\
├── blanco\
...
```

---

## 3. Paso a Paso del Código

### Paso 1: Extracción Inteligente (`01_extract_landmarks.py`)

**¿Qué hace?**
Usa MediaPipe para extraer 1662 puntos del cuerpo y las manos. 
*El secreto de este script:* Toma exactamente 30 frames distribuidos **uniformemente** a lo largo del video. Así, no importa si el video dura 1 segundo o 5 segundos, siempre capturará el inicio, el medio y el final de la seña.

**¿Qué debes modificar para entrenar más modelos?**
En la línea 10, actualiza la lista de palabras que vas a entrenar:
```python
ACTIONS = np.array(['palabra1', 'palabra2', 'palabra3', ...])
```
*Tip:* Si vas a entrenar las 65 clases de golpe, asegúrate de tener paciencia, este script tomará bastantes horas.

**Comando:**
```bash
python scripts_entrenamiento\01_extract_landmarks.py
```

---

### Paso 2: El Entrenamiento Anti-Overfitting (`02_train.py`)

**¿Qué hace?**
Aquí ocurre la verdadera magia matemática que elevó la precisión al 94.8%.

1. **Filtro de Ruido (Cara):** MediaPipe genera 1404 puntos solo para la cara. Nuestro script elimina estos puntos internamente, reduciendo la confusión.
2. **Traslación Invariante (Capa Lambda):** Resta la posición de la nariz a todo el resto del cuerpo. Esto centra a la persona en las coordenadas `(0,0,0)` del plano 3D en cada frame. El modelo se vuelve **100% inmune** a la posición de la persona frente a la cámara web.
3. **Data Augmentation:** Duplica los datos agregando un "ruido" microscópico a las coordenadas, lo que funciona como un excelente regularizador.
4. **Castigo (Dropout y L2):** Las capas de Dropout(0.4) y regularización L2 evitan que el modelo memorice.

**¿Qué debes modificar para entrenar más modelos?**
Al igual que en el script anterior, solo debes actualizar la lista `ACTIONS` en la línea 11 con tus nuevas palabras.

**Comando:**
```bash
python scripts_entrenamiento\02_train.py
```

---

### Paso 3: Exportación a Producción (`03_convert_to_onnx.py`)

**¿Qué hace?**
Toma el modelo entrenado en Keras (`.keras`) y lo convierte a formato ONNX (`.onnx`), el cual está ultra-optimizado para correr en navegadores web mediante WebAssembly o WebGL.

*El secreto de este script:* Fuerza que la entrada sea de `[1, 30, 1662]`. Aunque nuestro modelo Keras internamente ignora la cara y reduce todo a 258 puntos (gracias a la Capa Lambda), la firma ONNX seguirá pidiendo 1662 puntos. 
**Esto es vital porque significa que no tienes que cambiar NINGUNA LÍNEA de código en tu frontend de React/TypeScript.** Tu código seguirá enviando la salida cruda de MediaPipe, y el modelo ONNX hará la limpieza automáticamente.

**Comando:**
```bash
python scripts_entrenamiento\03_convert_to_onnx.py
```

---

## 4. Próximos Pasos para Escalar (65 Clases)

Cuando quieras entrenar el diccionario completo:
1. Mueve todas tus carpetas (las 65) a `D:\Proyecto VS\nuevos datos crudos`.
2. Junta los videos antiguos limpios y los nuevos dentro de sus respectivas carpetas.
3. Actualiza el arreglo `ACTIONS` en los scripts 1 y 2 para que contengan las 65 palabras.
4. Ejecuta los 3 pasos en orden.
5. (Opcional): Si notas que el entrenamiento es inestable con 65 clases, en el archivo `02_train.py`, podrías aumentar el número de neuronas de las capas LSTM (ej. de 64 a 128 o 256) para darle más "memoria" al modelo, ya que diferenciar entre 65 señas requiere un "cerebro" ligeramente más grande que para 5.
