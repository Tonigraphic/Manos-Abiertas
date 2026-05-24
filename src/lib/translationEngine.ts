/**
 * Motor de Traducción LSC a Español Estándar
 * Diseñado específicamente para convertir "español sordo" o estructuras de glosas LSC
 * a español gramaticalmente correcto con conectores, artículos y conjugación de verbos.
 */

interface Conjugations {
  present: string[];
  past: string[];
  future: string[];
}

const VERB_CONJUGATIONS: Record<string, Conjugations> = {
  ir: {
    present: ['voy', 'vas', 'va', 'vamos', 'van'],
    past: ['fui', 'fuiste', 'fue', 'fuimos', 'fueron'],
    future: ['iré', 'irás', 'irá', 'iremos', 'irán']
  },
  venir: {
    present: ['vengo', 'vienes', 'viene', 'venimos', 'vienen'],
    past: ['vine', 'viniste', 'vino', 'vinimos', 'vinieron'],
    future: ['vendré', 'vendrás', 'vendrá', 'vendremos', 'vendrán']
  },
  enviar: {
    present: ['envío', 'envías', 'envía', 'enviamos', 'envían'],
    past: ['envié', 'enviaste', 'envió', 'enviamos', 'enviaron'],
    future: ['enviaré', 'enviarás', 'enviará', 'enviaremos', 'enviarán']
  },
  solicitar: {
    present: ['solicito', 'solicitas', 'solicita', 'solicitamos', 'solicitan'],
    past: ['solicité', 'solicitaste', 'solicitó', 'solicitamos', 'solicitaron'],
    future: ['solicitaré', 'solicitarás', 'solicitará', 'solicitaremos', 'solicitarán']
  },
  mezclar: {
    present: ['mezclo', 'mezclas', 'mezcla', 'mezclamos', 'mezclan'],
    past: ['mezclé', 'mezclaste', 'mezcló', 'mezclamos', 'mezclaron'],
    future: ['mezclaré', 'mezclarás', 'mezclará', 'mezclaremos', 'mezclarán']
  },
  separar: {
    present: ['separo', 'separas', 'separa', 'separamos', 'separaran'],
    past: ['separé', 'separaste', 'separó', 'separamos', 'separaron'],
    future: ['separaré', 'separarás', 'separará', 'separaremos', 'separarán']
  },
  pintar: {
    present: ['pinto', 'pintas', 'pinta', 'pintamos', 'pintan'],
    past: ['pinté', 'pintaste', 'pintó', 'pintamos', 'pintaron'],
    future: ['pintaré', 'pintarás', 'pintará', 'pintaremos', 'pintarán']
  },
  necesitar: {
    present: ['necesito', 'necesitas', 'necesita', 'necesitamos', 'necesitan'],
    past: ['necesité', 'necesitaste', 'necesitó', 'necesitamos', 'necesitaron'],
    future: ['necesitaré', 'necesitarás', 'necesitará', 'necesitaremos', 'necesitarán']
  },
  querer: {
    present: ['quiero', 'quieres', 'quiere', 'queremos', 'quieren'],
    past: ['quise', 'quisiste', 'quiso', 'quisimos', 'quisieron'],
    future: ['querré', 'querrás', 'querrá', 'querremos', 'querrán']
  },
  hacer: {
    present: ['hago', 'haces', 'hace', 'hacemos', 'hacen'],
    past: ['hice', 'hiciste', 'hizo', 'hicimos', 'hicieron'],
    future: ['haré', 'harás', 'hará', 'haremos', 'harán']
  },
  estudiar: {
    present: ['estudio', 'estudias', 'estudia', 'estudiamos', 'estudian'],
    past: ['estudié', 'estudiaste', 'estudió', 'estudiamos', 'estudiaron'],
    future: ['estudiaré', 'estudiarás', 'estudiará', 'estudiaremos', 'estudiarán']
  },
  entender: {
    present: ['entiendo', 'entiendes', 'entiende', 'entendemos', 'entienden'],
    past: ['entendí', 'entendiste', 'entendió', 'entendimos', 'entendieron'],
    future: ['entenderé', 'entenderás', 'entenderá', 'entenderemos', 'entenderán']
  },
  explicar: {
    present: ['explico', 'explicas', 'explica', 'explicamos', 'explican'],
    past: ['expliqué', 'explicaste', 'explicó', 'explicamos', 'explicaron'],
    future: ['explicaré', 'explicarás', 'explicará', 'explicaremos', 'explicarán']
  },
  ver: {
    present: ['veo', 'ves', 've', 'vemos', 'ven'],
    past: ['vi', 'viste', 'vio', 'vimos', 'vieron'],
    future: ['veré', 'verás', 'verá', 'veremos', 'verán']
  },
  poder: {
    present: ['puedo', 'puedes', 'puede', 'podemos', 'pueden'],
    past: ['pude', 'pudiste', 'pudo', 'pudimos', 'pudieron'],
    future: ['podré', 'podrás', 'podrá', 'podremos', 'podrán']
  },
  aprender: {
    present: ['aprendo', 'aprendes', 'aprente', 'aprendemos', 'aprenden'],
    past: ['aprendí', 'aprendiste', 'aprendió', 'aprendimos', 'aprendieron'],
    future: ['aprenderé', 'aprenderás', 'aprenderá', 'aprenderemos', 'aprenderán']
  },
  estar: {
    present: ['estoy', 'estás', 'está', 'estamos', 'están'],
    past: ['estaba', 'estabas', 'estaba', 'estábamos', 'estaban'], // Imperfecto es más natural para condiciones pasadas
    future: ['estaré', 'estarás', 'estará', 'estaremos', 'estarán']
  },
  tener: {
    present: ['tengo', 'tienes', 'tiene', 'tenemos', 'tienen'],
    past: ['tenía', 'tenías', 'tenía', 'teníamos', 'tenían'], // Imperfecto es más natural
    future: ['tendré', 'tendrás', 'tendrá', 'tendremos', 'tendrán']
  },
  prestar: {
    present: ['presto', 'prestas', 'presta', 'prestamos', 'prestan'],
    past: ['presté', 'prestaste', 'prestó', 'prestamos', 'prestaron'],
    future: ['prestaré', 'prestarás', 'prestará', 'prestaremos', 'prestarán']
  }
};

