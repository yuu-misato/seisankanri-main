import { ProcessStatus, Job, PlatingTypeMaster, JigMaster, ClientMaster, ProcessStageDurations, User, CorrespondenceLog } from './types';

// The order of statuses for display and processing logic
export const PROCESS_STATUS_ORDER: ProcessStatus[] = [
  ProcessStatus.RECEIVED,
  ProcessStatus.PRE_TREATMENT,
  ProcessStatus.PLATING,
  ProcessStatus.POST_TREATMENT,
  ProcessStatus.INSPECTION,
  ProcessStatus.SHIPPED,
];

// Color mapping for statuses
export const STATUS_COLORS: Record<ProcessStatus, string> = {
  [ProcessStatus.RECEIVED]: 'bg-slate-500',
  [ProcessStatus.PRE_TREATMENT]: 'bg-blue-500',
  [ProcessStatus.PLATING]: 'bg-yellow-500',
  [ProcessStatus.POST_TREATMENT]: 'bg-orange-500',
  [ProcessStatus.INSPECTION]: 'bg-purple-500',
  [ProcessStatus.SHIPPED]: 'bg-green-500',
};

// --- Mock Data ---

// FIX: Removed the explicit type annotation `User[]` to allow TypeScript to infer the type, including the `password` property.
// This resolves the object literal errors and allows the login logic in App.tsx to correctly access the password for authentication.
export const MOCK_USERS = [
    { id: 'user-1', username: 'tanaka', password: 'password123', name: '田中 太郎', role: 'user' as const },
    { id: 'user-2', username: 'suzuki', password: 'password123', name: '鈴木 一郎', role: 'user' as const },
    { id: 'user-3', username: 'yamada', password: 'password123', name: '山田 花子', role: 'user' as const },
    { id: 'user-4', username: 'test', password: 'test', name: 'テストユーザー', role: 'user' as const },
    { id: 'admin-1', username: 'admin', password: 'admin', name: 'システム管理者', role: 'admin' as const },
];


export const MOCK_CLIENTS: ClientMaster[] = [
  { id: 'client-1', name: '株式会社テクノ', contactPerson: '田中 太郎' },
  { id: 'client-2', name: '精密工業合同会社', contactPerson: '鈴木 一郎' },
  { id: 'client-3', name: '山田製作所', contactPerson: '山田 花子' },
];

export const MOCK_PLATING_TYPES: PlatingTypeMaster[] = [
  { id: 'plating-1', name: '亜鉛めっき', unitPrice: 100, costPerLot: 5000 },
  { id: 'plating-2', name: 'ニッケルクロムめっき', unitPrice: 350, costPerLot: 12000 },
  { id: 'plating-3', name: '無電解ニッケルめっき', unitPrice: 500, costPerLot: 18000 },
];

export const MOCK_JIGS: JigMaster[] = [
  { id: 'jig-1', name: '治具A-1', totalQuantity: 50 },
  { id: 'jig-2', name: '治具B-5', totalQuantity: 20 },
  { id: 'jig-3', name: '特殊治具C', totalQuantity: 5 },
];

const today = new Date();
const formatDate = (d: Date) => d.toISOString().split('T')[0];
const addDays = (d: Date, days: number) => {
    const newDate = new Date(d);
    newDate.setDate(d.getDate() + days);
    return newDate;
}

