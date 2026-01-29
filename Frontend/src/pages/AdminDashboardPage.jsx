import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { apiRequest } from '../api/client.js';
import AdminHeader from './AdminHeader.jsx';

const AdminDashboardPage = ({ onLogout }) => {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadStats = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiRequest('/api/v1/admin/dashboard');
            setStats(data);
        } catch (err) {
            setError(err.message || '仪表盘数据加载失败。');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    const users = stats?.users || {};
    const activity = stats?.activity || {};
    const points = stats?.points || {};

    return (
        <div className="min-h-screen admin-shell pb-10">
            <AdminHeader onLogout={onLogout} />
            <main className="max-w-6xl mx-auto p-4 md:p-10 space-y-6">
                {error && (
                    <div className="bg-red-50 text-red-700 px-3 py-2 rounded-xl border border-red-200">
                        {error}
                    </div>
                )}

                {isLoading && !stats ? (
                    <div className="flex items-center justify-center py-10 text-gray-500">
                        <Loader2 className="w-5 h-5 mr-2 animate-spin text-indigo-500" />
                        正在加载...
                    </div>
                ) : (
                    <>
                        <section className="admin-panel rounded-3xl p-6 md:p-7 fade-in-up">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">Overview</p>
                                    <h2 className="text-xl font-semibold text-slate-900">用户概况</h2>
                                </div>
                                <span className="text-xs text-slate-500">实时统计</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
                                <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100 lift">
                                    <p className="text-gray-500">总用户</p>
                                    <p className="text-2xl font-bold text-emerald-700">{users.total ?? 0}</p>
                                </div>
                                <div className="rounded-2xl bg-white/80 p-4 border border-slate-100 lift">
                                    <p className="text-gray-500">学生数</p>
                                    <p className="text-2xl font-bold text-slate-700">{users.students ?? 0}</p>
                                </div>
                                <div className="rounded-2xl bg-white/80 p-4 border border-slate-100 lift">
                                    <p className="text-gray-500">教师数</p>
                                    <p className="text-2xl font-bold text-slate-700">{users.teachers ?? 0}</p>
                                </div>
                                <div className="rounded-2xl bg-amber-50 p-4 border border-amber-100 lift">
                                    <p className="text-gray-500">禁用账号</p>
                                    <p className="text-2xl font-bold text-amber-700">{users.disabled ?? 0}</p>
                                </div>
                                <div className="rounded-2xl bg-white/80 p-4 border border-slate-100 lift">
                                    <p className="text-gray-500">近7天新增</p>
                                    <p className="text-2xl font-bold text-slate-700">{users.new7d ?? 0}</p>
                                </div>
                            </div>
                        </section>

                        <section className="admin-panel rounded-3xl p-6 md:p-7 fade-in-up delay-1">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">Activity</p>
                                    <h2 className="text-xl font-semibold text-slate-900">近7天活跃</h2>
                                </div>
                                <span className="text-xs text-slate-500">动态更新</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100 lift">
                                    <p className="text-gray-500">活跃学生数（有提交）</p>
                                    <p className="text-2xl font-bold text-emerald-700">{activity.activeSubmitters7d ?? 0}</p>
                                </div>
                                <div className="rounded-2xl bg-white/80 p-4 border border-slate-100 lift">
                                    <p className="text-gray-500">提交作文次数</p>
                                    <p className="text-2xl font-bold text-slate-700">{activity.submissions7d ?? 0}</p>
                                </div>
                            </div>
                        </section>

                        <section className="admin-panel rounded-3xl p-6 md:p-7 fade-in-up delay-2">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">Points</p>
                                    <h2 className="text-xl font-semibold text-slate-900">积分概况</h2>
                                </div>
                                <span className="text-xs text-slate-500">运营侧数据</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100 lift">
                                    <p className="text-gray-500">累计发放</p>
                                    <p className="text-2xl font-bold text-emerald-700">{points.totalEarned ?? 0}</p>
                                </div>
                                <div className="rounded-2xl bg-rose-50 p-4 border border-rose-100 lift">
                                    <p className="text-gray-500">累计扣减</p>
                                    <p className="text-2xl font-bold text-rose-700">{points.totalSpent ?? 0}</p>
                                </div>
                                <div className="rounded-2xl bg-white/80 p-4 border border-slate-100 lift">
                                    <p className="text-gray-500">近7天调整次数</p>
                                    <p className="text-2xl font-bold text-slate-700">{points.adjustments7d ?? 0}</p>
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
};

export default AdminDashboardPage;