const VERB_TO_INFINITIVE: Record<string, string> = {
  // ir
  voy: 'ir', vas: 'ir', va: 'ir', vamos: 'ir', van: 'ir',
  fui: 'ir', fuiste: 'ir', fue: 'ir', fuimos: 'ir', fueron: 'ir',
  iré: 'ir', irás: 'ir', irá: 'ir', iremos: 'ir', irán: 'ir',
  // venir
  vengo: 'venir', vienes: 'venir', viene: 'venir', venimos: 'venir', vienen: 'venir',
  vine: 'venir', viniste: 'venir', vino: 'venir', vinieron: 'venir',
  vendré: 'venir', vendrás: 'venir', vendrá: 'venir', vendremos: 'venir', vendrán: 'venir',
  // estar
  estoy: 'estar', estás: 'estar', está: 'estar', estamos: 'estar', están: 'estar',
  estuve: 'estar', estuviste: 'estar', estuvo: 'estar', estuvimos: 'estar', estuvieron: 'estar',
  estaba: 'estar', estabas: 'estar', estábamos: 'estar', estaban: 'estar',
  estaré: 'estar', estarás: 'estar', estará: 'estar', estaremos: 'estar', estarán: 'estar',
  // tener
  tengo: 'tener', tienes: 'tener', tiene: 'tener', tenemos: 'tener', tienen: 'tener',
  tuve: 'tener', tuviste: 'tener', tuvo: 'tener', tuvimos: 'tener', tuvieron: 'tener',
  tenía: 'tener', tenías: 'tener', teníamos: 'tener', tenían: 'tener',
  tendré: 'tener', tendrás: 'tener', tendrá: 'tener', tendremos: 'tener', tendrán: 'tener',
  // enviar
  envío: 'enviar', envías: 'enviar', envía: 'enviar', enviamos: 'enviar', envían: 'enviar',
  envié: 'enviar', enviaste: 'enviar', envió: 'enviar', enviaron: 'enviar',
  enviaré: 'enviar', enviarás: 'enviar', enviará: 'enviar', enviaremos: 'enviar', enviarán: 'enviar',
  // solicitar
  solicito: 'solicitar', solicitas: 'solicitar', solicita: 'solicitar', solicitamos: 'solicitar', solicitan: 'solicitar',
  solicité: 'solicitar', solicitaste: 'solicitar', solicitó: 'solicitar', solicitaron: 'solicitar',
  solicitaré: 'solicitar', solicitarás: 'solicitar', solicitará: 'solicitar', solicitaremos: 'solicitar', solicitarán: 'solicitar',
  // mezclar
  mezclo: 'mezclar', mezclas: 'mezclar', mezcla: 'mezclar', mezclamos: 'mezclar', mezclan: 'mezclar',
  mezclé: 'mezclar', mezclaste: 'mezclar', mezcló: 'mezclar', mezclaron: 'mezclar',
  mezclaré: 'mezclar', mezclarás: 'mezclar', mezclará: 'mezclar', mezclaremos: 'mezclar', mezclarán: 'mezclar',
  // necesitar
  necesito: 'necesitar', necesitas: 'necesitar', necesita: 'necesitar', necesitamos: 'necesitar', necesitan: 'necesitar',
  necesité: 'necesitar', necesitaste: 'necesitar', necesitó: 'necesitar', necesitaron: 'necesitar',
  necesitaré: 'necesitar', necesitarás: 'necesitar', necesitará: 'necesitar', necesitaremos: 'necesitar', necesitarán: 'necesitar',
  // querer
  quiero: 'querer', quieres: 'querer', quiere: 'querer', queremos: 'querer', quieren: 'querer',
  quise: 'querer', quisiste: 'querer', quiso: 'querer', quisimos: 'querer', quisieron: 'querer',
  querré: 'querer', querrás: 'querer', querrá: 'querer', querremos: 'querer', querrán: 'querer',
  // hacer
  hago: 'hacer', haces: 'hacer', hace: 'hacer', hacemos: 'hacer', hacen: 'hacer',
  hice: 'hacer', hiciste: 'hacer', hizo: 'hacer', hicimos: 'hacer', hicieron: 'hacer',
  haré: 'hacer', harás: 'hacer', hará: 'hacer', haremos: 'hacer', harán: 'hacer',
  // ver
  veo: 'ver', ves: 'ver', ve: 'ver', vemos: 'ver', ven: 'ver',
  vi: 'ver', viste: 'ver', vio: 'ver', vimos: 'ver', vieron: 'ver',
  veré: 'ver', verás: 'ver', verá: 'ver', veremos: 'ver', verán: 'ver',
  // poder
  puedo: 'poder', puedes: 'poder', puede: 'poder', podemos: 'poder', pueden: 'poder',
  pude: 'poder', pudiste: 'poder', pudo: 'poder', pudimos: 'poder', pudieron: 'poder',
  podré: 'poder', podrás: 'poder', podrá: 'poder', podremos: 'poder', podrán: 'poder',
  // prestar
  presto: 'prestar', prestas: 'prestar', presta: 'prestar', prestamos: 'prestar', prestan: 'prestar',
  presté: 'prestar', prestaste: 'prestar', prestó: 'prestar', prestaron: 'prestar',
  prestaré: 'prestar', prestarás: 'prestar', prestará: 'prestar', prestaremos: 'prestar', prestarán: 'prestar'
};

