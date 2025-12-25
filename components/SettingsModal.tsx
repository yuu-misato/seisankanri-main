import React, { useState, useEffect, useRef } from 'react';
import { PlatingTypeMaster, JigMaster, ClientMaster, ProcessStageDurations, ProcessStatus, User, Job, CorrespondenceLog } from '../types';
import { CloseIcon, CogIcon, PlusIcon, TrashIcon, PencilIcon, DownloadIcon, UploadIcon } from './icons';

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
}
//...
export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen, onClose, currentUser,
    users, platingTypes, jigs, clients, processDurations, settlementMonth, jobs, correspondenceLogs,
    onUsersSave, onPlatingTypesSave, onJigsSave, onClientsSave, onProcessDurationsSave, onSettlementMonthSave, onJobsSave, onCorrespondenceLogsSave
}) => {
//...
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

            <div className="flex-grow flex overflow-hidden">
                <nav className="border-r border-slate-200 p-4 w-48 flex-shrink-0 overflow-y-auto">
                    <div className="flex flex-col gap-1">
                        {currentUser.role === 'admin' && <TabButton tab="users" label="ユーザー管理" />}
                        <TabButton tab="plating" label="めっき種マスター" />
                        <TabButton tab="jigs" label="治具マスター" />
                        <TabButton tab="clients" label="顧客マスター" />
                        <TabButton tab="process" label="工程設定" />
                        <TabButton tab="report" label="レポート設定" />
                        <div className="border-t border-slate-200 my-2 pt-2">
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