import React, { useEffect, useState } from 'react';
import { Loader2, RefreshCcw, Search } from 'lucide-react';
import { apiRequest } from '../api/client.js';
import AdminHeader from './AdminHeader.jsx';
import Pagination from '../components/Pagination.jsx';

const AdminPointsPage = ({ onLogout }) => {
    const [query, setQuery] = useState('');
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const pageSize = 9;
    const totalPages = Math.max(1, Math.ceil(accounts.length / pageSize));
    const pagedAccounts = accounts.slice((page - 1) * pageSize, page * pageSize);

    const loadAccounts = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (query.trim()) {
                params.append('query', query.trim());
            }
            const url = `/api/v1/admin/points/accounts${params.toString() ? `?${params}` : ''}`;
            const data = await apiRequest(url);
            setAccounts(data);
        } catch (err) {
            setError(err.message || '积分账户加载失败。');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAccounts();
    }, []);
    useEffect(() => {
        setPage(1);
    }, [accounts, query]);

    const handleAdjustPoints = async (username) => {
        const deltaText = window.prompt('输入积分变动（可正可负）');
        if (deltaText === null) {
            return;
        }
        const delta = Number(deltaText);
        if (!Number.isInteger(delta)) {
            window.alert('积分变动必须为整数。');
            return;
        }
        const note = window.prompt('填写调整备注（必填）') || '';
        if (!note) {
            window.alert('备注不能为空。');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await apiRequest('/api/v1/admin/points/adjust', {
                method: 'POST',
                data: { username, delta, note },
            });
            window.alert('积分调整成功。');
            await loadAccounts();
        } catch (err) {
            setError(err.message || '积分调整失败。');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen admin-shell pb-10">
            <AdminHeader onLogout={onLogout} />
            <main className="max-w-5xl mx-auto p-4 md:p-10 space-y-6">
                <section className="admin-panel rounded-3xl p-5 md:p-7 fade-in-up">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">Points</p>
                            <h2 className="text-xl md:text-2xl font-semibold text-slate-900">积分账户</h2>
                            <p className="text-sm text-slate-500 mt-1">当前 {accounts.length} 位用户有积分账户</p>
                        </div>
                        <div className="flex flex-1 flex-col md:flex-row gap-3 md:items-center md:justify-end">
                            <div className="flex items-center w-full md:w-80 bg-white/80 border border-slate-200/70 rounded-2xl px-3">
                                <Search className="w-4 h-4 text-gray-400 mr-2" />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="搜索用户名"
                                    className="flex-1 bg-transparent py-2 focus:outline-none text-sm"
                                />
                            </div>
                            <button
                                onClick={loadAccounts}
                                className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-2xl hover:bg-emerald-700 transition text-sm shadow-md"
                            >
                                <RefreshCcw className="w-4 h-4" />
                                刷新
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 bg-red-50 text-red-700 px-3 py-2 rounded-xl border border-red-200">
                            {error}
                        </div>
                    )}

                    {isLoading && accounts.length === 0 ? (
                        <div className="flex items-center justify-center py-10 text-gray-500">
                            <Loader2 className="w-5 h-5 mr-2 animate-spin text-indigo-500" />
                            正在加载...
                        </div>
                    ) : (
                        <div className="mt-4">
                            {accounts.length === 0 && !isLoading ? (
                                <p className="text-sm text-gray-500 py-6">暂无用户。</p>
                            ) : (
                                <>
                                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                        {pagedAccounts.map((account) => (
                                            <div key={account.username} className="admin-panel rounded-2xl p-4 space-y-3">
                                                <div>
                                                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">Account</p>
                                                    <p className="text-lg font-semibold text-slate-900">{account.username}</p>
                                                </div>
                                                <div className="flex items-center justify-between text-sm text-slate-600">
                                                    <span>当前积分</span>
                                                    <span className="text-emerald-700 font-semibold text-lg">{account.balance}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleAdjustPoints(account.username)}
                                                    className="inline-flex items-center justify-center px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-sm"
                                                >
                                                    调整积分
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <Pagination
                                        page={page}
                                        totalPages={totalPages}
                                        onPageChange={setPage}
                                        className="mt-6"
                                    />
                                </>
                            )}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default AdminPointsPage;
