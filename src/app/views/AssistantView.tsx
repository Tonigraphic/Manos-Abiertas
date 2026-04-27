{/* Busca el contenedor de la cámara y reemplázalo por este */}
<div className="relative aspect-video bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
  
  {/* VIDEO: Siempre visible cuando isActive es true */}
  <video 
    ref={videoRef} 
    className={`absolute inset-0 w-full h-full object-cover ${recState.isActive ? 'opacity-100' : 'opacity-0'}`} 
    style={{ transform: 'scaleX(-1)' }} // Efecto espejo
    autoPlay 
    muted 
    playsInline 
  />
  
  {/* CANVAS: Capa transparente para los puntos */}
  <canvas 
    ref={canvasRef} 
    className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none" 
    style={{ transform: 'scaleX(-1)' }} 
  />

  {/* UI de selección y carga se mantiene igual... */}
</div>
