// Trading Education Content - Multi-language support
// This file returns translated content based on the current locale

export const getTradingRules = (t) => [
  {
    id: 1,
    category: t('Planificación'),
    rule: t('rule1Title'),
    explanation: t('rule1Explanation'),
    priority: 'critical'
  },
  {
    id: 2,
    category: t('Gestión de Riesgo'),
    rule: t('rule2Title'),
    explanation: t('rule2Explanation'),
    priority: 'critical'
  },
  {
    id: 3,
    category: t('Disciplina'),
    rule: t('rule3Title'),
    explanation: t('rule3Explanation'),
    priority: 'critical'
  },
  {
    id: 4,
    category: t('Entrada'),
    rule: t('rule4Title'),
    explanation: t('rule4Explanation'),
    priority: 'high'
  },
  {
    id: 5,
    category: t('Salida'),
    rule: t('rule5Title'),
    explanation: t('rule5Explanation'),
    priority: 'critical'
  },
  {
    id: 6,
    category: t('Psicología'),
    rule: t('rule6Title'),
    explanation: t('rule6Explanation'),
    priority: 'high'
  },
  {
    id: 7,
    category: t('Gestión de Riesgo'),
    rule: t('rule7Title'),
    explanation: t('rule7Explanation'),
    priority: 'critical'
  },
  {
    id: 8,
    category: t('Análisis'),
    rule: t('rule8Title'),
    explanation: t('rule8Explanation'),
    priority: 'high'
  },
  {
    id: 9,
    category: t('Capital'),
    rule: t('rule9Title'),
    explanation: t('rule9Explanation'),
    priority: 'critical'
  },
  {
    id: 10,
    category: t('Disciplina'),
    rule: t('rule10Title'),
    explanation: t('rule10Explanation'),
    priority: 'high'
  },
  {
    id: 11,
    category: t('Mercado'),
    rule: t('rule11Title'),
    explanation: t('rule11Explanation'),
    priority: 'medium'
  },
  {
    id: 12,
    category: t('Apalancamiento'),
    rule: t('rule12Title'),
    explanation: t('rule12Explanation'),
    priority: 'critical'
  },
  {
    id: 13,
    category: t('Tendencia'),
    rule: t('rule13Title'),
    explanation: t('rule13Explanation'),
    priority: 'high'
  },
  {
    id: 14,
    category: t('Posición'),
    rule: t('rule14Title'),
    explanation: t('rule14Explanation'),
    priority: 'high'
  },
  {
    id: 15,
    category: t('Ganadores'),
    rule: t('rule15Title'),
    explanation: t('rule15Explanation'),
    priority: 'high'
  }
];

