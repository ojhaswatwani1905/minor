import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 text-xs">
      <p className="text-slate-400">
        Showing <span className="font-bold text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
        <span className="font-bold text-white">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
        <span className="font-bold text-white">{totalItems}</span> tourists
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-3 py-1 font-bold text-cyan-400">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
