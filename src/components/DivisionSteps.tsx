import type { Step } from '../utils/crc';
import { clsx } from 'clsx';

interface DivisionStepsProps {
  steps: Step[];
  remainder: string;
}

export function DivisionSteps({ steps, remainder }: DivisionStepsProps) {
  return (
    <div className="font-mono text-xs sm:text-sm bg-surface p-4 rounded-md border border-border overflow-x-auto whitespace-pre leading-relaxed text-text-primary">
      {steps.map((step, index) => (
        <div key={index} className="flex flex-col mb-2">
          {index === 0 && (
            <div className="mb-1">
              <span className="text-text-secondary">Dividend: </span>
              {step.padding}{step.dividend}
            </div>
          )}
          <div className="text-accent flex gap-2">
            <span className="text-text-secondary opacity-0 select-none">Divisor : </span>
            <span>{step.padding}{step.divisor}</span>
          </div>
          <div className="border-t border-dashed border-border flex gap-2 pt-1 mt-1">
            <span className="text-text-secondary">Result  : </span>
            <span>{step.padding}&nbsp;{step.xorResult.substring(1)}</span>
          </div>
        </div>
      ))}
      <div className="mt-4 pt-2 border-t-2 border-border font-bold flex gap-2">
        <span className="text-text-secondary">Remainder:</span>
        <span className={clsx(
          parseInt(remainder, 2) === 0 ? "text-success" : "text-error"
        )}>
          {remainder.padStart(steps.length > 0 ? steps[0].divisor.length - 1 : 0, '0')}
        </span>
      </div>
    </div>
  );
}
