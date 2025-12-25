import React, { useMemo, useState, useCallback } from 'react';
import { Job, ClientMaster, PlatingTypeMaster, ProcessStatus } from '../types';

interface ReportPageProps {
  jobs: Job[];
  clients: ClientMaster[];
  platingTypes: PlatingTypeMaster[];
  settlementMonth: number;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
}

const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatDateToString = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

const ReportPage: React.FC<ReportPageProps> = ({ jobs, clients, platingTypes, settlementMonth }) => {
    const [viewMode, setViewMode] = useState<'year' | 'month' | 'day'>('day');
    const [currentDate, setCurrentDate] = useState(new Date());

    const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);
    const platingTypeMap = useMemo(() => new Map(platingTypes.map(pt => [pt.id, pt.name])), [platingTypes]);
    const shippedJobs = useMemo(() => jobs.filter(j => j.status === ProcessStatus.SHIPPED), [jobs]);

    const getFiscalYear = useCallback((date: Date, endMonth: number) => {
        return date.getMonth() + 1 > endMonth ? date.getFullYear() : date.getFullYear() - 1;
    }, []);

    const { periodStart, periodEnd, periodLabel } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        switch (viewMode) {
            case 'year':
                const fiscalYear = getFiscalYear(currentDate, settlementMonth);
                const start = new Date(fiscalYear, settlementMonth, 1);
                const end = new Date(fiscalYear + 1, settlementMonth, 0, 23, 59, 59);
                return { periodStart: start, periodEnd: end, periodLabel: `${fiscalYear}年度` };
            case 'month':
                const startMonth = new Date(year, month, 1);
                const endMonth = new Date(year, month + 1, 0, 23, 59, 59);
                return { periodStart: startMonth, periodEnd: endMonth, periodLabel: `${year}年 ${month + 1}月` };
            case 'day':
                const startDay = new Date(year, month, currentDate.getDate());
                const endDay = new Date(year, month, currentDate.getDate(), 23, 59, 59);
                 return { periodStart: startDay, periodEnd: endDay, periodLabel: formatDateToString(currentDate) };
        }
    }, [currentDate, viewMode, settlementMonth, getFiscalYear]);

    const handleDateNavigate = (amount: number) => {
        const newDate = new Date(currentDate);
        if (viewMode === 'year') {
            newDate.setFullYear(newDate.getFullYear() + amount);
        } else if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() + amount);
        } else {
            newDate.setDate(newDate.getDate() + amount);
        }
        setCurrentDate(newDate);
    };
    
    const filteredJobs = useMemo(() => {
        return shippedJobs.filter(job => {
            const deliveryDate = parseLocalDate(job.deliveryDate);
            return deliveryDate >= periodStart && deliveryDate <= periodEnd;
        });
    }, [shippedJobs, periodStart, periodEnd]);
    
    const reportData = useMemo(() => {
        const totalSales = filteredJobs.reduce((sum, job) => sum + job.price, 0);
        const totalCost = filteredJobs.reduce((sum, job) => sum + job.cost, 0);
        const totalProfit = totalSales - totalCost;

        const salesByClient = filteredJobs.reduce<Record<string, number>>((acc, job) => {
            const clientName = clientMap.get(job.clientId) || '不明な顧客';
            acc[clientName] = (acc[clientName] || 0) + job.price;
            return acc;
        }, {});

        const salesByPlatingType = filteredJobs.reduce<Record<string, number>>((acc, job) => {
            const platingTypeName = platingTypeMap.get(job.platingTypeId) || '不明なめっき種';
            acc[platingTypeName] = (acc[platingTypeName] || 0) + job.price;
            return acc;
        }, {});

        return { totalSales, totalProfit, totalJobs: filteredJobs.length, salesByClient, salesByPlatingType };
    }, [filteredJobs, clientMap, platingTypeMap]);
    
    const chartData = useMemo(() => {
        if (viewMode !== 'year') return null;
        
        const fiscalYear = getFiscalYear(currentDate, settlementMonth);
        const months = Array.from({length: 12}, (_, i) => {
            const date = new Date(fiscalYear, settlementMonth + i + 1, 1);
            return { year: date.getFullYear(), month: date.getMonth() };
        });

        const monthlySales = months.reduce<Record<string, number>>((acc, { year, month }) => {
            const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
            acc[monthKey] = 0;
            return acc;
        }, {});
        
        filteredJobs.forEach(job => {
            const monthKey = job.deliveryDate.substring(0, 7);
            if(monthlySales[monthKey] !== undefined) {
                 monthlySales[monthKey] += job.price;
            }
        });

        const data = Object.entries(monthlySales).map(([key, sales]) => ({
            name: `${new Date(key + '-02').getMonth() + 1}月`,
            売上: sales,
        }));
        
        const maxSales = Math.max(...data.map(d => d.売上));
        return { data, maxSales: maxSales > 0 ? maxSales : 1 };
    }, [filteredJobs, viewMode, currentDate, settlementMonth, getFiscalYear]);

    const ViewModeButton = ({ mode, label }: { mode: 'year' | 'month' | 'day', label: string }) => (
        <button onClick={() => setViewMode(mode)} className={`px-3 py-1 text-sm rounded-md ${viewMode === mode ? 'bg-cyan-600 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}>
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">レポート (出荷済案件)</h1>
            {/* Filter Controls */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-end gap-4">
                     <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-md">
                        <ViewModeButton mode="day" label="日次" />
                        <ViewModeButton mode="month" label="月次" />
                        <ViewModeButton mode="year" label="年次" />
                    </div>
                </div>
                <div className="flex items-center justify-center gap-4 border-t border-slate-200 pt-4">
                    <button onClick={() => handleDateNavigate(-1)} className="px-3 py-1 bg-slate-100 rounded-md hover:bg-slate-200">&lt; 前へ</button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 bg-slate-100 rounded-md hover:bg-slate-200">今日/今月/今年</button>
                    <h3 className="text-lg font-semibold w-40 text-center">{periodLabel}</h3>
                    <button onClick={() => handleDateNavigate(1)} className="px-3 py-1 bg-slate-100 rounded-md hover:bg-slate-200">次へ &gt;</button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500">完了案件数</p>
                    <p className="text-2xl font-bold text-slate-900">{reportData.totalJobs}<span className="text-base font-normal ml-1">件</span></p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500">総売上</p>
                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(reportData.totalSales)}</p>
                </div>
                 <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500">総利益</p>
                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(reportData.totalProfit)}</p>
                </div>
                 <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500">利益率</p>
                    <p className="text-2xl font-bold text-slate-900">
                        {reportData.totalSales > 0 ? `${((reportData.totalProfit / reportData.totalSales) * 100).toFixed(1)}%` : '-%'}
                    </p>
                </div>
            </div>

            {chartData && (
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">{periodLabel} 月次売上推移</h2>
                    <div className="flex items-end h-64 w-full gap-2 border-l border-b border-slate-200 p-2">
                        {chartData.data.map((monthData, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center justify-end" title={`${monthData.name}: ${formatCurrency(monthData.売上)}`}>
                                <div className="w-full bg-cyan-500 rounded-t hover:bg-cyan-600 transition-colors" style={{ height: `${(monthData.売上 / chartData.maxSales) * 100}%` }}></div>
                                <div className="text-xs text-slate-500 mt-1">{monthData.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">顧客別 売上 ({periodLabel})</h2>
                    <table className="w-full text-sm">
                        <thead className="text-left bg-slate-100"><tr><th className="p-2 font-semibold">顧客名</th><th className="p-2 font-semibold text-right">売上金額</th></tr></thead>
                        <tbody>
                            {/* FIX: Changed sort function to use array destructuring and type casting for better type inference and safety. */}
                            {Object.entries(reportData.salesByClient).sort(([,a],[,b]) => (b as number)-(a as number)).map(([name, sales]) => (
                                <tr key={name} className="border-b hover:bg-slate-50"><td className="p-2">{name}</td><td className="p-2 text-right font-medium">{formatCurrency(sales as number)}</td></tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
                 <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">めっき種別 売上 ({periodLabel})</h2>
                     <table className="w-full text-sm">
                        <thead className="text-left bg-slate-100"><tr><th className="p-2 font-semibold">めっき種</th><th className="p-2 font-semibold text-right">売上金額</th></tr></thead>
                        <tbody>
                            {/* FIX: Changed sort function to use array destructuring and type casting for better type inference and safety. */}
                            {Object.entries(reportData.salesByPlatingType).sort(([,a],[,b]) => (b as number)-(a as number)).map(([name, sales]) => (
                                <tr key={name} className="border-b hover:bg-slate-50"><td className="p-2">{name}</td><td className="p-2 text-right font-medium">{formatCurrency(sales as number)}</td></tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>
    );
};

export default ReportPage;