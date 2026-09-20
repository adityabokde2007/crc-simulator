import { useState, useEffect } from 'react';
import { verifyCRC } from '../utils/crc';
import type { Step } from '../utils/crc';
import { DivisionSteps } from './DivisionSteps';
import { Modal } from './Modal';
import { ShieldCheck, ShieldAlert, Cpu, Calculator, Download, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';
import { jsPDF } from 'jspdf';

interface ReceiverPanelProps {
  codeword: string | null;
  poly: string;
  onReset?: () => void;
}

export function ReceiverPanel({ codeword, poly, onReset }: ReceiverPanelProps) {
  const [result, setResult] = useState<{ isValid: boolean, steps: Step[], remainder: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setResult(null);
  }, [codeword, poly]);

  const handleVerify = () => {
    if (!codeword) return;
    const res = verifyCRC(codeword, poly);
    setResult(res);
  };

  const handleDownloadReport = () => {
    if (!result || !codeword) return;
    
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('CRC Transmission Report', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Transmission Status: ${result.isValid ? 'SUCCESS (Data Clean)' : 'FAILED (Error Detected)'}`, 20, 35);
    
    doc.text(`Generator Polynomial: ${poly}`, 20, 50);
    doc.text(`Received Codeword: ${codeword}`, 20, 60);
    
    doc.text('Verification Details:', 20, 75);
    doc.text(`- The polynomial division yielded a remainder of: ${result.remainder}`, 20, 85);
    
    const conclusion = result.isValid 
      ? '- Since the remainder is zero, no errors were detected.' 
      : '- Since the remainder is non-zero, errors were detected in the transmission.';
      
    doc.text(conclusion, 20, 95);
    
    doc.text('Thank you for using the CRC Simulator!', 20, 115);
    
    doc.save('crc-report.pdf');
  };

  return (
    <div className="bg-surface rounded-lg border border-border p-6 shadow-sm flex flex-col gap-6 w-full h-full">
      <div className="flex items-center gap-2 border-b border-border pb-4">
        <div className="bg-success/10 p-2 rounded-md text-success">
          <Cpu size={20} />
        </div>
        <h2 className="text-xl font-semibold text-text-primary">Receiver Panel</h2>
      </div>

      {!codeword ? (
         <div className="flex-1 flex flex-col items-center justify-center min-h-[250px] border-2 border-dashed border-border rounded-lg bg-surface/50 text-text-secondary/50 text-sm p-6 text-center">
          Waiting for transmission...
        </div>
      ) : (
        <div className="flex flex-col gap-4 flex-1">
          <div className="flex flex-col items-center gap-3 overflow-visible">
            <span className="text-sm font-medium text-text-secondary">Received Codeword</span>
            
            <div className="flex flex-wrap justify-center gap-1.5 pt-1 pb-1 overflow-visible">
              {codeword.split('').map((bit, idx) => (
                <div key={idx} className="flex flex-col items-center gap-0.5">
                  <span className="text-[11px] sm:text-[13px] leading-none text-text-primary font-bold font-mono select-none">{idx}</span>
                  <div className="w-7 h-8 sm:w-9 sm:h-10 flex items-center justify-center font-mono text-sm sm:text-base rounded-md border border-border text-text-primary bg-background">
                    {bit}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!result ? (
            <div className="mt-auto">
              <button
                onClick={handleVerify}
                className="w-full bg-success hover:bg-success/90 text-white font-medium py-3 sm:py-2.5 px-4 rounded-md transition-colors"
              >
                Verify Integrity
              </button>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-4 animate-in fade-in duration-300">
              <div className={clsx(
                "rounded-md p-4 flex items-start gap-3 border",
                result.isValid ? "bg-success/5 border-success/30" : "bg-error/5 border-error/30"
              )}>
                <div className="mt-0.5">
                  {result.isValid ? (
                    <ShieldCheck className="text-success" size={24} />
                  ) : (
                    <ShieldAlert className="text-error" size={24} />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className={clsx(
                    "font-bold text-lg",
                    result.isValid ? "text-success" : "text-error"
                  )}>
                    {result.isValid ? "Data Clean" : "Error Detected"}
                  </span>
                  <span className="text-sm text-text-secondary mt-1">
                    {result.isValid 
                      ? "The remainder is zero. Data is correct." 
                      : "Non-zero remainder. Codeword corrupted."}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full mt-2">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center justify-center gap-2 w-full bg-surface border border-border hover:bg-background text-text-primary font-medium py-3 sm:py-2 px-4 rounded-md transition-colors"
                >
                  <Calculator size={18} className="text-text-secondary" />
                  <span>See Calculation</span>
                </button>
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <button
                    onClick={handleDownloadReport}
                    className="flex-1 flex items-center justify-center gap-2 bg-surface border border-border hover:bg-background text-text-primary font-medium py-2.5 sm:py-1.5 px-3 text-sm rounded-md transition-colors"
                  >
                    <Download size={16} className="text-text-secondary" />
                    <span>Download Report</span>
                  </button>
                  {onReset && (
                    <button
                      onClick={onReset}
                      className="flex-1 flex items-center justify-center gap-2 bg-text-primary hover:bg-text-primary/90 text-white font-medium py-2.5 sm:py-1.5 px-3 text-sm rounded-md transition-colors"
                    >
                      <RotateCcw size={16} />
                      <span>Use Again</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Receiver Calculation (Verification)"
      >
        {result && <DivisionSteps steps={result.steps} remainder={result.remainder} />}
      </Modal>
    </div>
  );
}
