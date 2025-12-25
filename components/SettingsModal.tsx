
import React, { useState, useEffect, useRef } from 'react';
import { PlatingTypeMaster, JigMaster, ClientMaster, ProcessStageDurations, ProcessStatus, User, Job, CorrespondenceLog, FirebaseConfig } from '../types';
import { CloseIcon, CogIcon, PlusIcon, TrashIcon, PencilIcon, DownloadIcon, UploadIcon, CloudIcon } from './icons';
import { CloudConfigModal } from './CloudConfigModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  users: User[];
  platingTypes: PlatingTypeMaster[];
  jigs: JigMaster[];
  clients: ClientMaster[];
  processDurations: ProcessStageDurations;
  settlementMonth: number;
  jobs: Job[];
  correspondenceLogs: CorrespondenceLog[];
  onUsersSave: (data: User[]) => void;
  onPlatingTypesSave: (data: PlatingTypeMaster[]) => void;
  onJigsSave: (data: JigMaster[]) => void;
  onClientsSave: (data: ClientMaster[]) => void;
  onProcessDurationsSave: (data: ProcessStageDurations) => void;
  onSettlementMonthSave: (month: number) => void;
  onJobsSave: (data: Job[]) => void;
  onCorrespondenceLogsSave: (data: CorrespondenceLog[]) => void;
  
  // Cloud Props
  onOpenCloudConfig: () => void;
  isCloudConnected: boolean;
}

type Tab = 'plating' | 'jigs' | 'clients' | 'process' | 'report' | 'users' | 'data' | 'cloud';

type Field = {
    key: string;
    label: string;
    type: 'text' | 'number' | 'password' | 'select';
    options?: string[];
};


