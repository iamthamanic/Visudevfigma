import { RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { useProject } from '../contexts/ProjectContext';

interface ScanButtonProps {
  scanType: 'appflow' | 'blueprint' | 'data';
  label?: string;
}

export function ScanButton({ scanType, label }: ScanButtonProps) {
  const { startScan, scanStatuses } = useProject();
  const status = scanStatuses[scanType];
  const isScanning = status.status === 'running';

  const handleScan = async () => {
    await startScan(scanType);
  };

  return (
    <Button
      onClick={handleScan}
      disabled={isScanning}
      variant="outline"
      className="gap-2"
    >
      <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
      {isScanning ? `${status.progress}% Scanning...` : label || 'Scan starten'}
    </Button>
  );
}
