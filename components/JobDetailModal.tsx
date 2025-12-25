import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Job, ClientMaster, PlatingTypeMaster, JigMaster, ProcessStatus, ProcessStageDurations, CorrespondenceLog, User } from '../types';
import { PROCESS_STATUS_ORDER } from '../constants';
import { CloseIcon, TrashIcon, CalendarIcon, DuplicateIcon, SparklesIcon } from './icons';

interface JobDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (job: Job) => void;
  onDelete: (jobId: string) => void;
  onDeleteCorrespondenceLog: (logId: string) => void;
  onDuplicate: (job: Job) => void;
  job: Job;
  allJobs: Job[];
  isNew: boolean;
  clients: ClientMaster[];
  platingTypes: PlatingTypeMaster[];
  jigs: JigMaster[];
  processDurations: ProcessStageDurations;
  correspondenceLogs: CorrespondenceLog[];
  users: User[];
}

const InputField = ({ label, name, children }: {label: string, name: string, children?: React.ReactNode}) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
        {children}
    </div>
);

const StarRatingDisplay = ({ rating }: { rating: number }) => (
    <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
            <svg
                key={star}
                className={`w-4 h-4 ${rating >= star ? 'text-yellow-400' : 'text-slate-300'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
            >
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
        ))}
    </div>
);


export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  onDeleteCorrespondenceLog,
  onDuplicate,
  job,
  allJobs,
  isNew,
  clients,
  platingTypes,
  jigs,
  processDurations,
  correspondenceLogs,
  users
}) => {
  const [editedJob, setEditedJob] = useState<Job>(job);
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const [productSuggestions, setProductSuggestions] = useState<string[]>([]);
  const [isPastJobPickerOpen, setIsPastJobPickerOpen] = useState(false);
  
  const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);
  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);
  const platingTypeMap = useMemo(() => new Map(platingTypes.map(pt => [pt.id, pt.name])), [platingTypes]);
  const jigMap = useMemo(() => new Map(jigs.map(j => [j.id, j.name])), [jigs]);
  
  const relevantLogs = correspondenceLogs
    .filter(log => log.jobId === job.id)
    .sort((a, b) => new Date(b.correspondenceDate).getTime() - new Date(a.correspondenceDate).getTime());
  
  useEffect(() => {
    setEditedJob(job);
    setActiveTab('details');
    setProductSuggestions([]);
    setIsPastJobPickerOpen(false);
  }, [job]);

  // Effect for automatic recalculation of price, cost, and delivery date
  useEffect(() => {
    const platingType = platingTypes.find(pt => pt.id === editedJob.platingTypeId);
    const jig = jigs.find(j => j.id === editedJob.jigId);
    
    // --- Price Calculation ---
    let newPrice = 0;
    if (platingType && editedJob.quantity >= 0) {
        const unitPrice = editedJob.unitPrice > 0 ? editedJob.unitPrice : platingType.unitPrice;
        newPrice = editedJob.quantity * unitPrice;
    }

    // --- Cost & Lot Calculation ---
    let newCost = 0;
    let lots = 0;
    if (platingType && jig && editedJob.quantity > 0 && jig.totalQuantity > 0) {
        lots = Math.ceil(editedJob.quantity / jig.totalQuantity);
        newCost = lots * platingType.costPerLot;
    }

    // --- Delivery Date Calculation ---
    let newDeliveryDate = editedJob.deliveryDate;
    if (editedJob.startDate) {
        const basePlatingDuration = processDurations[ProcessStatus.PLATING] || 0;
        // Plating duration increases by 1 day for every 5 lots after the first.
        const additionalPlatingDays = lots > 1 ? Math.floor((lots - 1) / 5) : 0;
        const adjustedPlatingDuration = basePlatingDuration + additionalPlatingDays;

        const totalDuration = 
            (processDurations[ProcessStatus.PRE_TREATMENT] || 0) +
            adjustedPlatingDuration +
            (processDurations[ProcessStatus.POST_TREATMENT] || 0) +
            (processDurations[ProcessStatus.INSPECTION] || 0);
            
        const startDate = new Date(String(editedJob.startDate) + 'T00:00:00');
        startDate.setDate(startDate.getDate() + totalDuration);
        newDeliveryDate = startDate.toISOString().split('T')[0];
    } else {
        newDeliveryDate = '';
    }

    setEditedJob(prev => {
        if (
            prev.price !== newPrice ||
            prev.cost !== newCost ||
            prev.deliveryDate !== newDeliveryDate
        ) {
            return {
                ...prev,
                price: newPrice,
                cost: newCost,
                deliveryDate: newDeliveryDate,
            };
        }
        return prev;
    });
  }, [
    editedJob.platingTypeId, 
    editedJob.jigId, 
    editedJob.quantity, 
    editedJob.unitPrice, 
    editedJob.startDate, 
    platingTypes, 
    jigs, 
    processDurations
  ]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number = value;

    if (type === 'number') {
      parsedValue = value === '' ? 0 : Number(value);
    }

    if (name === 'productName') {
        const valStr = value as string;
        if (valStr.trim().length > 0) {
            const suggestions = Array.from(new Set(
                allJobs
                    .map(j => j.productName)
                    .filter(n => n && n.includes(valStr) && n !== valStr)
            )).slice(0, 10);
            setProductSuggestions(suggestions);
        } else {
            setProductSuggestions([]);
        }
    }
    
    if (name === 'platingTypeId') {
        const selectedPlatingType = platingTypes.find(pt => pt.id === value);
        if (selectedPlatingType) {
            // Also update unit price from master when plating type changes
            setEditedJob(prev => ({...prev, platingTypeId: value, unitPrice: selectedPlatingType.unitPrice}));
        } else {
            setEditedJob(prev => ({...prev, platingTypeId: value}));
        }
    } else {
        setEditedJob(prev => ({ ...prev, [name]: parsedValue }));
    }
  };

  const handleSelectSuggestion = (name: string) => {
    // 新規登録時、商品名を選択したら過去の最新の案件情報を自動入力する
    if (isNew) {
        const pastJob = allJobs
            .filter(j => j.productName === name)
            .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
        
        if (pastJob) {
             setEditedJob(prev => ({
                ...prev,
                productName: name,
                clientId: pastJob.clientId,
                platingTypeId: pastJob.platingTypeId,
                jigId: pastJob.jigId,
                unitPrice: pastJob.unitPrice,
                quantity: pastJob.quantity,
             }));
             setProductSuggestions([]);
             return;
        }
    }
    
    setEditedJob(prev => ({ ...prev, productName: name }));
    setProductSuggestions([]);
  };

  const handleSave = () => {
    if (!editedJob.productName || !editedJob.clientId || !editedJob.platingTypeId || !editedJob.jigId || editedJob.quantity <= 0) {
        alert('商品名、顧客、めっき種、治具、数量は必須です。');
        return;
    }
    onSave(editedJob);
  };
  
  const sortedClientJobs = useMemo(() => {
    if (!isNew || !editedJob.clientId) return [];
    return allJobs
        .filter(j => j.clientId === editedJob.clientId)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
        .slice(0, 10);
  }, [allJobs, editedJob.clientId, isNew]);

  const handleCopyFromPast = (jobId: string) => {
    const pastJob = allJobs.find(j => j.id === jobId);
    if (!pastJob) return;
    setEditedJob(prev => ({
        ...prev,
        productName: pastJob.productName,
        platingTypeId: pastJob.platingTypeId,
        jigId: pastJob.jigId,
        unitPrice: pastJob.unitPrice,
        quantity: pastJob.quantity,
        memo: pastJob.memo,
    }));
    setProductSuggestions([]);
    setIsPastJobPickerOpen(false);
  };
  
  const formatDateForDisplay = (isoString?: string) => {
      if (!isoString) return '-';
      return new Date(isoString).toLocaleString('ja-JP');
  };
  
  if (!isOpen) return null;
  
  const TabButton = ({ tab, label, count }: { tab: 'details' | 'history', label: string, count?: number}) => (
      <button 
        onClick={() => setActiveTab(tab)}
        className={`px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 ${activeTab === tab ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
      >
        {label} {typeof count !== 'undefined' && <span className="ml-1 px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-xs">{count}</span>}
      </button>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col relative">
        <header className="flex justify-between items-center p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">{isNew ? '新規案件登録' : '案件詳細'}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><CloseIcon /></button>
        </header>
        
        {!isNew && (
            <div className="px-6 border-b border-slate-200">
                <nav className="flex -mb-px">
                    <TabButton tab="details" label="基本情報" />
                    <TabButton tab="history" label="応対履歴" count={relevantLogs.length} />
                </nav>
            </div>
        )}

        <main className="flex-grow p-6 space-y-4 overflow-y-auto">
            {activeTab === 'details' ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="商品名" name="productName">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    name="productName" 
                                    value={editedJob.productName} 
                                    onChange={handleChange} 
                                    onBlur={() => {
                                        // Delay hiding suggestions to allow click event
                                        setTimeout(() => setProductSuggestions([]), 200);
                                    }}
                                    autoComplete="off"
                                    className="w-full border border-slate-300 rounded-md p-2 bg-white text-slate-900" 
                                />
                                {productSuggestions.length > 0 && (
                                    <ul className="absolute z-20 w-full bg-white border border-slate-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                                        {productSuggestions.map((suggestion, index) => (
                                            <li 
                                                key={index}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    handleSelectSuggestion(suggestion);
                                                }}
                                                className="px-3 py-2 hover:bg-cyan-50 cursor-pointer text-sm text-slate-700 border-b border-slate-100 last:border-0"
                                            >
                                                {suggestion}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </InputField>
                         <InputField label="顧客" name="clientId">
                             <div className="flex gap-2 items-center">
                                <select name="clientId" value={editedJob.clientId} onChange={handleChange} className="flex-1 w-full border border-slate-300 rounded-md p-2 bg-white text-slate-900">
                                    <option value="">選択してください</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                {isNew && (
                                    <button 
                                        type="button"
                                        onClick={() => setIsPastJobPickerOpen(true)}
                                        disabled={!editedJob.clientId || sortedClientJobs.length === 0}
                                        className={`flex items-center gap-1 px-3 py-2 rounded-md border transition-colors flex-shrink-0 ${
                                            !editedJob.clientId || sortedClientJobs.length === 0 
                                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                                            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 shadow-sm'
                                        }`}
                                        title={!editedJob.clientId ? "顧客を選択してください" : "過去の案件から引用"}
                                    >
                                        <SparklesIcon className="w-4 h-4" />
                                        <span className="text-sm font-medium whitespace-nowrap">引用</span>
                                    </button>
                                )}
                            </div>
                        </InputField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <InputField label="めっき種" name="platingTypeId">
                            <select name="platingTypeId" value={editedJob.platingTypeId} onChange={handleChange} className="w-full border border-slate-300 rounded-md p-2 bg-white text-slate-900">
                                <option value="">選択してください</option>
                                {platingTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                            </select>
                        </InputField>
                         <InputField label="治具" name="jigId">
                            <select name="jigId" value={editedJob.jigId} onChange={handleChange} className="w-full border border-slate-300 rounded-md p-2 bg-white text-slate-900">
                                <option value="">選択してください</option>
                                {jigs.map(j => <option key={j.id} value={j.id}>{j.name} (ロット: {j.totalQuantity})</option>)}
                            </select>
                        </InputField>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         <InputField label="数量" name="quantity">
                            <input 
                                type="number" 
                                name="quantity" 
                                value={editedJob.quantity === 0 ? '' : editedJob.quantity} 
                                onChange={handleChange} 
                                className="w-full border border-slate-300 rounded-md p-2 bg-white text-slate-900" 
                            />
                        </InputField>
                         <InputField label="単価" name="unitPrice">
                            <input 
                                type="number" 
                                name="unitPrice" 
                                value={editedJob.unitPrice === 0 ? '' : editedJob.unitPrice} 
                                onChange={handleChange} 
                                className="w-full border border-slate-300 rounded-md p-2 bg-white text-slate-900" 
                            />
                        </InputField>
                         <div className="p-2 bg-slate-50 rounded-md">
                            <p className="text-sm font-medium text-slate-600">金額 (自動)</p>
                            <p className="text-lg font-bold text-slate-800">¥{editedJob.price.toLocaleString()}</p>
                         </div>
                         <div className="p-2 bg-slate-50 rounded-md">
                            <p className="text-sm font-medium text-slate-600">原価 (自動)</p>
                            <p className="text-lg font-bold text-slate-800">¥{editedJob.cost.toLocaleString()}</p>
                         </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="開始日" name="startDate">
                            <input type="date" name="startDate" value={editedJob.startDate} onChange={handleChange} className="w-full border border-slate-300 rounded-md p-2 bg-white text-slate-900" />
                        </InputField>
                        <InputField label="納期 (自動)" name="deliveryDate">
                             <input type="date" name="deliveryDate" value={editedJob.deliveryDate} readOnly className="w-full border border-slate-300 rounded-md p-2 bg-slate-100 text-slate-600" />
                        </InputField>
                    </div>
                    <InputField label="工程ステータス" name="status">
                        <select name="status" value={editedJob.status} onChange={handleChange} className="w-full border border-slate-300 rounded-md p-2 bg-white text-slate-900">
                            {PROCESS_STATUS_ORDER.map(status => <option key={status} value={status}>{status}</option>)}
                        </select>
                    </InputField>
                    <InputField label="備考" name="memo">
                        <textarea name="memo" value={editedJob.memo || ''} onChange={handleChange} rows={3} className="w-full border border-slate-300 rounded-md p-2 bg-white text-slate-900"></textarea>
                    </InputField>
                </>
            ) : ( // history tab
                 <div className="space-y-3">
                    {relevantLogs.length > 0 ? relevantLogs.map(log => (
                        <div key={log.id} className="bg-slate-50 p-3 rounded-md border border-slate-200 relative">
                             <button 
                                onClick={() => onDeleteCorrespondenceLog(log.id)} 
                                className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-600 rounded-full hover:bg-slate-100 transition-colors"
                                aria-label="削除"
                            >
                                <TrashIcon className="h-5 w-5" />
                            </button>
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-xs text-slate-500">
                                    <p>{new Date(log.correspondenceDate).toLocaleString('ja-JP')}</p>
                                    <p>担当: {userMap.get(log.staffId) || '不明'}</p>
                                </div>
                                <div className="flex items-center gap-1 pr-8">
                                    <span className="text-xs text-slate-600">温度感:</span>
                                    <StarRatingDisplay rating={log.temperature} />
                                </div>
                            </div>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{log.memo}</p>
                        </div>
                    )) : (
                        <p className="text-center text-slate-500 py-4">この案件に関連する応対履歴はありません。</p>
                    )}
                </div>
            )}
        </main>
        
        {/* Footer with audit trail and actions */}
        <div className="flex-shrink-0 border-t border-slate-200 bg-slate-50 rounded-b-lg">
             {/* Audit Trail Info */}
             {!isNew && (
                <div className="px-4 py-2 border-b border-slate-100 flex justify-between text-xs text-slate-400 bg-white">
                    <div>登録: {job.createdBy ? `${userMap.get(job.createdBy) || '不明'} (${formatDateForDisplay(job.createdAt)})` : '-'}</div>
                    <div>最終更新: {job.updatedBy ? `${userMap.get(job.updatedBy) || '不明'} (${formatDateForDisplay(job.updatedAt)})` : '-'}</div>
                </div>
             )}

            <div className="flex justify-between items-center p-4">
              <div className="flex items-center gap-2">
                {!isNew && (
                    <button onClick={() => onDelete(editedJob.id)} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50">
                        <TrashIcon />
                        <span className="hidden sm:inline">案件を削除</span>
                    </button>
                )}
                 {!isNew && (
                     <button onClick={() => onDuplicate(editedJob)} className="flex items-center gap-2 px-4 py-2 text-sm text-cyan-600 bg-white border border-cyan-300 rounded-md hover:bg-cyan-50">
                        <DuplicateIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">複製して新規作成</span>
                    </button>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={onClose} className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50">キャンセル</button>
                <button onClick={handleSave} className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700">{isNew ? '登録する' : '保存する'}</button>
              </div>
            </div>
        </div>

        {/* Past Job Picker Overlay */}
        {isPastJobPickerOpen && (
            <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm rounded-lg flex flex-col p-4 animate-fadeIn">
                <div className="bg-white rounded-lg shadow-xl border border-slate-200 flex-1 flex flex-col overflow-hidden">
                     <header className="flex justify-between items-center p-4 border-b border-slate-100 bg-amber-50">
                        <div className="flex items-center gap-2">
                            <SparklesIcon className="text-amber-500"/>
                            <h3 className="font-bold text-slate-800">過去の案件から引用</h3>
                        </div>
                        <button onClick={() => setIsPastJobPickerOpen(false)} className="p-1 hover:bg-amber-100 rounded-full text-slate-500"><CloseIcon /></button>
                     </header>
                     <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                        {sortedClientJobs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
                                <SparklesIcon className="w-8 h-8 text-slate-300" />
                                <p>引用可能な過去の案件がありません。</p>
                            </div>
                        ) : (
                            sortedClientJobs.map(job => (
                                <button
                                    key={job.id}
                                    type="button"
                                    onClick={() => handleCopyFromPast(job.id)}
                                    className="w-full text-left bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:border-cyan-400 hover:shadow-md transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-slate-800 group-hover:text-cyan-700">{job.productName}</span>
                                        <span className="text-xs text-slate-400">{job.startDate}</span>
                                    </div>
                                    <div className="flex gap-4 text-sm text-slate-600">
                                        <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-xs"><span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>{platingTypeMap.get(job.platingTypeId)}</span>
                                        <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{jigMap.get(job.jigId)}</span>
                                        <span className="font-semibold">{job.quantity} <span className="text-xs font-normal">個</span></span>
                                    </div>
                                </button>
                            ))
                        )}
                     </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};