export const MOCK_JOBS: Job[] = [
    {
        id: 'job-1',
        productName: 'ギア部品 (ロットA)',
        clientId: 'client-1',
        platingTypeId: 'plating-1',
        jigId: 'jig-1',
        quantity: 500,
        unitPrice: 100,
        price: 50000,
        cost: 50000, // 500個 / 治具50 = 10ロット * 5000円
        startDate: formatDate(addDays(today, -5)),
        deliveryDate: formatDate(addDays(today, 5)),
        status: ProcessStatus.PLATING,
        memo: '特急対応',
        createdBy: 'user-1',
        createdAt: addDays(today, -5).toISOString(),
        updatedBy: 'user-1',
        updatedAt: addDays(today, -5).toISOString(),
    },
    {
        id: 'job-2',
        productName: 'ケース部品 (ロットC)',
        clientId: 'client-2',
        platingTypeId: 'plating-2',
        jigId: 'jig-2',
        quantity: 100,
        unitPrice: 350,
        price: 35000,
        cost: 60000, // 100個 / 治具20 = 5ロット * 12000円
        startDate: formatDate(today),
        deliveryDate: formatDate(addDays(today, 10)),
        status: ProcessStatus.PRE_TREATMENT,
        createdBy: 'user-2',
        createdAt: today.toISOString(),
        updatedBy: 'user-2',
        updatedAt: today.toISOString(),
    },
    {
        id: 'job-3',
        productName: '特殊シャフト',
        clientId: 'client-3',
        platingTypeId: 'plating-3',
        jigId: 'jig-3',
        quantity: 20,
        unitPrice: 500,
        price: 10000,
        cost: 72000, // 20個 / 治具5 = 4ロット * 18000円
        startDate: formatDate(addDays(today, 2)),
        deliveryDate: formatDate(addDays(today, 14)),
        status: ProcessStatus.RECEIVED,
        createdBy: 'user-3',
        createdAt: addDays(today, 2).toISOString(),
    },
    {
        id: 'job-4',
        productName: 'モーターハウジング',
        clientId: 'client-1',
        platingTypeId: 'plating-2',
        jigId: 'jig-2',
        quantity: 80,
        unitPrice: 350,
        price: 28000,
        cost: 48000, // 80個 / 治具20 = 4ロット * 12000円
        startDate: formatDate(addDays(today, -2)),
        deliveryDate: formatDate(addDays(today, 8)),
        status: ProcessStatus.INSPECTION,
        createdBy: 'user-1',
        createdAt: addDays(today, -2).toISOString(),
        updatedBy: 'user-2',
        updatedAt: today.toISOString(),
    },
    {
        id: 'job-5',
        productName: 'ブラケット (試作)',
        clientId: 'client-2',
        platingTypeId: 'plating-1',
        jigId: 'jig-1',
        quantity: 150,
        unitPrice: 100,
        price: 15000,
        cost: 15000, // 150個 / 治具50 = 3ロット * 5000円
        startDate: formatDate(addDays(today, -15)),
        deliveryDate: formatDate(addDays(today, -5)),
        status: ProcessStatus.SHIPPED,
        memo: '先日出荷完了',
        createdBy: 'user-2',
        createdAt: addDays(today, -15).toISOString(),
    },
];

// Default durations for each process stage in days
export const DEFAULT_PROCESS_DURATIONS: ProcessStageDurations = {
    [ProcessStatus.PRE_TREATMENT]: 1,
    [ProcessStatus.PLATING]: 3,
    [ProcessStatus.POST_TREATMENT]: 2,
    [ProcessStatus.INSPECTION]: 1,
};

export const MOCK_CORRESPONDENCE_LOGS: CorrespondenceLog[] = [
    {
        id: 'cl-1',
        clientId: 'client-1',
        jobId: 'job-1',
        correspondenceDate: addDays(today, -3).toISOString(),
        staffId: 'user-1',
        temperature: 5,
        memo: '納期を早めてほしいとの強い要望あり。工場長と相談し、対応可能と返答。非常に喜んでいただけた。'
    },
    {
        id: 'cl-2',
        clientId: 'client-1',
        jobId: 'job-1',
        correspondenceDate: addDays(today, -4).toISOString(),
        staffId: 'user-1',
        temperature: 3,
        memo: '進捗確認のお電話。特に問題ない旨を伝え、安心された様子。'
    },
    {
        id: 'cl-3',
        clientId: 'client-2',
        jobId: 'job-2',
        correspondenceDate: addDays(today, -1).toISOString(),
        staffId: 'user-2',
        temperature: 4,
        memo: '来週の追加ロットについて相談あり。治具の空き状況を確認し、来週水曜以降なら対応可能と回答。'
    },
];