export const getChartPatterns = (t) => ({
  reversal: [
    {
      id: 'head-shoulders',
      name: t('headShouldersName'),
      type: 'bearish',
      description: t('headShouldersDesc'),
      howToTrade: [
        'Identificar la tendencia alcista previa',
        'Esperar formación completa del patrón',
        'Entrada en ruptura de la línea del cuello (neckline)',
        'Stop loss por encima del hombro derecho',
        'Objetivo: distancia de la cabeza a la neckline proyectada hacia abajo'
      ],
      reliability: t('highReliability'),
      timeframes: ['4H', 'D', 'W']
    },
    {
      id: 'inverse-head-shoulders',
      name: t('invHeadShouldersName'),
      type: 'bullish',
      description: t('invHeadShouldersDesc'),
      howToTrade: [
        'Identificar la tendencia bajista previa',
        'Esperar formación completa del patrón',
        'Entrada en ruptura alcista de la neckline',
        'Stop loss por debajo del hombro derecho',
        'Objetivo: distancia proyectada hacia arriba'
      ],
      reliability: t('highReliability'),
      timeframes: ['4H', 'D', 'W']
    },
    {
      id: 'double-top',
      name: t('doubleTopName'),
      type: 'bearish',
      description: t('doubleTopDesc'),
      howToTrade: [
        'Identificar dos máximos similares',
        'Confirmar con volumen decreciente en el segundo pico',
        'Entrada en ruptura del soporte intermedio',
        'Stop loss por encima del segundo máximo',
        'Objetivo: altura del patrón'
      ],
      reliability: t('mediumReliability') + '-' + t('highReliability'),
      timeframes: ['1H', '4H', 'D']
    },
    {
      id: 'double-bottom',
      name: t('doubleBottomName'),
      type: 'bullish',
      description: t('doubleBottomDesc'),
      howToTrade: [
        'Identificar dos mínimos similares',
        'Confirmar con volumen creciente en el rebote',
        'Entrada en ruptura de la resistencia intermedia',
        'Stop loss por debajo del segundo mínimo',
        'Objetivo: altura del patrón'
      ],
      reliability: t('mediumReliability') + '-' + t('highReliability'),
      timeframes: ['1H', '4H', 'D']
    },
    {
      id: 'triple-top',
      name: t('tripleTopName'),
      type: 'bearish',
      description: t('tripleTopDesc'),
      howToTrade: [
        'Identificar tres máximos en el mismo nivel',
        'Volumen debe disminuir en cada intento',
        'Entrada en ruptura del soporte',
        'Stop loss por encima del último máximo',
        'Objetivo: altura del patrón'
      ],
      reliability: t('highReliability'),
      timeframes: ['4H', 'D', 'W']
    },
    {
      id: 'triple-bottom',
      name: t('tripleBottomName'),
      type: 'bullish',
      description: t('tripleBottomDesc'),
      howToTrade: [
        'Identificar tres mínimos en el mismo nivel',
        'Volumen creciente en rebotes',
        'Entrada en ruptura de resistencia',
        'Stop loss por debajo del soporte',
        'Objetivo: altura del patrón'
      ],
      reliability: t('highReliability'),
      timeframes: ['4H', 'D', 'W']
    }
  ],
  continuation: [
    {
      id: 'ascending-triangle',
      name: t('ascTriangleName'),
      type: 'bullish',
      description: t('ascTriangleDesc'),
      image: 'https://customer-assets.emergentagent.com/job_transaction-hub-113/artifacts/9hxylq5z_TRIANGULO%20DE%20CONTINUACCION%20ALCISTA.png',
      howToTrade: [
        'Identificar resistencia plana con mínimos ascendentes',
        'Esperar ruptura de la resistencia con volumen',
        'Entry 1 en la ruptura de resistencia',
        'Entry 2 en el retroceso tras ruptura',
        'Stop Loss por debajo del último mínimo',
        'Take Profit 1 y 2: proyectar altura del triángulo'
      ],
      reliability: t('mediumReliability') + '-' + t('highReliability'),
      timeframes: ['1H', '4H', 'D']
    },
    {
      id: 'descending-triangle',
      name: t('descTriangleName'),
      type: 'bearish',
      description: t('descTriangleDesc'),
      image: 'https://customer-assets.emergentagent.com/job_transaction-hub-113/artifacts/ggcbypeq_TRIANGULO%20DE%20CONTINUACCION%20BAJISTA.png',
      howToTrade: [
        'Identificar soporte plano con máximos descendentes',
        'Esperar ruptura del soporte con volumen',
        'Entry 1: entrada en la ruptura del soporte',
        'Entry 2: entrada en retroceso tras ruptura',
        'Stop Loss 1 y 2 por encima del triángulo',
        'Take Profit 1 y 2: proyectar altura del triángulo'
      ],
      reliability: t('mediumReliability') + '-' + t('highReliability'),
      timeframes: ['1H', '4H', 'D']
    },
    {
      id: 'symmetrical-triangle',
      name: t('symTriangleName'),
      type: 'neutral',
      description: t('symTriangleDesc'),
      howToTrade: [
        'Identificar convergencia de líneas de tendencia',
        'Esperar ruptura clara en cualquier dirección',
        'Entry en dirección de la ruptura',
        'Stop loss al otro lado del triángulo',
        'Objetivo: altura del triángulo proyectada'
      ],
      reliability: t('mediumReliability'),
      timeframes: ['1H', '4H', 'D']
    },
    {
      id: 'symmetrical-triangle-bullish',
      name: t('symTriangleBullName'),
      type: 'bullish',
      description: t('symTriangleBullDesc'),
      image: 'https://customer-assets.emergentagent.com/job_transaction-hub-113/artifacts/xzk3o1rm_TRIANGULO%20SIMETRICO%20DE%20CONTINUACCION%20ALCISTA.png',
      howToTrade: [
        'Identificar convergencia de líneas de tendencia',
        'Entry 1: ruptura alcista de la resistencia superior',
        'Entry 2: retroceso tras ruptura',
        'Stop Loss 1 y 2 por debajo del triángulo',
        'Take Profit 1 y 2: altura del triángulo proyectada hacia arriba'
      ],
      reliability: t('mediumReliability'),
      timeframes: ['1H', '4H', 'D']
    },
    {
      id: 'symmetrical-triangle-bearish',
      name: t('symTriangleBearName'),
      type: 'bearish',
      description: t('symTriangleBearDesc'),
      image: 'https://customer-assets.emergentagent.com/job_transaction-hub-113/artifacts/ui5ydasb_TRIANGULO%20SIMETRICO%20DE%20CONTINUACCION%20BAJISTA.png',
      howToTrade: [
        'Identificar convergencia de líneas de tendencia',
        'Entry 1: ruptura bajista del soporte inferior',
        'Entry 2: retroceso tras ruptura',
        'Stop Loss 1 y 2 por encima del triángulo',
        'Take Profit 1 y 2: altura del triángulo proyectada hacia abajo'
      ],
      reliability: t('mediumReliability'),
      timeframes: ['1H', '4H', 'D']
    },
    {
      id: 'bull-flag',
      name: t('bullFlagName'),
      type: 'bullish',
      description: t('bullFlagDesc'),
      image: 'https://customer-assets.emergentagent.com/job_transaction-hub-113/artifacts/tyu0tbqa_BANDERA%20DE%20CONTINUACCION%20ALCISTA.png',
      howToTrade: [
        'Identificar movimiento alcista fuerte (asta)',
        'Consolidación en canal bajista (bandera)',
        'Entrada en ruptura alcista de la bandera (Entry 1 o Entry 2)',
        'Stop loss por debajo de la bandera',
        'Take Profit 1 y 2: longitud del asta proyectada'
      ],
      reliability: t('highReliability'),
      timeframes: ['15m', '1H', '4H']
    },
    {
      id: 'bear-flag',
      name: t('bearFlagName'),
      type: 'bearish',
      description: t('bearFlagDesc'),
      image: 'https://customer-assets.emergentagent.com/job_transaction-hub-113/artifacts/yxqoe3xy_BANDERA%20DE%20CONTINUACCION%20BAJISTA.png',
      howToTrade: [
        'Identificar movimiento bajista fuerte (asta)',
        'Consolidación en canal alcista (bandera)',
        'Entrada en ruptura bajista de la bandera (Entry 1 o Entry 2)',
        'Stop loss por encima de la bandera',
        'Take Profit 1 y 2: longitud del asta proyectada'
      ],
      reliability: t('highReliability'),
      timeframes: ['15m', '1H', '4H']
    },
    {
      id: 'pennant',
      name: t('pennantName'),
      type: 'neutral',
      description: t('pennantDesc'),
      howToTrade: [
        'Identificar asta (movimiento fuerte)',
        'Pequeño triángulo simétrico (banderín)',
        'Entrada en ruptura en dirección del asta',
        'Stop loss al otro lado del banderín',
        'Objetivo: longitud del asta'
      ],
      reliability: t('highReliability'),
      timeframes: ['5m', '15m', '1H']
    },
    {
      id: 'bull-pennant',
      name: t('bullPennantName'),
      type: 'bullish',
      description: t('bullPennantDesc'),
      image: 'https://customer-assets.emergentagent.com/job_transaction-hub-113/artifacts/4ikd2cr5_BANDERIN%20DE%20CONTINUACCION%20ALCISTA.png',
      howToTrade: [
        'Identificar asta alcista fuerte',
        'Pequeño triángulo simétrico (banderín)',
        'Entrada en ruptura alcista (Entry 1 o Entry 2)',
        'Stop loss por debajo del banderín',
        'Take Profit 1 y 2: longitud del asta'
      ],
      reliability: t('highReliability'),
      timeframes: ['5m', '15m', '1H']
    },
    {
      id: 'bear-pennant',
      name: t('bearPennantName'),
      type: 'bearish',
      description: t('bearPennantDesc'),
      image: 'https://customer-assets.emergentagent.com/job_transaction-hub-113/artifacts/urowelfz_BANDERIN%20DE%20CONTINUACCION%20BAJISTA.png',
      howToTrade: [
        'Identificar asta bajista fuerte',
        'Pequeño triángulo simétrico (banderín)',
        'Entrada en ruptura bajista (Entry 1 o Entry 2)',
        'Stop loss por encima del banderín',
        'Take Profit 1 y 2: longitud del asta'
      ],
      reliability: t('highReliability'),
      timeframes: ['5m', '15m', '1H']
    },
    {
      id: 'ascending-channel',
      name: t('ascChannelName'),
      type: 'bullish',
      description: t('ascChannelDesc'),
      image: 'https://customer-assets.emergentagent.com/job_transaction-hub-113/artifacts/xwieicd1_CANAL%20ALCISTA.png',
      howToTrade: [
        'Dibujar líneas paralelas conectando mínimos y máximos',
        'Entry 1: comprar en el soporte del canal',
        'Entry 2: comprar tras retroceso dentro del canal',
        'Stop Loss por debajo del canal',
        'Take Profit en la resistencia del canal o en ruptura'
      ],
      reliability: t('mediumReliability') + '-' + t('highReliability'),
      timeframes: ['1H', '4H', 'D']
    },
    {
      id: 'descending-channel',
      name: t('descChannelName'),
      type: 'bearish',
      description: t('descChannelDesc'),
      image: 'https://customer-assets.emergentagent.com/job_transaction-hub-113/artifacts/17ftg4ps_CANAL%20BAJISTA.png',
      howToTrade: [
        'Dibujar líneas paralelas conectando máximos y mínimos',
        'Entry 1: vender en la resistencia del canal',
        'Entry 2: vender tras rebote dentro del canal',
        'Stop Loss por encima del canal',
        'Take Profit en el soporte del canal o en ruptura'
      ],
      reliability: t('mediumReliability') + '-' + t('highReliability'),
      timeframes: ['1H', '4H', 'D']
    },
    {
      id: 'horizontal-channel',
      name: t('horzChannelName'),
      type: 'neutral',
      description: t('horzChannelDesc'),
      image: 'https://customer-assets.emergentagent.com/job_transaction-hub-113/artifacts/wrbamc2m_CANAL%20HORIZONTAL.png',
      howToTrade: [
        'Identificar soporte y resistencia horizontales claros',
        'Entry 1: comprar en el soporte, vender en resistencia',
        'Entry 2: operar el rebote dentro del rango',
        'Stop Loss fuera del canal (según dirección)',
        'Take Profit en el extremo opuesto del canal'
      ],
      reliability: t('mediumReliability'),
      timeframes: ['1H', '4H', 'D']
    },
    {
      id: 'horizontal-channel-bullish',
      name: t('horzChannelBullName'),
      type: 'bullish',
      description: t('horzChannelBullDesc'),
      image: 'https://customer-assets.emergentagent.com/job_transaction-hub-113/artifacts/m4fqb9l4_CANAL%20HORIZONTAL%20ALCISTA.png',
      howToTrade: [
        'Identificar rango horizontal con acumulación',
        'Entry 1: comprar en soporte antes de ruptura',
        'Entry 2: comprar en ruptura de resistencia',
        'Stop Loss por debajo del soporte',
        'Take Profit 1 y 2: proyectar altura del canal hacia arriba'
      ],
      reliability: t('mediumReliability') + '-' + t('highReliability'),
      timeframes: ['1H', '4H', 'D']
    },
    {
      id: 'horizontal-channel-bearish',
      name: t('horzChannelBearName'),
      type: 'bearish',
      description: t('horzChannelBearDesc'),
      image: 'https://customer-assets.emergentagent.com/job_transaction-hub-113/artifacts/grq5z4q9_CANAL%20HORIZONTAL%20BAJISTA.png',
      howToTrade: [
        'Identificar rango horizontal con distribución',
        'Entry 1: vender en resistencia antes de ruptura',
        'Entry 2: vender en ruptura del soporte',
        'Stop Loss por encima de la resistencia',
        'Take Profit 1 y 2: proyectar altura del canal hacia abajo'
      ],
      reliability: t('mediumReliability') + '-' + t('highReliability'),
      timeframes: ['1H', '4H', 'D']
    },
    {
      id: 'cup-and-handle',
      name: t('cupHandleName'),
      type: 'bullish',
      description: t('cupHandleDesc'),
      image: 'https://customer-assets.emergentagent.com/job_transaction-hub-113/artifacts/xxyrw8nn_TAZA%20CON%20ASA.png',
      howToTrade: [
        'Identificar formación de taza (U) con asa (consolidación)',
        'Entry 1: comprar en ruptura de la resistencia del asa',
        'Entry 2: comprar en retroceso tras ruptura',
        'Stop Loss por debajo del mínimo del asa',
        'Take Profit: altura de la taza proyectada desde ruptura'
      ],
      reliability: t('highReliability'),
      timeframes: ['4H', 'D', 'W']
    }
  ]
});

