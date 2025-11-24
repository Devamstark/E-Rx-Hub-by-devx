
import React from 'react';
import { Delete, Check, X } from 'lucide-react';

interface VirtualNumpadProps {
    onInput: (key: string) => void;
    onDelete: () => void;
    onConfirm?: () => void;
    onClose?: () => void;
    className?: string;
    compact?: boolean;
}

export const VirtualNumpad: React.FC<VirtualNumpadProps> = ({ 
    onInput, 
    onDelete, 
    onConfirm, 
    onClose,
    className = '',
    compact = false
}) => {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];

    return (
        <div className={`bg-white border border-slate-200 rounded-lg shadow-sm p-2 ${className}`}>
             {onClose && (
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase">Keypad</span>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4"/></button>
                </div>
             )}
            <div className={`grid grid-cols-3 gap-2 ${compact ? 'text-sm' : ''}`}>
                {keys.map(k => (
                    <button 
                        key={k}
                        onClick={() => onInput(k)}
                        className={`bg-slate-50 border border-slate-200 rounded font-bold text-slate-700 hover:bg-slate-100 active:bg-slate-200 active:scale-95 transition-all ${compact ? 'p-2' : 'p-3 text-lg'}`}
                        type="button"
                    >
                        {k}
                    </button>
                ))}
                <button 
                    onClick={onDelete}
                    className={`bg-red-50 border border-red-100 rounded text-red-600 hover:bg-red-100 flex items-center justify-center active:scale-95 transition-all ${compact ? 'p-2' : 'p-3'}`}
                    type="button"
                >
                    <Delete className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`}/>
                </button>
                {onConfirm && (
                     <button 
                        onClick={onConfirm}
                        className={`col-span-3 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700 flex items-center justify-center shadow-sm active:scale-95 transition-all ${compact ? 'p-2' : 'p-3'}`}
                        type="button"
                    >
                        <Check className={`${compact ? 'w-4 h-4 mr-1' : 'w-5 h-5 mr-2'}`}/> Done
                    </button>
                )}
            </div>
        </div>
    );
};
