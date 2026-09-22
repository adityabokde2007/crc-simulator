import { useState, useEffect } from 'react';
import { MousePointerClick } from 'lucide-react';

interface TransmissionChannelProps {
  codeword: string | null;
  onTransmit: (receivedCodeword: string) => void;
}

export function TransmissionChannel({ codeword, onTransmit }: TransmissionChannelProps) {
  const [currentCodeword, setCurrentCodeword] = useState<string | null>(null);
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);
  const [manualIndex, setManualIndex] = useState<string>('');

  useEffect(() => {
    setCurrentCodeword(codeword);
    setFlippedIndex(null);
    setManualIndex('');
  }, [codeword]);

  const triggerAnimation = (index: number) => {
    setFlippedIndex(index);
  };

  const handleManualFlip = () => {
    if (!currentCodeword) return;
    const idx = parseInt(manualIndex, 10);
    if (isNaN(idx) || idx < 0 || idx >= currentCodeword.length) return;
    
    const chars = currentCodeword.split('');
    chars[idx] = chars[idx] === '0' ? '1' : '0';
    setCurrentCodeword(chars.join(''));
    triggerAnimation(idx);
  };

  const handleSendToReceiver = () => {
    if (currentCodeword) {
      onTransmit(currentCodeword);
    }
  };

  return (
    <div className="bg-surface rounded-lg border border-border p-6 shadow-sm flex flex-col gap-6 w-full h-full">
      <div className="flex items-center gap-2 border-b border-border pb-4">
        <div className="bg-text-secondary/10 p-2 rounded-md text-text-secondary">
          <img src="/transmission.png" alt="Transmission icon" width={28} height={28} className="object-contain" />
        </div>
        <h2 className="text-xl font-semibold text-text-primary">Transmission Channel</h2>
      </div>

      {!currentCodeword ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[250px] border-2 border-dashed border-border rounded-lg bg-surface/50 text-text-secondary/50 text-sm p-6 text-center">
          Waiting for encoded data...
        </div>
      ) : (
        <div className="flex flex-col gap-6 flex-1">
          <div className="flex flex-col items-center gap-3 overflow-visible">
            <span className="text-sm font-medium text-text-secondary">Codeword In Transit</span>
            
            <div className="flex flex-wrap justify-center gap-1.5 pt-1 pb-1 overflow-visible">
              {currentCodeword.split('').map((bit, idx) => (
                <div key={idx} className="flex flex-col items-center gap-0.5">
                  <span className="text-[11px] sm:text-[13px] leading-none text-text-primary font-bold font-mono select-none">{idx}</span>
                  <div 
                    className="w-7 h-8 sm:w-9 sm:h-10 flex items-center justify-center font-mono text-sm sm:text-base rounded-md border transition-all duration-300 border-border text-text-primary bg-background"
                  >
                    {bit}
                  </div>
                </div>
              ))}
            </div>

            {flippedIndex !== null && (
              <div className="text-sm text-text-secondary mt-1">
                Bit flipped at position <strong className="text-black font-bold">{flippedIndex}</strong>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 mt-auto">
            <div className="flex flex-col gap-3 p-4 bg-background rounded-md border border-border">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                <label className="text-xs font-medium text-text-secondary whitespace-nowrap">Manually flip a bit:</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    min={0}
                    max={currentCodeword.length - 1}
                    value={manualIndex}
                    onChange={(e) => setManualIndex(e.target.value)}
                    placeholder="Index"
                    className="w-24 px-2 py-2 sm:py-1.5 text-sm text-text-primary border border-border rounded-md font-mono focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
                  />
                  <button
                    onClick={handleManualFlip}
                    disabled={manualIndex === '' || isNaN(parseInt(manualIndex, 10)) || parseInt(manualIndex, 10) < 0 || parseInt(manualIndex, 10) >= currentCodeword.length}
                    className="bg-surface border border-border hover:bg-background text-text-primary text-sm font-medium py-2 sm:py-1.5 px-4 sm:px-3 rounded-md transition-colors disabled:opacity-40 flex items-center gap-1.5"
                  >
                    <MousePointerClick size={14} />
                    <span>Flip</span>
                  </button>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleSendToReceiver}
              className="w-full bg-text-primary hover:bg-text-primary/90 text-white font-medium py-3 sm:py-2.5 px-4 rounded-md transition-colors"
            >
              Pass to Receiver
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
