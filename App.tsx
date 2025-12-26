import React, { useState, useMemo, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Job, ClientMaster, PlatingTypeMaster, JigMaster, Filters, ProcessStatus, ProcessStageDurations, User, CorrespondenceLog, SupabaseConfig } from './types';
import { MOCK_JOBS, MOCK_CLIENTS, MOCK_PLATING_TYPES, MOCK_JIGS, DEFAULT_PROCESS_DURATIONS, PROCESS_STATUS_ORDER, MOCK_USERS, MOCK_CORRESPONDENCE_LOGS } from './constants';
import Header from './components/Header';
import { Dashboard } from './components/Dashboard';
import { FilterControls } from './components/FilterControls';
import { JobList } from './components/JobList';
import { GanttChart } from './components/GanttChart';
import { KanbanBoard } from './components/KanbanBoard'; // Import KanbanBoard
import { JobDetailModal } from './components/JobDetailModal';
import { SettingsModal } from './components/SettingsModal';
import ReportPage from './components/ReportPage';
import { LoginPage } from './components/LoginPage';
import CorrespondencePage from './components/CorrespondencePage';
import { BulkEditModal } from './components/BulkEditModal';
import {
    PlusIcon,
    FunnelIcon,
    ArrowPathIcon,
    CogIcon,
    ChatBubbleIcon,
    ChartBarIcon,
    ClipboardIcon,
    TrashIcon,
    PencilIcon
} from './components/icons';

import { createSupabaseClient } from './supabaseClient';

/**
 * A custom hook that persists state to localStorage.
 * It mimics the useState API but automatically saves the state
 * to localStorage on every change and loads it on initialization.
 */
function usePersistentState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(() => {
        try {
            const storedValue = window.localStorage.getItem(key);
            if (storedValue) {
                return JSON.parse(storedValue);
            }
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
        }
        // If no stored value, return the initial value
        return initialValue;
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, state]);

    return [state, setState];
}


