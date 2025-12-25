import React, { useState, useMemo } from 'react';
import { CorrespondenceLog, ClientMaster, Job, User } from '../types';
import { TrashIcon } from './icons';

interface CorrespondencePageProps {
    currentUser: User;
    clients: ClientMaster[];
    jobs: Job[];
    correspondenceLogs: CorrespondenceLog[];
    users: User[];
    onSaveLog: (log: Omit<CorrespondenceLog, 'id' | 'correspondenceDate' | 'staffId'>) => void;
    onDeleteLog: (logId: string) => void;
}

const StarRatingInput = ({ rating, setRating }: { rating: number, setRating: (rating: number) => void }) => {
    return (
        <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                >
                    <svg
                        className={`w-6 h-6 ${rating >= star ? 'text-yellow-400' : 'text-slate-300 hover:text-yellow-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                </button>
            ))}
        </div>
    );
};

const StarRatingDisplay = ({ rating }: { rating: number }) => (
    <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
            <svg
                key={star}
                className={`w-5 h-5 ${rating >= star ? 'text-yellow-400' : 'text-slate-300'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
            >
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
        ))}
    </div>
);

const CorrespondencePage: React.FC<CorrespondencePageProps> = ({ currentUser, clients, jobs, correspondenceLogs, users, onSaveLog, onDeleteLog }) => {
    const [newLog, setNewLog] = useState({ clientId: '', jobId: '', temperature: 3, memo: '' });
    
    const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);
    const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);
    const jobMap = useMemo(() => new Map(jobs.map(j => [j.id, j.productName])), [jobs]);

    const jobsForSelectedClient = useMemo(() => {
        if (!newLog.clientId) return [];
        return jobs.filter(job => job.clientId === newLog.clientId);
    }, [jobs, newLog.clientId]);
    
    const sortedLogs = useMemo(() => {
        return [...correspondenceLogs].sort((a,b) => new Date(b.correspondenceDate).getTime() - new Date(a.correspondenceDate).getTime());
    }, [correspondenceLogs]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLog.clientId || !newLog.memo) {
            alert('顧客とメモは必須です。');
            return;
        }
        onSaveLog({
            clientId: newLog.clientId,
            jobId: newLog.jobId || undefined,
            temperature: newLog.temperature,
            memo: newLog.memo,
        });
        setNewLog({ clientId: '', jobId: '', temperature: 3, memo: '' });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Form Column */}
            <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm sticky top-24">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">応対履歴の登録</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">顧客</label>
                            <select
                                value={newLog.clientId}
                                onChange={e => setNewLog({ ...newLog, clientId: e.target.value, jobId: '' })}
                                className="w-full border border-slate-300 rounded-md p-2 bg-white"
                                required
                            >
                                <option value="">選択してください</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">関連案件 (任意)</label>
                            <select
                                value={newLog.jobId}
                                onChange={e => setNewLog({ ...newLog, jobId: e.target.value })}
                                className="w-full border border-slate-300 rounded-md p-2 bg-white"
                                disabled={!newLog.clientId}
                            >
                                <option value="">案件と紐付けない</option>
                                {jobsForSelectedClient.map(j => <option key={j.id} value={j.id}>{j.productName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">顧客の温度感</label>
                            <StarRatingInput rating={newLog.temperature} setRating={(r) => setNewLog({...newLog, temperature: r})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">要望・メモ</label>
                            <textarea
                                value={newLog.memo}
                                onChange={e => setNewLog({ ...newLog, memo: e.target.value })}
                                className="w-full border border-slate-300 rounded-md p-2"
                                rows={5}
                                required
                            ></textarea>
                        </div>
                        <button type="submit" className="w-full px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700">
                            登録する
                        </button>
                    </form>
                </div>
            </div>

            {/* History List Column */}
            <div className="lg:col-span-2">
                <h1 className="text-2xl font-bold text-slate-800 mb-4">応対履歴一覧</h1>
                <div className="space-y-4">
                    {sortedLogs.map(log => (
                        <div key={log.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative">
                             <button
                                onClick={() => onDeleteLog(log.id)}
                                className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-600 rounded-full hover:bg-slate-100 transition-colors"
                                aria-label="削除"
                            >
                                <TrashIcon className="h-5 w-5" />
                            </button>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-bold text-slate-800">{clientMap.get(log.clientId) || '不明な顧客'}</p>
                                    {log.jobId && <p className="text-sm text-cyan-600">{jobMap.get(log.jobId) || '不明な案件'}</p>}
                                </div>
                                <div className="flex flex-col items-end text-xs text-slate-500 pr-8">
                                    <span>{new Date(log.correspondenceDate).toLocaleString('ja-JP')}</span>
                                    <span>担当: {userMap.get(log.staffId) || '不明'}</span>
                                </div>
                            </div>
                             <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm text-slate-600">温度感:</span>
                                <StarRatingDisplay rating={log.temperature} />
                             </div>
                            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-md whitespace-pre-wrap">{log.memo}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CorrespondencePage;