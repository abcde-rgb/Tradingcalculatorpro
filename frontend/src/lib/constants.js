// Lista de criptomonedas soportadas
export const CRYPTO_LIST = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', color: 'text-orange-500' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', color: 'text-blue-500' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', color: 'text-purple-500' },
  { id: 'binancecoin', symbol: 'BNB', name: 'Binance Coin', color: 'text-yellow-500' },
  { id: 'ripple', symbol: 'XRP', name: 'Ripple', color: 'text-gray-400' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', color: 'text-blue-400' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', color: 'text-yellow-400' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', color: 'text-red-500' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', color: 'text-pink-500' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', color: 'text-blue-300' },
  { id: 'litecoin', symbol: 'LTC', name: 'Litecoin', color: 'text-gray-300' },
];

export const COMMODITIES = [
  { id: 'gold', symbol: 'XAUUSD', name: 'Oro/USD', color: 'text-yellow-500' },
];

export const ALL_ASSETS = [...CRYPTO_LIST, ...COMMODITIES];

// Niveles de Fibonacci
export const FIBONACCI_LEVELS = [
  { level: 0, label: '0%' },
  { level: 0.236, label: '23.6%' },
  { level: 0.382, label: '38.2%' },
  { level: 0.5, label: '50%' },
  { level: 0.618, label: '61.8%' },
  { level: 0.786, label: '78.6%' },
  { level: 1, label: '100%' },
  { level: 1.272, label: '127.2%' },
  { level: 1.618, label: '161.8%' },
];

