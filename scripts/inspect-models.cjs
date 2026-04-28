const ort = require('onnxruntime-node');
const path = require('path');
const fs = require('fs');

const modelsDir = path.join(__dirname, '..', 'public', 'models');
const shape = [1, 30, 1662];

(async () => {
  const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.onnx'));
  
  console.log('Input shape: [1, 30, 1662]');
  console.log('  = 1 batch × 30 frames × 1662 features');
  console.log('  1662 = pose(33×4=132) + face(468×3=1404) + leftHand(21×3=63) + rightHand(21×3=63)');
  console.log('');

  for (const file of files) {
    const session = await ort.InferenceSession.create(path.join(modelsDir, file));
    const inputName = session.inputNames[0];
    
    const data = new Float32Array(shape.reduce((a, b) => a * b, 1));
    const tensor = new ort.Tensor('float32', data, shape);
    const result = await session.run({ [inputName]: tensor });
    const output = result[session.outputNames[0]];
    
    console.log(`${file}: input="${inputName}" → output classes: ${output.data.length}`);
  }
})();
