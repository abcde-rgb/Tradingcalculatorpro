// Reglas de Trading - Contenido educativo profesional
export const TRADING_RULES = [
  {
    id: 1,
    category: 'Planificación',
    rule: 'Tener un plan de trading completo antes de operar',
    explanation: 'Un plan de trading debe incluir: análisis del mercado, puntos de entrada y salida, gestión del riesgo, y criterios para evaluar el rendimiento. Sin un plan, estás apostando, no operando.',
    priority: 'critical'
  },
  {
    id: 2,
    category: 'Gestión de Riesgo',
    rule: 'Nunca arriesgar más del 1-2% del capital en una sola operación',
    explanation: 'Esta regla te protege de pérdidas catastróficas. Si tienes $10,000, tu pérdida máxima por operación debería ser $100-200. Esto te permite sobrevivir una racha de pérdidas.',
    priority: 'critical'
  },
  {
    id: 3,
    category: 'Disciplina',
    rule: 'Seguir el plan de trading sin excepciones',
    explanation: 'Las emociones son el peor enemigo del trader. El miedo y la avaricia te harán tomar decisiones irracionales. Un plan bien diseñado elimina la emoción de la ecuación.',
    priority: 'critical'
  },
  {
    id: 4,
    category: 'Entrada',
    rule: 'Esperar confirmación antes de entrar',
    explanation: 'No anticipes el movimiento. Espera a que el precio confirme tu análisis. Una entrada prematura puede resultar en un stop loss innecesario.',
    priority: 'high'
  },
  {
    id: 5,
    category: 'Salida',
    rule: 'Definir stop loss y take profit ANTES de entrar',
    explanation: 'Conocer exactamente dónde salir antes de entrar te permite calcular el riesgo/beneficio y tomar decisiones objetivas. Nunca muevas tu stop loss hacia abajo.',
    priority: 'critical'
  },
  {
    id: 6,
    category: 'Psicología',
    rule: 'No operar cuando estés emocional',
    explanation: 'Si estás frustrado por una pérdida, ansioso, o eufórico por una ganancia, tu juicio está comprometido. Toma un descanso y vuelve cuando estés calmado.',
    priority: 'high'
  },
  {
    id: 7,
    category: 'Gestión de Riesgo',
    rule: 'Usar siempre stop loss',
    explanation: 'El mercado puede moverse en tu contra más de lo que imaginas. Un stop loss es tu seguro contra el desastre. Sin él, una operación puede acabar con tu cuenta.',
    priority: 'critical'
  },
  {
    id: 8,
    category: 'Análisis',
    rule: 'Analizar múltiples temporalidades',
    explanation: 'Antes de entrar, revisa la tendencia en temporalidades mayores. Una entrada en 15 minutos debe estar alineada con la tendencia de 4 horas y diaria.',
    priority: 'high'
  },
  {
    id: 9,
    category: 'Capital',
    rule: 'Solo operar con dinero que puedas permitirte perder',
    explanation: 'Operar con el dinero del alquiler o de emergencias te pondrá bajo presión emocional extrema. El trading requiere capital de riesgo, no fondos esenciales.',
    priority: 'critical'
  },
  {
    id: 10,
    category: 'Disciplina',
    rule: 'Mantener un diario de trading',
    explanation: 'Registra cada operación: entrada, salida, razón, emoción, resultado. Analiza patrones en tus errores y éxitos. La mejora viene del análisis, no de más operaciones.',
    priority: 'high'
  },
  {
    id: 11,
    category: 'Mercado',
    rule: 'El mercado siempre tiene la razón',
    explanation: 'No discutas con el mercado. Si tu análisis falla, acepta la pérdida y aprende. El ego es costoso en trading.',
    priority: 'medium'
  },
  {
    id: 12,
    category: 'Apalancamiento',
    rule: 'Usar apalancamiento con extremo cuidado',
    explanation: 'El apalancamiento amplifica tanto ganancias como pérdidas. Principiantes no deberían usar más de 2-3x. Profesionales rara vez usan más de 10x.',
    priority: 'critical'
  },
  {
    id: 13,
    category: 'Tendencia',
    rule: 'La tendencia es tu amiga',
    explanation: 'Opera a favor de la tendencia principal. Contratendencia solo para traders muy experimentados. Es más fácil ganar dinero siguiendo el momentum.',
    priority: 'high'
  },
  {
    id: 14,
    category: 'Posición',
    rule: 'Nunca promediar a la baja en posiciones perdedoras',
    explanation: 'Añadir a una posición perdedora es uno de los errores más comunes y costosos. Si el trade está en contra, acepta la pérdida según tu plan.',
    priority: 'high'
  },
  {
    id: 15,
    category: 'Ganadores',
    rule: 'Dejar correr las ganancias',
    explanation: 'Muchos traders cortan las ganancias prematuramente y dejan correr las pérdidas. Usa trailing stops para proteger ganancias mientras el precio se mueve a tu favor.',
    priority: 'high'
  },
  {
    id: 16,
    category: 'Pérdidas',
    rule: 'Cortar las pérdidas rápidamente',
    explanation: 'Una pequeña pérdida es parte del negocio. Una gran pérdida puede acabar con tu cuenta. Acepta pérdidas pequeñas para preservar capital para mejores oportunidades.',
    priority: 'critical'
  },
  {
    id: 17,
    category: 'Ratio',
    rule: 'Mantener ratio riesgo/beneficio mínimo de 1:2',
    explanation: 'Si arriesgas $100, tu objetivo debería ser al menos $200. Con un ratio 1:2 y 40% de acierto, sigues siendo rentable.',
    priority: 'high'
  },
  {
    id: 18,
    category: 'Tiempo',
    rule: 'No operar por operar',
    explanation: 'La mejor operación a veces es no operar. Esperar por setups de alta calidad es mejor que forzar operaciones en condiciones pobres.',
    priority: 'medium'
  },
  {
    id: 19,
    category: 'Conocimiento',
    rule: 'Nunca dejar de aprender',
    explanation: 'Los mercados evolucionan constantemente. Lo que funciona hoy puede no funcionar mañana. Estudia, practica en demo, y adapta tu estrategia.',
    priority: 'medium'
  },
  {
    id: 20,
    category: 'Sesgo',
    rule: 'Evitar el sesgo de confirmación',
    explanation: 'No busques solo información que confirme tu análisis. Busca activamente razones por las que podrías estar equivocado. Los mejores traders son escépticos de sus propias ideas.',
    priority: 'high'
  },
  {
    id: 21,
    category: 'Noticias',
    rule: 'Cuidado con operar noticias',
    explanation: 'Los eventos de noticias causan volatilidad extrema y spreads amplios. Si no tienes experiencia, es mejor mantenerse al margen durante anuncios importantes.',
    priority: 'medium'
  },
  {
    id: 22,
    category: 'Capital',
    rule: 'Preservar el capital es prioridad #1',
    explanation: 'Sin capital, no puedes operar. La supervivencia a largo plazo es más importante que ganancias a corto plazo. Protege tu cuenta primero.',
    priority: 'critical'
  },
  {
    id: 23,
    category: 'Estrategia',
    rule: 'Dominar una estrategia antes de probar otras',
    explanation: 'Es mejor ser experto en una estrategia que mediocre en diez. Perfecciona tu edge antes de diversificar tus métodos.',
    priority: 'high'
  },
  {
    id: 24,
    category: 'Mercado',
    rule: 'Conocer las correlaciones del mercado',
    explanation: 'DXY afecta al oro y a pares de USD. BTC puede influir en altcoins. Entender estas relaciones te da ventaja.',
    priority: 'medium'
  },
  {
    id: 25,
    category: 'Paciencia',
    rule: 'La paciencia es una virtud en trading',
    explanation: 'Los mejores setups no aparecen cada día. Esperar por la oportunidad perfecta es más rentable que tomar operaciones mediocres.',
    priority: 'high'
  }
];