export const getCandlestickPatterns = (t) => ({
  bullish: [
    {
      id: 'hammer',
      name: t('hammerName'),
      description: t('hammerDesc'),
      type: 'bullish',
      signal: t('bullishReversal'),
      reliability: t('mediumReliability') + '-' + t('highReliability')
    },
    {
      id: 'bullish-engulfing',
      name: t('engulfingBullName'),
      description: t('engulfingBullDesc'),
      type: 'bullish',
      signal: t('bullishReversal'),
      reliability: t('highReliability')
    },
    {
      id: 'morning-star',
      name: t('morningStarName'),
      description: t('morningStarDesc'),
      type: 'bullish',
      signal: t('bullishReversal'),
      reliability: t('highReliability')
    },
    {
      id: 'dragonfly-doji',
      name: t('dragonflyDojiName'),
      description: t('dragonflyDojiDesc'),
      type: 'bullish',
      signal: t('bullishReversal'),
      reliability: t('mediumReliability')
    },
    {
      id: 'three-white-soldiers',
      name: t('threeWhiteSoldiersName'),
      description: t('threeWhiteSoldiersDesc'),
      type: 'bullish',
      signal: t('bullishReversal'),
      reliability: t('highReliability')
    }
  ],
  bearish: [
    {
      id: 'shooting-star',
      name: t('shootingStarName'),
      description: t('shootingStarDesc'),
      type: 'bearish',
      signal: t('bearishReversal'),
      reliability: t('mediumReliability') + '-' + t('highReliability')
    },
    {
      id: 'bearish-engulfing',
      name: t('engulfingBearName'),
      description: t('engulfingBearDesc'),
      type: 'bearish',
      signal: t('bearishReversal'),
      reliability: t('highReliability')
    },
    {
      id: 'evening-star',
      name: t('eveningStarName'),
      description: t('eveningStarDesc'),
      type: 'bearish',
      signal: t('bearishReversal'),
      reliability: t('highReliability')
    },
    {
      id: 'gravestone-doji',
      name: t('gravestoneDojiName'),
      description: t('gravestoneDojiDesc'),
      type: 'bearish',
      signal: t('bearishReversal'),
      reliability: t('mediumReliability')
    },
    {
      id: 'three-black-crows',
      name: t('threeBlackCrowsName'),
      description: t('threeBlackCrowsDesc'),
      type: 'bearish',
      signal: t('bearishReversal'),
      reliability: t('highReliability')
    }
  ],
  neutral: [
    {
      id: 'doji',
      name: t('dojiName'),
      description: t('dojiDesc'),
      type: 'neutral',
      signal: t('indecisionSignal'),
      reliability: t('mediumReliability')
    },
    {
      id: 'spinning-top',
      name: t('spinningTopName'),
      description: t('spinningTopDesc'),
      type: 'neutral',
      signal: t('indecisionSignal'),
      reliability: t('mediumReliability')
    }
  ]
});

