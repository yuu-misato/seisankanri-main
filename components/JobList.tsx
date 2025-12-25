import React, { useMemo } from 'react';
import { Job, PlatingTypeMaster, ClientMaster, User } from '../types';
import { StatusBadge } from './StatusBadge';
import { PrinterIcon } from './icons';

interface JobListProps {
  jobs: Job[];
  platingTypes: PlatingTypeMaster[];
  clients: ClientMaster[];
  onSelectJob: (job: Job) => void;
  users?: User[]; // Optional for backward compatibility, but recommended
}

export const JobList: React.FC<JobListProps> = ({ jobs, platingTypes, clients, onSelectJob, users = [] }) => {
  const platingTypeMap = useMemo(() => new Map(platingTypes.map(pt => [pt.id, pt.name])), [platingTypes]);
  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);

  if (jobs.length === 0) {
    return <div className="text-center py-10 text-slate-500 bg-white rounded-lg shadow-sm border border-slate-200">条件に一致する案件はありません。</div>;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-slate-200 print:hidden">
        <h3 className="font-bold text-slate-800">案件リスト ({jobs.length}件)</h3>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors text-sm font-medium"
        >
          <PrinterIcon className="h-4 w-4" />
          <span>リストを印刷</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">ステータス</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">納期</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">顧客名</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">商品名</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">数量</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">金額</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">めっき種</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {jobs.map((job) => (
              <tr
                key={job.id}
                onClick={() => onSelectJob(job)}
                className="hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={job.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {job.deliveryDate || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                  {clientMap.get(job.clientId) || '未設定'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {job.productName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">
                  {job.quantity.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">
                  {formatCurrency(job.price || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {platingTypeMap.get(job.platingTypeId) || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};