// FIX: Changed EditableRow to return a fragment of TDs instead of a TR, to avoid invalid HTML (`<tr>` inside `<tr>`) and subsequent React errors.
const EditableRow = ({ item, onSave, onCancel, fields, isNew }: { item: any, onSave: (item: any) => void, onCancel: () => void, fields: Field[], isNew: boolean }) => {
    const [editItem, setEditItem] = useState(item);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        // @ts-ignore
        const isNumber = e.target.type === 'number';
        setEditItem({ ...editItem, [name]: isNumber ? Number(value) : value });
    };
    
    const handleSaveClick = () => {
        if (isNew) {
            if (!editItem.username.trim() || !editItem.password.trim()) {
                alert('新規ユーザーを作成する場合、ユーザー名とパスワードは必須です。');
                return;
            }
        }
        
        const itemToSave = {...editItem};
        // If password is blank on edit, don't change it.
        if (!isNew && itemToSave.password === '') {
            delete itemToSave.password;
        }
        onSave(itemToSave);
    }

    return (
        <>
            {fields.map(field => (
                <td key={field.key} className="px-2 py-1">
                    {field.type === 'select' ? (
                        <select
                            name={field.key}
                            value={editItem[field.key]}
                            onChange={handleChange}
                            className="w-full bg-white border border-cyan-400 rounded-md p-1.5 text-sm"
                        >
                            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    ) : (
                        <input
                            type={field.type}
                            name={field.key}
                            value={editItem[field.key]}
                            onChange={handleChange}
                            className="w-full bg-white border border-cyan-400 rounded-md p-1 text-sm"
                            autoFocus={field.key === 'name'}
                            placeholder={field.key === 'password' ? (isNew ? 'パスワード (必須)' : '変更時のみ入力') : ''}
                        />
                    )}
                </td>
            ))}
            <td className="px-2 py-1">
                <div className="flex gap-2">
                    <button onClick={handleSaveClick} className="text-cyan-600 hover:text-cyan-800">保存</button>
                    <button onClick={onCancel} className="text-slate-500 hover:text-slate-700">取消</button>
                </div>
            </td>
        </>
    );
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen, onClose, currentUser,
    users, platingTypes, jigs, clients, processDurations, settlementMonth, jobs, correspondenceLogs,
    onUsersSave, onPlatingTypesSave, onJigsSave, onClientsSave, onProcessDurationsSave, onSettlementMonthSave, onJobsSave, onCorrespondenceLogsSave,
    onOpenCloudConfig, isCloudConnected
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('plating');
    const [localUsers, setLocalUsers] = useState<User[]>([]);
    const [localPlatingTypes, setLocalPlatingTypes] = useState<PlatingTypeMaster[]>([]);
    const [localJigs, setLocalJigs] = useState<JigMaster[]>([]);
    const [localClients, setLocalClients] = useState<ClientMaster[]>([]);
    const [localProcessDurations, setLocalProcessDurations] = useState<ProcessStageDurations>(processDurations);
    const [localSettlementMonth, setLocalSettlementMonth] = useState<number>(settlementMonth);
    
    const [editingId, setEditingId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setLocalUsers(JSON.parse(JSON.stringify(users)));
            setLocalPlatingTypes(JSON.parse(JSON.stringify(platingTypes)));
            setLocalJigs(JSON.parse(JSON.stringify(jigs)));
            setLocalClients(JSON.parse(JSON.stringify(clients)));
            setLocalProcessDurations(JSON.parse(JSON.stringify(processDurations)));
            setLocalSettlementMonth(settlementMonth);
        }
    }, [isOpen, users, platingTypes, jigs, clients, processDurations, settlementMonth]);

    const handleSave = () => {
        onUsersSave(localUsers);
        onPlatingTypesSave(localPlatingTypes);
        onJigsSave(localJigs);
        onClientsSave(localClients);
        onProcessDurationsSave(localProcessDurations);
        onSettlementMonthSave(localSettlementMonth);
        onClose();
    };
    
    const handleAddItem = <T extends {id: string}>(setter: React.Dispatch<React.SetStateAction<T[]>>, newItem: T) => {
        setter(prev => [...prev, newItem]);
        setEditingId(newItem.id);
    };

    const handleUpdateItem = <T extends {id: string}>(setter: React.Dispatch<React.SetStateAction<T[]>>, updatedItem: Partial<T> & { id: string }) => {
        setter(prev => prev.map(item => item.id === updatedItem.id ? { ...item, ...updatedItem } : item));
        setEditingId(null);
    };

    const handleDeleteItem = <T extends {id: string}>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: string) => {
        if (window.confirm('この項目を削除しますか？')) {
            setter(prev => prev.filter(item => item.id !== id));
        }
    };

    const handleExportData = () => {
        const data = {
            version: "1.0",
            exportDate: new Date().toISOString(),
            users,
            platingTypes,
            jigs,
            clients,
            processDurations,
            settlementMonth,
            jobs,
            correspondenceLogs
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `imai_plating_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                
                if (window.confirm('現在のデータを上書きして、インポートしたデータを読み込みますか？この操作は取り消せません。')) {
                    if (data.users) onUsersSave(data.users);
                    if (data.platingTypes) onPlatingTypesSave(data.platingTypes);
                    if (data.jigs) onJigsSave(data.jigs);
                    if (data.clients) onClientsSave(data.clients);
                    if (data.processDurations) onProcessDurationsSave(data.processDurations);
                    if (data.settlementMonth) onSettlementMonthSave(data.settlementMonth);
                    if (data.jobs) onJobsSave(data.jobs);
                    if (data.correspondenceLogs) onCorrespondenceLogsSave(data.correspondenceLogs);
                    
                    alert('データの復元が完了しました。');
                    onClose();
                }
            } catch (error) {
                console.error(error);
                alert('ファイルの読み込みに失敗しました。正しいJSONファイルを選択してください。');
            }
        };
        reader.readAsText(file);
    };

    const platingFields: Field[] = [
        { key: 'name', label: 'めっき種名', type: 'text' },
        { key: 'unitPrice', label: '基準単価 (円)', type: 'number' },
        { key: 'costPerLot', label: 'ロット毎の原価 (円)', type: 'number' },
    ];
     const jigFields: Field[] = [
        { key: 'name', label: '治具名', type: 'text' },
        { key: 'totalQuantity', label: 'ロット数量', type: 'number' },
    ];
     const clientFields: Field[] = [
        { key: 'name', label: '顧客名', type: 'text' },
        { key: 'contactPerson', label: '担当者', type: 'text' },
    ];
    const userFields: Field[] = [
        { key: 'name', label: '氏名', type: 'text' },
        { key: 'username', label: 'ユーザー名', type: 'text' },
        { key: 'password', label: 'パスワード', type: 'password' },
        { key: 'role', label: '役割', type: 'select', options: ['admin', 'user'] },
    ];
    
    if (!isOpen) return null;

    const TabButton = ({ tab, label }: { tab: Tab, label: string }) => (
        <button
            onClick={() => { setEditingId(null); setActiveTab(tab); }}
            className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md ${activeTab === tab ? 'bg-cyan-100 text-cyan-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
        >
            {label}
        </button>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'users':
                return (
                    <div>
                        <table className="w-full text-sm">
                           <thead>
                               <tr className="text-left bg-slate-100">
                                   {userFields.map(f=><th key={f.key} className="p-2 font-semibold">{f.label}</th>)}
                                   <th className="p-2 font-semibold">操作</th>
                               </tr>
                           </thead>
                           <tbody>
                                {localUsers.map(item => editingId === item.id ? 
                                    <tr key={item.id} className="bg-slate-50">
                                        <EditableRow item={{...item, password: ''}} onSave={(updated) => handleUpdateItem(setLocalUsers, updated)} onCancel={() => setEditingId(null)} fields={userFields} isNew={item.id.startsWith('new-')} />
                                    </tr>
                                    :
                                    <tr key={item.id} className="border-b hover:bg-slate-50">
                                        {userFields.map(f => (
                                            <td key={f.key} className="p-2">
                                                {f.type === 'password' ? '••••••••' : item[f.key as keyof typeof item]}
                                            </td>
                                        ))}
                                        <td className="p-2 flex gap-2"><button onClick={() => setEditingId(item.id)}><PencilIcon /></button><button onClick={() => handleDeleteItem(setLocalUsers, item.id)}><TrashIcon /></button></td>
                                    </tr>
                                )}
                           </tbody>
                        </table>
                        <button onClick={() => handleAddItem(setLocalUsers, {id: `new-${Date.now()}`, name: '', username: '', password: '', role: 'user'})} className="mt-4 flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-800"><PlusIcon />ユーザーを追加</button>
                    </div>
                );
            case 'plating':
                return (
                    <div>
                        <table className="w-full text-sm">
                           <thead><tr className="text-left bg-slate-100">{platingFields.map(f=><th key={f.key} className="p-2 font-semibold">{f.label}</th>)}<th className="p-2 font-semibold">操作</th></tr></thead>
                           <tbody>
                                {localPlatingTypes.map(item => editingId === item.id ? 
                                    <tr key={item.id} className="bg-slate-50">
                                        <EditableRow item={item} onSave={(updated) => handleUpdateItem(setLocalPlatingTypes, updated)} onCancel={() => setEditingId(null)} fields={platingFields} isNew={item.id.startsWith('new-')} />
                                    </tr>
                                    :
                                    <tr key={item.id} className="border-b hover:bg-slate-50">
                                        {platingFields.map(f => <td key={f.key} className="p-2">{item[f.key as keyof typeof item]}</td>)}
                                        <td className="p-2 flex gap-2"><button onClick={() => setEditingId(item.id)}><PencilIcon /></button><button onClick={() => handleDeleteItem(setLocalPlatingTypes, item.id)}><TrashIcon /></button></td>
                                    </tr>
                                )}
                           </tbody>
                        </table>
                        <button onClick={() => handleAddItem(setLocalPlatingTypes, {id: `new-${Date.now()}`, name: '', unitPrice: 0, costPerLot: 0})} className="mt-4 flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-800"><PlusIcon />めっき種を追加</button>
                    </div>
                );
            case 'jigs':
                 return (
                    <div>
                        <table className="w-full text-sm">
                           <thead><tr className="text-left bg-slate-100">{jigFields.map(f=><th key={f.key} className="p-2 font-semibold">{f.label}</th>)}<th className="p-2 font-semibold">操作</th></tr></thead>
                           <tbody>
                                {localJigs.map(item => editingId === item.id ? 
                                    <tr key={item.id} className="bg-slate-50">
                                        <EditableRow item={item} onSave={(updated) => handleUpdateItem(setLocalJigs, updated)} onCancel={() => setEditingId(null)} fields={jigFields} isNew={item.id.startsWith('new-')} />
                                    </tr>
                                    :
                                    <tr key={item.id} className="border-b hover:bg-slate-50">
                                        {jigFields.map(f => <td key={f.key} className="p-2">{item[f.key as keyof typeof item]}</td>)}
                                        <td className="p-2 flex gap-2"><button onClick={() => setEditingId(item.id)}><PencilIcon /></button><button onClick={() => handleDeleteItem(setLocalJigs, item.id)}><TrashIcon /></button></td>
                                    </tr>
                                )}
                           </tbody>
                        </table>
                        <button onClick={() => handleAddItem(setLocalJigs, {id: `new-${Date.now()}`, name: '', totalQuantity: 0})} className="mt-4 flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-800"><PlusIcon />治具を追加</button>
                    </div>
                );
            case 'clients':
                return (
                    <div>
                        <table className="w-full text-sm">
                           <thead><tr className="text-left bg-slate-100">{clientFields.map(f=><th key={f.key} className="p-2 font-semibold">{f.label}</th>)}<th className="p-2 font-semibold">操作</th></tr></thead>
                           <tbody>
                                {localClients.map(item => editingId === item.id ? 
                                    <tr key={item.id} className="bg-slate-50">
                                        <EditableRow item={item} onSave={(updated) => handleUpdateItem(setLocalClients, updated)} onCancel={() => setEditingId(null)} fields={clientFields} isNew={item.id.startsWith('new-')} />
                                    </tr>
                                    :
                                    <tr key={item.id} className="border-b hover:bg-slate-50">
                                        {clientFields.map(f => <td key={f.key} className="p-2">{item[f.key as keyof typeof item] || '-'}</td>)}
                                        <td className="p-2 flex gap-2"><button onClick={() => setEditingId(item.id)}><PencilIcon /></button><button onClick={() => handleDeleteItem(setLocalClients, item.id)}><TrashIcon /></button></td>
                                    </tr>
                                )}
                           </tbody>
                        </table>
                        <button onClick={() => handleAddItem(setLocalClients, {id: `new-${Date.now()}`, name: '', contactPerson: ''})} className="mt-4 flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-800"><PlusIcon />顧客を追加</button>
                    </div>
                );
            case 'process':
                return (
                    <div className="space-y-4">
                        <h4 className="font-semibold text-slate-800">各工程の標準所要日数</h4>
                        {Object.keys(localProcessDurations).map(key => (
                            <div key={key} className="grid grid-cols-2 items-center">
                                <label className="text-sm text-slate-700">{key}</label>
                                <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    value={localProcessDurations[key as keyof ProcessStageDurations]}
                                    onChange={(e) => setLocalProcessDurations(prev => ({...prev, [key]: Number(e.target.value)}))}
                                    className="w-24 border border-slate-300 rounded-md shadow-sm p-2 focus:ring-cyan-500 focus:border-cyan-500"
                                />
                                <span className="text-sm text-slate-600">日</span>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'report':
                return (
                    <div className="space-y-4">
                        <h4 className="font-semibold text-slate-800">レポート設定</h4>
                        <div className="grid grid-cols-2 items-center">
                            <label htmlFor="settlement-month" className="text-sm text-slate-700">決算月</label>
                            <select
                                id="settlement-month"
                                value={localSettlementMonth}
                                onChange={e => setLocalSettlementMonth(Number(e.target.value))}
                                className="w-32 p-2 border border-slate-300 rounded-md bg-white focus:ring-cyan-500 focus:border-cyan-500">
                                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}月</option>)}
                            </select>
                        </div>
                    </div>
                );
            case 'cloud':
                return (
                    <div className="space-y-6">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-2">
                                <CloudIcon className={isCloudConnected ? "text-green-500" : "text-slate-400"} />
                                接続ステータス: {isCloudConnected ? <span className="text-green-600">接続済み</span> : <span className="text-slate-500">未接続</span>}
                            </h4>
                            <p className="text-sm text-slate-600 mb-4">
                                Google Firebaseと連携することで、複数の端末間でリアルタイムにデータを共有できます。
                            </p>
                            <button onClick={onOpenCloudConfig} className="px-4 py-2 bg-white text-cyan-600 border border-cyan-500 rounded-md hover:bg-cyan-50">
                                接続設定を変更する
                            </button>
                        </div>
                    </div>
                )
            case 'data':
                return (
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-semibold text-slate-800 mb-2">データの保存 (エクスポート)</h4>
                            <p className="text-sm text-slate-600 mb-4">
                                現在のシステム内の全データ（ユーザー、マスター、案件、履歴など）をJSONファイルとしてダウンロードします。
                                別のブラウザやPCにデータを移行する際に使用してください。
                            </p>
                            <button onClick={handleExportData} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700">
                                <DownloadIcon />
                                データをダウンロード
                            </button>
                        </div>
                        <div className="border-t border-slate-200 pt-6">
                            <h4 className="font-semibold text-slate-800 mb-2">データの復元 (インポート)</h4>
                            <p className="text-sm text-slate-600 mb-4">
                                ダウンロードしたJSONファイルを読み込み、データを復元します。
                                <br />
                                <span className="text-red-600 font-bold">注意: 現在のデータはすべて上書きされます。</span>
                            </p>
                            <input 
                                type="file" 
                                accept=".json" 
                                ref={fileInputRef} 
                                onChange={handleImportData} 
                                className="hidden" 
                            />
                            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700">
                                <UploadIcon />
                                ファイルを選択して復元
                            </button>
                        </div>
                    </div>
                )
            default: return null;
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-40 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <CogIcon />
                        <h2 className="text-lg font-semibold text-slate-800">設定</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><CloseIcon /></button>
                </header>

                <div className="flex-grow flex">
                    <nav className="border-r border-slate-200 p-4 w-48 flex-shrink-0">
                       <div className="flex flex-col gap-1">
                           {currentUser.role === 'admin' && <TabButton tab="users" label="ユーザー管理" />}
                           <TabButton tab="plating" label="めっき種マスター" />
                           <TabButton tab="jigs" label="治具マスター" />
                           <TabButton tab="clients" label="顧客マスター" />
                           <TabButton tab="process" label="工程設定" />
                           <TabButton tab="report" label="レポート設定" />
                           <div className="border-t border-slate-200 my-2 pt-2">
                                <TabButton tab="cloud" label="クラウド同期" />
                                <TabButton tab="data" label="データ管理" />
                           </div>
                       </div>
                    </nav>
                    <main className="flex-grow p-6 overflow-y-auto">
                        {renderTabContent()}
                    </main>
                </div>

                <footer className="flex justify-end gap-2 p-4 border-t border-slate-200 bg-slate-50 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50">キャンセル</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700">保存して閉じる</button>
                </footer>
            </div>
        </div>
    );
};