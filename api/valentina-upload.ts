export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { word, category, videoBase64, fileName, customRepo, customToken } = req.body;

    if (!word || !videoBase64) {
      return res.status(400).json({ error: 'Palabra y videoBase64 son requeridos' });
    }

    const HF_TOKEN = customToken || process.env.HF_SUGGESTIONS_TOKEN || process.env.HF_TRANSLATION_TOKEN || process.env.HF_TOKEN;
    const REPO_ID = customRepo || process.env.HF_SUGGESTIONS_REPO || 'manosabiertas/Manos-Abiertas-LSC';

    if (!HF_TOKEN) {
      console.warn("No se encontró ningún token de Hugging Face. Modos de prueba/simulado activo.");
      return res.status(200).json({ success: true, simulated: true });
    }

    const cleanCategory = (category || 'general').toLowerCase().replace(/\s+/g, '_');
    const cleanWord = word.toUpperCase().replace(/\s+/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const folderPath = `grabaciones_valentina/${cleanCategory}/${cleanWord}`;
    
    const operations: any[] = [];

    // Header del commit
    operations.push({
      key: 'header',
      value: {
        summary: `Grabación Valentina Mora: ${word} (${category})`,
        description: `Video grabado para la seña ${word} en la categoría ${category}`
      }
    });

    // Metadata JSON
    const metadataData = {
      word,
      category,
      recordedBy: 'Valentina Mora',
      recordedAt: new Date().toISOString(),
      fileName: fileName || `${cleanWord}.webm`,
      videoBase64: videoBase64
    };

    operations.push({
      key: 'file',
      value: {
        path: `${folderPath}/metadata.json`,
        content: JSON.stringify(metadataData, null, 2),
      }
    });

    // Enviar commit a Hugging Face
    const response = await fetch(`https://huggingface.co/api/models/${REPO_ID}/commit/main?create_pr=1`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/x-ndjson',
      },
      body: operations.map(x => JSON.stringify(x)).join('\n'),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Hugging Face API Error:", errorText);
      return res.status(response.status).json({ 
        error: 'Error subiendo grabación a Hugging Face', 
        status: response.status,
        details: errorText
      });
    }

    return res.status(200).json({
      success: true,
      repo: REPO_ID,
      path: folderPath
    });

  } catch (error: any) {
    console.error('Error procesando grabación de Valentina:', error);
    return res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
}
