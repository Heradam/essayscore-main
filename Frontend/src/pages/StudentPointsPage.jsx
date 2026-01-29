import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import StudentHeader from './StudentHeader.jsx';
import { apiRequest } from '../api/client.js';
import Pagination from '../components/Pagination.jsx';

const StudentPointsPage = ({ role, onLogout }) => {
    const [points, setPoints] = useState({ balance: 0, lifetimeEarned: 0, lifetimeSpent: 0 });
    const [ledger, setLedger] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const pageSize = 8;
    const totalPages = Math.max(1, Math.ceil(ledger.length / pageSize));
    const pagedLedger = ledger.slice((page - 1) * pageSize, page * pageSize);
    const reasonLabels = {
        'signup.bonus': '注册奖励',
        'invite.reward': '邀请奖励',
        'essay.score': '作文批改扣分',
        'admin.adjust': '管理员调整',
    };

    const getReasonLabel = (reasonCode) => reasonLabels[reasonCode] || reasonCode;

    const loadPoints = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const balanceData = await apiRequest('/api/v1/points/balance');
            const ledgerData = await apiRequest('/api/v1/points/ledger');
            setPoints(balanceData);
            setLedger(ledgerData.items || []);
        } catch (err) {
            setError(err.message || '积分加载失败。');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadPoints();
    }, []);
    useEffect(() => {
        setPage(1);
    }, [ledger]);

    return (
        <div className="min-h-screen bg-gray-100">
            <StudentHeader role={role} onLogout={onLogout} />
            <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
                <section className="bg-white rounded-2xl shadow-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">当前积分</p>
                            <p className="text-3xl font-bold text-indigo-600">{points.balance}</p>
                        </div>
                        <button
                            type="button"
                            onClick={loadPoints}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition disabled:opacity-60"
                        >
                            {isLoading ? '刷新中...' : '刷新'}
                        </button>
                    </div>
                    <div className="mt-3 text-xs text-gray-500">
                        累计获得 {points.lifetimeEarned} · 累计消耗 {points.lifetimeSpent}
                    </div>
                </section>

                <section className="bg-white rounded-2xl shadow-xl p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">积分明细</h2>
                    {error && (
                        <div className="mb-4 bg-red-100 text-red-700 px-3 py-2 rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}
                    {isLoading && ledger.length === 0 ? (
                        <div className="flex items-center justify-center text-gray-500">
                            <Loader2 className="w-5 h-5 mr-2 animate-spin text-indigo-500" />
                            正在加载...
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {ledger.length === 0 ? (
                                <p className="text-sm text-gray-500">暂无明细。</p>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {pagedLedger.map((item, index) => (
                                            <div key={`${item.createdAt}-${index}`} className="flex items-center justify-between text-sm text-gray-600 border border-gray-100 rounded-2xl px-4 py-3 bg-white shadow-sm">
                                                <div>
                                                    <div className="font-medium">{getReasonLabel(item.reasonCode)}</div>
                                                    <div className="text-xs text-gray-400">{item.createdAt}</div>
                                                </div>
                                                <div className={`font-semibold ${item.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {item.delta >= 0 ? `+${item.delta}` : item.delta}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Pagination
                                        page={page}
                                        totalPages={totalPages}
                                        onPageChange={setPage}
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

export default StudentPointsPage;
