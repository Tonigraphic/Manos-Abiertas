import { useState } from 'react';
import { Search, Upload, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (url: string) => void;
}

export function ImageSelector({ isOpen, onClose, onSelectImage }: ImageSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);

    // Simulación de búsqueda - En producción usarías el skill de Unsplash
    // Por ahora usamos imágenes de placeholder
    setTimeout(() => {
      const mockResults = Array.from({ length: 9 }, (_, i) =>
        `https://picsum.photos/seed/${searchQuery}-${i}/400/400`
      );
      setSearchResults(mockResults);
      setIsSearching(false);
    }, 500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onSelectImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-neutral-900 rounded-2xl p-6 max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl">Seleccionar Imagen</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex gap-2 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
              <input
                type="text"
                placeholder="Buscar imágenes (ej: naturaleza, ciudad, abstracto)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-11 pr-4 py-3 bg-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSearching ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          <div className="mb-6">
            <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-neutral-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
              <Upload size={20} />
              <span>Subir tu propia imagen</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex-1 overflow-y-auto">
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {searchResults.map((url, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      onSelectImage(url);
                      onClose();
                    }}
                    className="aspect-square bg-neutral-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center text-neutral-500 py-12">
                <Search size={48} className="mx-auto mb-4 opacity-50" />
                <p>Busca imágenes o sube la tuya propia</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
