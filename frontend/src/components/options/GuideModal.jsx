import React from 'react';
import { GUIDE_ITEMS } from '../../data/mockData';
import { X, Lightbulb } from 'lucide-react';

const GuideModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#0f1420] border border-[#253048] rounded-2xl w-full max-w-xl max-h-[80vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2536]">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[#eab308]" />
            <h2 className="text-base font-bold text-white">Guía Rápida</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#1e2740] transition-colors"
          >
            <X className="w-4 h-4 text-[#6b7a94]" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh] space-y-3">
          {GUIDE_ITEMS.map((item) => (
            <div
              key={item.t}
              className="bg-[#151c2c] rounded-lg border border-[#1e2536] p-4 hover:border-[#253048] transition-colors"
            >
              <h4 className="text-sm font-bold text-[#60a5fa] mb-1.5">{item.t}</h4>
              <p className="text-xs text-[#8b9ab8] leading-relaxed">{item.d}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#1e2536]">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#3b82f6]/15 border border-[#3b82f6]/40 text-[#60a5fa] rounded-lg text-sm font-semibold hover:bg-[#3b82f6]/25 transition-colors"
          >
            ENTENDIDO
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuideModal;
