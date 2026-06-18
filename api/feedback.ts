export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userType, feedbackType, userName, userEmail, text, wordSuggestion, gifBase64, gifName } = req.body;
    
    // El token de sugerencias o traducciones configurado en Vercel o local
    const HF_TOKEN = process.env.HF_SUGGESTIONS_TOKEN || process.env.HF_TRANSLATION_TOKEN || process.env.HF_TOKEN;
    const REPO_ID = process.env.HF_SUGGESTIONS_REPO || 'manosabiertas/Manos-Abiertas-LSC'; // Repositorio destino
    
    if (!HF_TOKEN) {
      console.warn("No se encontró ningún token de Hugging Face (HF_SUGGESTIONS_TOKEN o HF_TRANSLATION_TOKEN). Solo se simulará el envío.");
      // En desarrollo local sin token, simulamos éxito para no bloquear la UI
      return res.status(200).json({ success: true, simulated: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const folderName = `sugerencias/${timestamp}`;
    
    // Preparamos las operaciones para el commit de Hugging Face (formato array de objetos { key, value })
    const operations: any[] = [];

    // Añadir el encabezado del commit (summary)
    operations.push({
      key: 'header',
      value: {
        summary: `Nueva retroalimentación: ${feedbackType}`,
        description: `Enviado por ${userName || 'Anónimo'}`
      }
    });

    // 1. Añadir el archivo de texto con la información de la sugerencia
    const reportText = `
Nombre del Colaborador: ${userName || 'Anónimo'}
Email: ${userEmail || 'No proporcionado'}
Tipo de Usuario: ${userType}
Tipo de Feedback: ${feedbackType}
${wordSuggestion ? `Sugerencia de Seña: ${wordSuggestion}\n` : ''}
Comentarios:
${text}
    `.trim();

    operations.push({
      key: 'file',
      value: {
        path: `${folderName}/reporte.txt`,
        content: reportText,
      }
    });

    // 2. Si hay un GIF, añadir la operación en formato base64
    if (gifBase64) {
      // Remover el prefix 'data:image/gif;base64,'
      const base64Data = gifBase64.split(';base64,').pop();
      const safeGifName = gifName.replace(/[^a-zA-Z0-9.-]/g, '_'); // Sanitizar nombre
      
      operations.push({
        key: 'file',
        value: {
          path: `${folderName}/${safeGifName}`,
          content: base64Data,
          encoding: 'base64'
        }
      });
    }

    // Ejecutar el Commit hacia Hugging Face (Model Hub) - Crear Pull Request para moderación
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
        error: 'Error subiendo a Hugging Face', 
        status: response.status,
        details: errorText
      });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error procesando feedback:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
