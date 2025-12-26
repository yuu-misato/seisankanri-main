import React, { useState } from 'react';
import { Job, ProcessStatus, PlatingTypeMaster, ClientMaster } from '../types';
import { STATUS_LABELS } from '../constants';
import { CloseIcon } from './icons';

interface BulkEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedCount: number;
    onSave: (updates: Partial<Job>) => void;
    platingTypes: PlatingTypeMaster[];
}

export const BulkEditModal: React.FC<BulkEditModalProps> = ({ isOpen, onClose, selectedCount, onSave, platingTypes }) => {
    const [updates, setUpdates] = useState<Partial<Job>>({});
    const [enabledFields, setEnabledFields] = useState<{ [key: string]: boolean }>({});

    if (!isOpen) return null;

    const handleToggleField = (field: keyof Job) => {
        setEnabledFields(prev => {
            const next = { ...prev, [field]: !prev[field] };
            if (!next[field]) {
                const newUpdates = { ...updates };
                delete newUpdates[field];
                setUpdates(newUpdates);
            }
            return next;
        });
    }

    const handleChange = (field: keyof Job, value: any) => {
        setUpdates(prev => ({ ...prev, [field]: value }));
    }

    const handleSave = () => {
        if (Object.keys(updates).length === 0) {
            onClose();
            return;
        }
        if (window.confirm(`${selectedCount}件の案件を一括更新しますか？`)) {
            onSave(updates);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <header className="flex justify-between items-center p-4 border-b border-slate-200">
                    <h3 className="font-bold text-slate-800">一括編集 ({selectedCount}件)</h3>
                    <button onClick={onClose}><CloseIcon /></button>
                </header>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-slate-500 mb-4">更新したい項目にチェックを入れ、新しい値を入力してください。</p>

                    {/* Status */}
                    <div className="flex items-center gap-4">
                        <input
                            type="checkbox"
                            id="chk-status"
                            checked={!!enabledFields.status}
                            onChange={() => handleToggleField('status')}
                            className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        <div className={`flex-1 ${!enabledFields.status ? 'opacity-50 pointer-events-none' : ''}`}>
                            <label htmlFor="chk-status" className="block text-sm font-medium text-slate-700 mb-1">ステータス</label>
                            <select
                                value={updates.status || ''}
                                onChange={e => handleChange('status', e.target.value)}
                                className="w-full border border-slate-300 rounded-md p-2 bg-white"
                            >
                                <option value="">(変更なし)</option>
                                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Delivery Date */}
                    <div className="flex items-center gap-4">
                        <input
                            type="checkbox"
                            id="chk-deliveryDate"
                            checked={!!enabledFields.deliveryDate}
                            onChange={() => handleToggleField('deliveryDate')}
                            className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        <div className={`flex-1 ${!enabledFields.deliveryDate ? 'opacity-50 pointer-events-none' : ''}`}>
                            <label htmlFor="chk-deliveryDate" className="block text-sm font-medium text-slate-700 mb-1">納期</label>
                            <input
                                type="date"
                                value={updates.deliveryDate || ''}
                                onChange={e => handleChange('deliveryDate', e.target.value)}
                                className="w-full border border-slate-300 rounded-md p-2"
                            />
                        </div>
                    </div>

                    {/* Plating Type */}
                    <div className="flex items-center gap-4">
                        <input
                            type="checkbox"
                            id="chk-plating"
                            checked={!!enabledFields.platingTypeId}
                            onChange={() => handleToggleField('platingTypeId')}
                            className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        <div className={`flex-1 ${!enabledFields.platingTypeId ? 'opacity-50 pointer-events-none' : ''}`}>
                            <label htmlFor="chk-plating" className="block text-sm font-medium text-slate-700 mb-1">めっき種</label>
                            <select
                                value={updates.platingTypeId || ''}
                                onChange={e => handleChange('platingTypeId', e.target.value)}
                                className="w-full border border-slate-300 rounded-md p-2 bg-white"
                            >
                                <option value="">(変更なし)</option>
                                {platingTypes.map(pt => (
                                    <option key={pt.id} value={pt.id}>{pt.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                </div>
                <footer className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50">キャンセル</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700">更新を実行</button>
                </footer>
            </div>
        </div>
    );
};
