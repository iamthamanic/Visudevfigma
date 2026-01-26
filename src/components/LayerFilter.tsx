import { Layer } from '../types';

interface LayerFilterProps {
  selectedLayers: Set<Layer>;
  onToggleLayer: (layer: Layer) => void;
}

const layers: { key: Layer; label: string; color: string }[] = [
  { key: 'frontend', label: 'Frontend', color: '#03ffa3' },
  { key: 'compute', label: 'Compute', color: '#666666' },
  { key: 'data', label: 'Data', color: '#000000' },
  { key: 'external', label: 'External', color: '#999999' },
  { key: 'policies', label: 'Policies', color: '#CCCCCC' }
];

export function LayerFilter({ selectedLayers, onToggleLayer }: LayerFilterProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-gray-600 mr-2">Layer:</span>
      {layers.map(({ key, label, color }) => {
        const isSelected = selectedLayers.has(key);
        return (
          <button
            key={key}
            onClick={() => onToggleLayer(key)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all border ${
              isSelected
                ? 'border-transparent'
                : 'border-gray-200 bg-white'
            }`}
            style={{
              backgroundColor: isSelected ? color : undefined,
              color: isSelected ? (key === 'frontend' ? '#000' : '#fff') : '#666',
              opacity: isSelected ? 1 : 0.7
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
