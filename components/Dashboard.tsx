
import React from 'react';
import { Job, ProcessStatus } from '../types';
import { LightningBoltIcon } from './icons';

interface DashboardProps {
  jobs: Job[];
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
}

export const Dashboard: React.FC<DashboardProps> = ({ jobs }) => {
  const activeJobs = jobs.filter(job => job.status !== ProcessStatus.SHIPPED);
  
  const totalActiveJobs = activeJobs.length;
  const totalSales = activeJobs.reduce((sum, job) => sum + (job.price || 0), 0);
  const totalProfit = activeJobs.reduce((sum, job) => sum + ((job.price || 0) - (job.cost || 0)), 0);


  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 md:p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <LightningBoltIcon />
        <h2 className="text-xl font-bold text-slate-900">ダッシュボード</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-100 p-4 rounded-lg">
          <p className="text-sm text-slate-500">進行中案件</p>
          <p className="text-3xl font-bold text-slate-900">{totalActiveJobs}<span className="text-base font-normal ml-1">件</span></p>
        </div>
         <div className="bg-slate-100 p-4 rounded-lg">
          <p className="text-sm text-slate-500">進行中 総売上</p>
          <p className="text-xl md:text-2xl font-bold text-slate-900">{formatCurrency(totalSales)}</p>
        </div>
         <div className="bg-blue-100 p-4 rounded-lg border-l-4 border-blue-400">
          <p className="text-sm text-blue-600">進行中 総利益</p>
          <p className="text-xl md:text-2xl font-bold text-blue-900">{formatCurrency(totalProfit)}</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg border-l-4 border-green-400">
          <p className="text-sm text-green-600">利益率</p>
          <p className="text-xl md:text-2xl font-bold text-green-900">
            {totalSales > 0 ? `${((totalProfit / totalSales) * 100).toFixed(1)}%` : '-%'}
          </p>
        </div>
      </div>
    </div>
  );
};
