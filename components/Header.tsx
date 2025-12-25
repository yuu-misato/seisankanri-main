import React from 'react';
import { CogIcon, PlusCircleIcon, ClipboardListIcon, ChartBarIcon, LogoutIcon, PhoneIcon, CloudIcon } from './icons';
import { User } from '../types';

type Page = 'management' | 'report' | 'correspondence';

interface HeaderProps {
    onNewJob: () => void;
    onOpenSettings: () => void;
    currentPage: Page;
    onNavigate: (page: Page) => void;
    currentUser: User;
    onLogout: () => void;
    isCloudConnected: boolean;
}

const Header: React.FC<HeaderProps> = ({ onNewJob, onOpenSettings, currentPage, onNavigate, currentUser, onLogout, isCloudConnected }) => {
    
    const navLinkClasses = "flex items-center gap-2 px-3 py-2 border-b-2 text-sm font-medium transition-colors";
    const activeLinkClasses = "border-cyan-500 text-cyan-600";
    const inactiveLinkClasses = "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300";

    return (
        <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-end py-2">
                    <div className="flex items-end">
                        {/* Navigation */}
                        <nav className="flex items-center gap-2">
                             <button onClick={() => onNavigate('management')} className={`${navLinkClasses} ${currentPage === 'management' ? activeLinkClasses : inactiveLinkClasses}`}>
                                <ClipboardListIcon />
                                <span>生産管理</span>
                            </button>
                             <button onClick={() => onNavigate('correspondence')} className={`${navLinkClasses} ${currentPage === 'correspondence' ? activeLinkClasses : inactiveLinkClasses}`}>
                                <PhoneIcon />
                                <span>応対履歴</span>
                            </button>
                             <button onClick={() => onNavigate('report')} className={`${navLinkClasses} ${currentPage === 'report' ? activeLinkClasses : inactiveLinkClasses}`}>
                                <ChartBarIcon />
                                <span>レポート</span>
                            </button>
                        </nav>
                    </div>
                    <div className="flex items-center gap-2 pb-1">
                        {isCloudConnected && (
                             <div className="text-cyan-600 px-2" title="クラウド同期中">
                                 <CloudIcon className="h-5 w-5" />
                             </div>
                        )}
                        <button onClick={onNewJob} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors">
                            <PlusCircleIcon className="h-5 w-5"/>
                            <span className="hidden sm:inline">新規案件</span>
                        </button>
                        <div className="w-px h-6 bg-slate-200 mx-2"></div>
                        <span className="text-sm text-slate-600 hidden sm:inline">ようこそ、{currentUser.name}さん</span>
                        <button onClick={onOpenSettings} className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors">
                            <CogIcon className="h-6 w-6"/>
                        </button>
                        <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors">
                            <LogoutIcon />
                            <span className="hidden sm:inline">ログアウト</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;