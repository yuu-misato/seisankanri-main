import React, { useState, useRef } from 'react';
import { FirebaseConfig } from '../types';
import { CloseIcon, CloudIcon, UploadIcon, DownloadIcon } from './icons';

interface CloudConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: FirebaseConfig | null;
  onSave: (config: FirebaseConfig) => void;
  onDisconnect: () => void;
  onUploadLocalData: () => void;
}

export const CloudConfigModal: React.FC<CloudConfigModalProps> = ({ isOpen, onClose, config, onSave, onDisconnect, onUploadLocalData }) => {
  const [formData, setFormData] = useState<FirebaseConfig>(config || { apiKey: '', authDomain: '', projectId: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    if (!formData.apiKey || !formData.authDomain || !formData.projectId) {
      alert('すべての項目を入力してください。');
      return;
    }
    onSave(formData);
  };

  const handleExportConfig = () => {
    const data = formData;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `firebase_config.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target?.result as string);
            if (data.apiKey && data.authDomain && data.projectId) {
                setFormData({
                    apiKey: data.apiKey,
                    authDomain: data.authDomain,
                    projectId: data.projectId
                });
                alert('設定ファイルを読み込みました。');
            } else {
                alert('無効な設定ファイルです。必要な項目 (apiKey, authDomain, projectId) が含まれていません。');
            }
        } catch (error) {
            console.error(error);
            alert('ファイルの読み込みに失敗しました。');
        }
        // Reset input to allow selecting the same file again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <header className="flex justify-between items-center p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <CloudIcon className="text-cyan-600" />
            <h2 className="text-lg font-semibold text-slate-800">クラウド同期設定</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><CloseIcon /></button>
        </header>

        <div className="p-6 space-y-4 overflow-y-auto">
          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md">
            Firebaseコンソールから取得した設定情報を入力してください。
            設定後、データはリアルタイムでクラウドに同期されます。
          </p>

          <div className="flex justify-end gap-3 text-sm border-b border-slate-100 pb-4">
            <button
                type="button"
                onClick={handleExportConfig}
                className="text-cyan-600 hover:text-cyan-800 flex items-center gap-1 px-2 py-1 hover:bg-cyan-50 rounded"
                title="現在の入力内容をファイルに保存します"
            >
                <DownloadIcon className="w-4 h-4"/> 設定ファイルを出力
            </button>
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-cyan-600 hover:text-cyan-800 flex items-center gap-1 px-2 py-1 hover:bg-cyan-50 rounded"
                title="保存した設定ファイルを読み込みます"
            >
                <UploadIcon className="w-4 h-4"/> 設定ファイルを読込
            </button>
            <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleImportConfig}
                className="hidden"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">API Key (apiKey)</label>
            <input
              type="text"
              name="apiKey"
              value={formData.apiKey}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-md p-2 text-sm"
              placeholder="Example: AIzaSy..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Auth Domain (authDomain)</label>
            <input
              type="text"
              name="authDomain"
              value={formData.authDomain}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-md p-2 text-sm"
              placeholder="Example: project-id.firebaseapp.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Project ID (projectId)</label>
            <input
              type="text"
              name="projectId"
              value={formData.projectId}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-md p-2 text-sm"
              placeholder="Example: project-id"
            />
          </div>
          
           {config && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                    <h4 className="font-semibold text-slate-800 mb-2">データ移行</h4>
                     <button 
                        onClick={() => {
                            if(window.confirm('現在のローカルデータをクラウドにアップロードし、クラウド上のデータを上書きしますか？')) {
                                onUploadLocalData();
                            }
                        }}
                        className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 border border-slate-300 rounded-md hover:bg-slate-200 transition-colors"
                    >
                        <UploadIcon />
                        現在のローカルデータをクラウドにアップロード
                    </button>
                </div>
            )}
        </div>

        <footer className="flex justify-between items-center p-4 border-t border-slate-200 bg-slate-50 rounded-b-lg mt-auto">
           {config ? (
               <button onClick={() => { if(window.confirm('接続を解除しますか？')) onDisconnect(); }} className="text-red-600 hover:text-red-800 text-sm">接続を解除</button>
           ) : <div></div>}
           <div className="flex gap-2">
               <button onClick={onClose} className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50">キャンセル</button>
               <button onClick={handleSave} className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700">保存して接続</button>
           </div>
        </footer>
      </div>
    </div>
  );
};