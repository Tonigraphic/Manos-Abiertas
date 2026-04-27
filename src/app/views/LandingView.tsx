{/* Hero Section */}
<section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8">
  <div className="max-w-6xl mx-auto text-center">
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full mb-8 shadow-md border border-[var(--color-neutral-200)]">
        <GraduationCap size={20} className="text-[var(--color-primary-600)]" />
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">
          Universidad de Nariño - Programa de Diseño Gráfico
        </span>
      </div>

      {/* AQUÍ ESTÁ EL CAMBIO: Reemplazo de texto por Imagen */}
      <div className="flex justify-center mb-6">
        <img 
          src="/logo.png" 
          alt="Logo Manos Abiertas" 
          className="h-28 sm:h-36 lg:h-44 w-auto object-contain" 
        />
      </div>

      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--color-text-primary)] mb-6 leading-tight">
        Asistente para la comunicación en LSC
      </h1>

      <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto mb-10 leading-relaxed">
        Herramienta digital integral desde el enfoque del diseño gráfico, orientada a fortalecer
        los procesos de comunicación entre la comunidad sorda y oyente de la Facultad de Artes de la Universidad de Nariño.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Button
          variant="primary"
          size="lg"
          onClick={() => onNavigate('assistant')}
          rightIcon={<Bot size={22} />}
          className="w-full sm:w-auto"
        >
          Probar Asistente
        </Button>
        <Button
          variant="ghost"
          size="lg"
          onClick={() => {
            document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="w-full sm:w-auto border border-[var(--color-neutral-300)]"
        >
          Ver Características
        </Button>
      </div>
    </motion.div>
    {/* ... resto del código ... */}
