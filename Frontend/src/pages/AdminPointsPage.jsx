import React, { useEffect, useState } from 'react';
import { Loader2, RefreshCcw, Search } from 'lucide-react';
import { apiRequest } from '../api/client.js';
import AdminHeader from './AdminHeader.jsx';

const AdminPointsPage = ({ onLogout }) => {
    const [query, setQuery] = useState('');
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

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
        <div className="min-h-screen bg-gray-100">
            <AdminHeader onLogout={onLogout} />
            <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
                <section className="bg-white rounded-2xl shadow-xl p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex flex-1 gap-3">
                            <div className="flex items-center w-full bg-gray-50 border border-gray-200 rounded-lg px-3">
                                <Search className="w-4 h-4 text-gray-400 mr-2" />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="搜索用户名"
                                    className="flex-1 bg-transparent py-2 focus:outline-none text-sm"
                                />
                            </div>
                        </div>
                        <button
                            onClick={loadAccounts}
                            className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm"
                        >
                            <RefreshCcw className="w-4 h-4 mr-2" />
                            刷新
                        </button>
                    </div>

                    {error && (
                        <div className="mt-4 bg-red-100 text-red-700 px-3 py-2 rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}

                    {isLoading && accounts.length === 0 ? (
                        <div className="flex items-center justify-center py-10 text-gray-500">
                            <Loader2 className="w-5 h-5 mr-2 animate-spin text-indigo-500" />
                            正在加载...
                        </div>
                    ) : (
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500 border-b">
                                        <th className="py-2 pr-4">用户名</th>
                                        <th className="py-2 pr-4">当前积分</th>
                                        <th className="py-2 pr-4">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accounts.map((account) => (
                                        <tr key={account.username} className="border-b last:border-0">
                                            <td className="py-3 pr-4 font-medium text-gray-800">{account.username}</td>
                                            <td className="py-3 pr-4 text-indigo-600 font-semibold">{account.balance}</td>
                                            <td className="py-3 pr-4">
                                                <button
                                                    onClick={() => handleAdjustPoints(account.username)}
                                                    className="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-sm"
                                                >
                                                    调整
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {accounts.length === 0 && !isLoading && (
                                <p className="text-sm text-gray-500 py-6">暂无用户。</p>
                            )}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default AdminPointsPage;