// Patrones de Trading con imágenes y pasos
export const TRADING_PATTERNS = {
  reversal: [
    {
      id: 'double-top',
      name: 'Doble Techo',
      category: 'reversal',
      direction: 'bearish',
      description: 'Patrón de reversión bajista que se forma cuando el precio alcanza dos máximos consecutivos en nivel similar, formando una "M".',
      howToIdentify: [
        'Dos máximos (picos) en el mismo nivel de precio',
        'Corrección intermedia entre ambos picos formando una "M"',
        'Volumen elevado en el primer techo, menor en el segundo',
        'Línea de cuello (neckline) en el mínimo entre los dos picos'
      ],
      target: 'Medir la altura desde la línea de cuello hasta los máximos y proyectar hacia abajo desde el punto de ruptura',
      stopLoss: 'Por encima del segundo máximo (fuera de la estructura)',
      confirmation: 'Ruptura de la línea de cuello con aumento de volumen',
      steps: [
        { title: '1. Formación', description: 'El precio forma dos máximos al mismo nivel tras una tendencia alcista. El segundo pico no supera al primero, mostrando debilidad compradora.', color: '#3B82F6' },
        { title: '2. Ruptura', description: 'El precio rompe la línea de cuello (soporte entre los dos máximos) con volumen. Esta es la señal de entrada en SHORT.', color: '#EF4444' },
        { title: '3. Target', description: 'El objetivo es la altura del patrón proyectada hacia abajo desde la ruptura. SL por encima del segundo máximo.', color: '#22C55E' }
      ]
    },
    {
      id: 'double-bottom',
      name: 'Doble Suelo',
      category: 'reversal',
      direction: 'bullish',
      description: 'Patrón de reversión alcista que se forma cuando el precio alcanza dos mínimos consecutivos en nivel similar, formando una "W".',
      howToIdentify: [
        'Dos mínimos (valles) en el mismo nivel de precio',
        'Corrección alcista intermedia formando una "W"',
        'El segundo mínimo no rompe el primero, mostrando soporte fuerte',
        'Volumen alto en rebote del segundo suelo'
      ],
      target: 'Medir la altura desde el soporte hasta la resistencia intermedia y proyectar hacia arriba desde la ruptura',
      stopLoss: 'Por debajo del segundo mínimo (fuera de la estructura)',
      confirmation: 'Ruptura de la resistencia (neckline) con volumen',
      steps: [
        { title: '1. Formación', description: 'El precio forma dos mínimos al mismo nivel tras una tendencia bajista. El segundo valle no rompe el primero, indicando soporte fuerte.', color: '#3B82F6' },
        { title: '2. Ruptura', description: 'El precio rompe la línea de cuello (resistencia entre los dos mínimos) con volumen. Esta es la señal de entrada en LONG.', color: '#22C55E' },
        { title: '3. Target', description: 'El objetivo es la altura del patrón proyectada hacia arriba desde la ruptura. SL por debajo del segundo mínimo.', color: '#22C55E' }
      ]
    },
    {
      id: 'head-shoulders',
      name: 'Hombro-Cabeza-Hombro (HCH)',
      category: 'reversal',
      direction: 'bearish',
      description: 'Uno de los patrones más fiables. Formado por tres picos: dos hombros de altura similar y una cabeza más elevada en el centro.',
      howToIdentify: [
        'Hombro izquierdo: primer pico seguido de corrección',
        'Cabeza: pico más alto que el hombro izquierdo',
        'Hombro derecho: pico similar al hombro izquierdo',
        'Línea de cuello: conecta los mínimos entre los picos'
      ],
      target: 'Medir desde la cabeza hasta la línea de cuello y proyectar hacia abajo',
      stopLoss: 'Por encima del hombro derecho',
      confirmation: 'Ruptura de la línea de cuello con volumen significativo',
      steps: [
        { title: '1. Formación', description: 'Se forma el hombro izquierdo, luego la cabeza (máximo más alto), y finalmente el hombro derecho (similar al izquierdo). La neckline conecta los mínimos.', color: '#3B82F6' },
        { title: '2. Ruptura', description: 'El precio rompe la neckline hacia abajo. Puede haber un pullback a la neckline antes de continuar bajando. Entrada en SHORT en ruptura o pullback.', color: '#EF4444' },
        { title: '3. Target', description: 'Target = Distancia de la cabeza a la neckline, proyectada hacia abajo. Normalmente se alcanza en 60-70% de los casos.', color: '#22C55E' }
      ]
    },
    {
      id: 'inverse-head-shoulders',
      name: 'HCH Invertido',
      category: 'reversal',
      direction: 'bullish',
      description: 'Versión invertida del HCH que señala cambio de tendencia bajista a alcista. Muy fiable en suelos de mercado.',
      howToIdentify: [
        'Tres valles en lugar de tres picos',
        'La cabeza es el punto más bajo',
        'Los hombros son valles de altura similar',
        'Neckline conecta los máximos entre los valles'
      ],
      target: 'Medir desde la cabeza hasta la línea de cuello y proyectar hacia arriba',
      stopLoss: 'Por debajo del hombro derecho',
      confirmation: 'Ruptura alcista de la neckline con volumen',
      steps: [
        { title: '1. Formación', description: 'Tras tendencia bajista: hombro izquierdo (mínimo), cabeza (mínimo más bajo), hombro derecho (mínimo similar al izquierdo).', color: '#3B82F6' },
        { title: '2. Ruptura', description: 'El precio rompe la neckline hacia arriba con volumen. El pullback a la neckline es común y ofrece mejor entrada.', color: '#22C55E' },
        { title: '3. Target', description: 'Target = Distancia de la cabeza a la neckline, proyectada hacia arriba. Ratio riesgo/beneficio suele ser excelente.', color: '#22C55E' }
      ]
    },
    {
      id: 'triple-top',
      name: 'Triple Techo',
      category: 'reversal',
      direction: 'bearish',
      description: 'Tres máximos consecutivos en el mismo nivel. Más fuerte que el doble techo por la triple confirmación de resistencia.',
      howToIdentify: [
        'Tres picos en nivel de precio similar',
        'Dos correcciones intermedias',
        'Volumen decreciente en cada pico',
        'Soporte claro en los mínimos intermedios'
      ],
      target: 'Altura del patrón proyectada hacia abajo desde la ruptura del soporte',
      stopLoss: 'Por encima del tercer máximo',
      confirmation: 'Ruptura del soporte con aumento de volumen',
      steps: [
        { title: '1. Formación', description: 'El precio toca tres veces la misma resistencia sin poder superarla. Cada rechazo muestra que los compradores se agotan.', color: '#3B82F6' },
        { title: '2. Ruptura', description: 'Ruptura del soporte (zona de los mínimos intermedios). El volumen debe aumentar en la ruptura para confirmar.', color: '#EF4444' },
        { title: '3. Target', description: 'Target = Altura del patrón desde resistencia hasta soporte, proyectada hacia abajo.', color: '#22C55E' }
      ]
    },
    {
      id: 'triple-bottom',
      name: 'Triple Suelo',
      category: 'reversal',
      direction: 'bullish',
      description: 'Tres mínimos consecutivos en el mismo nivel. Señal muy fuerte de que el soporte aguantará.',
      howToIdentify: [
        'Tres valles en nivel de precio similar',
        'Dos rebotes intermedios',
        'Los vendedores no pueden empujar más el precio',
        'Volumen creciente en el tercer rebote'
      ],
      target: 'Altura del patrón proyectada hacia arriba desde la ruptura',
      stopLoss: 'Por debajo del tercer mínimo',
      confirmation: 'Ruptura de la resistencia con volumen',
      steps: [
        { title: '1. Formación', description: 'El precio rebota tres veces en el mismo soporte. Cada rebote confirma la fortaleza de la zona de demanda.', color: '#3B82F6' },
        { title: '2. Ruptura', description: 'Ruptura de la resistencia (máximos intermedios) con volumen elevado. Confirma el cambio de tendencia.', color: '#22C55E' },
        { title: '3. Target', description: 'Target = Altura del patrón proyectada hacia arriba desde el punto de ruptura.', color: '#22C55E' }
      ]
    },
    {
      id: 'rounding-top',
      name: 'Techo Redondeado',
      category: 'reversal',
      direction: 'bearish',
      description: 'Patrón de reversión gradual que forma una curva suave en los máximos, indicando pérdida progresiva de momentum alcista.',
      howToIdentify: [
        'Máximos que forman una curva suave (forma de U invertida)',
        'Proceso lento de formación (semanas/meses)',
        'Volumen decrece gradualmente',
        'Pérdida de momentum clara'
      ],
      target: 'Profundidad del patrón proyectada hacia abajo',
      stopLoss: 'Por encima del punto más alto de la curva',
      confirmation: 'Ruptura del soporte de la base del patrón',
      steps: [
        { title: '1. Formación', description: 'El precio va formando máximos cada vez más bajos de forma gradual, creando una curva suave en el techo.', color: '#3B82F6' },
        { title: '2. Ruptura', description: 'El precio rompe el soporte de la base del patrón redondeado con volumen creciente.', color: '#EF4444' },
        { title: '3. Target', description: 'Target = Profundidad del patrón (desde el máximo hasta la base) proyectada hacia abajo.', color: '#22C55E' }
      ]
    },
    {
      id: 'rounding-bottom',
      name: 'Suelo Redondeado (Taza)',
      category: 'reversal',
      direction: 'bullish',
      description: 'También llamado "Cup". Patrón de acumulación gradual que indica cambio de tendencia bajista a alcista.',
      howToIdentify: [
        'Mínimos que forman una curva suave (forma de U)',
        'Proceso lento de formación',
        'Volumen en forma de U también (decrece y luego aumenta)',
        'Acumulación gradual evidente'
      ],
      target: 'Profundidad del patrón proyectada hacia arriba',
      stopLoss: 'Por debajo del punto más bajo de la curva',
      confirmation: 'Ruptura de la resistencia en el borde de la taza',
      steps: [
        { title: '1. Formación', description: 'El precio forma mínimos graduales creando una forma de U o taza. El volumen también forma una U.', color: '#3B82F6' },
        { title: '2. Ruptura', description: 'El precio rompe la resistencia del borde de la taza. Puede formar un "asa" antes de la ruptura definitiva.', color: '#22C55E' },
        { title: '3. Target', description: 'Target = Profundidad de la taza proyectada hacia arriba desde la ruptura.', color: '#22C55E' }
      ]
    }
  ],
  continuation: [
    {
      id: 'ascending-triangle',
      name: 'Triángulo Ascendente',
      category: 'continuation',
      direction: 'bullish',
      description: 'Patrón de continuación alcista con resistencia horizontal y mínimos ascendentes. Alta probabilidad de ruptura alcista.',
      howToIdentify: [
        'Resistencia horizontal (techos planos)',
        'Mínimos cada vez más altos (soporte ascendente)',
        'Compresión del precio hacia el vértice',
        'Volumen decrece durante la formación'
      ],
      target: 'Altura del triángulo proyectada desde el punto de ruptura',
      stopLoss: 'Por debajo del último mínimo del triángulo',
      confirmation: 'Ruptura alcista de la resistencia con volumen',
      steps: [
        { title: '1. Formación', description: 'El precio rebota entre resistencia horizontal y soporte ascendente. Los mínimos son cada vez más altos, mostrando presión compradora.', color: '#3B82F6' },
        { title: '2. Ruptura', description: 'Ruptura de la resistencia horizontal con volumen significativo. 75% de probabilidad de ruptura alcista.', color: '#22C55E' },
        { title: '3. Target', description: 'Target = Base del triángulo (parte más ancha) proyectada hacia arriba desde la ruptura.', color: '#22C55E' }
      ]
    },
    {
      id: 'descending-triangle',
      name: 'Triángulo Descendente',
      category: 'continuation',
      direction: 'bearish',
      description: 'Patrón de continuación bajista con soporte horizontal y máximos descendentes. Alta probabilidad de ruptura bajista.',
      howToIdentify: [
        'Soporte horizontal (suelos planos)',
        'Máximos cada vez más bajos (resistencia descendente)',
        'Presión vendedora creciente',
        'Volumen decrece durante formación'
      ],
      target: 'Altura del triángulo proyectada hacia abajo',
      stopLoss: 'Por encima del último máximo del triángulo',
      confirmation: 'Ruptura bajista del soporte con volumen',
      steps: [
        { title: '1. Formación', description: 'El precio rebota entre soporte horizontal y resistencia descendente. Los máximos son cada vez más bajos, mostrando presión vendedora.', color: '#3B82F6' },
        { title: '2. Ruptura', description: 'Ruptura del soporte horizontal con volumen. 75% de probabilidad de ruptura bajista.', color: '#EF4444' },
        { title: '3. Target', description: 'Target = Base del triángulo proyectada hacia abajo desde la ruptura.', color: '#22C55E' }
      ]
    },
    {
      id: 'symmetric-triangle',
      name: 'Triángulo Simétrico',
      category: 'continuation',
      direction: 'neutral',
      description: 'Patrón de consolidación con líneas convergentes. Puede romper en cualquier dirección, pero suele continuar la tendencia previa.',
      howToIdentify: [
        'Máximos descendentes y mínimos ascendentes',
        'Líneas de tendencia convergentes simétricas',
        'Volumen decreciente durante la formación',
        'Ruptura esperada en el 2/3 del patrón'
      ],
      target: 'Altura del triángulo proyectada en dirección de la ruptura',
      stopLoss: 'Al otro lado del triángulo',
      confirmation: 'Ruptura con aumento significativo de volumen',
      steps: [
        { title: '1. Formación', description: 'El precio comprime entre líneas convergentes. Máximos más bajos y mínimos más altos crean forma de triángulo simétrico.', color: '#3B82F6' },
        { title: '2. Ruptura', description: 'La ruptura suele ocurrir en el primer 2/3 del patrón. Esperar confirmación de volumen antes de entrar.', color: '#FBBF24' },
        { title: '3. Target', description: 'Target = Base del triángulo proyectada en la dirección de la ruptura. El 75% continúa la tendencia previa.', color: '#22C55E' }
      ]
    },
    {
      id: 'bull-flag',
      name: 'Bandera Alcista',
      category: 'continuation',
      direction: 'bullish',
      description: 'Patrón de continuación potente que aparece tras un fuerte impulso alcista (asta), seguido de consolidación (bandera).',
      howToIdentify: [
        'Asta: movimiento alcista fuerte y rápido',
        'Bandera: canal descendente de consolidación',
        'Volumen alto en el asta, bajo en la bandera',
        'Duración de la bandera: 1-3 semanas típicamente'
      ],
      target: 'Altura del asta proyectada desde la ruptura de la bandera',
      stopLoss: 'Por debajo de la base de la bandera',
      confirmation: 'Ruptura alcista del canal con volumen',
      steps: [
        { title: '1. Formación', description: 'Impulso alcista fuerte (asta), seguido de retroceso ordenado en canal descendente (bandera). Volumen bajo en la bandera.', color: '#3B82F6' },
        { title: '2. Ruptura', description: 'Ruptura del canal bajista de la bandera con aumento de volumen. Entrada en LONG en ruptura o pullback.', color: '#22C55E' },
        { title: '3. Target', description: 'Target = Longitud del asta proyectada hacia arriba desde la ruptura. Alta tasa de éxito (65%+).', color: '#22C55E' }
      ]
    },
    {
      id: 'bear-flag',
      name: 'Bandera Bajista',
      category: 'continuation',
      direction: 'bearish',
      description: 'Patrón de continuación bajista tras un fuerte impulso a la baja, seguido de consolidación alcista.',
      howToIdentify: [
        'Asta: movimiento bajista fuerte',
        'Bandera: canal ascendente de consolidación',
        'Volumen alto en el asta, bajo en la bandera',
        'El rally de la bandera es débil (sin convicción)'
      ],
      target: 'Altura del asta proyectada hacia abajo',
      stopLoss: 'Por encima de la parte superior de la bandera',
      confirmation: 'Ruptura bajista del canal',
      steps: [
        { title: '1. Formación', description: 'Impulso bajista fuerte (asta), seguido de retroceso ordenado en canal ascendente (bandera). El rebote es débil.', color: '#3B82F6' },
        { title: '2. Ruptura', description: 'Ruptura del canal alcista de la bandera hacia abajo con volumen. Entrada en SHORT.', color: '#EF4444' },
        { title: '3. Target', description: 'Target = Longitud del asta proyectada hacia abajo desde la ruptura de la bandera.', color: '#22C55E' }
      ]
    },
    {
      id: 'bull-pennant',
      name: 'Banderín Alcista',
      category: 'continuation',
      direction: 'bullish',
      description: 'Similar a la bandera pero la consolidación forma un triángulo simétrico pequeño. Muy explosivo.',
      howToIdentify: [
        'Asta: movimiento alcista fuerte con volumen',
        'Banderín: triángulo simétrico pequeño',
        'Formación más corta que la bandera',
        'Compresión de volatilidad extrema'
      ],
      target: 'Altura del asta proyectada hacia arriba',
      stopLoss: 'Por debajo del banderín',
      confirmation: 'Ruptura alcista con explosión de volumen',
      steps: [
        { title: '1. Formación', description: 'Impulso alcista seguido de consolidación en forma de triángulo pequeño (banderín). El precio se comprime rápidamente.', color: '#3B82F6' },
        { title: '2. Ruptura', description: 'Ruptura explosiva del banderín hacia arriba. El movimiento suele ser rápido y fuerte.', color: '#22C55E' },
        { title: '3. Target', description: 'Target = Longitud del asta. Los banderines tienen alta tasa de éxito cuando se forman correctamente.', color: '#22C55E' }
      ]
    },
    {
      id: 'bear-pennant',
      name: 'Banderín Bajista',
      category: 'continuation',
      direction: 'bearish',
      description: 'Versión bajista del banderín. Consolidación en triángulo tras impulso bajista.',
      howToIdentify: [
        'Asta: movimiento bajista fuerte',
        'Banderín: triángulo simétrico pequeño',
        'Volumen bajo durante el banderín',
        'Compresión rápida del precio'
      ],
      target: 'Altura del asta proyectada hacia abajo',
      stopLoss: 'Por encima del banderín',
      confirmation: 'Ruptura bajista con volumen',
      steps: [
        { title: '1. Formación', description: 'Impulso bajista fuerte seguido de consolidación en triángulo pequeño.', color: '#3B82F6' },
        { title: '2. Ruptura', description: 'Ruptura del banderín hacia abajo con volumen. Movimiento rápido esperado.', color: '#EF4444' },
        { title: '3. Target', description: 'Target = Longitud del asta proyectada hacia abajo.', color: '#22C55E' }
      ]
    },
    {
      id: 'rising-wedge',
      name: 'Cuña Ascendente',
      category: 'continuation',
      direction: 'bearish',
      description: 'Patrón con líneas convergentes hacia arriba. Aunque sube, es BAJISTA porque indica agotamiento.',
      howToIdentify: [
        'Máximos y mínimos ascendentes',
        'Líneas de tendencia convergentes hacia arriba',
        'Momentum decreciente (subidas más débiles)',
        'Volumen decreciente'
      ],
      target: 'Base de la cuña (inicio del patrón)',
      stopLoss: 'Por encima del último máximo',
      confirmation: 'Ruptura bajista con volumen',
      steps: [
        { title: '1. Formación', description: 'El precio sube pero las líneas convergen. Cada máximo es más alto pero con menos fuerza. Señal de agotamiento.', color: '#3B82F6' },
        { title: '2. Ruptura', description: 'Ruptura de la línea de soporte de la cuña hacia abajo. Suele ser violenta.', color: '#EF4444' },
        { title: '3. Target', description: 'Target = Base de la cuña (punto de inicio). El movimiento puede ser muy rápido.', color: '#22C55E' }
      ]
    },
    {
      id: 'falling-wedge',
      name: 'Cuña Descendente',
      category: 'continuation',
      direction: 'bullish',
      description: 'Patrón con líneas convergentes hacia abajo. Aunque baja, es ALCISTA porque indica que la presión vendedora se agota.',
      howToIdentify: [
        'Máximos y mínimos descendentes',
        'Líneas de tendencia convergentes hacia abajo',
        'Presión vendedora agotándose',
        'Volumen bajo en las caídas finales'
      ],
      target: 'Inicio de la cuña (parte alta)',
      stopLoss: 'Por debajo del último mínimo',
      confirmation: 'Ruptura alcista con volumen',
      steps: [
        { title: '1. Formación', description: 'El precio baja pero las líneas convergen. Los vendedores pierden fuerza gradualmente.', color: '#3B82F6' },
        { title: '2. Ruptura', description: 'Ruptura de la resistencia de la cuña hacia arriba con volumen creciente.', color: '#22C55E' },
        { title: '3. Target', description: 'Target = Inicio de la cuña (primer punto). Movimiento potente esperado.', color: '#22C55E' }
      ]
    },
    {
      id: 'rectangle-bullish',
      name: 'Rectángulo Alcista',
      category: 'continuation',
      direction: 'bullish',
      description: 'Consolidación horizontal entre soporte y resistencia paralelos en tendencia alcista.',
      howToIdentify: [
        'Soporte y resistencia horizontales paralelos',
        'Precio rebota entre ambos niveles',
        'Aparece en medio de tendencia alcista',
        'Volumen bajo durante la consolidación'
      ],
      target: 'Altura del rectángulo proyectada hacia arriba',
      stopLoss: 'Por debajo del soporte del rectángulo',
      confirmation: 'Ruptura de la resistencia con volumen',
      steps: [
        { title: '1. Formación', description: 'El precio consolida horizontalmente entre soporte y resistencia claros. Acumulación de posiciones.', color: '#3B82F6' },
        { title: '2. Ruptura', description: 'Ruptura de la resistencia superior con aumento de volumen. Continuación de la tendencia alcista.', color: '#22C55E' },
        { title: '3. Target', description: 'Target = Altura del rectángulo proyectada hacia arriba desde la ruptura.', color: '#22C55E' }
      ]
    },
    {
      id: 'rectangle-bearish',
      name: 'Rectángulo Bajista',
      category: 'continuation',
      direction: 'bearish',
      description: 'Consolidación horizontal en tendencia bajista. Distribución antes de continuar la caída.',
      howToIdentify: [
        'Soporte y resistencia horizontales',
        'Aparece en medio de tendencia bajista',
        'Distribución de posiciones',
        'Los rebotes son cada vez más débiles'
      ],
      target: 'Altura del rectángulo proyectada hacia abajo',
      stopLoss: 'Por encima de la resistencia',
      confirmation: 'Ruptura del soporte con volumen',
      steps: [
        { title: '1. Formación', description: 'Consolidación horizontal durante tendencia bajista. Los vendedores distribuyen posiciones.', color: '#3B82F6' },
        { title: '2. Ruptura', description: 'Ruptura del soporte inferior con volumen. Continuación bajista.', color: '#EF4444' },
        { title: '3. Target', description: 'Target = Altura del rectángulo proyectada hacia abajo.', color: '#22C55E' }
      ]
    },
    {
      id: 'channel-ascending',
      name: 'Canal Ascendente',
      category: 'continuation',
      direction: 'bullish',
      description: 'Tendencia alcista contenida entre dos líneas paralelas ascendentes.',
      howToIdentify: [
        'Líneas de soporte y resistencia paralelas ascendentes',
        'Mínimos y máximos cada vez más altos',
        'El precio rebota entre ambas líneas',
        'Tendencia ordenada y predecible'
      ],
      target: 'Operar dentro del canal o esperar ruptura',
      stopLoss: 'Por debajo del soporte del canal',
      confirmation: 'Rebote en soporte con volumen o ruptura de resistencia',
      steps: [
        { title: '1. Formación', description: 'El precio sube de forma ordenada entre dos líneas paralelas. Cada toque del soporte es oportunidad de compra.', color: '#3B82F6' },
        { title: '2. Trading', description: 'Comprar en soporte del canal, vender en resistencia. O esperar ruptura alcista de la resistencia.', color: '#22C55E' },
        { title: '3. Target', description: 'Dentro del canal: resistencia. En ruptura: ancho del canal proyectado hacia arriba.', color: '#22C55E' }
      ]
    },
    {
      id: 'channel-descending',
      name: 'Canal Descendente',
      category: 'continuation',
      direction: 'bearish',
      description: 'Tendencia bajista contenida entre dos líneas paralelas descendentes.',
      howToIdentify: [
        'Líneas de soporte y resistencia paralelas descendentes',
        'Mínimos y máximos cada vez más bajos',
        'Tendencia bajista ordenada',
        'Rebotes en resistencia son oportunidades de venta'
      ],
      target: 'Operar dentro del canal o esperar ruptura',
      stopLoss: 'Por encima de la resistencia del canal',
      confirmation: 'Rechazo en resistencia o ruptura de soporte',
      steps: [
        { title: '1. Formación', description: 'El precio baja de forma ordenada entre dos líneas paralelas descendentes.', color: '#3B82F6' },
        { title: '2. Trading', description: 'Vender en resistencia del canal o esperar ruptura bajista del soporte.', color: '#EF4444' },
        { title: '3. Target', description: 'Dentro del canal: soporte. En ruptura: ancho del canal proyectado hacia abajo.', color: '#22C55E' }
      ]
    }
  ],
  candlesticks: [
    {
      id: 'doji',
      name: 'Doji',
      category: 'candlesticks',
      direction: 'neutral',
      description: 'Vela con apertura y cierre casi iguales. Indica indecisión total en el mercado y posible cambio de tendencia.',
      howToIdentify: [
        'Cuerpo muy pequeño o inexistente',
        'Sombras superior e inferior visibles',
        'Apertura ≈ Cierre',
        'Importante en zonas de soporte/resistencia'
      ],
      target: 'Confirmar con la siguiente vela para determinar dirección',
      stopLoss: 'Por encima/debajo de las sombras del Doji',
      confirmation: 'Vela siguiente que confirme la dirección',
      steps: [
        { title: '1. Formación', description: 'Vela con cuerpo mínimo donde apertura = cierre. Las sombras muestran la batalla entre compradores y vendedores.', color: '#3B82F6' },
        { title: '2. Contexto', description: 'Un Doji tras tendencia alcista sugiere techo. Tras tendencia bajista sugiere suelo. En rango, indica continuación de indecisión.', color: '#FBBF24' },
        { title: '3. Confirmación', description: 'NUNCA operar solo el Doji. Esperar la vela siguiente que confirme la dirección del movimiento.', color: '#22C55E' }
      ]
    },
    {
      id: 'hammer',
      name: 'Martillo (Hammer)',
      category: 'candlesticks',
      direction: 'bullish',
      description: 'Vela con sombra inferior larga tras tendencia bajista. Los compradores rechazaron los mínimos con fuerza.',
      howToIdentify: [
        'Cuerpo pequeño en la parte superior',
        'Sombra inferior al menos 2x el cuerpo',
        'Poca o nula sombra superior',
        'Aparece tras tendencia bajista'
      ],
      target: 'Máximo anterior o resistencia cercana',
      stopLoss: 'Por debajo de la sombra del martillo',
      confirmation: 'Vela alcista siguiente',
      steps: [
        { title: '1. Formación', description: 'Tras tendencia bajista, aparece vela con sombra inferior larga. Los compradores entraron con fuerza rechazando los mínimos.', color: '#3B82F6' },
        { title: '2. Confirmación', description: 'La siguiente vela debe ser alcista y cerrar por encima del cuerpo del martillo. Sin confirmación, no hay entrada.', color: '#22C55E' },
        { title: '3. Entrada', description: 'Entrada LONG con SL debajo de la sombra del martillo. Target en resistencia cercana o máximo anterior.', color: '#22C55E' }
      ]
    },
    {
      id: 'inverted-hammer',
      name: 'Martillo Invertido',
      category: 'candlesticks',
      direction: 'bullish',
      description: 'Vela con sombra superior larga tras tendencia bajista. Señal de que los compradores están intentando tomar control.',
      howToIdentify: [
        'Cuerpo pequeño en la parte inferior',
        'Sombra superior larga (2x el cuerpo mínimo)',
        'Poca o nula sombra inferior',
        'Aparece tras tendencia bajista'
      ],
      target: 'Resistencia cercana',
      stopLoss: 'Por debajo del mínimo del martillo invertido',
      confirmation: 'Vela alcista siguiente que cierre por encima',
      steps: [
        { title: '1. Formación', description: 'Tras tendencia bajista, vela con sombra superior larga. Los compradores intentaron subir el precio.', color: '#3B82F6' },
        { title: '2. Confirmación', description: 'Necesita confirmación alcista fuerte en la siguiente vela para validar la señal.', color: '#22C55E' },
        { title: '3. Entrada', description: 'LONG si la siguiente vela confirma. SL bajo el mínimo del patrón.', color: '#22C55E' }
      ]
    },
    {
      id: 'shooting-star',
      name: 'Estrella Fugaz',
      category: 'candlesticks',
      direction: 'bearish',
      description: 'Vela con sombra superior larga tras tendencia alcista. Los vendedores rechazaron los máximos con fuerza.',
      howToIdentify: [
        'Cuerpo pequeño en la parte inferior',
        'Sombra superior al menos 2x el cuerpo',
        'Poca o nula sombra inferior',
        'Aparece tras tendencia alcista'
      ],
      target: 'Mínimo anterior o soporte cercano',
      stopLoss: 'Por encima de la sombra superior',
      confirmation: 'Vela bajista siguiente',
      steps: [
        { title: '1. Formación', description: 'Tras tendencia alcista, vela con sombra superior larga. Los vendedores rechazaron los máximos.', color: '#3B82F6' },
        { title: '2. Confirmación', description: 'La siguiente vela debe ser bajista y cerrar por debajo del cuerpo de la estrella fugaz.', color: '#EF4444' },
        { title: '3. Entrada', description: 'SHORT con SL encima de la sombra. Target en soporte cercano.', color: '#22C55E' }
      ]
    },
    {
      id: 'hanging-man',
      name: 'Hombre Colgado',
      category: 'candlesticks',
      direction: 'bearish',
      description: 'Igual forma que el martillo pero aparece tras tendencia alcista. Señal de posible reversión bajista.',
      howToIdentify: [
        'Misma forma que el martillo',
        'Aparece tras tendencia ALCISTA',
        'Sombra inferior larga, cuerpo pequeño arriba',
        'Señal de que los compradores están perdiendo control'
      ],
      target: 'Soporte cercano o mínimo anterior',
      stopLoss: 'Por encima del máximo de la vela',
      confirmation: 'Vela bajista siguiente',
      steps: [
        { title: '1. Formación', description: 'Misma forma que el martillo pero en contexto alcista. Indica que los vendedores están ganando fuerza.', color: '#3B82F6' },
        { title: '2. Confirmación', description: 'Requiere confirmación bajista en la siguiente vela para ser válido.', color: '#EF4444' },
        { title: '3. Entrada', description: 'SHORT si confirma. SL encima del máximo del patrón.', color: '#22C55E' }
      ]
    },
    {
      id: 'engulfing-bullish',
      name: 'Envolvente Alcista',
      category: 'candlesticks',
      direction: 'bullish',
      description: 'Patrón de dos velas donde la segunda (alcista) "envuelve" completamente el cuerpo de la primera (bajista).',
      howToIdentify: [
        'Primera vela: bajista',
        'Segunda vela: alcista que cubre completamente la primera',
        'El cuerpo de la segunda debe ser mayor que el de la primera',
        'Mayor volumen en la segunda vela'
      ],
      target: 'Resistencia anterior',
      stopLoss: 'Por debajo del mínimo del patrón',
      confirmation: 'El patrón es confirmación en sí mismo',
      steps: [
        { title: '1. Formación', description: 'Tras tendencia bajista: vela bajista pequeña seguida de vela alcista grande que la envuelve completamente.', color: '#3B82F6' },
        { title: '2. Validación', description: 'El cuerpo alcista debe cubrir todo el cuerpo bajista anterior. Más grande = más fuerte la señal.', color: '#22C55E' },
        { title: '3. Entrada', description: 'LONG en cierre de la vela envolvente o apertura siguiente. SL bajo el mínimo del patrón.', color: '#22C55E' }
      ]
    },
    {
      id: 'engulfing-bearish',
      name: 'Envolvente Bajista',
      category: 'candlesticks',
      direction: 'bearish',
      description: 'Patrón de dos velas donde la segunda (bajista) "envuelve" completamente el cuerpo de la primera (alcista).',
      howToIdentify: [
        'Primera vela: alcista',
        'Segunda vela: bajista que cubre completamente la primera',
        'El cuerpo bajista debe ser mayor',
        'Mayor volumen en la vela bajista'
      ],
      target: 'Soporte anterior',
      stopLoss: 'Por encima del máximo del patrón',
      confirmation: 'El patrón es confirmación en sí mismo',
      steps: [
        { title: '1. Formación', description: 'Tras tendencia alcista: vela alcista pequeña seguida de vela bajista grande que la envuelve.', color: '#3B82F6' },
        { title: '2. Validación', description: 'El cuerpo bajista debe cubrir completamente el cuerpo alcista anterior.', color: '#EF4444' },
        { title: '3. Entrada', description: 'SHORT en cierre de la vela envolvente. SL encima del máximo del patrón.', color: '#22C55E' }
      ]
    },
    {
      id: 'morning-star',
      name: 'Estrella de la Mañana',
      category: 'candlesticks',
      direction: 'bullish',
      description: 'Patrón de TRES velas muy fiable. Señala reversión alcista con alta probabilidad de éxito.',
      howToIdentify: [
        'Primera vela: bajista grande',
        'Segunda vela: cuerpo pequeño (gap bajista posible)',
        'Tercera vela: alcista grande que cierra >50% de la primera',
        'El "gap" de la estrella es importante'
      ],
      target: 'Máximo de la primera vela o resistencia',
      stopLoss: 'Por debajo del mínimo de la segunda vela (estrella)',
      confirmation: 'El patrón ya es confirmación por sí mismo',
      steps: [
        { title: '1. Primera Vela', description: 'Vela bajista grande que muestra presión vendedora fuerte. Continuación de tendencia bajista.', color: '#EF4444' },
        { title: '2. Segunda Vela (Estrella)', description: 'Vela pequeña (Doji o spinning top) que muestra indecisión. Idealmente con gap bajista.', color: '#FBBF24' },
        { title: '3. Tercera Vela', description: 'Vela alcista fuerte que cierra por encima del 50% de la primera. Confirmación de reversión. ENTRADA LONG.', color: '#22C55E' }
      ]
    },
    {
      id: 'evening-star',
      name: 'Estrella del Atardecer',
      category: 'candlesticks',
      direction: 'bearish',
      description: 'Patrón de TRES velas muy fiable para reversión bajista. Opuesto a la estrella de la mañana.',
      howToIdentify: [
        'Primera vela: alcista grande',
        'Segunda vela: cuerpo pequeño (gap alcista posible)',
        'Tercera vela: bajista grande que cierra <50% de la primera',
        'Patrón de alta fiabilidad'
      ],
      target: 'Mínimo de la primera vela o soporte',
      stopLoss: 'Por encima del máximo de la segunda vela',
      confirmation: 'El patrón ya es confirmación',
      steps: [
        { title: '1. Primera Vela', description: 'Vela alcista grande mostrando fuerza compradora. Tendencia alcista en progreso.', color: '#22C55E' },
        { title: '2. Segunda Vela (Estrella)', description: 'Vela pequeña que muestra indecisión. Idealmente con gap alcista.', color: '#FBBF24' },
        { title: '3. Tercera Vela', description: 'Vela bajista fuerte que cierra por debajo del 50% de la primera. ENTRADA SHORT.', color: '#EF4444' }
      ]
    },
    {
      id: 'three-white-soldiers',
      name: 'Tres Soldados Blancos',
      category: 'candlesticks',
      direction: 'bullish',
      description: 'Tres velas alcistas consecutivas con cierres cada vez más altos. Señal de reversión alcista muy fuerte.',
      howToIdentify: [
        'Tres velas alcistas consecutivas',
        'Cada vela abre dentro del cuerpo anterior',
        'Cada vela cierra más alto que la anterior',
        'Cuerpos largos con sombras pequeñas'
      ],
      target: 'Resistencia significativa o extensión de Fibonacci',
      stopLoss: 'Por debajo del mínimo de la primera vela',
      confirmation: 'El patrón es la confirmación',
      steps: [
        { title: '1. Formación', description: 'Tres velas alcistas consecutivas, cada una cerrando más alto. Muestra acumulación agresiva.', color: '#22C55E' },
        { title: '2. Validación', description: 'Cada vela debe abrir dentro del cuerpo de la anterior y cerrar más alto. Sombras pequeñas = más fuerte.', color: '#22C55E' },
        { title: '3. Entrada', description: 'LONG en cierre de la tercera vela o pullback. Target en resistencia. SL bajo primera vela.', color: '#22C55E' }
      ]
    },
    {
      id: 'three-black-crows',
      name: 'Tres Cuervos Negros',
      category: 'candlesticks',
      direction: 'bearish',
      description: 'Tres velas bajistas consecutivas con cierres cada vez más bajos. Señal de reversión bajista muy fuerte.',
      howToIdentify: [
        'Tres velas bajistas consecutivas',
        'Cada vela abre dentro del cuerpo anterior',
        'Cada vela cierra más bajo que la anterior',
        'Cuerpos largos, sombras pequeñas'
      ],
      target: 'Soporte significativo',
      stopLoss: 'Por encima del máximo de la primera vela',
      confirmation: 'El patrón es la confirmación',
      steps: [
        { title: '1. Formación', description: 'Tres velas bajistas consecutivas, cada una cerrando más bajo. Muestra distribución agresiva.', color: '#EF4444' },
        { title: '2. Validación', description: 'Cada vela abre dentro del cuerpo anterior y cierra más bajo. Cuerpos grandes = señal más fuerte.', color: '#EF4444' },
        { title: '3. Entrada', description: 'SHORT en cierre de la tercera vela. Target en soporte. SL sobre primera vela.', color: '#22C55E' }
      ]
    },
    {
      id: 'piercing-line',
      name: 'Línea Penetrante',
      category: 'candlesticks',
      direction: 'bullish',
      description: 'Patrón de dos velas donde la segunda alcista "penetra" más del 50% del cuerpo de la primera bajista.',
      howToIdentify: [
        'Primera vela: bajista grande',
        'Segunda vela: alcista que abre por debajo del mínimo anterior',
        'Segunda vela cierra por encima del 50% de la primera',
        'Aparece en suelos'
      ],
      target: 'Máximo de la primera vela',
      stopLoss: 'Por debajo del mínimo del patrón',
      confirmation: 'Vela alcista siguiente',
      steps: [
        { title: '1. Formación', description: 'Vela bajista grande seguida de vela alcista que abre con gap bajista pero cierra penetrando >50% de la primera.', color: '#3B82F6' },
        { title: '2. Validación', description: 'La penetración debe ser de al menos 50% del cuerpo bajista. Cuanto más, mejor la señal.', color: '#22C55E' },
        { title: '3. Entrada', description: 'LONG con confirmación. SL bajo el mínimo del patrón. Target en resistencia.', color: '#22C55E' }
      ]
    },
    {
      id: 'dark-cloud-cover',
      name: 'Cubierta de Nube Oscura',
      category: 'candlesticks',
      direction: 'bearish',
      description: 'Opuesto a la línea penetrante. Vela bajista que "penetra" más del 50% del cuerpo de la primera alcista.',
      howToIdentify: [
        'Primera vela: alcista grande',
        'Segunda vela: bajista que abre por encima del máximo anterior',
        'Segunda vela cierra por debajo del 50% de la primera',
        'Aparece en techos'
      ],
      target: 'Mínimo de la primera vela',
      stopLoss: 'Por encima del máximo del patrón',
      confirmation: 'Vela bajista siguiente',
      steps: [
        { title: '1. Formación', description: 'Vela alcista grande seguida de vela bajista que abre con gap alcista pero cierra penetrando >50% de la primera.', color: '#3B82F6' },
        { title: '2. Validación', description: 'La penetración bajista debe ser de al menos 50%. Señal de que los compradores perdieron control.', color: '#EF4444' },
        { title: '3. Entrada', description: 'SHORT con confirmación. SL sobre el máximo del patrón. Target en soporte.', color: '#22C55E' }
      ]
    },
    {
      id: 'tweezer-top',
      name: 'Pinzas de Techo (Tweezer Top)',
      category: 'candlesticks',
      direction: 'bearish',
      description: 'Dos velas con máximos al mismo nivel exacto. La primera alcista, la segunda bajista.',
      howToIdentify: [
        'Dos velas con máximos idénticos o casi idénticos',
        'Primera vela alcista, segunda bajista',
        'Aparece tras tendencia alcista',
        'Muestra rechazo fuerte del nivel'
      ],
      target: 'Soporte cercano',
      stopLoss: 'Por encima de los máximos idénticos',
      confirmation: 'Vela bajista siguiente',
      steps: [
        { title: '1. Formación', description: 'Vela alcista seguida de vela bajista con máximos exactamente al mismo nivel. Doble rechazo.', color: '#3B82F6' },
        { title: '2. Contexto', description: 'Válido solo en techos/resistencias. Los dos rechazos muestran que el nivel es infranqueable.', color: '#EF4444' },
        { title: '3. Entrada', description: 'SHORT con confirmación. SL justo encima de los máximos idénticos.', color: '#22C55E' }
      ]
    },
    {
      id: 'tweezer-bottom',
      name: 'Pinzas de Suelo (Tweezer Bottom)',
      category: 'candlesticks',
      direction: 'bullish',
      description: 'Dos velas con mínimos al mismo nivel exacto. La primera bajista, la segunda alcista.',
      howToIdentify: [
        'Dos velas con mínimos idénticos',
        'Primera vela bajista, segunda alcista',
        'Aparece tras tendencia bajista',
        'Muestra soporte fuerte en el nivel'
      ],
      target: 'Resistencia cercana',
      stopLoss: 'Por debajo de los mínimos idénticos',
      confirmation: 'Vela alcista siguiente',
      steps: [
        { title: '1. Formación', description: 'Vela bajista seguida de vela alcista con mínimos exactamente al mismo nivel. Doble soporte.', color: '#3B82F6' },
        { title: '2. Contexto', description: 'Válido solo en suelos/soportes. Los dos rebotes muestran que el nivel tiene demanda fuerte.', color: '#22C55E' },
        { title: '3. Entrada', description: 'LONG con confirmación. SL justo debajo de los mínimos idénticos.', color: '#22C55E' }
      ]
    }
  ]
};
