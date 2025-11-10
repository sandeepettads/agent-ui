import { Check } from 'lucide-react';

interface ComponentOption {
  id: string;
  displayName: string;
  description?: string;
  category?: string;
}

interface ComponentSelectorProps {
  options: ComponentOption[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  multiSelect?: boolean;
  title: string;
}

export function ComponentSelector({ 
  options, 
  selectedIds, 
  onSelect, 
  multiSelect = true,
  title 
}: ComponentSelectorProps) {
  const handleToggle = (id: string) => {
    if (multiSelect) {
      if (selectedIds.includes(id)) {
        onSelect(selectedIds.filter(selectedId => selectedId !== id));
      } else {
        onSelect([...selectedIds, id]);
      }
    } else {
      onSelect([id]);
    }
  };
  
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-slate-300">{title}</h3>
      <div className="grid gap-2">
        {options.map((option) => {
          const isSelected = selectedIds.includes(option.id);
          
          return (
            <button
              key={option.id}
              onClick={() => handleToggle(option.id)}
              className={`text-left p-4 rounded-xl border transition-all ${
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-slate-700 bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                  isSelected
                    ? 'border-primary bg-primary'
                    : 'border-slate-600'
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-100">{option.displayName}</span>
                    {option.category && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                        {option.category}
                      </span>
                    )}
                  </div>
                  {option.description && (
                    <p className="mt-1 text-sm text-slate-400">{option.description}</p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
