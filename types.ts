export enum ProcessStatus {
  RECEIVED = '受付',
  PRE_TREATMENT = '前処理',
  PLATING = 'めっき',
  POST_TREATMENT = '後処理',
  INSPECTION = '検査',
  SHIPPED = '出荷済',
}

export interface Job {
  id: string;
  productName: string;
  clientId: string;
  platingTypeId: string;
  jigId: string;
  quantity: number;
  unitPrice: number; // 案件ごとの単価
  price: number;
  cost: number;
  startDate: string; // YYYY-MM-DD
  deliveryDate: string; // YYYY-MM-DD
  status: ProcessStatus;
  memo?: string;
  
  // Audit Trail
  createdBy?: string; // User ID
  createdAt?: string; // ISO String
  updatedBy?: string; // User ID
  updatedAt?: string; // ISO String
}

export interface PlatingTypeMaster {
  id: string;
  name: string;
  unitPrice: number; // 基準単価
  costPerLot: number; // ロット毎の原価
}

export interface JigMaster {
  id:string;
  name: string;
  totalQuantity: number; // 1ロットあたりの最大数量
}

export interface ClientMaster {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

export interface Filters {
  clientId: string;
  productName: string;
  statuses: ProcessStatus[];
  deliveryDateStart: string;
  deliveryDateEnd: string;
}

// Key will be ProcessStatus, value will be duration in days
export type ProcessStageDurations = Record<Exclude<ProcessStatus, ProcessStatus.SHIPPED | ProcessStatus.RECEIVED>, number>;

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  password?: string; // For creation/editing, not for general state
}

export interface CorrespondenceLog {
  id: string;
  clientId: string;
  jobId?: string;
  correspondenceDate: string; // ISO 8601 format
  staffId: string;
  temperature: number; // 1 to 5
  memo: string;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
}