export const CHART_PATTERNS = {
  reversal: [
    {
      id: 'head-shoulders',
      name: 'Cabeza y Hombros',
      type: 'bearish',
      description: 'Patrón de reversión bajista que aparece al final de una tendencia alcista. Consta de tres picos, siendo el del medio (cabeza) más alto que los laterales (hombros).',
      howToTrade: [
        'Identificar la tendencia alcista previa',
        'Esperar formación completa del patrón',
        'Entrada en ruptura de la línea del cuello (neckline)',
        'Stop loss por encima del hombro derecho',
        'Objetivo: distancia de la cabeza a la neckline proyectada hacia abajo'
      ],
      reliability: 'Alta',
      timeframes: ['4H', 'D', 'W']
    },
    {
      id: 'inverse-head-shoulders',
      name: 'Cabeza y Hombros Invertido',
      type: 'bullish',
      description: 'Patrón de reversión alcista que aparece al final de una tendencia bajista. Es el inverso del H&S clásico.',
      howToTrade: [
        'Identificar la tendencia bajista previa',
        'Esperar formación completa del patrón',
        'Entrada en ruptura alcista de la neckline',
        'Stop loss por debajo del hombro derecho',
        'Objetivo: distancia proyectada hacia arriba'
      ],
      reliability: 'Alta',
      timeframes: ['4H', 'D', 'W']
    },
    {
      id: 'double-top',
      name: 'Doble Techo',
      type: 'bearish',
      description: 'Dos picos al mismo nivel que forman una M. Indica agotamiento del movimiento alcista.',
      howToTrade: [
        'Identificar dos máximos similares',
        'Confirmar con volumen decreciente en el segundo pico',
        'Entrada en ruptura del soporte intermedio',
        'Stop loss por encima del segundo máximo',
        'Objetivo: altura del patrón'
      ],
      reliability: 'Media-Alta',
      timeframes: ['1H', '4H', 'D']
    },
    {
      id: 'double-bottom',
      name: 'Doble Suelo',
      type: 'bullish',
      description: 'Dos mínimos al mismo nivel que forman una W. Indica fin de la presión vendedora.',
      howToTrade: [
        'Identificar dos mínimos similares',
        'Confirmar con volumen creciente en el rebote',
        'Entrada en ruptura de la resistencia intermedia',
        'Stop loss por debajo del segundo mínimo',
        'Objetivo: altura del patrón'
      ],
      reliability: 'Media-Alta',
      timeframes: ['1H', '4H', 'D']
    },
    {
      id: 'triple-top',
      name: 'Triple Techo',
      type: 'bearish',
      description: 'Tres intentos fallidos de superar una resistencia. Patrón de reversión muy fiable.',
      howToTrade: [
        'Identificar tres máximos en el mismo nivel',
        'Volumen debe disminuir en cada intento',
        'Entrada en ruptura del soporte',
        'Stop loss por encima del último máximo',
        'Objetivo: altura del patrón'
      ],
      reliability: 'Alta',
      timeframes: ['4H', 'D', 'W']
    },
    {
      id: 'triple-bottom',
      name: 'Triple Suelo',
      type: 'bullish',
      description: 'Tres intentos fallidos de romper un soporte. Indica acumulación institucional.',
      howToTrade: [
        'Identificar tres mínimos en el mismo nivel',
        'Volumen creciente en rebotes',
        'Entrada en ruptura de resistencia',
        'Stop loss por debajo del soporte',
        'Objetivo: altura del patrón'
      ],
      reliability: 'Alta',
      timeframes: ['4H', 'D', 'W']
    }
  ],
  continuation: [
    {
      id: 'ascending-triangle',
      name: 'Triángulo Ascendente',
      type: 'bullish',
      description: 'Patrón de continuación alcista con resistencia horizontal y mínimos crecientes.',
      image: 'https://customer-assets.emergentagent.com/job_transaction-hub-113/artifacts/9hxylq5z_TRIANGULO%20DE%20CONTINUACCION%20ALCISTA.png',
      howToTrade: [
        'Identificar resistencia plana con mínimos ascendentes',
        'Esperar ruptura de la resistencia con volumen',
        'Entry 1 en la ruptura de resistencia',
        'Entry 2 en el retroceso tras ruptura',
        'Stop Loss por debajo del último mínimo',
        'Take Profit 1 y 2: proyectar altura del triángulo'
      ],
      reliability: 'Media-Alta',
      timeframes: ['1H', '4H', 'D']
    },
    {
      id: 'descending-triangle',
      name: 'Triángulo Descendente',
      type: 'bearish',
      description: 'Patrón de continuación bajista con soporte horizontal y máximos decrecientes.',
      image: 'https://customer-assets.emergentagent.com/job_transaction-hub-113/artifacts/ggcbypeq_TRIANGULO%20DE%20CONTINUACCION%20BAJISTA.png',
      howToTrade: [
        'Identificar soporte plano con máximos descendentes',
        'Esperar ruptura del soporte con volumen',
        'Entry 1: entrada en la ruptura del soporte',
        'Entry 2: entrada en retroceso tras ruptura',
        'Stop Loss 1 y 2 por encima del triángulo',
        'Take Profit 1 y 2: proyectar altura del triángulo'
      ],
      reliability: 'Media-Alta',
      timeframes: ['1H', '4H', 'D']
    },
    {
      id: 'symmetrical-triangle',
      name: 'Triángulo Simétrico',
      type: 'neutral',
      description: 'Consolidación con máximos decrecientes y mínimos crecientes. Puede romper en cualquier dirección.',
      howToTrade: [
        'Identificar convergencia de líneas de tendencia',
        'Esperar ruptura clara en cualquier dirección',
        'Entry en dirección de la ruptura',
        'Stop loss al otro lado del triángulo',
        'Objetivo: altura del triángulo proyectada'
      ],
      reliability: 'Media',
      timeframes: ['1H', '4H', 'D']
    },
    {
      id: 'symmetrical-triangle-bullish',
      name: 'Triángulo Simétrico Alcista',
      type: 'bullish',
      description: 'Triángulo simétrico que rompe al alza. Consolidación neutral que resuelve con continuación alcista.',
      image: 'https://customer-assets.emergentagent.com/job_transaction-hub-113/artifacts/xzk3o1rm_TRIANGULO%20SIMETRICO%20DE%20CONTINUACCION%20ALCISTA.png',
      howToTrade: [
        'Identificar convergencia de líneas de tendencia',
        'Entry 1: ruptura alcista de la resistencia superior',
        'Entry 2: retroceso tras ruptura',
        'Stop Loss 1 y 2 por debajo del triángulo',
        'Take Profit 1 y 2: altura del triángulo proyectada hacia arriba'
      ],
      reliability: 'Media',
      timeframes: ['1H', '4H', 'D']
    },
    {
      id: 'symmetrical-triangle-bearish',
      name: 'Triángulo Simétrico Bajista',
      type: 'bearish',
      description: 'Triángulo simétrico que rompe a la baja. Consolidación neutral que resuelve con continuación bajista.',
      image: 'https://customer-assets.emergentagent.com/job_transaction-hub-113/artifacts/ui5ydasb_TRIANGULO%20SIMETRICO%20DE%20CONTINUACCION%20BAJISTA.png',
      howToTrade: [
        'Identificar convergencia de líneas de tendencia',
        'Entry 1: ruptura bajista del soporte inferior',
        'Entry 2: retroceso tras ruptura',
        'Stop Loss 1 y 2 por encima del triángulo',
        'Take Profit 1 y 2: altura del triángulo proyectada hacia abajo'
      ],
      reliability: 'Media',
      timeframes: ['1H', '4H', 'D']
    },
    {
      id: 'bull-flag',
      name: 'Bandera Alcista',
      type: 'bullish',
      description: 'Consolidación bajista después de un movimiento alcista fuerte (asta). Pausa antes de continuar.',
      image: 'https://customer-assets.emergentagent.com/job_transaction-hub-113/artifacts/tyu0tbqa_BANDERA%20DE%20CONTINUACCION%20ALCISTA.png',
      howToTrade: [
        'Identificar movimiento alcista fuerte (asta)',
        'Consolidación en canal bajista (bandera)',
        'Entrada en ruptura alcista de la bandera (Entry 1 o Entry 2)',
        'Stop loss por debajo de la bandera',
        'Take Profit 1 y 2: longitud del asta proyectada'
      ],
      reliability: 'Alta',
      timeframes: ['15m', '1H', '4H']
    },
    {
      id: 'bear-flag',
      name: 'Bandera Bajista',
      type: 'bearish',
      description: 'Consolidación alcista después de un movimiento bajista fuerte. Pausa antes de continuar cayendo.',
      image: 'https://customer-assets.emergentagent.com/job_transaction-hub-113/artifacts/yxqoe3xy_BANDERA%20DE%20CONTINUACCION%20BAJISTA.png',
      howToTrade: [
        'Identificar movimiento bajista fuerte (asta)',
        'Consolidación en canal alcista (bandera)',
        'Entrada en ruptura bajista de la bandera (Entry 1 o Entry 2)',
        'Stop loss por encima de la bandera',
        'Take Profit 1 y 2: longitud del asta proyectada'
      ],
      reliability: 'Alta',
      timeframes: ['15m', '1H', '4H']
    },
    {
      id: 'pennant',
      name: 'Banderín',
      type: 'neutral',
      description: 'Similar a la bandera pero con forma de triángulo simétrico pequeño. Consolidación muy corta.',
      howToTrade: [
        'Identificar asta (movimiento fuerte)',
        'Pequeño triángulo simétrico (banderín)',
        'Entrada en ruptura en dirección del asta',
        'Stop loss al otro lado del banderín',
        'Objetivo: longitud del asta'
      ],
      reliability: 'Alta',
      timeframes: ['5m', '15m', '1H']
    },
    {
      id: 'bull-pennant',
      name: 'Banderín Alcista',
      type: 'bullish',
      description: 'Pequeño triángulo simétrico después de un fuerte movimiento alcista. Continuación muy rápida.',
      image: 'https://customer-assets.emergentagent.com/job_transaction-hub-113/artifacts/4ikd2cr5_BANDERIN%20DE%20CONTINUACCION%20ALCISTA.png',
      howToTrade: [
        'Identificar asta alcista fuerte',
        'Pequeño triángulo simétrico (banderín)',
        'Entrada en ruptura alcista (Entry 1 o Entry 2)',
        'Stop loss por debajo del banderín',
        'Take Profit 1 y 2: longitud del asta'
      ],
      reliability: 'Alta',
      timeframes: ['5m', '15m', '1H']
    },
    {
      id: 'bear-pennant',
      name: 'Banderín Bajista',
      type: 'bearish',
      description: 'Pequeño triángulo simétrico después de un fuerte movimiento bajista. Continuación muy rápida.',
      image: 'https://customer-assets.emergentagent.com/job_transaction-hub-113/artifacts/urowelfz_BANDERIN%20DE%20CONTINUACCION%20BAJISTA.png',
      howToTrade: [
        'Identificar asta bajista fuerte',
        'Pequeño triángulo simétrico (banderín)',
        'Entrada en ruptura bajista (Entry 1 o Entry 2)',
        'Stop loss por encima del banderín',
        'Take Profit 1 y 2: longitud del asta'
      ],
      reliability: 'Alta',
      timeframes: ['5m', '15m', '1H']
    },
    {
      id: 'ascending-channel',
      name: 'Canal Alcista',
      type: 'bullish',
      description: 'Líneas paralelas ascendentes que contienen el precio. Oportunidades de compra en soporte del canal.',
      image: 'https://customer-assets.emergentagent.com/job_transaction-hub-113/artifacts/xwieicd1_CANAL%20ALCISTA.png',
      howToTrade: [
        'Dibujar líneas paralelas conectando mínimos y máximos',
        'Entry 1: comprar en el soporte del canal',
        'Entry 2: comprar tras retroceso dentro del canal',
        'Stop Loss por debajo del canal',
        'Take Profit en la resistencia del canal o en ruptura'
      ],
      reliability: 'Media-Alta',
      timeframes: ['1H', '4H', 'D']
    },
    {
      id: 'descending-channel',
      name: 'Canal Bajista',
      type: 'bearish',
      description: 'Líneas paralelas descendentes que contienen el precio. Oportunidades de venta en resistencia del canal.',
      image: 'https://customer-assets.emergentagent.com/job_transaction-hub-113/artifacts/17ftg4ps_CANAL%20BAJISTA.png',
      howToTrade: [
        'Dibujar líneas paralelas conectando máximos y mínimos',
        'Entry 1: vender en la resistencia del canal',
        'Entry 2: vender tras rebote dentro del canal',
        'Stop Loss por encima del canal',
        'Take Profit en el soporte del canal o en ruptura'
      ],
      reliability: 'Media-Alta',
      timeframes: ['1H', '4H', 'D']
    },
    {
      id: 'horizontal-channel',
      name: 'Canal Horizontal (Rango)',
      type: 'neutral',
      description: 'Movimiento lateral del precio entre soporte y resistencia horizontales. Ideal para trading de rango.',
      image: 'https://customer-assets.emergentagent.com/job_transaction-hub-113/artifacts/wrbamc2m_CANAL%20HORIZONTAL.png',
      howToTrade: [
        'Identificar soporte y resistencia horizontales claros',
        'Entry 1: comprar en el soporte, vender en resistencia',
        'Entry 2: operar el rebote dentro del rango',
        'Stop Loss fuera del canal (según dirección)',
        'Take Profit en el extremo opuesto del canal'
      ],
      reliability: 'Media',
      timeframes: ['1H', '4H', 'D']
    },
    {
      id: 'horizontal-channel-bullish',
      name: 'Canal Horizontal Alcista',
      type: 'bullish',
      description: 'Canal horizontal con preparación para ruptura alcista. Acumulación antes de movimiento fuerte.',
      image: 'https://customer-assets.emergentagent.com/job_transaction-hub-113/artifacts/m4fqb9l4_CANAL%20HORIZONTAL%20ALCISTA.png',
      howToTrade: [
        'Identificar rango horizontal con acumulación',
        'Entry 1: comprar en soporte antes de ruptura',
        'Entry 2: comprar en ruptura de resistencia',
        'Stop Loss por debajo del soporte',
        'Take Profit 1 y 2: proyectar altura del canal hacia arriba'
      ],
      reliability: 'Media-Alta',
      timeframes: ['1H', '4H', 'D']
    },
    {
      id: 'horizontal-channel-bearish',
      name: 'Canal Horizontal Bajista',
      type: 'bearish',
      description: 'Canal horizontal con preparación para ruptura bajista. Distribución antes de caída.',
      image: 'https://customer-assets.emergentagent.com/job_transaction-hub-113/artifacts/grq5z4q9_CANAL%20HORIZONTAL%20BAJISTA.png',
      howToTrade: [
        'Identificar rango horizontal con distribución',
        'Entry 1: vender en resistencia antes de ruptura',
        'Entry 2: vender en ruptura del soporte',
        'Stop Loss por encima de la resistencia',
        'Take Profit 1 y 2: proyectar altura del canal hacia abajo'
      ],
      reliability: 'Media-Alta',
      timeframes: ['1H', '4H', 'D']
    },
    {
      id: 'cup-and-handle',
      name: 'Taza con Asa',
      type: 'bullish',
      description: 'Patrón de continuación alcista con forma de U (taza) seguido de consolidación pequeña (asa). Muy potente.',
      image: 'https://customer-assets.emergentagent.com/job_transaction-hub-113/artifacts/xxyrw8nn_TAZA%20CON%20ASA.png',
      howToTrade: [
        'Identificar formación de taza (U) con asa (consolidación)',
        'Entry 1: comprar en ruptura de la resistencia del asa',
        'Entry 2: comprar en retroceso tras ruptura',
        'Stop Loss por debajo del mínimo del asa',
        'Take Profit: altura de la taza proyectada desde ruptura'
      ],
      reliability: 'Alta',
      timeframes: ['4H', 'D', 'W']
    }
  ]
};

