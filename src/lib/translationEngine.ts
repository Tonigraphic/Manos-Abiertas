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
  aprender: {
    present: ['aprendo', 'aprendes', 'aprende', 'aprendemos', 'aprenden'],
    past: ['aprendí', 'aprendiste', 'aprendió', 'aprendimos', 'aprendieron'],
    future: ['aprenderé', 'aprenderás', 'aprenderá', 'aprenderemos', 'aprenderán']
  }
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
  seña: 'mi seña'
};

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

/**
 * Traduce una frase en estructura LSC (sin conectores) a español estándar correcto.
 */
export function translateLSCtoSpanish(input: string): string {
  if (!input || !input.trim()) return '';

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
  const words = cleanInput.split(' ');
  const containsMezclar = words.includes('mezclar');
  if (containsMezclar) {
    const detectedColors = words.filter(word => COLORES.includes(word));
    if (detectedColors.length >= 3) {
      const c1 = detectedColors[0];
      const c2 = detectedColors[1];
      const c3 = detectedColors[2];
      // Capitalizar colores para la salida
      const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
      return `Al mezclar ${c1} y ${c2} se obtiene ${c3}.`;
    } else if (detectedColors.length === 2) {
      return `Mezclar ${detectedColors[0]} con ${detectedColors[1]}.`;
    }
  }

  // 4. Procesamiento general basado en reglas (Sujeto + Tiempo + Verbo + Objetos)
  let subjectIndex = 2; // Por defecto: 3ª persona singular (él/ella/eso)
  let subjectWord = '';
  let tense: 'present' | 'past' | 'future' = 'present';
  let hasNegation = false;

  // Analizar tokens para encontrar Sujeto, Tiempo y Negaciones
  for (const word of words) {
    if (word === 'no') {
      hasNegation = true;
      continue;
    }
    if (word in SUBJECT_PRONOUNS) {
      subjectIndex = SUBJECT_PRONOUNS[word as keyof typeof SUBJECT_PRONOUNS];
      subjectWord = word;
    }
    if (word in TIME_INDICATORS) {
      tense = TIME_INDICATORS[word as keyof typeof TIME_INDICATORS] as 'present' | 'past' | 'future';
    }
  }

  const resultWords: string[] = [];

  // Agregar sujeto al inicio si es un pronombre personal explícito
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

  let verbProcessed = false;
  const listItems: string[] = [];
  const objectItems: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Ignorar pronombres de sujeto ya procesados y marcadores de tiempo (los colocaremos al final o los absorberá la conjugación)
    if (word === subjectWord || word === 'no') {
      continue;
    }

    // Si es un verbo, conjugarlo
    if (word in VERB_CONJUGATIONS) {
      const conjugations = VERB_CONJUGATIONS[word];
      const conjugatedVerb = conjugations[tense][subjectIndex];
      
      if (hasNegation) {
        resultWords.push('no');
        hasNegation = false; // Ya consumido
      }
      resultWords.push(conjugatedVerb);
      verbProcessed = true;

      // Si el verbo es "ir", verificar si la siguiente palabra es un lugar para añadir preposición
      const nextWord = words[i + 1];
      if (word === 'ir' && nextWord && nextWord in PLACE_PREPOSITIONS) {
        resultWords.push(PLACE_PREPOSITIONS[nextWord]);
        i++; // Saltar la palabra del lugar ya que se incluyó en la preposición
      }
      continue;
    }

    // Tratar palabras de lugar aisladas (si no fueron consumidas por el verbo "ir")
    if (word in PLACE_PREPOSITIONS) {
      if (verbProcessed) {
        objectItems.push(PLACE_PREPOSITIONS[word]);
      } else {
        listItems.push(PLACE_PREPOSITIONS[word]);
      }
      continue;
    }

    // Agregar artículos a sustantivos comunes
    if (word in NOUN_ARTICLES) {
      // Si ya hay un verbo, se considera un objeto directo, de lo contrario se guarda para posible lista
      if (verbProcessed) {
        objectItems.push(NOUN_ARTICLES[word]);
      } else {
        listItems.push(NOUN_ARTICLES[word]);
      }
      continue;
    }

    // Evitar añadir marcadores de tiempo de forma literal si ya definieron el tiempo del verbo,
    // excepto si están en palabras clave o al final. Los dejamos pasar al final de la frase.
    if (word in TIME_INDICATORS) {
      continue;
    }

    // Palabras desconocidas o nombres propios se añaden directamente
    if (verbProcessed) {
      objectItems.push(word);
    } else {
      listItems.push(word);
    }
  }

  // Si hay objetos recolectados después del verbo, formatearlos como lista y agregarlos a resultWords
  if (objectItems.length > 0) {
    let objectsStr = '';
    if (objectItems.length === 1) {
      objectsStr = objectItems[0];
    } else if (objectItems.length === 2) {
      objectsStr = `${objectItems[0]} y ${objectItems[1]}`;
    } else {
      const last = objectItems.pop();
      objectsStr = `${objectItems.join(', ') || ''} y ${last}`;
    }
    resultWords.push(objectsStr);
  }

  // Si no se procesó ningún verbo pero tenemos una lista de sustantivos comunes, unirlos con comas y "y"
  if (!verbProcessed && listItems.length > 0) {
    let listStr = '';
    if (listItems.length === 1) {
      listStr = listItems[0];
    } else if (listItems.length === 2) {
      listStr = `${listItems[0]} y ${listItems[1]}`;
    } else {
      const last = listItems.pop();
      listStr = `${listItems.join(', ')} y ${last}`;
    }
    // Capitalizar primera letra
    listStr = listStr.charAt(0).toUpperCase() + listStr.slice(1);
    
    // Si hay negación al inicio
    if (hasNegation) {
      listStr = 'No ' + listStr.toLowerCase();
    }
    return listStr + '.';
  }

  // Si la negación no se consumió (ej: "no tarea")
  if (hasNegation && resultWords.length > 0) {
    resultWords.unshift('no');
  }

  // Agregar marcador de tiempo al final para dar contexto completo
  const timeMarkerWord = words.find(w => w in TIME_INDICATORS);
  if (timeMarkerWord) {
    resultWords.push(timeMarkerWord);
  }

  // Construir frase
  let output = resultWords.join(' ');
  
  // Limpieza de espaciados extras
  output = output.replace(/\s+/g, ' ').trim();

  // Asegurar mayúscula al principio y punto al final
  if (output) {
    output = output.charAt(0).toUpperCase() + output.slice(1);
    if (!output.endsWith('.')) {
      output += '.';
    }
  }

  // Retornar frase o fallback al texto original capitalizado
  return output || (input.charAt(0).toUpperCase() + input.slice(1));
}