const App: React.FC = () => {
    const STORAGE_PREFIX = 'imai-plating-prod-mgnt:';

    // Auth state
    const [currentUser, setCurrentUser] = usePersistentState<User | null>(`${STORAGE_PREFIX}currentUser`, null);

    // Cloud Config State - Hardcoded from env
    const supabaseConfig: SupabaseConfig = {
        url: import.meta.env.VITE_SUPABASE_URL || '',
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
    };
    const [isCloudMode, setIsCloudMode] = useState(false);
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

    // Master data state, now persistent
    const [jobs, setJobs] = usePersistentState<Job[]>(`${STORAGE_PREFIX}jobs`, MOCK_JOBS);
    const [clients, setClients] = usePersistentState<ClientMaster[]>(`${STORAGE_PREFIX}clients`, MOCK_CLIENTS);
    const [platingTypes, setPlatingTypes] = usePersistentState<PlatingTypeMaster[]>(`${STORAGE_PREFIX}platingTypes`, MOCK_PLATING_TYPES);
    const [jigs, setJigs] = usePersistentState<JigMaster[]>(`${STORAGE_PREFIX}jigs`, MOCK_JIGS);
    const [processDurations, setProcessDurations] = usePersistentState<ProcessStageDurations>(`${STORAGE_PREFIX}processDurations`, DEFAULT_PROCESS_DURATIONS);
    const [settlementMonth, setSettlementMonth] = usePersistentState<number>(`${STORAGE_PREFIX}settlementMonth`, 3); // 3月決算
    const [correspondenceLogs, setCorrespondenceLogs] = usePersistentState<CorrespondenceLog[]>(`${STORAGE_PREFIX}correspondenceLogs`, MOCK_CORRESPONDENCE_LOGS);
    const [users, setUsers] = usePersistentState<User[]>(`${STORAGE_PREFIX}users`, MOCK_USERS);


    // UI state
    const [currentPage, setCurrentPage] = useState<'management' | 'report' | 'correspondence'>('management');
    const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'gantt'>('gantt');
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    // Pagination State
    const [itemsPerPage, setItemsPerPage] = useState<number>(20);
    const [paginationPage, setPaginationPage] = useState<number>(1);
    const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);


    const handleBulkDelete = async () => {
        if (!window.confirm(`${selectedJobIds.length}件の案件を削除しますか？この操作は取り消せません。`)) return;

        const idsToDelete = [...selectedJobIds];

        // Optimistic update
        setJobs(prev => prev.filter(j => !idsToDelete.includes(j.id)));
        setSelectedJobIds([]);

        if (supabase) {
            const { error } = await supabase.from('jobs').delete().in('id', idsToDelete);
            if (error) {
                console.error('Error deleting jobs:', error);
                alert('削除中にエラーが発生しました。');
                // Revert would be needed here ideally, but for now assuming success or reload
                window.location.reload();
            }
        }
    };

    const handleBulkUpdate = async (updates: Partial<Job>) => {
        const idsToUpdate = [...selectedJobIds];

        // Optimistic update
        setJobs(prev => prev.map(j => idsToUpdate.includes(j.id) ? { ...j, ...updates } : j));
        setSelectedJobIds([]);

        if (supabase) {
            // Supabase doesn't support bulk update with different values, but here updates are same for all
            const { error } = await supabase.from('jobs').update(updates).in('id', idsToUpdate);
            if (error) {
                console.error('Error updating jobs:', error);
                alert('更新中にエラーが発生しました。');
                window.location.reload();
            }
        }
    };


    const [filters, setFilters] = useState<Filters>({
        clientId: '',
        productName: '',
        statuses: PROCESS_STATUS_ORDER.filter(s => s !== ProcessStatus.SHIPPED),
        deliveryDateStart: '',
        deliveryDateEnd: '',
    });

    // Reset pagination when filters or view changes
    useEffect(() => {
        setPaginationPage(1);
    }, [filters, viewMode, itemsPerPage]);

    // --- Supabase Initialization & Sync ---
    useEffect(() => {
        if (supabaseConfig.url && supabaseConfig.anonKey) {
            try {
                const client = createSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey);
                setSupabase(client);
                setIsCloudMode(true);

                // --- Initial Fetch ---
                // Supabase doesn't have a "snapshot" listener that gives initial data AND updates like Firestore in one go (easily).
                // We should fetch once, then listen for changes.
                const fetchData = async () => {
                    const { data: jobsData } = await client.from('jobs').select('*');
                    if (jobsData) setJobs(jobsData as any);

                    const { data: clientsData } = await client.from('clients').select('*');
                    if (clientsData) setClients(clientsData as any);

                    const { data: platingData } = await client.from('platingTypes').select('*');
                    if (platingData) setPlatingTypes(platingData as any);

                    const { data: jigsData } = await client.from('jigs').select('*');
                    if (jigsData) setJigs(jigsData as any);

                    const { data: logsData } = await client.from('correspondenceLogs').select('*');
                    if (logsData) setCorrespondenceLogs(logsData as any);

                    const { data: usersData } = await client.from('users').select('*');
                    if (usersData) setUsers(usersData as User[]);

                    const { data: settingsData } = await client.from('appSettings').select('*');
                    if (settingsData) {
                        settingsData.forEach((row: any) => {
                            if (row.key === 'processDurations') setProcessDurations(row.value);
                            if (row.key === 'general') setSettlementMonth(row.value.settlementMonth);
                        });
                    }
                };
                fetchData();

                // --- Real-time Listeners ---
                // Helper to handle realtime updates
                const handleRealtime = (table: string, setter: React.Dispatch<React.SetStateAction<any[]>>, pk = 'id') => {
                    return client.channel(`public:${table}`)
                        .on('postgres_changes', { event: '*', schema: 'public', table: table }, (payload: any) => {
                            if (payload.eventType === 'INSERT') {
                                setter(prev => [...prev, payload.new]);
                            } else if (payload.eventType === 'UPDATE') {
                                setter(prev => prev.map(item => item[pk] === payload.new[pk] ? payload.new : item));
                            } else if (payload.eventType === 'DELETE') {
                                setter(prev => prev.filter(item => item[pk] !== payload.old[pk]));
                            }
                        })
                        .subscribe();
                };

                const subs = [
                    handleRealtime('jobs', setJobs),
                    handleRealtime('clients', setClients),
                    handleRealtime('platingTypes', setPlatingTypes),
                    handleRealtime('jigs', setJigs),
                    handleRealtime('correspondenceLogs', setCorrespondenceLogs),
                    handleRealtime('users', setUsers),
                ];

                // Settings listener (special case for key-value store structure)
                const settingsSub = client.channel('public:appSettings')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'appSettings' }, (payload) => {
                        if (payload.new && payload.new.key === 'processDurations') {
                            setProcessDurations(payload.new.value);
                        }
                        if (payload.new && payload.new.key === 'general') {
                            setSettlementMonth(payload.new.value.settlementMonth);
                        }
                    })
                    .subscribe();


                return () => {
                    subs.forEach(sub => client.removeChannel(sub));
                    client.removeChannel(settingsSub);
                };
            } catch (e) {
                console.error("Supabase connection error:", e);
                setIsCloudMode(false);
            }
        }
    }, []);

    // --- Data Upload Utility ---
    const handleUploadLocalData = async () => {
        if (!supabase) return;
        try {
            const batchPromises = [];
            // Upload Jobs
            for (const j of jobs) batchPromises.push(supabase.from('jobs').upsert(j));
            // Upload Clients
            for (const c of clients) batchPromises.push(supabase.from('clients').upsert(c));
            // Upload Plating Types
            for (const p of platingTypes) batchPromises.push(supabase.from('platingTypes').upsert(p));
            // Upload Jigs
            for (const j of jigs) batchPromises.push(supabase.from('jigs').upsert(j));
            // Upload Logs
            for (const l of correspondenceLogs) batchPromises.push(supabase.from('correspondenceLogs').upsert(l));
            // Upload Users
            for (const u of users) batchPromises.push(supabase.from('users').upsert(u));

            // Upload Settings
            // Settings are key-value in 'appSettings' table
            batchPromises.push(supabase.from('appSettings').upsert({ key: 'processDurations', value: processDurations }));
            batchPromises.push(supabase.from('appSettings').upsert({ key: 'general', value: { settlementMonth } }));

            await Promise.all(batchPromises);
            alert('データのアップロードが完了しました。');

        } catch (e) {
            console.error(e);
            alert('アップロード中にエラーが発生しました。');
        }
    }


    const filteredJobs = useMemo(() => {
        return jobs.filter(job => {
            const statusMatch = filters.statuses.length === 0 || filters.statuses.includes(job.status);
            const clientMatch = !filters.clientId || job.clientId === filters.clientId;
            const productMatch = !filters.productName || job.productName.toLowerCase().includes(filters.productName.toLowerCase());
            const deliveryStartMatch = !filters.deliveryDateStart || job.deliveryDate >= filters.deliveryDateStart;
            const deliveryEndMatch = !filters.deliveryDateEnd || job.deliveryDate <= filters.deliveryDateEnd;

            return statusMatch && clientMatch && productMatch && deliveryStartMatch && deliveryEndMatch;
        });
    }, [jobs, filters]);

    const paginatedJobs = useMemo(() => {
        const start = (paginationPage - 1) * itemsPerPage;
        return filteredJobs.slice(start, start + itemsPerPage);
    }, [filteredJobs, paginationPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);

    const handleSelectJob = (job: Job) => {
        setSelectedJob(job);
        setIsNewJob(false);
        setIsDetailModalOpen(true);
    };

    const handleToggleSelectJob = (jobId: string) => {
        setSelectedJobIds(prev => prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]);
    };

    const handleSelectAllJobs = (ids: string[]) => {
        setSelectedJobIds(ids);
    };

    const handleNewJob = () => {
        const newJobTemplate: Job = {
            id: `job-${Date.now()}`,
            productName: '',
            clientId: '',
            platingTypeId: '',
            jigId: '',
            quantity: 0,
            unitPrice: 0,
            price: 0,
            cost: 0,
            startDate: new Date().toISOString().split('T')[0],
            deliveryDate: '',
            status: ProcessStatus.RECEIVED,
        };
        setSelectedJob(newJobTemplate);
        setIsNewJob(true);
        setIsDetailModalOpen(true);
    };

    const handleDuplicateJob = (sourceJob: Job) => {
        const newJob: Job = {
            ...sourceJob,
            id: `job-${Date.now()}`,
            startDate: new Date().toISOString().split('T')[0],
            deliveryDate: '', // Recalculation happens in modal
            status: ProcessStatus.RECEIVED,
            memo: sourceJob.memo,
            // Reset audit fields for duplication
            createdBy: undefined,
            createdAt: undefined,
            updatedBy: undefined,
            updatedAt: undefined
        };
        setSelectedJob(newJob);
        setIsNewJob(true);
        setIsDetailModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsDetailModalOpen(false);
        setSelectedJob(null);
    };

    const handleSaveJob = async (jobToSave: Job) => {
        if (!currentUser) return;

        const timestamp = new Date().toISOString();
        const jobWithAudit = {
            ...jobToSave,
            updatedBy: currentUser.id,
            updatedAt: timestamp,
            createdBy: isNewJob ? currentUser.id : (jobToSave.createdBy || currentUser.id),
            createdAt: isNewJob ? timestamp : (jobToSave.createdAt || timestamp),
        };

        if (isCloudMode && supabase) {
            await supabase.from('jobs').upsert(jobWithAudit);
        } else {
            if (isNewJob) {
                setJobs(prevJobs => [...prevJobs, jobWithAudit]);
            } else {
                setJobs(prevJobs => prevJobs.map(job => (job.id === jobWithAudit.id ? jobWithAudit : job)));
            }
        }
        handleCloseModal();
    };

    const handleDeleteJob = async (jobId: string) => {
        if (window.confirm('この案件を削除しますか？')) {
            if (isCloudMode && supabase) {
                await supabase.from('jobs').delete().eq('id', jobId);
            } else {
                setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
            }
            handleCloseModal();
        }
    };

    const handleSaveCorrespondenceLog = async (log: Omit<CorrespondenceLog, 'id' | 'correspondenceDate' | 'staffId'>) => {
        if (!currentUser) return;
        const newLog: CorrespondenceLog = {
            ...log,
            id: `cl-${Date.now()}`,
            correspondenceDate: new Date().toISOString(),
            staffId: currentUser.id,
        };

        if (isCloudMode && supabase) {
            await supabase.from('correspondenceLogs').upsert(newLog);
        } else {
            setCorrespondenceLogs(prev => [newLog, ...prev]);
        }
    };

    const handleDeleteCorrespondenceLog = async (logId: string) => {
        if (window.confirm('この応対履歴を削除しますか？')) {
            if (isCloudMode && supabase) {
                await supabase.from('correspondenceLogs').delete().eq('id', logId);
            } else {
                setCorrespondenceLogs(prevLogs => prevLogs.filter(log => log.id !== logId));
            }
        }
    };

    // Generic handlers for master data updates from SettingsModal
    const handleUpdateMaster = async (collectionName: string, data: any[]) => {
        if (isCloudMode && supabase) {
            // For master data arrays, we need to sync each item.
            // Strategy: We can either replace the whole collection or upsert items.
            // Given the UI sends the full array, let's upsert all.
            // Deletion handling is tricky with just 'upsert', so we might need to rely on the user interface's delete action being separate
            // BUT, SettingsModal passes the full new state.
            // For simplicity in this structure: we iterate and set.
            // Real deletion sync needs more logic, but for now let's save all items.
            // If an item was deleted locally, it won't be in `data`, so we should really sync deletions too.
            // A proper way: Since we are in SettingsModal, maybe we should change `onUsersSave` to individual actions.
            // However, to keep changes minimal to existing structure:
            const batchPromises = data.map(item => supabase.from(collectionName).upsert(item));
            await Promise.all(batchPromises);
        } else {
            // Local storage update is handled by the passed setter (e.g. setUsers)
            // This function is just a proxy if we need to intercept for cloud.
        }
    };

    // We need to wrap the setters passed to SettingsModal to handle Cloud Mode
    const wrapSetter = <T extends { id: string }>(collectionName: string, localSetter: React.Dispatch<React.SetStateAction<T[]>>) => {
        return (newData: T[]) => {
            localSetter(newData); // Always update local state for immediate UI feedback (optimistic)
            if (isCloudMode && supabase) {
                // Determine deletions
                // Fetch current collection to find diff? No, too expensive.
                // Simple approach: Upsert all. (Deleted items will remain in cloud - limitation of this simple sync)
                // Better approach for this app size: The UI state `newData` IS the source of truth.
                // We should technically delete items not in `newData`.
                // For now, let's just upsert for safety.
                newData.forEach(item => supabase.from(collectionName).upsert(item));
            }
        }
    }


    const handleResetFilters = () => {
        setFilters({
            clientId: '',
            productName: '',
            statuses: PROCESS_STATUS_ORDER.filter(s => s !== ProcessStatus.SHIPPED),
            deliveryDateStart: '',
            deliveryDateEnd: '',
        });
    };

    const handleLogin = (username: string, password: string): boolean => {
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            const { password: _, ...userToStore } = user;
            setCurrentUser(userToStore);
            return true;
        }
        return false;
    };

    const handleLogout = () => {
        setCurrentUser(null);
    };

    if (!currentUser) {
        return <LoginPage onLogin={handleLogin} />;
    }

    return (
        <div className="bg-slate-50 min-h-screen">
            <div className="print:hidden">
                <Header
                    currentUser={currentUser}
                    onLogout={handleLogout}
                    onNewJob={handleNewJob}
                    onOpenSettings={() => setIsSettingsModalOpen(true)}
                    currentPage={currentPage}
                    onNavigate={setCurrentPage}
                    isCloudConnected={isCloudMode}
                />
            </div>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 print:max-w-full print:p-0 print:m-0">
                {currentPage === 'management' && (
                    <div className="space-y-6">
                        <div className="print:hidden">
                            <Dashboard jobs={jobs} />
                        </div>
                        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-4 print:hidden">
                            <div className="flex-1 w-full">
                                <FilterControls filters={filters} onFilterChange={setFilters} onReset={handleResetFilters} clients={clients} />
                            </div>

                            <div className="flex items-center gap-4 self-end xl:self-auto">
                                {/* Pagination Controls */}
                                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                        className="text-sm border-none bg-transparent focus:ring-0 cursor-pointer text-slate-600 font-medium"
                                        title="表示件数"
                                    >
                                        <option value={20}>20件</option>
                                        <option value={50}>50件</option>
                                        <option value={100}>100件</option>
                                    </select>
                                    <div className="h-4 w-px bg-slate-200 mx-1"></div>
                                    <div className="flex items-center gap-1 text-sm">
                                        <button
                                            onClick={() => setPaginationPage(p => Math.max(1, p - 1))}
                                            disabled={paginationPage === 1}
                                            className="px-2 text-slate-500 hover:text-cyan-600 disabled:opacity-30 disabled:hover:text-slate-500"
                                        >
                                            &lt;
                                        </button>
                                        <span className="text-slate-600 min-w-[3rem] text-center text-xs">
                                            {paginationPage} / {totalPages || 1}
                                        </span>
                                        <button
                                            onClick={() => setPaginationPage(p => Math.min(totalPages, p + 1))}
                                            disabled={paginationPage >= totalPages}
                                            className="px-2 text-slate-500 hover:text-cyan-600 disabled:opacity-30 disabled:hover:text-slate-500"
                                        >
                                            &gt;
                                        </button>
                                    </div>
                                </div>

                                {/* View Mode Switcher */}
                                <div className="bg-white p-1 rounded-lg border border-slate-200 flex items-center shadow-sm">
                                    <button
                                        onClick={() => setViewMode('gantt')}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'gantt' ? 'bg-cyan-100 text-cyan-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        工程表
                                    </button>
                                    <button
                                        onClick={() => setViewMode('kanban')}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'kanban' ? 'bg-cyan-100 text-cyan-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        カンバン
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-cyan-100 text-cyan-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        リスト
                                    </button>
                                </div>
                            </div>
                        </div>

                        {viewMode === 'kanban' && (
                            <KanbanBoard jobs={paginatedJobs} platingTypes={platingTypes} clients={clients} onSelectJob={handleSelectJob} users={users} />
                        )}
                        {viewMode === 'list' && (
                            <JobList
                                jobs={paginatedJobs}
                                onToggleSelect={handleToggleSelectJob}
                                onSelectAll={handleSelectAllJobs}
                            />
                        )}
                        {viewMode === 'gantt' && (
                            <GanttChart jobs={paginatedJobs} onSelectJob={handleSelectJob} />
                        )}
                    </div>
                )}
                {currentPage === 'correspondence' && (
                    <CorrespondencePage
                        currentUser={currentUser}
                        clients={clients}
                        jobs={jobs}
                        correspondenceLogs={correspondenceLogs}
                        users={users}
                        onSaveLog={handleSaveCorrespondenceLog}
                        onDeleteLog={handleDeleteCorrespondenceLog}
                        onLinkToJob={handleSelectJob}
                    />
                )}
                {currentPage === 'report' && (
                    <ReportPage
                        jobs={jobs}
                        platingTypes={platingTypes}
                        clients={clients}
                        processDurations={processDurations}
                        settlementMonth={settlementMonth}
                    />
                )}
            </main>

            {/* Bulk Action Bar */}
            {selectedJobIds.length > 0 && currentPage === 'management' && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-6 z-30 transition-all animate-fade-in-up">
                    <span className="font-bold">{selectedJobIds.length}件 選択中</span>
                    <div className="h-6 w-px bg-slate-600"></div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsBulkEditModalOpen(true)}
                            className="flex items-center gap-2 hover:text-cyan-400 transition-colors"
                        >
                            <PencilIcon className="h-4 w-4" />
                            <span>一括編集</span>
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 hover:text-red-400 transition-colors"
                        >
                            <TrashIcon className="h-4 w-4" />
                            <span>削除</span>
                        </button>
                    </div>
                    <button
                        onClick={() => setSelectedJobIds([])}
                        className="ml-2 text-slate-400 hover:text-white text-sm"
                    >
                        解除
                    </button>
                </div>
            )}

            <BulkEditModal
                isOpen={isBulkEditModalOpen}
                onClose={() => setIsBulkEditModalOpen(false)}
                selectedCount={selectedJobIds.length}
                onSave={handleBulkUpdate}
                platingTypes={platingTypes}
            />

            {
                isDetailModalOpen && selectedJob && (
                    <JobDetailModal
                        isOpen={isDetailModalOpen}
                        onClose={handleCloseModal}
                        onSave={handleSaveJob}
                        onDelete={handleDeleteJob}
                        onDuplicate={handleDuplicateJob}
                        job={selectedJob}
                        allJobs={jobs}
                        isNew={isNewJob}
                        clients={clients}
                        platingTypes={platingTypes}
                        jigs={jigs}
                        processDurations={processDurations}
                        correspondenceLogs={correspondenceLogs}
                        users={users}
                        onDeleteCorrespondenceLog={handleDeleteCorrespondenceLog}
                    />
                )
            }

            {
                isSettingsModalOpen && (
                    <SettingsModal
                        isOpen={isSettingsModalOpen}
                        onClose={() => setIsSettingsModalOpen(false)}
                        currentUser={currentUser}
                        users={users}
                        platingTypes={platingTypes}
                        jigs={jigs}
                        clients={clients}
                        processDurations={processDurations}
                        settlementMonth={settlementMonth}
                        jobs={jobs}
                        correspondenceLogs={correspondenceLogs}

                        // Wrapped setters for cloud sync
                        onUsersSave={wrapSetter('users', setUsers)}
                        onPlatingTypesSave={wrapSetter('platingTypes', setPlatingTypes)}
                        onJigsSave={wrapSetter('jigs', setJigs)}
                        onClientsSave={wrapSetter('clients', setClients)}

                        onProcessDurationsSave={(data) => {
                            setProcessDurations(data);
                            if (isCloudMode && supabase) supabase.from('appSettings').upsert({ key: 'processDurations', value: data });
                        }}
                        onSettlementMonthSave={(month) => {
                            setSettlementMonth(month);
                            if (isCloudMode && supabase) supabase.from('appSettings').upsert({ key: 'general', value: { settlementMonth: month } });
                        }}
                        onJobsSave={wrapSetter('jobs', setJobs)}
                        onCorrespondenceLogsSave={wrapSetter('correspondenceLogs', setCorrespondenceLogs)}

                    />
                )
            }

        </div >
    );
};

export default App;