import React, { useState } from 'react';
import { Filters, ProcessStatus, ClientMaster } from '../types';
import { PROCESS_STATUS_ORDER, STATUS_COLORS } from '../constants';
import { FilterIcon, XCircleIcon } from './icons';

interface FilterControlsProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  onReset: () => void;
  clients: ClientMaster[];
}

export const FilterControls: React.FC<FilterControlsProps> = ({ filters, onFilterChange, onReset, clients }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onFilterChange({ ...filters, [e.target.name]: e.target.value });
  };

  const handleStatusChange = (status: ProcessStatus) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    onFilterChange({ ...filters, statuses: newStatuses });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg mb-6 shadow-sm">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left"
      >
        <div className="flex items-center gap-2">
            <FilterIcon />
            <h3 className="font-semibold text-slate-900">絞り込みフィルタ</h3>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Text Filters */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">商品名</label>
              <input
                type="text"
                name="productName"
                value={filters.productName}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-slate-900 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="商品名で検索..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">顧客名</label>
              <select
                name="clientId"
                value={filters.clientId}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-slate-900 focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="">すべての顧客</option>
                {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">納期 (開始)</label>
                <input
                  type="date"
                  name="deliveryDateStart"
                  value={filters.deliveryDateStart}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-slate-900 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">納期 (終了)</label>
                <input
                  type="date"
                  name="deliveryDateEnd"
                  value={filters.deliveryDateEnd}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-slate-900 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="md:col-span-2 lg:col-span-4">
              <label className="block text-sm font-medium text-slate-600 mb-2">工程ステータス</label>
              <div className="flex flex-wrap gap-2">
                {PROCESS_STATUS_ORDER.map(status => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={`px-3 py-1 text-xs font-semibold text-white rounded-full transition-all duration-200 ${
                      filters.statuses.includes(status)
                        ? `${STATUS_COLORS[status]} ring-2 ring-offset-2 ring-offset-white ring-cyan-500`
                        : `${STATUS_COLORS[status]} opacity-50 hover:opacity-100`
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
             <button onClick={onReset} className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                <XCircleIcon />
                リセット
            </button>
          </div>
        </div>
      )}
    </div>
  );
};