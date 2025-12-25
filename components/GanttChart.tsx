import React, { useState, useMemo } from 'react';
import { Job } from '../types';
import { STATUS_COLORS } from '../constants';

interface GanttChartProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
}

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

/**
 * Parses a 'YYYY-MM-DD' string into a Date object in the local timezone.
 * This avoids timezone conversion issues where new Date('2024-08-01') might be interpreted as UTC midnight,
 * which can be '2024-07-31' in some timezones.
 * @param dateString The date string to parse.
 * @returns A Date object representing midnight in the local timezone.
 */
const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  // Using new Date(year, monthIndex, day) creates a date in the local timezone.
  return new Date(year, month - 1, day);
};


export const GanttChart: React.FC<GanttChartProps> = ({ jobs, onSelectJob }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handleSetMonth = (offset: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };
  
  const handleThisMonth = () => {
    setCurrentDate(new Date());
  }

  const daysInMonth = getDaysInMonth(year, month);
  const dateHeaders = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month, daysInMonth, 23, 59, 59);

  const visibleJobs = useMemo(() => {
    return jobs.filter(job => {
      if (!job.startDate || !job.deliveryDate) return false;
      const jobStart = parseLocalDate(job.startDate);
      const jobEnd = parseLocalDate(job.deliveryDate);
      return jobStart <= monthEnd && jobEnd >= monthStart;
    });
  }, [jobs, monthStart, monthEnd]);

  const today = new Date();
  const showTodayMarker = today.getFullYear() === year && today.getMonth() === month;
  const todayPosition = showTodayMarker ? today.getDate() : -1;
  
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 overflow-hidden shadow-sm">
      <div className="flex items-center justify-center gap-4 mb-4">
        <button onClick={() => handleSetMonth(-1)} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200">&lt; 前月</button>
        <button onClick={handleThisMonth} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200">今月</button>
        <h3 className="text-xl font-semibold w-32 text-center">{year}年 {month + 1}月</h3>
        <button onClick={() => handleSetMonth(1)} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200">次月 &gt;</button>
      </div>
      <div className="overflow-x-auto">
        <div className="grid gap-0 relative" style={{ gridTemplateColumns: `150px repeat(${daysInMonth}, minmax(40px, 1fr))`, gridTemplateRows: `auto repeat(${visibleJobs.length}, 40px)` }}>
          {/* Header Row */}
          <div className="font-semibold text-sm border-r border-b border-slate-200 p-2 sticky left-0 bg-white z-10">商品名</div>
          {dateHeaders.map(day => {
              const d = new Date(year, month, day);
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
              return (
                <div key={day} className={`text-center text-xs border-b border-r border-slate-200 p-2 ${isWeekend ? 'bg-slate-100 text-slate-500' : ''} ${day === todayPosition ? 'bg-cyan-100' : ''}`}>
                    {day}
                </div>
              )
          })}
          
          {/* Job Rows & Bars */}
          {visibleJobs.map((job, index) => {
            const jobStart = parseLocalDate(job.startDate);
            const jobEnd = parseLocalDate(job.deliveryDate);
            
            const startDayInMonth = jobStart <= monthStart ? 1 : jobStart.getDate();
            const endDayInMonth = jobEnd >= monthEnd ? daysInMonth : jobEnd.getDate();
            
            const duration = endDayInMonth - startDayInMonth + 1;
            
            if (duration <= 0) return null;

            const gridColumnStart = startDayInMonth + 1; // +1 to account for job name column

            return (
              <React.Fragment key={job.id}>
                {/* Job Name Cell */}
                <div style={{gridRow: index + 2}} className="text-xs truncate border-r border-b border-slate-200 p-2 sticky left-0 bg-white z-10 flex items-center" title={job.productName}>{job.productName}</div>
                
                {/* Background Grid Cells */}
                {dateHeaders.map(day => {
                    const d = new Date(year, month, day);
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    return <div key={`${job.id}-${day}`} style={{gridRow: index + 2, gridColumn: day + 1}} className={`border-b border-r border-slate-200 ${isWeekend ? 'bg-slate-100/50' : ''}`}></div>
                })}

                {/* Job Bar */}
                <div
                  style={{ 
                    gridRow: index + 2,
                    gridColumn: `${gridColumnStart} / span ${duration}`,
                    zIndex: 5,
                  }}
                  className="p-1 h-full flex items-center"
                  onClick={() => onSelectJob(job)}
                >
                  <div
                    title={`${job.productName} (${job.startDate} ~ ${job.deliveryDate})`}
                    className={`w-full h-5/6 rounded ${STATUS_COLORS[job.status]} flex items-center px-2 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity group`}
                  >
                    <span className="text-white text-xs font-medium truncate group-hover:text-cyan-200">{job.productName}</span>
                  </div>
                </div>
              </React.Fragment>
            )
          })}
          
           {showTodayMarker && (
            <div 
              className="w-0.5 bg-cyan-400 z-20 pointer-events-none"
              style={{
                gridColumn: todayPosition + 1,
                gridRow: `1 / span ${visibleJobs.length + 1}`,
                justifySelf: 'center'
              }}
            ></div>
           )}
        </div>
      </div>
       {visibleJobs.length === 0 && <p className="text-center text-slate-500 mt-4">この月に該当する案件はありません。</p>}
    </div>
  );
};