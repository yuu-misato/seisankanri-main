
import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: (username: string, password: string) => boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const success = onLogin(username, password);
        if (!success) {
            setError('ユーザー名またはパスワードが正しくありません。');
            setPassword('');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
                <div>
                    <h1 className="text-xl font-bold text-center text-slate-700">今井メッキ工業所</h1>
                    <h2 className="mt-2 text-2xl font-bold text-center text-slate-900">生産管理システム</h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="username" className="sr-only">ユーザー名</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 bg-white rounded-t-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 focus:z-10 sm:text-sm"
                                placeholder="ユーザー名"
                            />
                        </div>
                        <div>
                            <label htmlFor="password"className="sr-only">パスワード</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 bg-white rounded-b-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 focus:z-10 sm:text-sm"
                                placeholder="パスワード"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 text-sm text-center text-red-800 bg-red-100 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            className="group relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-cyan-600 border border-transparent rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                        >
                            ログイン
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
