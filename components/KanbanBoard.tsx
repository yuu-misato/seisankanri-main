
import React, { useMemo } from 'react';
import { Job, PlatingTypeMaster, ClientMaster, ProcessStatus, User } from '../types';
import { JobCard } from './JobCard';

interface KanbanBoardProps {
    jobs: Job[];
    platingTypes: PlatingTypeMaster[];
    clients: ClientMaster[];
    onSelectJob: (job: Job) => void;
    users?: User[];
}

const STATUS_CONFIG: Record<ProcessStatus, { label: string, color: string, bg: string }> = {
    [ProcessStatus.RECEIVED]: { label: '受付', color: 'text-slate-600', bg: 'bg-slate-100' },
    [ProcessStatus.PRE_TREATMENT]: { label: '前処理', color: 'text-blue-600', bg: 'bg-blue-50' },
    [ProcessStatus.PLATING]: { label: 'めっき', color: 'text-purple-600', bg: 'bg-purple-50' },
    [ProcessStatus.POST_TREATMENT]: { label: '後処理', color: 'text-orange-600', bg: 'bg-orange-50' },
    [ProcessStatus.INSPECTION]: { label: '検査', color: 'text-cyan-600', bg: 'bg-cyan-50' },
    [ProcessStatus.SHIPPED]: { label: '出荷済', color: 'text-green-600', bg: 'bg-green-50' },
};

const ORDERED_STATUSES = [
    ProcessStatus.RECEIVED,
    ProcessStatus.PRE_TREATMENT,
    ProcessStatus.PLATING,
    ProcessStatus.POST_TREATMENT,
    ProcessStatus.INSPECTION,
    ProcessStatus.SHIPPED,
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ jobs, platingTypes, clients, onSelectJob, users = [] }) => {
    const platingTypeMap = useMemo(() => new Map(platingTypes.map(pt => [pt.id, pt.name])), [platingTypes]);
    const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);
    const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);

    // Group jobs by status
    const jobsByStatus = useMemo(() => {
        const groups: Record<string, Job[]> = {};
        ORDERED_STATUSES.forEach(status => {
            groups[status] = [];
        });
        jobs.forEach(job => {
            if (groups[job.status]) {
                groups[job.status].push(job);
            }
        });
        return groups;
    }, [jobs]);

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)] min-w-full">
            {ORDERED_STATUSES.map(status => {
                const config = STATUS_CONFIG[status];
                const statusJobs = jobsByStatus[status] || [];
                const count = statusJobs.length;

                return (
                    <div key={status} className={`flex-shrink-0 w-80 flex flex-col rounded-lg ${config.bg} shadow-sm border border-slate-200/60`}>
                        {/* Column Header */}
                        <div className={`p-3 border-b border-white/50 flex justify-between items-center sticky top-0 backdrop-blur-sm rounded-t-lg bg-opacity-90`}>
                            <div className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full ${config.color.replace('text-', 'bg-')}`}></span>
                                <h3 className={`font-bold ${config.color}`}>{config.label}</h3>
                            </div>
                            <span className="bg-white/60 px-2 py-0.5 rounded-full text-xs font-medium text-slate-600">
                                {count}件
                            </span>
                        </div>

                        {/* Cards Container */}
                        <div className="p-2 flex-grow overflow-y-auto space-y-2 custom-scrollbar">
                            {statusJobs.map(job => (
                                <JobCard
                                    key={job.id}
                                    job={job}
                                    platingTypeName={platingTypeMap.get(job.platingTypeId) || '未設定'}
                                    clientName={clientMap.get(job.clientId) || '未設定'}
                                    updatedByName={job.updatedBy ? userMap.get(job.updatedBy) : undefined}
                                    onSelect={onSelectJob}
                                    isCompact={true} // Add compact mode for Kanban
                                />
                            ))}
                            {statusJobs.length === 0 && (
                                <div className="h-full flex items-center justify-center min-h-[100px] text-slate-400 text-sm border-2 border-dashed border-slate-200/50 rounded-lg">
                                    案件なし
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
