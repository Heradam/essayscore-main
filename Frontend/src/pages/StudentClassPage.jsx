import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import StudentHeader from './StudentHeader.jsx';
import { apiRequest } from '../api/client.js';

const StudentClassPage = ({ role, onLogout }) => {
    const [joinCode, setJoinCode] = useState('');
    const [classes, setClasses] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const loadMyClasses = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiRequest('/api/v1/classes/mine');
            setClasses(data);
        } catch (err) {
            setError(err.message || '班级加载失败。');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadMyClasses();
    }, []);

    const handleJoin = async () => {
        if (!joinCode.trim()) {
            setError('请输入班级邀请码。');
            return;
        }
        setIsLoading(true);
        setError(null);
        setMessage(null);
        try {
            const data = await apiRequest('/api/v1/classes/join', {
                method: 'POST',
                data: { code: joinCode.trim() },
            });
            setMessage(data.message || '请求已提交。');
            setJoinCode('');
            await loadMyClasses();
        } catch (err) {
            setError(err.message || '加入班级失败。');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLeave = async (classId) => {
        const confirmed = window.confirm('确认退出该班级吗？');
        if (!confirmed) {
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await apiRequest(`/api/v1/classes/leave/${classId}`, {
                method: 'POST',
            });
            await loadMyClasses();
        } catch (err) {
            setError(err.message || '退出班级失败。');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <StudentHeader role={role} onLogout={onLogout} />
            <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
                <section className="bg-white rounded-2xl shadow-xl p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">我的班级</h2>
                    {isLoading && classes.length === 0 ? (
                        <div className="flex items-center justify-center text-gray-500">
                            <Loader2 className="w-5 h-5 mr-2 animate-spin text-indigo-500" />
                            正在加载...
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {classes.length === 0 ? (
                                <p className="text-sm text-gray-500">暂无加入的班级。</p>
                            ) : (
                                classes.map((item) => (
                                    <div key={item.id} className="border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-gray-800">{item.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {[item.grade, item.subject].filter(Boolean).join(' / ') || '未设置'}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">老师：{item.teacherUsername}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleLeave(item.id)}
                                            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                                        >
                                            退出班级
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </section>

                <section className="bg-white rounded-2xl shadow-xl p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">加入班级</h2>
                    {error && (
                        <div className="mb-4 bg-red-100 text-red-700 px-3 py-2 rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}
                    {message && (
                        <div className="mb-4 bg-green-100 text-green-700 px-3 py-2 rounded-lg border border-green-200">
                            {message}
                        </div>
                    )}
                    <div className="flex flex-col md:flex-row gap-3">
                        <input
                            type="text"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            placeholder="输入班级邀请码"
                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                        />
                        <button
                            type="button"
                            onClick={handleJoin}
                            disabled={isLoading}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-indigo-400"
                        >
                            {isLoading ? (
                                <span className="flex items-center">
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    提交中...
                                </span>
                            ) : (
                                '申请加入'
                            )}
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default StudentClassPage;
