import React, { useState } from 'react';
import { ArrowLeft, KeyRound, Loader2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordPage = () => {
    const [username, setUsername] = useState('');
    const [status, setStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus(null);
        if (!username.trim()) {
            setStatus({ type: 'error', message: '请输入用户名。' });
            return;
        }
        setIsLoading(true);
        setTimeout(() => {
            setStatus({ type: 'success', message: '请联系管理员重置密码。' });
            setIsLoading(false);
        }, 600);
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="sticky top-0 bg-white/80 backdrop-blur p-4 flex items-center justify-between z-30 w-full border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        返回登录
                    </button>
                </div>
                <span className="hidden md:inline-flex items-center gap-2 text-xs glow-pill px-3 py-1 rounded-full">
                    密码找回
                </span>
            </header>

            <div className="relative overflow-hidden">
                <div className="absolute -top-24 left-1/2 h-64 w-[720px] -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-100 via-teal-50 to-amber-50 blur-3xl opacity-80" />
                <div className="absolute right-0 top-24 h-40 w-40 rounded-full bg-amber-100/60 blur-2xl" />
            </div>

            <div className="flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md surface-float rounded-3xl p-8 lift fade-in-up">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                            <KeyRound className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-semibold text-slate-900">找回密码</h3>
                            <p className="text-xs text-slate-500">提交信息后，系统将发送重置提示</p>
                        </div>
                    </div>

                    {status && (
                        <div
                            className={`mb-5 px-4 py-3 rounded-xl text-sm border ${
                                status.type === 'success'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-rose-50 border-rose-200 text-rose-600'
                            }`}
                        >
                            {status.message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-slate-500 flex items-center">
                                <User className="w-4 h-4 mr-2" /> 用户名
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                placeholder="输入账号用户名"
                                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                            该系统暂不支持自助找回密码，请联系管理员重置。
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:bg-emerald-700 transition duration-300 disabled:bg-emerald-300 flex items-center justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> 提交中...
                                </>
                            ) : (
                                '联系管理员'
                            )}
                        </button>
                    </form>

                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
