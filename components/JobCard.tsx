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
}

export const JobCard: React.FC<JobCardProps> = ({ job, platingTypeName, clientName, updatedByName, onSelect }) => {
  return (
    <div 
      className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md hover:border-cyan-400 transition-all cursor-pointer flex flex-col justify-between"
      onClick={() => onSelect(job)}
    >
      <div>
        <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-slate-800 pr-2 truncate" title={job.productName}>
                {job.productName}
            </h3>
            <StatusBadge status={job.status} />
        </div>
        <p className="text-sm text-slate-500 mb-1 truncate" title={clientName}>{clientName}</p>
        <p className="text-sm text-slate-500 mb-4">{platingTypeName}</p>
      </div>
      
      <div>
        <div className="grid grid-cols-2 gap-x-2 text-sm text-slate-600 mb-2">
            <div>数量:</div>
            <div className="font-semibold text-slate-800 text-right">{job.quantity.toLocaleString()} 個</div>
            <div>金額:</div>
            <div className="font-semibold text-slate-800 text-right">¥{job.price.toLocaleString()}</div>
        </div>
        
        <div className="border-t border-slate-200 pt-3 mt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <CalendarIcon className="h-4 w-4" />
                <span className="text-xs">{job.startDate} ~ {job.deliveryDate}</span>
            </div>
            
            {updatedByName && (
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