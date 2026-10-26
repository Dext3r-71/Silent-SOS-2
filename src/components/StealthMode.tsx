import React, { useState } from 'react';
import { Eye, Shield, Lock } from 'lucide-react';

interface StealthModeProps {
  isActive: boolean;
  onExit: () => void;
}

export const StealthMode: React.FC<StealthModeProps> = ({ isActive, onExit }) => {
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [prevVal, setPrevVal] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  if (!isActive) return null;

  const handleDigit = (digit: string) => {
    if (waitingForOperand) {
      setCalcDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setCalcDisplay(calcDisplay === '0' ? digit : calcDisplay + digit);
    }
  };

  const handleOp = (nextOp: string) => {
    const val = parseFloat(calcDisplay);
    if (prevVal === null) {
      setPrevVal(val);
    } else if (op) {
      const current = prevVal;
      let res = current;
      if (op === '+') res = current + val;
      if (op === '-') res = current - val;
      if (op === '×') res = current * val;
      if (op === '÷') res = val !== 0 ? current / val : 0;
      setCalcDisplay(String(res));
      setPrevVal(res);
    }
    setWaitingForOperand(true);
    setOp(nextOp);
  };

  const handleEqual = () => {
    const val = parseFloat(calcDisplay);
    if (prevVal !== null && op) {
      let res = prevVal;
      if (op === '+') res = prevVal + val;
      if (op === '-') res = prevVal - val;
      if (op === '×') res = prevVal * val;
      if (op === '÷') res = val !== 0 ? prevVal / val : 0;
      setCalcDisplay(String(res));
      setPrevVal(null);
      setOp(null);
      setWaitingForOperand(true);
    }
  };

  const handleClear = () => {
    setCalcDisplay('0');
    setPrevVal(null);
    setOp(null);
    setWaitingForOperand(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-900 text-neutral-100 p-4">
      {/* Discreet Header */}
      <div className="w-full max-w-sm flex items-center justify-between pb-4 border-b border-neutral-800 mb-6">
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <Lock className="h-3.5 w-3.5 text-neutral-500" />
          <span>System Utility · Calculator</span>
        </div>
        {/* Discreet exit button disguised as simple info icon */}
        <button
          onClick={onExit}
          title="Return to Silent SOS"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors"
        >
          <Shield className="h-3.5 w-3.5 text-neutral-400" />
          <span>Resume SOS</span>
        </button>
      </div>

      {/* Disguise Calculator */}
      <div className="w-full max-w-sm bg-neutral-950 p-6 rounded-2xl border border-neutral-800 shadow-2xl">
        <div className="bg-neutral-900/90 rounded-xl p-4 mb-4 text-right">
          <span className="text-3xl font-mono text-neutral-100 tracking-wider overflow-x-auto block">
            {calcDisplay}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2.5 text-sm font-medium">
          <button
            onClick={handleClear}
            className="p-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-rose-400"
          >
            AC
          </button>
          <button
            onClick={() => setCalcDisplay(String(-parseFloat(calcDisplay)))}
            className="p-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
          >
            ±
          </button>
          <button
            onClick={() => setCalcDisplay(String(parseFloat(calcDisplay) / 100))}
            className="p-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
          >
            %
          </button>
          <button
            onClick={() => handleOp('÷')}
            className="p-3.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/40 text-amber-300"
          >
            ÷
          </button>

          {['7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              className="p-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-100"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handleOp('×')}
            className="p-3.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/40 text-amber-300"
          >
            ×
          </button>

          {['4', '5', '6'].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              className="p-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-100"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handleOp('-')}
            className="p-3.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/40 text-amber-300"
          >
            -
          </button>

          {['1', '2', '3'].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              className="p-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-100"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handleOp('+')}
            className="p-3.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/40 text-amber-300"
          >
            +
          </button>

          <button
            onClick={() => handleDigit('0')}
            className="col-span-2 p-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-100"
          >
            0
          </button>
          <button
            onClick={() => {
              if (!calcDisplay.includes('.')) handleDigit('.');
            }}
            className="p-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-100"
          >
            .
          </button>
          <button
            onClick={handleEqual}
            className="p-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
          >
            =
          </button>
        </div>
      </div>

      <p className="text-xs text-neutral-500 mt-6 text-center max-w-xs">
        Stealth Disguise Mode is active. Click &quot;Resume SOS&quot; or press <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">Esc</kbd> to return to protection.
      </p>
    </div>
  );
};
