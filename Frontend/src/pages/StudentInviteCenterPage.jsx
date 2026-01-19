import React, { useEffect, useState } from 'react';
import { Copy, Loader2 } from 'lucide-react';
import StudentHeader from './StudentHeader.jsx';
import { apiRequest } from '../api/client.js';

const StudentInviteCenterPage = ({ role, onLogout }) => {
    const [inviteInfo, setInviteInfo] = useState({ code: '', link: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const loadInvite = async () => {
        setIsLoading(true);
        setError(null);
        setMessage(null);
        try {
            const data = await apiRequest('/api/v1/invite/code');
            setInviteInfo({ code: data.code || '', link: data.inviteLink || '' });
        } catch (err) {
            setError(err.message || '邀请码生成失败。');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateInvite = async () => {
        setIsLoading(true);
        setError(null);
        setMessage(null);
        try {
            const created = await apiRequest('/api/v1/invite/code', { method: 'POST' });
            setInviteInfo({ code: created.code || '', link: created.inviteLink || '' });
            setMessage('邀请码已生成。');
        } catch (err) {
            setError(err.message || '邀请码生成失败。');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetInvite = async () => {
        const confirmed = window.confirm('确认重置邀请码吗？旧链接将失效。');
        if (!confirmed) {
            return;
        }
        setIsLoading(true);
        setError(null);
        setMessage(null);
        try {
            const created = await apiRequest('/api/v1/invite/code/reset', { method: 'POST' });
            setInviteInfo({ code: created.code || '', link: created.inviteLink || '' });
            setMessage('邀请码已重置。');
        } catch (err) {
            setError(err.message || '邀请码重置失败。');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadInvite();
    }, []);

    const handleCopyInvite = async (text) => {
        if (!text) {
            return;
        }
        try {
            await navigator.clipboard.writeText(text);
            setMessage('已复制到剪贴板。');
        } catch {
            setError('复制失败，请手动复制。');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <StudentHeader role={role} onLogout={onLogout} />
            <main className="max-w-3xl mx-auto p-4 md:p-8">
                <section className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
                    <h2 className="text-lg font-bold text-gray-800">邀请好友</h2>
                    {error && (
                        <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}
                    {message && (
                        <div className="bg-green-100 text-green-700 px-3 py-2 rounded-lg border border-green-200">
                            {message}
                        </div>
                    )}
                    <div className="flex flex-wrap gap-3">
                        {!inviteInfo.code ? (
                            <button
                                type="button"
                                onClick={handleCreateInvite}
                                disabled={isLoading}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-indigo-400"
                            >
                                {isLoading ? (
                                    <span className="flex items-center">
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        生成中...
                                    </span>
                                ) : (
                                    '生成邀请码'
                                )}
                            </button>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={handleResetInvite}
                                    disabled={isLoading}
                                    className="px-6 py-3 bg-white border border-red-200 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition disabled:opacity-60"
                                >
                                    重置邀请码
                                </button>
                            </>
                        )}
                    </div>
                    {inviteInfo.link && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-sm text-indigo-700 break-all">
                            {inviteInfo.link}
                        </div>
                    )}
                    {inviteInfo.link && (
                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => handleCopyInvite(inviteInfo.link)}
                                className="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-sm"
                            >
                                <Copy className="w-4 h-4 mr-1" />
                                复制链接
                            </button>
                            <button
                                type="button"
                                onClick={() => handleCopyInvite(inviteInfo.code)}
                                className="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-sm"
                            >
                                <Copy className="w-4 h-4 mr-1" />
                                复制邀请码
                            </button>
                        </div>
                    )}
                    {error && (
                        <button
                            type="button"
                            onClick={loadInvite}
                            disabled={isLoading}
                            className="inline-flex items-center text-gray-500 hover:text-gray-700 text-sm"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                    重新加载中...
                                </>
                            ) : (
                                '重新加载'
                            )}
                        </button>
                    )}
                </section>
            </main>
        </div>
    );
};

export default StudentInviteCenterPage;
