import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { clsx } from 'clsx';

interface HowItWorksPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function HowItWorksPanel({ isOpen, onToggle }: HowItWorksPanelProps) {
  return (
    <div className="w-full max-w-4xl mx-auto mt-12 bg-surface rounded-lg border border-border overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-background/50 hover:bg-background transition-colors text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 inset-0"
      >
        <div className="flex items-center gap-2">
          <Info size={18} className="text-accent" />
          <span className="font-semibold text-sm">What is CRC and how it works</span>
        </div>
        {isOpen ? <ChevronUp size={18} className="text-text-secondary" /> : <ChevronDown size={18} className="text-text-secondary" />}
      </button>
      
      <div className={clsx(
        "transition-all duration-300 ease-in-out overflow-hidden",
        isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="p-6 pt-2 text-text-secondary text-sm leading-relaxed space-y-3">
          <p>
            Cyclic Redundancy Check (CRC) is an error-detection technique used in data communication to detect whether data has been corrupted during transmission. It works by treating data as a binary number and performing modulo-2 division using a predefined binary polynomial called the generator polynomial.
          </p>
          <p>
            At the sender's side, the original data is divided by the generator polynomial, and the remainder is appended to the data to create a codeword. At the receiver's side, the received codeword is divided by the same generator polynomial. If the remainder is zero, the data is assumed to be error-free; otherwise, an error is detected.
          </p>
          <p>
            CRC is widely used in communication networks and storage systems because it provides reliable and efficient error detection.
          </p>
        </div>
      </div>
    </div>
  );
}
