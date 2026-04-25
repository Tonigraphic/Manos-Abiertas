import { useState } from 'react';
import { X, Type, Download } from 'lucide-react';
import { motion } from 'motion/react';

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  fontWeight: string;
}

interface CollageCanvasProps {
  images: string[];
  template: string;
  onImageClick: (index: number) => void;
}

export function CollageCanvas({ images, template, onImageClick }: CollageCanvasProps) {
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const addText = () => {
    const newText: TextElement = {
      id: `text-${Date.now()}`,
      text: 'Nuevo texto',
      x: 50,
      y: 50,
      fontSize: 32,
      color: '#ffffff',
      fontFamily: 'Arial',
      fontWeight: 'bold',
    };
    setTextElements([...textElements, newText]);
    setSelectedText(newText.id);
  };

  const updateText = (id: string, updates: Partial<TextElement>) => {
    setTextElements(textElements.map(el =>
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  const deleteText = (id: string) => {
    setTextElements(textElements.filter(el => el.id !== id));
    setSelectedText(null);
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    setSelectedText(id);
    setIsDragging(true);
    const text = textElements.find(t => t.id === id);
    if (text) {
      setDragStart({ x: e.clientX - text.x, y: e.clientY - text.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && selectedText) {
      const rect = e.currentTarget.getBoundingClientRect();
      updateText(selectedText, {
        x: e.clientX - rect.left - dragStart.x,
        y: e.clientY - rect.top - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const downloadCollage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const canvasElement = document.getElementById('collage-canvas');
    if (!canvasElement) return;

    // Nota: Para una descarga real completa, necesitarías html2canvas
    alert('Función de descarga: En una app real, esto convertiría el collage a imagen');
  };

  const getTemplateLayout = () => {
    switch (template) {
      case 'grid-2x2':
        return (
          <div className="grid grid-cols-2 grid-rows-2 gap-2 h-full">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                onClick={() => onImageClick(i)}
                className="relative bg-neutral-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
              >
                {images[i] && (
                  <img src={images[i]} alt="" className="w-full h-full object-cover" />
                )}
                {!images[i] && (
                  <div className="w-full h-full flex items-center justify-center text-neutral-600">
                    Click para añadir
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      case 'horizontal-3':
        return (
          <div className="flex gap-2 h-full">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                onClick={() => onImageClick(i)}
                className="relative flex-1 bg-neutral-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
              >
                {images[i] && (
                  <img src={images[i]} alt="" className="w-full h-full object-cover" />
                )}
                {!images[i] && (
                  <div className="w-full h-full flex items-center justify-center text-neutral-600">
                    Click para añadir
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      case 'vertical-3':
        return (
          <div className="flex flex-col gap-2 h-full">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                onClick={() => onImageClick(i)}
                className="relative flex-1 bg-neutral-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
              >
                {images[i] && (
                  <img src={images[i]} alt="" className="w-full h-full object-cover" />
                )}
                {!images[i] && (
                  <div className="w-full h-full flex items-center justify-center text-neutral-600">
                    Click para añadir
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      case 'magazine':
        return (
          <div className="grid grid-cols-3 grid-rows-3 gap-2 h-full">
            <div
              onClick={() => onImageClick(0)}
              className="col-span-2 row-span-2 relative bg-neutral-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
            >
              {images[0] && <img src={images[0]} alt="" className="w-full h-full object-cover" />}
              {!images[0] && (
                <div className="w-full h-full flex items-center justify-center text-neutral-600">
                  Click para añadir
                </div>
              )}
            </div>
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                onClick={() => onImageClick(i)}
                className="relative bg-neutral-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
              >
                {images[i] && (
                  <img src={images[i]} alt="" className="w-full h-full object-cover" />
                )}
                {!images[i] && (
                  <div className="w-full h-full flex items-center justify-center text-neutral-600 text-sm">
                    +
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      case 'polaroid':
        return (
          <div className="relative h-full p-8 flex items-center justify-center">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                onClick={() => onImageClick(i)}
                className="absolute bg-white p-4 pb-16 shadow-2xl cursor-pointer hover:scale-105 transition-transform"
                style={{
                  width: '280px',
                  height: '340px',
                  rotate: i === 0 ? '-8deg' : i === 1 ? '0deg' : '8deg',
                  zIndex: i === 1 ? 3 : i === 0 ? 2 : 1,
                  left: i === 0 ? '10%' : i === 1 ? '50%' : 'auto',
                  right: i === 2 ? '10%' : 'auto',
                  top: i === 0 ? '15%' : i === 1 ? '10%' : '20%',
                  transform: i === 1 ? 'translateX(-50%)' : 'none',
                }}
              >
                <div className="w-full h-full bg-neutral-200 overflow-hidden">
                  {images[i] && <img src={images[i]} alt="" className="w-full h-full object-cover" />}
                  {!images[i] && (
                    <div className="w-full h-full flex items-center justify-center text-neutral-500">
                      +
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const selectedTextElement = textElements.find(t => t.id === selectedText);

  return (
    <div className="flex-1 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl">Tu Collage</h2>
        <div className="flex gap-2">
          <button
            onClick={addText}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Type size={18} />
            Añadir Texto
          </button>
          <button
            onClick={downloadCollage}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download size={18} />
            Descargar
          </button>
        </div>
      </div>

      <div
        id="collage-canvas"
        className="relative bg-neutral-900 rounded-xl overflow-hidden"
        style={{ height: '600px' }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {getTemplateLayout()}

        {textElements.map(textEl => (
          <div
            key={textEl.id}
            onMouseDown={(e) => handleMouseDown(e, textEl.id)}
            className={`absolute cursor-move select-none ${
              selectedText === textEl.id ? 'ring-2 ring-blue-500' : ''
            }`}
            style={{
              left: `${textEl.x}px`,
              top: `${textEl.y}px`,
              fontSize: `${textEl.fontSize}px`,
              color: textEl.color,
              fontFamily: textEl.fontFamily,
              fontWeight: textEl.fontWeight,
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            }}
          >
            {textEl.text}
          </div>
        ))}
      </div>

      {selectedTextElement && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3>Editar Texto</h3>
            <button
              onClick={() => deleteText(selectedTextElement.id)}
              className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-neutral-400 mb-2">Texto</label>
              <input
                type="text"
                value={selectedTextElement.text}
                onChange={(e) => updateText(selectedTextElement.id, { text: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-400 mb-2">Tamaño</label>
              <input
                type="range"
                min="12"
                max="120"
                value={selectedTextElement.fontSize}
                onChange={(e) => updateText(selectedTextElement.id, { fontSize: Number(e.target.value) })}
                className="w-full"
              />
              <div className="text-sm text-neutral-500 mt-1">{selectedTextElement.fontSize}px</div>
            </div>

            <div>
              <label className="block text-sm text-neutral-400 mb-2">Color</label>
              <input
                type="color"
                value={selectedTextElement.color}
                onChange={(e) => updateText(selectedTextElement.id, { color: e.target.value })}
                className="w-full h-10 bg-neutral-700 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-400 mb-2">Fuente</label>
              <select
                value={selectedTextElement.fontFamily}
                onChange={(e) => updateText(selectedTextElement.id, { fontFamily: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Verdana">Verdana</option>
                <option value="Comic Sans MS">Comic Sans</option>
                <option value="Impact">Impact</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-neutral-400 mb-2">Peso</label>
              <select
                value={selectedTextElement.fontWeight}
                onChange={(e) => updateText(selectedTextElement.id, { fontWeight: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="normal">Normal</option>
                <option value="bold">Negrita</option>
                <option value="lighter">Ligera</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
