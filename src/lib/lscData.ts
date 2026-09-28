export const LSC_VOCABULARY = {
  Abecedario: [
    { label: "A", url: "/videos/A.mp4" },
    { label: "B", url: "/videos/B.mp4" },
    { label: "C", url: "/videos/C.mp4" },
    { label: "D", url: "/videos/D.mp4" },
    { label: "E", url: "/videos/E.mp4" },
    { label: "F", url: "/videos/F.mp4" },
    { label: "G", url: "/videos/G.mp4" },
    { label: "H", url: "/videos/H.mp4" },
    { label: "I", url: "/videos/I.mp4" },
    { label: "J", url: "/videos/J.mp4" },
    { label: "K", url: "/videos/K.mp4" },
    { label: "L", url: "/videos/L.mp4" },
    { label: "LL", url: "/videos/LL.mp4" },
    { label: "M", url: "/videos/M.mp4" },
    { label: "N", url: "/videos/N.mp4" },
    { label: "Ñ", url: "/videos/Ñ.mp4" },
    { label: "O", url: "/videos/O.mp4" },
    { label: "P", url: "/videos/P.mp4" },
    { label: "Q", url: "/videos/Q.mp4" },
    { label: "R", url: "/videos/R.mp4" },
    { label: "RR", url: "/videos/RR.mp4" },
    { label: "S", url: "/videos/S.mp4" },
    { label: "T", url: "/videos/T.mp4" },
    { label: "U", url: "/videos/U.mp4" },
    { label: "V", url: "/videos/V.mp4" },
    { label: "W", url: "/videos/W.mp4" },
    { label: "X", url: "/videos/X.mp4" },
    { label: "Y", url: "/videos/Y.mp4" },
    { label: "Z", url: "/videos/Z.mp4" },
  ],
  Colores: [
    // TEMPORAL PARA PRUEBAS: Solo los 5 colores entrenados
    { label: "AMARILLO", url: "/videos/AMARILLO.mp4" },
    { label: "AZUL", url: "/videos/AZUL.mp4" },
    { label: "BLANCO", url: "/videos/BLANCO.mp4" },
    { label: "NEGRO", url: "/videos/NEGRO.mp4" },
    { label: "ROJO", url: "/videos/ROJO.mp4" },
    
    /* COMENTADOS HASTA ENTRENAR EL MODELO COMPLETO
    { label: "AMARILLO NARANJA", url: "..." },
    { label: "AMARILLO VERDE", url: "..." },
    ...
    */
  ],
  Diseño: [
    { label: "AGUA", url: "/videos/AGUA.mp4" },
    { label: "CAPAS", url: "/videos/CAPAS.mp4" },
    { label: "HOJAS", url: "/videos/HOJAS.mp4" },
    { label: "LÁPIZ", url: "/videos/LÁPIZ.mp4" },
    { label: "MATERIALES", url: "/videos/MATERIALES.mp4" },
    { label: "PERSPECTIVA", url: "/videos/PERSPECTIVA.mp4" },
    { label: "PINCEL", url: "/videos/PINCEL.mp4" },
    { label: "SEPARAR", url: "/videos/SEPARAR.mp4" },
    { label: "TEXTURA", url: "/videos/TEXTURA.mp4" },
    { label: "VOLUMEN", url: "/videos/VOLUMEN.mp4" },
  ],
  Oficina: [
    { label: "ENVIAR TAREA", url: "/videos/ENVIAR_TAREA.mp4" },
    { label: "HORARIO", url: "/videos/HORARIO.mp4" },
    { label: "HORARIO DE CLASE", url: "/videos/HORARIO DE CLASE.mp4" },
    { label: "HORARIO DE MATERIA", url: "/videos/HORARIO DE MATERIA.mp4" },
    { label: "MATRÍCULA ACADÉMICA", url: "/videos/MATRICULA_ACADEMICA.mp4" },
    { label: "MATRICULA FINANCIERA", url: "/videos/MATRICULA_FINANCIERA.mp4" },
    { label: "MATRÍCULA MATERIAS", url: "/videos/MATRÍCULA_MATERIAS.mp4" },
    { label: "PROCESO DE MATRÍCULA", url: "/videos/PROCESO DE MATRÍCULA.mp4" },
    { label: "SOLICITAR CERTIFICADO", url: "/videos/SOLICITAR_CERTIFICADO.mp4" },
  ],
  Saludos: [
    { label: "GRACIAS", url: "/videos/GRACIAS.mp4" },
    { label: "HOLA", url: "/videos/HOLA.mp4" },
    { label: "MI NOMBRE", url: "/videos/MI_NOMBRE.mp4" },
    { label: "MI SEÑA", url: "/videos/MI_SEÑA.mp4" },
    { label: "PROFESOR", url: "/videos/PROFESOR.mp4" },
  ]
};

export interface VocabularySign {
  label: string;
  url: string;
  variants?: Array<{
    label: string;
    url: string;
  }>;
}