export const getRiskManagementConcepts = (t) => [
  {
    id: 'position-sizing',
    title: t('positionSizingTitle'),
    description: t('positionSizingDesc'),
    importance: 'critical'
  },
  {
    id: 'risk-reward',
    title: t('riskRewardTitle'),
    description: t('riskRewardDesc'),
    importance: 'critical'
  },
  {
    id: 'diversification',
    title: t('diversificationTitle'),
    description: t('diversificationDesc'),
    importance: 'high'
  }
];

export const getDowTheory = (t) => ({
  title: t('dowTheoryTitle'),
  intro: t('dowTheoryIntro'),
  principles: [
    {
      id: 1,
      title: t('dowPrinciple1Title'),
      description: t('dowPrinciple1Desc'),
      importance: 'critical'
    },
    {
      id: 2,
      title: t('dowPrinciple2Title'),
      description: t('dowPrinciple2Desc'),
      importance: 'critical'
    },
    {
      id: 3,
      title: t('dowPrinciple3Title'),
      description: t('dowPrinciple3Desc'),
      importance: 'high'
    },
    {
      id: 4,
      title: t('dowPrinciple4Title'),
      description: t('dowPrinciple4Desc'),
      importance: 'high'
    },
    {
      id: 5,
      title: t('dowPrinciple5Title'),
      description: t('dowPrinciple5Desc'),
      importance: 'critical'
    },
    {
      id: 6,
      title: t('dowPrinciple6Title'),
      description: t('dowPrinciple6Desc'),
      importance: 'critical'
    }
  ],
  application: {
    title: t('dowApplicationTitle'),
    description: t('dowApplicationDesc')
  },
  limitations: {
    title: t('dowLimitationsTitle'),
    description: t('dowLimitationsDesc')
  }
});

