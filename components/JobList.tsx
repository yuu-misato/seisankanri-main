import React, { useMemo } from 'react';
import { Job, PlatingTypeMaster, ClientMaster, User } from '../types';
import { JobCard } from './JobCard';

interface JobListProps {
  jobs: Job[];
  platingTypes: PlatingTypeMaster[];
  clients: ClientMaster[];
  onSelectJob: (job: Job) => void;
  users?: User[]; // Optional for backward compatibility, but recommended
}

export const JobList: React.FC<JobListProps> = ({ jobs, platingTypes, clients, onSelectJob, users = [] }) => {
  const platingTypeMap = useMemo(() => new Map(platingTypes.map(pt => [pt.id, pt.name])), [platingTypes]);
  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);
  const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);

  if (jobs.length === 0) {
    return <p className="text-center text-slate-500 py-8">条件に一致する案件はありません。</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {jobs.map(job => (
        <JobCard 
            key={job.id} 
            job={job} 
            platingTypeName={platingTypeMap.get(job.platingTypeId) || '未設定'}
            clientName={clientMap.get(job.clientId) || '未設定'}
            updatedByName={job.updatedBy ? userMap.get(job.updatedBy) : undefined}
            onSelect={onSelectJob} 
        />
      ))}
    </div>
  );
};