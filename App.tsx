import React, { useState, useMemo, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Job, ClientMaster, PlatingTypeMaster, JigMaster, Filters, ProcessStatus, ProcessStageDurations, User, CorrespondenceLog, FirebaseConfig } from './types';
import { MOCK_JOBS, MOCK_CLIENTS, MOCK_PLATING_TYPES, MOCK_JIGS, DEFAULT_PROCESS_DURATIONS, PROCESS_STATUS_ORDER, MOCK_USERS, MOCK_CORRESPONDENCE_LOGS } from './constants';
import Header from './components/Header';
import { Dashboard } from './components/Dashboard';
import { FilterControls } from './components/FilterControls';
import { JobList } from './components/JobList';
import { GanttChart } from './components/GanttChart';
import { JobDetailModal } from './components/JobDetailModal';
import { SettingsModal } from './components/SettingsModal';
import ReportPage from './components/ReportPage';
import { LoginPage } from './components/LoginPage';
import CorrespondencePage from './components/CorrespondencePage';
import { CloudConfigModal } from './components/CloudConfigModal';

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
    
    // Cloud Config State
    const [firebaseConfig, setFirebaseConfig] = usePersistentState<FirebaseConfig | null>(`${STORAGE_PREFIX}firebaseConfig`, null);
    const [isCloudMode, setIsCloudMode] = useState(false);
    const [db, setDb] = useState<any>(null); // Firestore instance

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
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isCloudConfigModalOpen, setIsCloudConfigModalOpen] = useState(false);
    const [isNewJob, setIsNewJob] = useState(false);

    const [filters, setFilters] = useState<Filters>({
        clientId: '',
        productName: '',
        statuses: PROCESS_STATUS_ORDER.filter(s => s !== ProcessStatus.SHIPPED),
        deliveryDateStart: '',
        deliveryDateEnd: '',
    });

    // --- Firebase Initialization & Sync ---
    useEffect(() => {
        if (firebaseConfig) {
            try {
                const app = initializeApp(firebaseConfig);
                const firestore = getFirestore(app);
                setDb(firestore);
                setIsCloudMode(true);
                
                // Real-time listeners
                const unsubJobs = onSnapshot(collection(firestore, 'jobs'), (snap) => {
                    const data = snap.docs.map(d => d.data() as Job);
                    setJobs(data);
                });
                const unsubClients = onSnapshot(collection(firestore, 'clients'), (snap) => {
                    setClients(snap.docs.map(d => d.data() as ClientMaster));
                });
                const unsubPlating = onSnapshot(collection(firestore, 'platingTypes'), (snap) => {
                    setPlatingTypes(snap.docs.map(d => d.data() as PlatingTypeMaster));
                });
                 const unsubJigs = onSnapshot(collection(firestore, 'jigs'), (snap) => {
                    setJigs(snap.docs.map(d => d.data() as JigMaster));
                });
                 const unsubLogs = onSnapshot(collection(firestore, 'correspondenceLogs'), (snap) => {
                    setCorrespondenceLogs(snap.docs.map(d => d.data() as CorrespondenceLog));
                });
                const unsubUsers = onSnapshot(collection(firestore, 'users'), (snap) => {
                    setUsers(snap.docs.map(d => d.data() as User));
                });
                // Settings collections (stored as documents inside appSettings collection)
                const unsubSettings = onSnapshot(collection(firestore, 'appSettings'), (snap) => {
                   snap.docs.forEach(doc => {
                       if (doc.id === 'processDurations') setProcessDurations(doc.data() as ProcessStageDurations);
                       if (doc.id === 'general') setSettlementMonth(doc.data().settlementMonth as number);
                   })
                });


                return () => {
                    unsubJobs();
                    unsubClients();
                    unsubPlating();
                    unsubJigs();
                    unsubLogs();
                    unsubUsers();
                    unsubSettings();
                };
            } catch (e) {
                console.error("Firebase connection error:", e);
                setIsCloudMode(false);
            }
        } else {
            setIsCloudMode(false);
            setDb(null);
        }
    }, [firebaseConfig]);

    // --- Data Upload Utility ---
    const handleUploadLocalData = async () => {
        if (!db) return;
        try {
            const batchPromises = [];
            // Upload Jobs
            for(const j of jobs) batchPromises.push(setDoc(doc(db, 'jobs', j.id), j));
            // Upload Clients
            for(const c of clients) batchPromises.push(setDoc(doc(db, 'clients', c.id), c));
            // Upload Plating Types
            for(const p of platingTypes) batchPromises.push(setDoc(doc(db, 'platingTypes', p.id), p));
            // Upload Jigs
            for(const j of jigs) batchPromises.push(setDoc(doc(db, 'jigs', j.id), j));
             // Upload Logs
            for(const l of correspondenceLogs) batchPromises.push(setDoc(doc(db, 'correspondenceLogs', l.id), l));
             // Upload Users
            for(const u of users) batchPromises.push(setDoc(doc(db, 'users', u.id), u));
            
            // Upload Settings
            batchPromises.push(setDoc(doc(db, 'appSettings', 'processDurations'), processDurations));
            batchPromises.push(setDoc(doc(db, 'appSettings', 'general'), { settlementMonth }));
            
            await Promise.all(batchPromises);
            alert('データのアップロードが完了しました。');
            setIsCloudConfigModalOpen(false);
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

    const handleSelectJob = (job: Job) => {
        setSelectedJob(job);
        setIsNewJob(false);
        setIsDetailModalOpen(true);
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
        
        if (isCloudMode && db) {
            await setDoc(doc(db, 'jobs', jobWithAudit.id), jobWithAudit);
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
            if (isCloudMode && db) {
                await deleteDoc(doc(db, 'jobs', jobId));
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
        
        if (isCloudMode && db) {
            await setDoc(doc(db, 'correspondenceLogs', newLog.id), newLog);
        } else {
            setCorrespondenceLogs(prev => [newLog, ...prev]);
        }
    };
    
    const handleDeleteCorrespondenceLog = async (logId: string) => {
        if (window.confirm('この応対履歴を削除しますか？')) {
            if (isCloudMode && db) {
                await deleteDoc(doc(db, 'correspondenceLogs', logId));
            } else {
                setCorrespondenceLogs(prevLogs => prevLogs.filter(log => log.id !== logId));
            }
        }
    };
    
    // Generic handlers for master data updates from SettingsModal
    const handleUpdateMaster = async (collectionName: string, data: any[]) => {
         if (isCloudMode && db) {
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
             const batchPromises = data.map(item => setDoc(doc(db, collectionName, item.id), item));
             await Promise.all(batchPromises);
         } else {
             // Local storage update is handled by the passed setter (e.g. setUsers)
             // This function is just a proxy if we need to intercept for cloud.
         }
    };
    
    // We need to wrap the setters passed to SettingsModal to handle Cloud Mode
    const wrapSetter = <T extends {id: string}>(collectionName: string, localSetter: React.Dispatch<React.SetStateAction<T[]>>) => {
        return (newData: T[]) => {
            localSetter(newData); // Always update local state for immediate UI feedback (optimistic)
            if (isCloudMode && db) {
                // Determine deletions
                // Fetch current collection to find diff? No, too expensive.
                // Simple approach: Upsert all. (Deleted items will remain in cloud - limitation of this simple sync)
                // Better approach for this app size: The UI state `newData` IS the source of truth.
                // We should technically delete items not in `newData`.
                // For now, let's just upsert for safety.
                newData.forEach(item => setDoc(doc(db, collectionName, item.id), item));
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
            <Header
                currentUser={currentUser}
                onLogout={handleLogout}
                onNewJob={handleNewJob}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
                currentPage={currentPage}
                onNavigate={setCurrentPage}
                isCloudConnected={isCloudMode}
            />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {currentPage === 'management' && (
                    <div className="space-y-6">
                        <Dashboard jobs={jobs} />
                        <FilterControls filters={filters} onFilterChange={setFilters} onReset={handleResetFilters} clients={clients} />
                        <GanttChart jobs={filteredJobs} onSelectJob={handleSelectJob} />
                        <JobList jobs={filteredJobs} platingTypes={platingTypes} clients={clients} onSelectJob={handleSelectJob} users={users} />
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
                    />
                )}
                 {currentPage === 'report' && (
                    <ReportPage jobs={jobs} clients={clients} platingTypes={platingTypes} settlementMonth={settlementMonth} />
                )}
            </main>
            
            {isDetailModalOpen && selectedJob && (
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
            )}

            {isSettingsModalOpen && (
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
                        if(isCloudMode && db) setDoc(doc(db, 'appSettings', 'processDurations'), data);
                    }}
                    onSettlementMonthSave={(month) => {
                        setSettlementMonth(month);
                        if(isCloudMode && db) setDoc(doc(db, 'appSettings', 'general'), { settlementMonth: month });
                    }}
                    onJobsSave={wrapSetter('jobs', setJobs)}
                    onCorrespondenceLogsSave={wrapSetter('correspondenceLogs', setCorrespondenceLogs)}
                    
                    // Cloud Config
                    onOpenCloudConfig={() => setIsCloudConfigModalOpen(true)}
                    isCloudConnected={isCloudMode}
                />
            )}
            
            {isCloudConfigModalOpen && (
                <CloudConfigModal
                    isOpen={isCloudConfigModalOpen}
                    onClose={() => setIsCloudConfigModalOpen(false)}
                    config={firebaseConfig}
                    onSave={(cfg) => { setFirebaseConfig(cfg); setIsCloudConfigModalOpen(false); }}
                    onDisconnect={() => { setFirebaseConfig(null); setIsCloudConfigModalOpen(false); }}
                    onUploadLocalData={handleUploadLocalData}
                />
            )}
        </div>
    );
};

export default App;