const SUBJECT_PRONOUNS = {
  yo: 0,
  nosotros: 3,
  nosotras: 3,
  tú: 1,
  usted: 1,
  él: 2,
  ella: 2,
  profesor: 2,
  profesora: 2,
  director: 2,
  directora: 2,
  estudiante: 2,
  estudiantes: 4,
  ellos: 4,
  ellas: 4
};

const CONJUGATED_TO_SUBJECT_INDEX: Record<string, number> = {
  // yo (0)
  voy: 0, fui: 0, iré: 0, vengo: 0, vine: 0, vendré: 0, estoy: 0, estuve: 0, estaba: 0,
  tengo: 0, tuve: 0, tenía: 0, envío: 0, envié: 0, enviaré: 0, solicito: 0, solicité: 0,
  solicitaré: 0, mezclo: 0, mezclé: 0, mezclaré: 0, necesito: 0, necesité: 0, necesitaré: 0,
  veo: 0, vi: 0, veré: 0, quiero: 0, quise: 0, querré: 0, hago: 0, hice: 0, haré: 0,
  // tú / usted (1)
  vas: 1, fuiste: 1, irás: 1, vienes: 1, viniste: 1, vendrás: 1, estás: 1, estuviste: 1,
  estabas: 1, tienes: 1, tuviste: 1, tenías: 1, envías: 1, enviaste: 1, enviarás: 1,
  // nosotros / nosotras (3)
  vamos: 3, fuimos: 3, iremos: 3, venimos: 3, vinimos: 3, vendremos: 3, estamos: 3,
  estuvimos: 3, estábamos: 3, tenemos: 3, tuvimos: 3, teníamos: 3, enviamos: 3,
  solicitamos: 3, mezclamos: 3, necesitamos: 3, queremos: 3, hacemos: 3,
  // ellos / ellas (4)
  van: 4, fueron: 4, irán: 4, vienen: 4, vinieron: 4, vendrán: 4, están: 4, estuvieron: 4,
  estaban: 4, tienen: 4, tuvieron: 4, tenían: 4, envían: 4, enviaron: 4, enviarán: 4
};

const TIME_INDICATORS = {
  ayer: 'past',
  pasado: 'past',
  anterior: 'past',
  antes: 'past',
  mañana: 'future',
  despues: 'future',
  después: 'future',
  luego: 'future',
  futuro: 'future',
  hoy: 'present',
  ahora: 'present',
  actual: 'present'
};

const PLACE_PREPOSITIONS: Record<string, string> = {
  casa: 'a mi casa',
  universidad: 'a la universidad',
  clase: 'a clase',
  oficina: 'a la oficina',
  departamento: 'al departamento',
  salon: 'al salón',
  salón: 'al salón',
  biblioteca: 'a la biblioteca',
  baño: 'al baño'
};

const NOUN_ARTICLES: Record<string, string> = {
  casa: 'la casa',
  tarea: 'la tarea',
  certificado: 'un certificado',
  horario: 'el horario',
  matricula: 'la matrícula',
  matrícula: 'la matrícula',
  proceso: 'el proceso',
  lapiz: 'un lápiz',
  lápiz: 'un lápiz',
  pincel: 'un pincel',
  agua: 'el agua',
  hojas: 'las hojas',
  capas: 'las capas',
  textura: 'la textura',
  perspectiva: 'la perspectiva',
  volumen: 'el volumen',
  materiales: 'los materiales',
  colores: 'los colores',
  color: 'el color',
  nombre: 'mi nombre',
  seña: 'mi seña',
  internet: 'internet',
  pelicula: 'una película',
  película: 'una película',
  bus: 'el bus'
};

const CLITIC_PRONOUNS = new Set(['me', 'te', 'se', 'nos', 'os', 'lo', 'la', 'los', 'las', 'le', 'les']);
const QUANTITY_MODIFIERS = new Set(['poco', 'poca', 'pocos', 'pocas', 'mucho', 'mucha', 'muchos', 'muchas', 'algo', 'nada', 'vario', 'varios', 'varia', 'varias']);
const INFINITIVE_COMPLEMENTS = new Set(['ver', 'querer', 'poder', 'necesitar', 'ir', 'venir', 'hacer', 'decir', 'dar', 'ayudar', 'prestar', 'explicar', 'solicitar', 'aprender', 'entender']);

const DICCIONARIO_FRASES: Record<string, string> = {
  'gracias': '¡Muchas gracias!',
  'gracias profesor': 'Muchas gracias, profesor.',
  'gracias profesora': 'Muchas gracias, profesora.',
  'hola': '¡Hola!',
  'horario clase': 'El horario de clase.',
  'horario de clase': 'El horario de clase.',
  'horario materia': 'El horario de la materia.',
  'horario de materia': 'El horario de la materia.',
  'proceso matricula': 'El proceso de matrícula.',
  'proceso de matricula': 'El proceso de matrícula.',
  'proceso de matrícula': 'El proceso de matrícula.',
  'matricula academica': 'El proceso de matrícula académica.',
  'matrícula académica': 'El proceso de matrícula académica.',
  'matricula financiera': 'El proceso de matrícula financiera.',
  'matrícula financiera': 'El proceso de matrícula financiera.',
  'matricula materias': 'La matrícula de materias.',
  'matrícula materias': 'La matrícula de materias.',
  'solicitar certificado': 'Solicitar un certificado académico.',
  'enviar tarea': 'Enviar la tarea.',
  'mi nombre': 'Hola, mi nombre es...',
  'mi seña': 'Mi seña es...'
};

const COLORES = [
  'amarillo', 'azul', 'rojo', 'blanco', 'negro', 'morado', 'naranja', 'violeta', 'gris', 'cafe', 'café', 'crema', 'verde'
];

