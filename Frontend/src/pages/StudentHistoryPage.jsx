import React, { useEffect, useState } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import StudentHeader from './StudentHeader.jsx';
import { apiRequest } from '../api/client.js';

const StudentHistoryPage = ({ role, onLogout }) => {
    const [history, setHistory] = useState([]);
    const [currentEssay, setCurrentEssay] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

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

    return (
        <div className="min-h-screen bg-gray-100">
            <StudentHeader role={role} onLogout={onLogout} />
            <main className="max-w-6xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <section className="bg-white rounded-2xl shadow-xl p-4 md:p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">历史记录</h2>
                    {isLoading && history.length === 0 ? (
                        <div className="flex items-center justify-center text-gray-500">
                            <Loader2 className="w-5 h-5 mr-2 animate-spin text-indigo-500" />
                            正在加载...
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {history.length === 0 && (
                                <p className="text-sm text-gray-500">暂无历史记录。</p>
                            )}
                            {history.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => loadEssay(item.id)}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition border ${
                                        currentEssay?.id === item.id
                                            ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                            : 'hover:bg-gray-50 text-gray-700 border-transparent'
                                    }`}
                                >
                                    <p className="text-sm font-medium truncate">{item.title || '无标题作文'}</p>
                                    <p className="text-xs text-gray-400">
                                        {new Date(item.timestamp).toLocaleDateString('zh-CN')}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                <section className="bg-white rounded-2xl shadow-xl p-4 md:p-6 lg:col-span-2">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">作文详情</h2>
                    {error && (
                        <div className="mb-4 bg-red-100 text-red-700 px-3 py-2 rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}
                    {!currentEssay ? (
                        <p className="text-sm text-gray-500">请选择一篇作文查看详情。</p>
                    ) : (
                        <div className="space-y-4 text-sm text-gray-700">
                            <div className="flex items-center">
                                <BookOpen className="w-5 h-5 text-indigo-500 mr-2" />
                                <h3 className="text-xl font-bold text-gray-800">{currentEssay.title}</h3>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">题目要求</p>
                                <p className="whitespace-pre-wrap mt-1">{currentEssay.topic}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">原文</p>
                                <p className="whitespace-pre-wrap mt-1">{currentEssay.originalContent}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">评分</p>
                                <p className="mt-1 text-indigo-600">{currentEssay.score}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">反馈</p>
                                {currentEssay.feedback && currentEssay.feedback.length > 0 ? (
                                    <ul className="space-y-2 mt-1">
                                        {currentEssay.feedback.map((item, index) => (
                                            <li key={`${item.type}-${index}`}>
                                                <span className="font-medium text-indigo-600">{item.type}：</span>
                                                {item.detail}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="mt-1 text-gray-500">暂无反馈。</p>
                                )}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">润色后文章</p>
                                <p className="whitespace-pre-wrap mt-1">{currentEssay.revisedContent}</p>
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default StudentHistoryPage;