export const LSC_DICTIONARY: Record<string, VocabularySign[]> = {
  Abecedario: LSC_VOCABULARY.Abecedario,
  Colores: [
    { label: 'AMARILLO', url: '/videos/AMARILLO.mp4' },
    { label: 'AMARILLO NARANJA', url: '/videos/AMARILLO_NARANJA.mp4' },
    { label: 'AMARILLO VERDE', url: '/videos/AMARILLO_VERDE.mp4' },
    { label: 'AZUL', url: '/videos/AZUL.mp4' },
    { label: 'AZUL VERDE', url: '/videos/AZUL_VERDE.mp4' },
    { label: 'AZUL VIOLETA', url: '/videos/AZUL_VIOLETA.mp4' },
    { label: 'BLANCO', url: '/videos/BLANCO.mp4' },
    { label: 'CAFÉ', url: '/videos/CAFE.mp4' },
    { label: 'COLORES', url: '/videos/COLORES.mp4' },
    { label: 'CREMA', url: '/videos/CREMA.mp4' },
    { label: 'GRIS', url: '/videos/GRIS.mp4' },
    { label: 'MEZCLAR', url: '/videos/MEZCLAR.mp4' },
    { label: 'MORADO', url: '/videos/MORADO_VIOLETA.mp4' },
    { label: 'NARANJA', url: '/videos/NARANJA.mp4' },
    { label: 'NEGRO', url: '/videos/NEGRO.mp4' },
    { label: 'ROJO', url: '/videos/ROJO.mp4' },
    { label: 'ROJO NARANJA', url: '/videos/ROJO_NARANJA.mp4' },
    { label: 'ROJO VIOLETA', url: '/videos/ROJO_VIOLETA.mp4' },
    { label: 'VERDE', url: '/videos/VERDE.mp4' },
    { label: 'VIOLETA', url: '/videos/VIOLETA.mp4' },
  ],
  Diseño: [
    { label: 'AGUA', url: '/videos/AGUA.mp4' },
    { label: 'CAPAS', url: '/videos/CAPAS.mp4' },
    { label: 'HOJAS', url: '/videos/HOJAS.mp4' },
    {
      label: 'LÁPIZ',
      url: '/videos/LÁPIZ_FORMA_1.mp4',
      variants: [
        { label: 'Forma 1', url: '/videos/LÁPIZ_FORMA_1.mp4' },
        { label: 'Forma 2', url: '/videos/LÁPIZ_FORMA_2.mp4' },
      ],
    },
    { label: 'MATERIALES', url: '/videos/MATERIALES.mp4' },
    { label: 'PERSPECTIVA', url: '/videos/PERSPECTIVA.mp4' },
    {
      label: 'PINCEL',
      url: '/videos/PINCEL_FORMA_1.mp4',
      variants: [
        { label: 'Forma 1', url: '/videos/PINCEL_FORMA_1.mp4' },
        { label: 'Forma 2', url: '/videos/PINCEL_FORMA_2.mp4' },
      ],
    },
    {
      label: 'SEPARAR',
      url: '/videos/SEPARAR_FORMA_1.mp4',
      variants: [
        { label: 'Forma 1', url: '/videos/SEPARAR_FORMA_1.mp4' },
        { label: 'Forma 2', url: '/videos/SEPARAR_FORMA_2.mp4' },
      ],
    },
    { label: 'TEXTURA', url: '/videos/TEXTURA.mp4' },
    { label: 'VOLUMEN', url: '/videos/VOLUMEN.mp4' },
  ],
  Oficina: [
    { label: 'ENVIAR TAREA', url: '/videos/ENVIAR_TAREA.mp4' },
    { label: 'HORARIO', url: '/videos/HORARIO.mp4' },
    { label: 'HORARIO DE CLASE', url: '/videos/HORARIO DE CLASE.mp4' },
    { label: 'HORARIO DE MATERIA', url: '/videos/HORARIO DE MATERIA.mp4' },
    { label: 'MATRÍCULA ACADÉMICA', url: '/videos/MATRICULA_ACADEMICA.mp4' },
    { label: 'MATRÍCULA FINANCIERA', url: '/videos/MATRICULA_FINANCIERA.mp4' },
    { label: 'MATRÍCULA MATERIAS', url: '/videos/MATRÍCULA_MATERIAS.mp4' },
    { label: 'PROCESO DE MATRÍCULA', url: '/videos/PROCESO DE MATRÍCULA.mp4' },
    { label: 'SOLICITAR CERTIFICADO', url: '/videos/SOLICITAR CERTIFICADO.mp4' },
  ],
  Saludos: [
    { label: 'GRACIAS', url: '/videos/GRACIAS.mp4' },
    { label: 'HOLA', url: '/videos/HOLA.mp4' },
    { label: 'MI NOMBRE', url: '/videos/MI_NOMBRE.mp4' },
    { label: 'MI SEÑA', url: '/videos/MI_SEÑA.mp4' },
    { label: 'PROFESOR', url: '/videos/PROFESOR_2.mp4' },
  ],
};