export const getTradingPsychology = (t) => ({
  title: t('tradingPsychologyTitle'),
  intro: t('tradingPsychologyIntro'),
  cognitiveBiases: {
    title: t('cognitiveBiasesTitle'),
    biases: [
      {
        id: 'fomo',
        title: t('fomoTitle'),
        description: t('fomoDesc'),
        severity: 'high'
      },
      {
        id: 'confirmation',
        title: t('confirmationBiasTitle'),
        description: t('confirmationBiasDesc'),
        severity: 'high'
      },
      {
        id: 'loss-aversion',
        title: t('lossAversionTitle'),
        description: t('lossAversionDesc'),
        severity: 'critical'
      },
      {
        id: 'herd',
        title: t('herdMentalityTitle'),
        description: t('herdMentalityDesc'),
        severity: 'medium'
      }
    ]
  },
  emotionalControl: {
    title: t('emotionalControlTitle'),
    techniques: [
      {
        id: 'losing-streaks',
        title: t('losingStreaksTitle'),
        description: t('losingStreaksDesc'),
        importance: 'critical'
      },
      {
        id: 'winning-discipline',
        title: t('winningDisciplineTitle'),
        description: t('winningDisciplineDesc'),
        importance: 'high'
      },
      {
        id: 'overtrading',
        title: t('overtradingTitle'),
        description: t('overtradingDesc'),
        importance: 'high'
      },
      {
        id: 'routines',
        title: t('tradingRoutinesTitle'),
        description: t('tradingRoutinesDesc'),
        importance: 'medium'
      }
    ]
  }
});

