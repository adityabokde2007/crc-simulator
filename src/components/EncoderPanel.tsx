import { useState } from 'react';
import { encodeCRC, parsePolynomialInput } from '../utils/crc';
import type { Step } from '../utils/crc';
import { DivisionSteps } from './DivisionSteps';
import { Modal } from './Modal';
import { clsx } from 'clsx';
import { ArrowRight, Calculator } from 'lucide-react';

interface EncoderPanelProps {
  onEncode: (data: string, poly: string, codeword: string) => void;
}

export function EncoderPanel({ onEncode }: EncoderPanelProps) {
  const [data, setData] = useState('');
  const [polyInput, setPolyInput] = useState('');
  const [result, setResult] = useState<{ codeword: string, steps: Step[], remainder: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const parsedPoly = parsePolynomialInput(polyInput);

  const isDataValidStr = /^[01]+$/.test(data);
  const isPolyValidStr = parsedPoly !== null && parsedPoly.length > 1;
  const showDataError = data.length > 0 && !isDataValidStr;
  const showPolyError = polyInput.length > 0 && !isPolyValidStr;
  
  const canEncode = isDataValidStr && isPolyValidStr;

  const handleEncode = () => {
    if (!canEncode || !parsedPoly) return;
    const res = encodeCRC(data, parsedPoly);
    setResult(res);
    onEncode(data, parsedPoly, res.codeword);
  };

  return (
    <div className="bg-surface rounded-lg border border-border p-6 shadow-sm flex flex-col gap-6 w-full h-full">
      <div className="flex items-center gap-2 border-b border-border pb-4">
        <div className="bg-accent/10 p-2 rounded-md text-accent">
          <img src="/sender.png" alt="Sender icon" width={28} height={28} className="object-contain" />
        </div>
        <h2 className="text-xl font-semibold text-text-primary">Sender Panel</h2>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Data to Transmit (Binary)</label>
          <input
            type="text"
            value={data}
            onChange={(e) => setData(e.target.value.replace(/[^01]/g, ''))}
            className={clsx(
              "w-full px-3 py-2 border rounded-md font-mono focus:outline-none focus:ring-2 transition-all",
              showDataError ? "border-error focus:border-error focus:ring-error/20" : "border-border focus:border-accent focus:ring-accent/20"
            )}
            placeholder="Enter your binary data"
          />
          {showDataError && <span className="text-xs text-error">Only 0 and 1 characters allowed.</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Generator Polynomial</label>
          <input
            type="text"
            value={polyInput}
            onChange={(e) => setPolyInput(e.target.value)}
            className={clsx(
              "w-full px-3 py-2 border rounded-md font-mono focus:outline-none focus:ring-2 transition-all",
              showPolyError ? "border-error focus:border-error focus:ring-error/20" : "border-border focus:border-accent focus:ring-accent/20"
            )}
            placeholder="e.g. 100000111 or x^8+x^2+x+1"
          />
          <span className="text-[11px] text-text-secondary/70">Enter as binary (100000111) or polynomial (x^8+x^2+x+1)</span>
          {showPolyError && <span className="text-xs text-error mt-1">Please enter a valid binary string or polynomial expression</span>}
        </div>

        <button
          onClick={handleEncode}
          disabled={!canEncode}
          className="mt-2 w-full bg-accent hover:bg-accent/90 text-white font-medium py-3 sm:py-2.5 px-4 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span>Encode Data</span>
          <ArrowRight size={18} />
        </button>

        {result && (
          <div className="mt-4 flex flex-col gap-4 animate-in fade-in duration-300">
            <div className="bg-accent/5 border border-accent/20 rounded-md p-4">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-text-secondary mb-2">Transmitted Codeword</h3>
              <div className="font-mono text-lg text-text-primary break-all">
                <span>{data}</span>
                <span className="text-accent font-bold">{result.remainder.padStart(parsedPoly ? parsedPoly.length - 1 : 0, '0')}</span>
              </div>
              <p className="text-xs text-text-secondary mt-1">Data bits + CRC Remainder</p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 w-full bg-surface border border-border hover:bg-background text-text-primary font-medium py-3 sm:py-2 px-4 rounded-md transition-colors"
            >
              <Calculator size={18} className="text-text-secondary" />
              <span>See Calculation</span>
            </button>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Sender Calculation (Encoding)"
      >
        {result && <DivisionSteps steps={result.steps} remainder={result.remainder} />}
      </Modal>
    </div>
  );
}