const REASON_ADJECTIVES = ['enfermo', 'enferma', 'cansado', 'cansada', 'ocupado', 'ocupada', 'triste', 'tarde', 'preocupado', 'preocupada'];
const REASON_NOUNS = ['problema', 'problemas', 'internet', 'lluvia', 'dificultad', 'luz', 'energia', 'energía'];

function looksAlreadyConventionalSpanish(input: string): boolean {
  const normalized = input
    .toLowerCase()
    .replace(/[¿?¡!.,;:_]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return false;

  const words = normalized.split(' ');
  const hasFiniteVerb = words.some(word => word in VERB_TO_INFINITIVE || word in CONJUGATED_TO_SUBJECT_INDEX);
  const hasArticle = words.some(word => ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas'].includes(word));
  const hasTypicalLSCMarkers = words.some(word => ['yo', 'tú', 'usted', 'porque', 'me', 'te', 'nos'].includes(word));
  const hasQuestionCue = /^¿|^(que|qué|como|cómo|cuando|cuándo|donde|dónde|por qué|por que)\b/.test(input.trim().toLowerCase());

  return (hasFiniteVerb && hasArticle && !hasTypicalLSCMarkers) || (hasFiniteVerb && hasQuestionCue && !hasTypicalLSCMarkers);
}

function articleForWord(word: string): string {
  if (word in NOUN_ARTICLES) return NOUN_ARTICLES[word];

  const lower = word.toLowerCase();
  const startsWithA = /^[aá]/.test(lower);
  const startsWithO = /^[oó]/.test(lower);

  if (startsWithA) return `una ${word}`;
  if (startsWithO) return `un ${word}`;
  return `un ${word}`;
}

function detectSimpleIntentPattern(wordsRaw: string[]): string | null {
  if (wordsRaw.length < 2) return null;

  const first = wordsRaw[0];
  const second = wordsRaw[1];
  const third = wordsRaw[2];
  const fourth = wordsRaw[3];

  if (first === 'no' && second === 'quiero' && third === 'ver' && fourth) {
    return `No quiero ver ${articleForWord(fourth)}.`;
  }

  if (first === 'no' && second === 'quiero' && third) {
    return `No quiero ${articleForWord(third)}.`;
  }

  if (first === 'no' && second === 'necesito' && third) {
    return `No necesito ${articleForWord(third)}.`;
  }

  if (first === 'no' && second === 'puedo' && third) {
    return `No puedo ${third}${fourth ? ` ${articleForWord(fourth)}` : ''}.`;
  }

  if (first === 'quiero' && second === 'ver' && third) {
    return `Quiero ver ${articleForWord(third)}.`;
  }

  if (first === 'quiero' && second === 'ver' && third && fourth) {
    return `Quiero ver ${articleForWord(third)} ${articleForWord(fourth)}.`;
  }

  if (first === 'quiero' && second && !INFINITIVE_COMPLEMENTS.has(second)) {
    return `Quiero ${articleForWord(second)}.`;
  }

  if (first === 'quiero' && second && INFINITIVE_COMPLEMENTS.has(second) && third) {
    return `Quiero ${second} ${articleForWord(third)}.`;
  }

  if (first === 'necesito' && second && !INFINITIVE_COMPLEMENTS.has(second)) {
    return `Necesito ${articleForWord(second)}.`;
  }

  if ((first === 'necesito' || first === 'quiero') && second && INFINITIVE_COMPLEMENTS.has(second) && third) {
    const tail = fourth ? `${articleForWord(third)} ${articleForWord(fourth)}` : articleForWord(third);
    return `${first.charAt(0).toUpperCase() + first.slice(1)} ${second} ${tail}.`;
  }

  return null;
}

/**
 * Traduce una frase en estructura LSC (sin conectores) a español estándar correcto.
 */
export function translateLSCtoSpanish(input: string): string {
  if (!input || !input.trim()) return '';

  if (looksAlreadyConventionalSpanish(input)) {
    const cleanedStandard = input.replace(/\s+/g, ' ').trim();
    return applyPragmaticCorrections(cleanedStandard.charAt(0).toUpperCase() + cleanedStandard.slice(1));
  }

  const normalizedLineBreaks = input.replace(/\r\n/g, '\n').trim();
  const paragraphBlocks = normalizedLineBreaks
    .split(/\n{2,}/)
    .map(block => block.trim())
    .filter(Boolean);

  if (paragraphBlocks.length > 1) {
    const translatedParagraphs = paragraphBlocks
      .map(block => translateLSCtoSpanish(block))
      .filter(Boolean);

    return translatedParagraphs.join('\n\n');
  }

  const structuredSegments = splitStructuredSegments(input);
  if (structuredSegments.length > 1) {
    const translatedSegments = structuredSegments
      .map(segment => translateLSCtoSpanish(segment))
      .filter(Boolean);

    return translatedSegments.join(' ');
  }

  const cleanInput = input
    .toLowerCase()
    .replace(/[¿?¡!.,;:_]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanInput) return '';

  // 1. Verificar coincidencia directa en el diccionario
  if (DICCIONARIO_FRASES[cleanInput]) {
    return DICCIONARIO_FRASES[cleanInput];
  }

  // 2. Comprobación especial para saludos estructurados como "hola mi nombre [nombre]"
  if (cleanInput.startsWith('hola mi nombre ')) {
    const name = input.trim().split(/\s+/).slice(3).join(' ');
    if (name) {
      return `¡Hola! Mi nombre es ${name}.`;
    }
  }
  if (cleanInput.startsWith('mi nombre ')) {
    const name = input.trim().split(/\s+/).slice(2).join(' ');
    if (name) {
      return `Mi nombre es ${name}.`;
    }
  }
  if (cleanInput.startsWith('mi seña ')) {
    const sign = input.trim().split(/\s+/).slice(2).join(' ');
    if (sign) {
      return `Mi seña es ${sign}.`;
    }
  }

  // 3. Regla especial para mezcla de colores
  // Formato: "azul mezclar amarillo verde" -> "Al mezclar azul y amarillo se obtiene verde."
  const wordsRaw = cleanInput.split(' ');

  const simpleIntent = detectSimpleIntentPattern(wordsRaw);
  if (simpleIntent) {
    return applyPragmaticCorrections(simpleIntent);
  }

  const conjugatedRequest = detectConjugatedRequestPattern(wordsRaw);
  if (conjugatedRequest) {
    return applyPragmaticCorrections(conjugatedRequest);
  }

  const requestPattern = detectRequestPattern(wordsRaw);
  if (requestPattern) {
    const leadingText = requestPattern.leadingText ? translateLSCtoSpanish(requestPattern.leadingText) : '';
    const requestText = formatRequestClause(requestPattern.requestWords);

    if (leadingText && requestText) {
      return applyPragmaticCorrections(`${stripTrailingPunctuation(leadingText)}, ${requestText}`);
    }
    if (requestText) {
      return applyPragmaticCorrections(requestText);
    }
  }

  const containsMezclar = wordsRaw.includes('mezclar') || wordsRaw.includes('mezcla');
  if (containsMezclar) {
    const detectedColors = wordsRaw.filter(word => COLORES.includes(word));
    if (detectedColors.length >= 3) {
      const c1 = detectedColors[0];
      const c2 = detectedColors[1];
      const c3 = detectedColors[2];
      return `Al mezclar ${c1} y ${c2} se obtiene ${c3}.`;
    } else if (detectedColors.length === 2) {
      return `Mezclar ${detectedColors[0]} con ${detectedColors[1]}.`;
    }
  }

  // 4. Normalizar palabras mapeando conjugados a infinitivos para simplificar la lógica
  const words = wordsRaw.map(w => VERB_TO_INFINITIVE[w] || w);

  // 5. Analizar tokens para encontrar Sujeto, Tiempo y Negaciones generales de la frase
  let subjectIndex = 2; // Por defecto: 3ª persona singular
  let subjectWord = '';
  let tense: 'present' | 'past' | 'future' = 'present';

  // Buscar sujeto implícito en verbos conjugados de la frase original (wordsRaw)
  for (const word of wordsRaw) {
    if (word in CONJUGATED_TO_SUBJECT_INDEX) {
      subjectIndex = CONJUGATED_TO_SUBJECT_INDEX[word];
      if (subjectIndex === 0) subjectWord = 'yo';
      else if (subjectIndex === 3) subjectWord = 'nosotros';
    }
  }

  // Sobrescribir si hay pronombres explícitos o marcadores temporales
  for (const word of words) {
    if (word in SUBJECT_PRONOUNS) {
      subjectIndex = SUBJECT_PRONOUNS[word as keyof typeof SUBJECT_PRONOUNS];
      subjectWord = word;
    }
    if (word in TIME_INDICATORS) {
      tense = TIME_INDICATORS[word as keyof typeof TIME_INDICATORS] as 'present' | 'past' | 'future';
    }
  }

  // 6. DETECTOR DE CLÁUSULAS CAUSALES / RAZÓN (porque)
  // Sólo parte la frase cuando hay una causa explícita; evita inventar un "porque".
  let splitIdx = -1;
  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    if (word === 'porque') {
      splitIdx = i;
      break;
    }
    if (word === 'no' && i + 1 < words.length && REASON_NOUNS.includes(words[i + 1])) {
      splitIdx = i;
      break;
    }
    if (word === 'sin' && i + 1 < words.length && REASON_NOUNS.includes(words[i + 1])) {
      splitIdx = i;
      break;
    }
    if ((word === 'problema' || word === 'problemas') && i + 1 < words.length) {
      splitIdx = i;
      break;
    }
  }

  if (splitIdx !== -1) {
    const clause1Words = words.slice(0, splitIdx);
    let clause2Words = words.slice(splitIdx);

    // Ajustar cláusula 2 si inicia directamente con un adjetivo o sustantivo de razón
    if (clause2Words[0] === 'porque') {
      clause2Words.shift();
    }
    if (REASON_ADJECTIVES.includes(clause2Words[0])) {
      clause2Words.unshift('estar');
    }
    // Si la cláusula 2 es del tipo "no internet" o "sin luz", transformarla a "no tener internet"
    if (clause2Words[0] === 'no' && clause2Words.length > 1 && REASON_NOUNS.includes(clause2Words[1])) {
      const noun = clause2Words[1];
      clause2Words = ['no', 'tener', noun, ...clause2Words.slice(2)];
    } else if (clause2Words[0] === 'sin' && clause2Words.length > 1 && REASON_NOUNS.includes(clause2Words[1])) {
      const noun = clause2Words[1];
      clause2Words = ['no', 'tener', noun, ...clause2Words.slice(2)];
    } else if (clause2Words[0] === 'problema' || clause2Words[0] === 'problemas') {
      if (clause2Words.length > 1) {
        clause2Words = ['tener', 'problemas', 'con', ...clause2Words.slice(1)];
      } else {
        clause2Words = ['tener', 'problemas'];
      }
    }

    // Buscar si hay marcador de tiempo en la cláusula 1
    const timeMarkerWord = clause1Words.find(w => w in TIME_INDICATORS);
    // Filtrar el marcador de tiempo de clause1Words para que no se procese doble
    const clause1WordsFiltered = clause1Words.filter(w => !(w in TIME_INDICATORS));

    let trans1 = translateSingleClause(clause1WordsFiltered, subjectIndex, subjectWord, tense, true);
    const trans2 = translateSingleClause(clause2Words, subjectIndex, subjectWord, tense, false);

    if (timeMarkerWord) {
      trans1 = `${trans1} ${timeMarkerWord}`;
    }

    // Combinar con la conjunción "porque"
    if (trans1 && trans2) {
      let output = `${trans1} porque ${trans2}`;

      // Limpieza y formato final
      output = output.replace(/\s+/g, ' ').trim();
      output = output.charAt(0).toUpperCase() + output.slice(1);
      if (!output.endsWith('.')) {
        output += '.';
      }
      return output;
    }
  }

  // 7. Traducción de cláusula única
  let output = translateSingleClause(words, subjectIndex, subjectWord, tense, true);

  // Mover marcador de tiempo al final
  const timeMarkerWord = words.find(w => w in TIME_INDICATORS);
  if (timeMarkerWord) {
    output = `${output} ${timeMarkerWord}`;
  }

  // Limpieza y formato final
  output = output.replace(/\s+/g, ' ').trim();
  if (output) {
    output = output.charAt(0).toUpperCase() + output.slice(1);
    if (!output.endsWith('.')) {
      output += '.';
    }
  }

  return applyPragmaticCorrections(output || (input.charAt(0).toUpperCase() + input.slice(1)));
}

function stripTrailingPunctuation(text: string): string {
  return text.replace(/[.?!,;:]+$/g, '').trim();
}

function detectRequestPattern(wordsRaw: string[]): { leadingText: string; requestWords: string[] } | null {
  const requestVerbs = new Set(['prestar', 'dar', 'ayudar', 'pasar', 'decir', 'explicar']);
  const powerForms = new Set(['puedo', 'puedes', 'puede', 'podemos', 'pueden', 'podría', 'podrías', 'podria', 'podrian']);
  const requestConjugations = new Set(['ayudas', 'ayuda', 'ayudan', 'explicas', 'explica', 'explican', 'das', 'da', 'dan', 'prestas', 'presta', 'prestan']);

  const requestRegex = /(?:^|\s)(me|te|nos|le|les)\s+(puedo|puedes|puede|podemos|pueden|podría|podrías|podria|podrian)\s+(prestar|dar|ayudar|pasar|decir|explicar)(?:\s+([\p{L}\p{N}]+))?/u;
  const normalized = wordsRaw.join(' ');
  const regexMatch = normalized.match(requestRegex);
  if (regexMatch && regexMatch.index !== undefined) {
    const leading = normalized.slice(0, regexMatch.index).trim();
    const requestWords = [regexMatch[1], regexMatch[2], regexMatch[3], regexMatch[4]].filter(Boolean) as string[];
    return {
      leadingText: leading,
      requestWords
    };
  }

  for (let i = 0; i < wordsRaw.length - 2; i++) {
    const first = wordsRaw[i];
    const second = wordsRaw[i + 1];
    const third = wordsRaw[i + 2];

    if (first !== 'me' && first !== 'te' && first !== 'nos' && first !== 'le' && first !== 'les') {
      continue;
    }

    if (!powerForms.has(second)) {
      continue;
    }

    if (!requestVerbs.has(third)) {
      continue;
    }

    const leading = wordsRaw.slice(0, i).join(' ').trim();
    const requestWords = wordsRaw.slice(i).filter(Boolean);
    return {
      leadingText: leading,
      requestWords
    };
  }

  const shortRequestIndex = wordsRaw.findIndex((word, index) => {
    if (!requestVerbs.has(word)) return false;
    const prev = wordsRaw[index - 1];
    return prev === 'me' || prev === 'te' || prev === 'nos' || prev === 'le' || prev === 'les';
  });

  if (shortRequestIndex === -1) return null;

  const leading = wordsRaw.slice(0, shortRequestIndex - 1).join(' ').trim();
  const requestWords = wordsRaw.slice(shortRequestIndex - 1).filter(Boolean);
  if (!requestWords.length) return null;

  return {
    leadingText: leading,
    requestWords
  };
}

function detectConjugatedRequestPattern(wordsRaw: string[]): string | null {
  if (wordsRaw.length < 2) return null;

  const first = wordsRaw[0];
  const second = wordsRaw[1];
  const third = wordsRaw[2];
  const requestVerbs = new Set(['ayudas', 'ayuda', 'ayudan', 'explicas', 'explica', 'explican', 'das', 'da', 'dan', 'prestas', 'presta', 'prestan', 'dices', 'dice', 'dicen', 'pasas', 'pasa', 'pasan']);

  if (first === 'me' && requestVerbs.has(second)) {
    if (third) {
      return `¿Me ${second} ${articleForWord(third)}?`;
    }
    return `¿Me ${second}?`;
  }

  if (first === 'me' && second === 'puedes') {
    const tailVerb = wordsRaw[2];
    const tail = wordsRaw[3];
    if (tailVerb === 'prestar') {
      return tail ? `¿Me puedes prestar ${articleForWord(tail)}?` : '¿Me puedes prestar?';
    }
    if (tailVerb && INFINITIVE_COMPLEMENTS.has(tailVerb)) {
      return tail ? `¿Me puedes ${tailVerb} ${articleForWord(tail)}?` : `¿Me puedes ${tailVerb}?`;
    }
  }

  return null;
}

function formatRequestClause(requestWords: string[]): string {
  const normalized = requestWords.join(' ').replace(/\s+/g, ' ').trim();
  if (!normalized) return '';

  const words = normalized.split(' ');
  const hasMe = words.includes('me');
  const hasPuedes = words.includes('puedes') || words.includes('podrías') || words.includes('podria') || words.includes('podrían') || words.includes('podrian');
  const hasPrestar = words.includes('prestar') || words.includes('prestas') || words.includes('prestes');

  if (hasMe && hasPuedes && hasPrestar) {
    const tail = words.slice(3).join(' ').trim();
    return tail ? `¿Me puedes prestar ${tail}?` : '¿Me puedes prestar?';
  }

  if (hasMe && hasPuedes) {
    const tailVerb = words.find(word => word in VERB_TO_INFINITIVE && word !== 'poder');
    if (tailVerb) {
      const verbRoot = VERB_TO_INFINITIVE[tailVerb] || tailVerb;
      const tail = words.slice(words.indexOf(tailVerb) + 1).join(' ').trim();
      return tail ? `¿Me puedes ${verbRoot} ${tail}?` : `¿Me puedes ${verbRoot}?`;
    }
  }

  const translated = translateSingleClause(
    words.map(w => VERB_TO_INFINITIVE[w] || w),
    words.includes('yo') ? 0 : 1,
    words.includes('yo') ? 'yo' : '',
    'present',
    false
  );

  if (!translated) return '';

  const cleaned = stripTrailingPunctuation(translated);
  return cleaned.endsWith('?') ? cleaned : `¿${cleaned}?`;
}

function applyPragmaticCorrections(text: string): string {
  let output = text;

  output = output.replace(/\bme\s+puedo\s+presto\b/gi, '¿Me puedes prestar?');
  output = output.replace(/\bme\s+puedo\s+prestar\b/gi, '¿Me puedes prestar?');
  output = output.replace(/\bme\s+puedo\s+dar\b/gi, '¿Me puedes dar?');
  output = output.replace(/\bme\s+puedo\s+ayudar\b/gi, '¿Me puedes ayudar?');
  output = output.replace(/\bpara\s+bus\b/gi, 'para el bus');
  output = output.replace(/\b([a-záéíóúñ]+)\s+y\s+(un|una|el|la|los|las)\b/gi, '$1 $2');
  output = output.replace(/\b(un|una|el|la|los|las)\s+y\s+\1\b/gi, '$1');

  if (/^yo\s+tengo\b/i.test(output)) {
    output = output.replace(/^yo\s+tengo\b/i, 'Tengo');
  }

  output = output.replace(/\s+/g, ' ').trim();
  if (output && !/[.?!]$/.test(output)) {
    output += '.';
  }

  return output;
}

const CLAUSE_BREAKERS = new Set(['pero', 'aunque', 'si', 'cuando', 'entonces', 'mientras']);

function splitStructuredSegments(input: string): string[] {
  const normalized = input
    .replace(/\r\n/g, '\n')
    .trim();

  if (!normalized) return [];

  const paragraphBlocks = normalized
    .split(/\n{2,}/)
    .map(block => block.trim())
    .filter(Boolean);

  const segments: string[] = [];

  for (const paragraph of paragraphBlocks) {
    const sentenceParts = paragraph
      .split(/[\n.!?;]+/g)
      .map(part => part.trim())
      .filter(Boolean);

    for (const sentence of sentenceParts) {
      segments.push(...splitLongClauseSegments(sentence));
    }
  }

  return segments;
}

function splitLongClauseSegments(sentence: string): string[] {
  const normalized = sentence
    .toLowerCase()
    .replace(/[¿?¡!.,;:_]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return [];

  const words = normalized.split(' ');
  const verbCount = words.filter(word => word in VERB_CONJUGATIONS).length;
  const hasBoundaryWord = words.some(word => CLAUSE_BREAKERS.has(word));

  if (words.length <= 10 && verbCount <= 1 && !hasBoundaryWord) {
    return [sentence.trim()];
  }

  const segments: string[] = [];
  let current: string[] = [];
  let verbsInCurrent = 0;

  for (const word of words) {
    const isBoundaryWord = CLAUSE_BREAKERS.has(word);
    const isVerb = word in VERB_CONJUGATIONS;

    if (isBoundaryWord && current.length > 0) {
      segments.push(current.join(' '));
      current = [word];
      verbsInCurrent = 0;
      continue;
    }

    if (isVerb) {
      verbsInCurrent += 1;
      if (verbsInCurrent > 1 && current.length >= 4) {
        segments.push(current.join(' '));
        current = [word];
        verbsInCurrent = 1;
        continue;
      }
    }

    current.push(word);
  }

  if (current.length > 0) {
    segments.push(current.join(' '));
  }

  return segments.length > 0 ? segments : [sentence.trim()];
}

/**
 * Formatea una lista de elementos uniendo con comas y la conjunción "y".
 */
function formatList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} y ${items[1]}`;
  const last = items.pop();
  return `${items.join(', ')} y ${last}`;
}

/**
 * Traduce una cláusula individual de la frase.
 */
function translateSingleClause(
  words: string[],
  subjectIndex: number,
  subjectWord: string,
  tense: 'present' | 'past' | 'future',
  includeSubject: boolean
): string {
  const resultWords: string[] = [];
  let hasNegation = false;

  // Combinar preposiciones con la palabra siguiente (ej: "con" + "internet" -> "con internet")
  const processedWords: string[] = [];
  for (let i = 0; i < words.length; i++) {
    if ((words[i] === 'con' || words[i] === 'de' || words[i] === 'a') && i + 1 < words.length) {
      processedWords.push(`${words[i]} ${words[i + 1]}`);
      i++;
    } else {
      processedWords.push(words[i]);
    }
  }

  // Agregar pronombre o sujeto al inicio si includeSubject es verdadero
  if (includeSubject && subjectWord) {
    const isPronoun = ['yo', 'nosotros', 'nosotras', 'él', 'ella', 'ellos', 'ellas', 'tú', 'usted'].includes(subjectWord);
    // Solo imprimir si es un sustantivo común o si el pronombre explícitamente existe en el texto de entrada
    const shouldPrint = !isPronoun || words.includes(subjectWord);

    if (shouldPrint) {
      if (subjectWord === 'yo') {
        resultWords.push('Yo');
      } else if (subjectWord === 'nosotros' || subjectWord === 'nosotras') {
        resultWords.push(subjectWord.charAt(0).toUpperCase() + subjectWord.slice(1));
      } else if (subjectWord === 'él' || subjectWord === 'ella') {
        resultWords.push(subjectWord.charAt(0).toUpperCase() + subjectWord.slice(1));
      } else if (subjectWord === 'ellos' || subjectWord === 'ellas') {
        resultWords.push(subjectWord.charAt(0).toUpperCase() + subjectWord.slice(1));
      } else if (subjectWord === 'profesor' || subjectWord === 'profesora') {
        resultWords.push(subjectWord === 'profesor' ? 'El profesor' : 'La profesora');
      } else if (subjectWord === 'estudiante') {
        resultWords.push('El estudiante');
      } else if (subjectWord === 'estudiantes') {
        resultWords.push('Los estudiantes');
      }
    }
  }

  let verbProcessed = false;
  let complementChain = false;
  const listItems: string[] = [];
  const objectItems: string[] = [];

  for (let i = 0; i < processedWords.length; i++) {
    const word = processedWords[i];
    const nextWord = processedWords[i + 1];

    // Ignorar pronombres de sujeto ya procesados y marcadores de tiempo (los coloca translateLSCtoSpanish al final)
    if (word === subjectWord || word === 'no') {
      if (word === 'no') hasNegation = true;
      continue;
    }

    if (CLITIC_PRONOUNS.has(word)) {
      resultWords.push(word);
      continue;
    }

    if (QUANTITY_MODIFIERS.has(word) && nextWord && !(nextWord in VERB_CONJUGATIONS)) {
      const quantityPhrase = `${word} ${nextWord}`;
      if (verbProcessed) {
        objectItems.push(quantityPhrase);
      } else {
        listItems.push(quantityPhrase);
      }
      i++;
      continue;
    }

    if (verbProcessed && (INFINITIVE_COMPLEMENTS.has(word) || /^[a-záéíóúñ]+(ar|er|ir)$/.test(word))) {
      resultWords.push(word);
      complementChain = true;
      continue;
    }

    if (complementChain && (word in NOUN_ARTICLES || word in PLACE_PREPOSITIONS || /^[\p{L}][\p{L}\p{N}'-]*$/u.test(word))) {
      resultWords.push(word in NOUN_ARTICLES ? NOUN_ARTICLES[word] : word in PLACE_PREPOSITIONS ? PLACE_PREPOSITIONS[word] : word);
      continue;
    }

    // Si el token es una frase preposicional unida (ej: "con internet" o "de clase"), colocarla directamente en el flujo principal
    if (word.startsWith('con ') || word.startsWith('de ') || word.startsWith('a ')) {
      if (objectItems.length > 0) {
        const objectsStr = formatList(objectItems);
        resultWords.push(objectsStr);
        objectItems.length = 0;
      }
      resultWords.push(word);
      continue;
    }

    if (word === 'para' && nextWord) {
      if (objectItems.length > 0) {
        const objectsStr = formatList(objectItems);
        resultWords.push(objectsStr);
        objectItems.length = 0;
      }

      resultWords.push(nextWord in NOUN_ARTICLES ? `para ${NOUN_ARTICLES[nextWord]}` : `para ${nextWord}`);
      i++;
      continue;
    }

    // Si es un verbo, conjugarlo
    if (word in VERB_CONJUGATIONS) {
      const conjugations = VERB_CONJUGATIONS[word];
      const conjugatedVerb = conjugations[tense][subjectIndex];
      
      if (hasNegation) {
        resultWords.push('no');
        hasNegation = false; // Negación consumida
      }
      resultWords.push(conjugatedVerb);
      verbProcessed = true;

      // Si el verbo es "ir" o "venir", verificar si la siguiente palabra es un lugar para añadir preposición
      const nextWord = processedWords[i + 1];
      if ((word === 'ir' || word === 'venir') && nextWord && nextWord in PLACE_PREPOSITIONS) {
        resultWords.push(PLACE_PREPOSITIONS[nextWord]);
        i++; // Saltar palabra de lugar ya que fue consumida
      }
      continue;
    }

    // Tratar palabras de lugar aisladas (si no fueron consumidas por el verbo "ir")
    if (word in PLACE_PREPOSITIONS) {
      if (verbProcessed) {
        resultWords.push(PLACE_PREPOSITIONS[word]);
      } else {
        listItems.push(PLACE_PREPOSITIONS[word]);
      }
      continue;
    }

    // Agregar artículos a sustantivos comunes
    if (word in NOUN_ARTICLES) {
      if (verbProcessed) {
        resultWords.push(NOUN_ARTICLES[word]);
      } else {
        listItems.push(NOUN_ARTICLES[word]);
      }
      continue;
    }

    // Ignorar marcadores temporales ya procesados
    if (word in TIME_INDICATORS) {
      continue;
    }

    // Palabras desconocidas o nombres propios
    if (verbProcessed) {
      resultWords.push(word);
    } else {
      listItems.push(word);
    }
  }

  // Si hay objetos acumulados antes del final, formatearlos e insertarlos
  if (objectItems.length > 0) {
    const objectsStr = formatList(objectItems);
    resultWords.push(objectsStr);
  }

  // Si no se procesó ningún verbo pero tenemos una lista de sustantivos comunes
  if (!verbProcessed && listItems.length > 0) {
    let listStr = formatList(listItems);
    if (hasNegation) {
      listStr = 'no ' + listStr;
    }
    resultWords.push(listStr);
  } else if (hasNegation && resultWords.length > 0) {
    resultWords.unshift('no');
  }

  return resultWords.join(' ');
}