export const getCapitalManagement = (t) => ({
  title: t('capitalManagementTitle'),
  intro: t('capitalManagementIntro'),
  capitalRules: {
    title: t('capitalRulesTitle'),
    rules: [
      {
        id: 'one-percent',
        title: t('onePercentRuleTitle'),
        description: t('onePercentRuleDesc'),
        importance: 'critical'
      },
      {
        id: 'kelly',
        title: t('kellyCriterionTitle'),
        description: t('kellyCriterionDesc'),
        importance: 'high'
      },
      {
        id: 'scaling',
        title: t('positionScalingTitle'),
        description: t('positionScalingDesc'),
        importance: 'medium'
      },
      {
        id: 'diversification',
        title: t('diversificationRuleTitle'),
        description: t('diversificationRuleDesc'),
        importance: 'high'
      }
    ]
  },
  riskReward: {
    title: t('riskRewardRulesTitle'),
    concepts: [
      {
        id: 'minimum-rr',
        title: t('minimumRRTitle'),
        description: t('minimumRRDesc'),
        importance: 'critical'
      },
      {
        id: 'rr-calculation',
        title: t('rrCalculationTitle'),
        description: t('rrCalculationDesc'),
        importance: 'critical'
      }
    ]
  }
});

export const getTradingStrategies = (t) => ({
  title: t('tradingStrategiesTitle'),
  intro: t('tradingStrategiesIntro'),
  strategies: [
    {
      id: 'strategy-1',
      title: t('strategy1Title'),
      timeframe: t('strategy1Timeframe'),
      setup: t('strategy1Setup'),
      entry: t('strategy1Entry'),
      exit: t('strategy1Exit'),
      tips: t('strategy1Tips'),
      difficulty: 'beginner',
      winRate: '55-60%'
    },
    {
      id: 'strategy-2',
      title: t('strategy2Title'),
      timeframe: t('strategy2Timeframe'),
      setup: t('strategy2Setup'),
      entry: t('strategy2Entry'),
      exit: t('strategy2Exit'),
      tips: t('strategy2Tips'),
      difficulty: 'intermediate',
      winRate: '50-55%'
    },
    {
      id: 'strategy-3',
      title: t('strategy3Title'),
      timeframe: t('strategy3Timeframe'),
      setup: t('strategy3Setup'),
      entry: t('strategy3Entry'),
      exit: t('strategy3Exit'),
      tips: t('strategy3Tips'),
      difficulty: 'beginner',
      winRate: '45-50%'
    },
    {
      id: 'strategy-4',
      title: t('strategy4Title'),
      timeframe: t('strategy4Timeframe'),
      setup: t('strategy4Setup'),
      entry: t('strategy4Entry'),
      exit: t('strategy4Exit'),
      tips: t('strategy4Tips'),
      difficulty: 'advanced',
      winRate: '60-65%'
    },
    {
      id: 'strategy-5',
      title: t('strategy5Title'),
      timeframe: t('strategy5Timeframe'),
      setup: t('strategy5Setup'),
      entry: t('strategy5Entry'),
      exit: t('strategy5Exit'),
      tips: t('strategy5Tips'),
      difficulty: 'intermediate',
      winRate: '55-60%'
    }
  ]
});

