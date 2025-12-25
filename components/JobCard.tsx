import React from 'react';
import { Job } from '../types';
import { StatusBadge } from './StatusBadge';
import { CalendarIcon, PencilIcon } from './icons';

interface JobCardProps {
  job: Job;
  platingTypeName: string;
  clientName: string;
  updatedByName?: string;
  onSelect: (job: Job) => void;
  isCompact?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({ job, platingTypeName, clientName, updatedByName, onSelect, isCompact = false }) => {
  return (
    <div
      className={`bg-white border text-left border-slate-200 rounded-lg shadow-sm hover:shadow-md hover:border-cyan-400 transition-all cursor-pointer flex flex-col justify-between ${isCompact ? 'p-3' : 'p-4'}`}
      onClick={() => onSelect(job)}
    >
      <div>
        <div className="flex justify-between items-start mb-1">
          <h3 className={`font-bold text-slate-800 pr-2 truncate ${isCompact ? 'text-sm' : 'text-base'}`} title={job.productName}>
            {job.productName}
          </h3>
          {!isCompact && <StatusBadge status={job.status} />}
        </div>
        <p className="text-xs text-slate-500 truncate mb-0.5" title={clientName}>{clientName}</p>
        <p className="text-xs text-slate-400 mb-2 truncate">{platingTypeName}</p>
      </div>

      <div>
        {!isCompact && (
          <div className="grid grid-cols-2 gap-x-2 text-sm text-slate-600 mb-2">
            <div>数量:</div>
            <div className="font-semibold text-slate-800 text-right">{job.quantity.toLocaleString()} 個</div>
            <div>金額:</div>
            <div className="font-semibold text-slate-800 text-right">¥{job.price.toLocaleString()}</div>
          </div>
        )}

        <div className={`border-t border-slate-100 ${isCompact ? 'pt-2 mt-1' : 'pt-3 mt-3'} space-y-1`}>
          {isCompact && (
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-slate-500 font-medium">{job.quantity.toLocaleString()}個</span>
              <span className={`font-semibold ${job.deadlineColor ? 'text-red-600' : 'text-slate-600'}`}>
                {job.deliveryDate.slice(5).replace('-', '/')}
              </span>
            </div>
          )}

          {!isCompact && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CalendarIcon className="h-4 w-4" />
              <span className="text-xs">{job.startDate} ~ {job.deliveryDate}</span>
            </div>
          )}

          {updatedByName && !isCompact && (
            <div className="flex items-center gap-2 text-xs text-slate-400 justify-end" title={`最終更新: ${new Date(job.updatedAt || '').toLocaleString()}`}>
              <PencilIcon className="h-3 w-3" />
              <span>{updatedByName}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};