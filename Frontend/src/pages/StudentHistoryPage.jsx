import React, { useEffect, useState } from 'react';
import { BookOpen, Loader2, Star } from 'lucide-react';
import StudentHeader from './StudentHeader.jsx';
import { apiRequest } from '../api/client.js';
import Pagination from '../components/Pagination.jsx';

const getStarFillWidth = (rating, index) => `${Math.max(0, Math.min(1, (rating || 0) - index)) * 100}%`;

const StudentHistoryPage = ({ role, onLogout }) => {
    const [history, setHistory] = useState([]);
    const [currentEssay, setCurrentEssay] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const pageSize = 8;
    const totalPages = Math.max(1, Math.ceil(history.length / pageSize));
    const pagedHistory = history.slice((page - 1) * pageSize, page * pageSize);

    const loadHistory = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiRequest('/api/v1/history');
            setHistory(data);
        } catch (err) {
            setError(err.message || '加载历史记录失败。');
        } finally {
            setIsLoading(false);
        }
    };

    const loadEssay = async (essayId) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiRequest(`/api/v1/essay/${essayId}`);
            setCurrentEssay(data);
        } catch (err) {
            setError(err.message || '加载作文详情失败。');
            setCurrentEssay(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);
    useEffect(() => {
        setPage(1);
    }, [history]);

    return (
        <div className="min-h-screen bg-gray-100">
            <StudentHeader role={role} onLogout={onLogout} />
            <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
                <section className="bg-white rounded-2xl shadow-xl p-4 md:p-6 flex flex-col overflow-hidden min-h-[16rem]">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">历史记录</h2>
                            <p className="text-xs text-slate-400 mt-1">点击卡片查看详情</p>
                        </div>
                        <span className="text-xs text-slate-400">共 {history.length} 篇</span>
                    </div>
                    {isLoading && history.length === 0 ? (
                        <div className="flex items-center justify-center text-gray-500">
                            <Loader2 className="w-5 h-5 mr-2 animate-spin text-indigo-500" />
                            正在加载...
                        </div>
                    ) : (
                        <div className="space-y-4 flex-1 min-h-0 overflow-y-auto pr-1">
                            {history.length === 0 && (
                                <p className="text-sm text-gray-500">暂无历史记录。</p>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {pagedHistory.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => loadEssay(item.id)}
                                        className={`text-left px-4 py-4 rounded-2xl transition border ${
                                            currentEssay?.id === item.id
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                                                : 'hover:bg-slate-50 text-gray-700 border-slate-200'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="text-sm font-semibold leading-snug line-clamp-2 pr-2">
                                                {item.title || '无标题作文'}
                                            </p>
                                            <span className="shrink-0 text-[10px] px-2 py-1 rounded-full bg-white/80 border border-slate-200 text-slate-500">
                                                {new Date(item.timestamp).toLocaleDateString('zh-CN')}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-2">
                                            点击查看评分与润色结果
                                        </p>
                                    </button>
                                ))}
                            </div>
                            <Pagination
                                page={page}
                                totalPages={totalPages}
                                onPageChange={setPage}
                                className="pt-2"
                            />
                        </div>
                    )}
                </section>

                <section className="bg-white rounded-2xl shadow-xl p-4 md:p-6 min-h-[24rem]">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 shrink-0">作文详情</h2>
                    {error && (
                        <div className="mb-4 bg-red-100 text-red-700 px-3 py-2 rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}
                    {!currentEssay ? (
                        <p className="text-sm text-gray-500">请选择一篇作文查看详情。</p>
                    ) : (
                        <div className="space-y-5 text-sm text-gray-700">
                            <div className="flex items-center">
                                <BookOpen className="w-5 h-5 text-indigo-500 mr-2" />
                                <h3 className="text-xl font-bold text-gray-800">{currentEssay.title}</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                                    <p className="text-xs text-slate-400 mb-2">题目要求</p>
                                    <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">{currentEssay.topic}</p>
                                </div>
                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                                    <p className="text-xs text-emerald-700 mb-2">评分</p>
                                    <p className="text-3xl font-semibold text-emerald-700">{currentEssay.score}</p>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <p className="font-semibold text-gray-800">原文</p>
                                <p className="whitespace-pre-wrap mt-2 leading-relaxed">{currentEssay.originalContent}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <p className="font-semibold text-gray-800">反馈</p>
                                {currentEssay.feedback && currentEssay.feedback.length > 0 ? (
                                    <div className="mt-3 space-y-3">
                                        {currentEssay.feedback.map((item, index) => (
                                            <div key={`${item.type}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                                                <span className="font-semibold text-emerald-700">{item.type}</span>
                                                <p className="text-sm text-slate-600 mt-1">{item.detail}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-2 text-gray-500">暂无反馈。</p>
                                )}
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <p className="font-semibold text-gray-800">润色后文章</p>
                                <p className="whitespace-pre-wrap mt-2 leading-relaxed">{currentEssay.revisedContent}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <p className="font-semibold text-gray-800">评分效果反馈</p>
                                {currentEssay.userRating ? (
                                    <div className="mt-3 space-y-3">
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: 5 }, (_, index) => (
                                                <span key={index} className="relative block h-5 w-5">
                                                    <Star className="absolute inset-0 h-5 w-5 text-slate-300" />
                                                    <span
                                                        className="absolute inset-y-0 left-0 overflow-hidden"
                                                        style={{ width: getStarFillWidth(currentEssay.userRating, index) }}
                                                    >
                                                        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                                                    </span>
                                                </span>
                                            ))}
                                            <span className="ml-2 text-sm text-slate-600">
                                                {currentEssay.userRating} / 5
                                            </span>
                                        </div>
                                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                                            {currentEssay.userReview || '未填写文字评价。'}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="mt-2 text-gray-500">暂无评分效果反馈。</p>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default StudentHistoryPage;