export const getProbabilityStatistics = (t) => ({
  title: t('probabilityStatsTitle'),
  intro: t('probabilityStatsIntro'),
  sections: {
    mathematicalExpectation: {
      title: t('mathematicalExpectationTitle'),
      concepts: [
        {
          id: 'expectation-formula',
          title: t('expectationFormulaTitle'),
          description: t('expectationFormulaDesc'),
          importance: 'critical'
        },
        {
          id: 'why-expectation-matters',
          title: t('whyExpectationMattersTitle'),
          description: t('whyExpectationMattersDesc'),
          importance: 'critical'
        }
      ]
    },
    lawOfLargeNumbers: {
      title: t('lawOfLargeNumbersTitle'),
      concepts: [
        {
          id: 'large-numbers-concept',
          title: t('largeNumbersConceptTitle'),
          description: t('largeNumbersConceptDesc'),
          importance: 'high'
        },
        {
          id: 'variance-short-term',
          title: t('varianceShortTermTitle'),
          description: t('varianceShortTermDesc'),
          importance: 'critical'
        }
      ]
    },
    resultsDistribution: {
      title: t('resultsDistributionTitle'),
      concepts: [
        {
          id: 'normal-distribution',
          title: t('normalDistributionTitle'),
          description: t('normalDistributionDesc'),
          importance: 'high'
        },
        {
          id: 'outliers-impact',
          title: t('outliersImpactTitle'),
          description: t('outliersImpactDesc'),
          importance: 'high'
        }
      ]
    },
    streaksManagement: {
      title: t('streaksManagementTitle'),
      concepts: [
        {
          id: 'losing-streak-prob',
          title: t('losingStreakProbTitle'),
          description: t('losingStreakProbDesc'),
          importance: 'critical'
        },
        {
          id: 'psychological-impact',
          title: t('psychologicalImpactTitle'),
          description: t('psychologicalImpactDesc'),
          importance: 'high'
        }
      ]
    },
    varianceStdDev: {
      title: t('varianceStdDevTitle'),
      concepts: [
        {
          id: 'volatility-results',
          title: t('volatilityOfResultsTitle'),
          description: t('volatilityOfResultsDesc'),
          importance: 'medium'
        },
        {
          id: 'sharpe-ratio',
          title: t('sharpeRatioTitle'),
          description: t('sharpeRatioDesc'),
          importance: 'high'
        }
      ]
    },
    correlation: {
      title: t('correlationTitle'),
      concepts: [
        {
          id: 'correlation-concept',
          title: t('correlationConceptTitle'),
          description: t('correlationConceptDesc'),
          importance: 'medium'
        },
        {
          id: 'diversification-correlation',
          title: t('diversificationCorrelationTitle'),
          description: t('diversificationCorrelationDesc'),
          importance: 'high'
        }
      ]
    },
    keyMetrics: {
      title: t('keyMetricsTitle'),
      metrics: [
        {
          id: 'win-rate',
          title: t('winRateMetricTitle'),
          description: t('winRateMetricDesc'),
          importance: 'high'
        },
        {
          id: 'profit-factor',
          title: t('profitFactorMetricTitle'),
          description: t('profitFactorMetricDesc'),
          importance: 'critical'
        },
        {
          id: 'r-multiple',
          title: t('rMultipleMetricTitle'),
          description: t('rMultipleMetricDesc'),
          importance: 'high'
        },
        {
          id: 'max-drawdown',
          title: t('maxDrawdownMetricTitle'),
          description: t('maxDrawdownMetricDesc'),
          importance: 'critical'
        }
      ]
    },
    backtestingStats: {
      title: t('backtestingStatsTitle'),
      concepts: [
        {
          id: 'sample-size',
          title: t('sampleSizeTitle'),
          description: t('sampleSizeDesc'),
          importance: 'critical'
        },
        {
          id: 'overfitting-danger',
          title: t('overfittingDangerTitle'),
          description: t('overfittingDangerDesc'),
          importance: 'critical'
        },
        {
          id: 'statistical-significance',
          title: t('statisticalSignificanceTitle'),
          description: t('statisticalSignificanceDesc'),
          importance: 'high'
        }
      ]
    }
  }
});
