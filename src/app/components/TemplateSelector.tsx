import { Grid2x2, LayoutGrid, Columns3, Rows3, Newspaper } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  icon: React.ReactNode;
  imageCount: number;
}

const templates: Template[] = [
  { id: 'grid-2x2', name: 'Grid 2×2', icon: <Grid2x2 size={24} />, imageCount: 4 },
  { id: 'horizontal-3', name: '3 Horizontal', icon: <Columns3 size={24} />, imageCount: 3 },
  { id: 'vertical-3', name: '3 Vertical', icon: <Rows3 size={24} />, imageCount: 3 },
  { id: 'magazine', name: 'Magazine', icon: <Newspaper size={24} />, imageCount: 5 },
  { id: 'polaroid', name: 'Polaroid', icon: <LayoutGrid size={24} />, imageCount: 3 },
];

interface TemplateSelectorProps {
  selectedTemplate: string;
  onSelectTemplate: (templateId: string) => void;
}

export function TemplateSelector({ selectedTemplate, onSelectTemplate }: TemplateSelectorProps) {
  return (
    <div>
      <h3 className="mb-4">Plantillas</h3>
      <div className="grid grid-cols-1 gap-3">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template.id)}
            className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
              selectedTemplate === template.id
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-neutral-700 bg-neutral-800/50 hover:border-neutral-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={selectedTemplate === template.id ? 'text-blue-400' : 'text-neutral-400'}>
                {template.icon}
              </div>
              <div className="text-left">
                <div className="font-medium">{template.name}</div>
                <div className="text-sm text-neutral-500">{template.imageCount} imágenes</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
