import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 text-xs">
      <p className="text-slate-500 font-medium">
        Showing <span className="font-extrabold text-[#192E2A]">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
        <span className="font-extrabold text-[#192E2A]">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
        <span className="font-extrabold text-[#192E2A]">{totalItems}</span> tourists
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-xl border border-white/20 bg-[#25433E] text-white disabled:opacity-40 hover:bg-[#1E3732] shadow-sm transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-3 py-1 font-black text-[#25433E]">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-xl border border-white/20 bg-[#25433E] text-white disabled:opacity-40 hover:bg-[#1E3732] shadow-sm transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