export const CANDLESTICK_PATTERNS = {
  bullish: [
    {
      id: 'hammer',
      name: 'Martillo (Hammer)',
      description: 'Vela con cuerpo pequeño arriba y mecha inferior larga. Aparece en suelos.',
      signal: 'Reversión alcista',
      reliability: 'Media-Alta'
    },
    {
      id: 'bullish-engulfing',
      name: 'Envolvente Alcista',
      description: 'Vela alcista que envuelve completamente el cuerpo de la vela bajista anterior.',
      signal: 'Reversión alcista fuerte',
      reliability: 'Alta'
    },
    {
      id: 'morning-star',
      name: 'Estrella de la Mañana',
      description: 'Patrón de tres velas: bajista grande, vela pequeña (indecisión), alcista grande.',
      signal: 'Reversión alcista muy fiable',
      reliability: 'Alta'
    },
    {
      id: 'dragonfly-doji',
      name: 'Doji Libélula',
      description: 'Doji con mecha inferior larga y sin mecha superior. Indica rechazo de precios bajos.',
      signal: 'Posible reversión alcista',
      reliability: 'Media'
    },
    {
      id: 'three-white-soldiers',
      name: 'Tres Soldados Blancos',
      description: 'Tres velas alcistas consecutivas con cierres progresivamente más altos.',
      signal: 'Continuación/Reversión alcista fuerte',
      reliability: 'Alta'
    }
  ],
  bearish: [
    {
      id: 'shooting-star',
      name: 'Estrella Fugaz',
      description: 'Vela con cuerpo pequeño abajo y mecha superior larga. Aparece en techos.',
      signal: 'Reversión bajista',
      reliability: 'Media-Alta'
    },
    {
      id: 'bearish-engulfing',
      name: 'Envolvente Bajista',
      description: 'Vela bajista que envuelve completamente el cuerpo de la vela alcista anterior.',
      signal: 'Reversión bajista fuerte',
      reliability: 'Alta'
    },
    {
      id: 'evening-star',
      name: 'Estrella del Atardecer',
      description: 'Patrón de tres velas: alcista grande, vela pequeña (indecisión), bajista grande.',
      signal: 'Reversión bajista muy fiable',
      reliability: 'Alta'
    },
    {
      id: 'gravestone-doji',
      name: 'Doji Lápida',
      description: 'Doji con mecha superior larga y sin mecha inferior. Indica rechazo de precios altos.',
      signal: 'Posible reversión bajista',
      reliability: 'Media'
    },
    {
      id: 'three-black-crows',
      name: 'Tres Cuervos Negros',
      description: 'Tres velas bajistas consecutivas con cierres progresivamente más bajos.',
      signal: 'Continuación/Reversión bajista fuerte',
      reliability: 'Alta'
    }
  ],
  neutral: [
    {
      id: 'doji',
      name: 'Doji',
      description: 'Vela con apertura y cierre casi iguales. Indica indecisión en el mercado.',
      signal: 'Indecisión - posible cambio',
      reliability: 'Baja (necesita confirmación)'
    },
    {
      id: 'spinning-top',
      name: 'Peonza',
      description: 'Vela con cuerpo pequeño y mechas superiores e inferiores de tamaño similar.',
      signal: 'Indecisión en el mercado',
      reliability: 'Baja (necesita confirmación)'
    }
  ]
};

