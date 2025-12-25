
import React from 'react';
import { ProcessStatus } from '../types';
import { STATUS_COLORS } from '../constants';

interface StatusBadgeProps {
  status: ProcessStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const color = STATUS_COLORS[status] || 'bg-gray-400';
  return (
    <span className={`px-3 py-1 text-xs font-semibold text-white rounded-full ${color} print:bg-transparent print:text-slate-800 print:border print:border-slate-300 print:shadow-none`}>
      {status}
    </span>
  );
};