export const RISK_MANAGEMENT_CONCEPTS = [
  {
    id: 'position-sizing',
    title: 'Dimensionamiento de Posición',
    content: `
El dimensionamiento de posición es quizás el concepto más importante en gestión de riesgo. 
Determina cuánto capital arriesgar en cada operación.

**Regla del 1-2%**: Nunca arriesgar más del 1-2% de tu capital total en una sola operación.

**Fórmula**:
Tamaño Posición = (Capital × Riesgo%) / Distancia al Stop Loss

**Ejemplo**:
- Capital: $10,000
- Riesgo: 1%
- Distancia SL: 2%
- Tamaño: ($10,000 × 0.01) / 0.02 = $5,000
    `
  },
  {
    id: 'risk-reward',
    title: 'Ratio Riesgo/Beneficio',
    content: `
El ratio R:R compara la pérdida potencial con la ganancia potencial.

**Mínimo recomendado**: 1:2 (arriesgar $1 para ganar $2)

**¿Por qué importa?**
Con un R:R de 1:2 y solo 40% de aciertos, sigues siendo rentable:
- 10 trades, 4 ganadores, 6 perdedores
- Ganancia: 4 × $200 = $800
- Pérdida: 6 × $100 = $600
- Resultado: +$200

**Consejo**: Busca setups con R:R de 1:3 o mejor.
    `
  },
  {
    id: 'max-drawdown',
    title: 'Máximo Drawdown',
    content: `
El drawdown es la caída desde el punto más alto de tu cuenta hasta el punto más bajo antes de recuperarte.

**Niveles críticos**:
- 10% drawdown: Normal, parte del trading
- 20% drawdown: Precaución, revisar estrategia
- 30% drawdown: Peligro, reducir tamaño de posición
- 50%+ drawdown: Requiere 100%+ de ganancia para recuperar

**Prevención**:
- Seguir la regla del 1-2%
- Límite diario de pérdidas (ej: -3%)
- Límite semanal de pérdidas (ej: -5%)
    `
  },
  {
    id: 'kelly-criterion',
    title: 'Criterio de Kelly',
    content: `
Fórmula matemática para determinar el tamaño óptimo de apuesta basado en tu edge.

**Fórmula**:
Kelly % = W - [(1-W)/R]

Donde:
- W = Win Rate (porcentaje de aciertos)
- R = Ratio promedio de ganancia/pérdida

**Ejemplo**:
- Win Rate: 55%
- Ratio: 1.5

Kelly = 0.55 - [(1-0.55)/1.5] = 0.55 - 0.30 = 0.25 (25%)

**Importante**: Usar fracción de Kelly (1/4 o 1/2) para reducir volatilidad.
    `
  }
];
