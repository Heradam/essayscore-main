// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { LogIn, User, Lock, Loader2, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client.js';

/**
 * 真实的登录 API 调用函数
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<object>} - 包含认证令牌 (token) 和用户数据的 Promise
 */
const callLoginApi = async (username, password) => {
    // 假设你的 Flask 后端运行在同一域名下的 /api/v1/login
    const url = '/api/v1/login';

    // 准备发送到后端的 payload
    const payload = {
        username: username,
        password: password
    };

    try {
        const result = await apiRequest(url, {
            method: 'POST',
            data: payload,
            handleUnauthorized: false,
        });

        if (result.access_token && result.user) {
            let role = null;
            try {
                const payloadPart = result.access_token.split('.')[1];
                const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
                const json = decodeURIComponent(atob(base64).split('').map((c) => {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                role = JSON.parse(json)?.role || null;
            } catch (error) {
                role = null;
            }
            return {
                success: true,
                token: result.access_token,
                user: result.user,
                role,
                mustChangePassword: !!result.user.must_change_password
            };
        }
        throw new Error('登录成功但服务器返回数据格式错误。');
    } catch (error) {
        // 捕获网络错误、JSON 解析错误或上面抛出的错误
        console.error("API Error during login:", error);

        // 确保返回一个易于理解的错误信息
        throw new Error(error.message || '网络连接失败，请检查您的连接。');
    }
};

const LoginPage = ({ onLogin }) => {
    const [username, setUsername] = useState(() => localStorage.getItem('rememberUsername') || '');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(() => {
        const message = sessionStorage.getItem('authError');
        if (message) {
            sessionStorage.removeItem('authError');
            return message;
        }
        return null;
    });
    const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('rememberMe') === 'true');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const result = await callLoginApi(username, password);
            if (result.success) {
                // 存储 Token 以便后续 API 请求使用
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('authUser', result.user.username);
                if (result.role) {
                    localStorage.setItem('authRole', result.role);
                } else {
                    localStorage.removeItem('authRole');
                }
                localStorage.setItem('authMustChange', result.mustChangePassword ? 'true' : 'false');
                if (rememberMe) {
                    localStorage.setItem('rememberUsername', username);
                } else {
                    localStorage.removeItem('rememberUsername');
                }
                localStorage.setItem('rememberMe', rememberMe ? 'true' : 'false');
                // 登录成功，更新父组件/全局状态
                onLogin(result.user.username, result.role, result.mustChangePassword);
                if (result.mustChangePassword) {
                    navigate('/change-password');
                    return;
                }
                const inviteCode = sessionStorage.getItem('inviteCode');
                if (inviteCode && result.role === 'user') {
                    sessionStorage.removeItem('inviteCode');
                    navigate(`/invite/${inviteCode}`);
                    return;
                }
                sessionStorage.removeItem('inviteCode');
                if (result.role === 'admin') {
                    navigate('/admin/dashboard');
                } else if (result.role === 'teacher') {
                    navigate('/teacher/classes');
                } else {
                    navigate('/'); // 导航到主页
                }
            }
        } catch (err) {
            setError(err.message || '登录失败，请重试。');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="sticky top-0 bg-white/80 backdrop-blur p-4 flex items-center justify-between z-30 w-full border-b border-slate-200">
                <div className="flex items-center">
                    <h1 className="text-xl font-bold text-gray-800 flex items-center">
                        <Edit3 className="w-5 h-5 mr-2 text-indigo-600" />
                        AI 作文助手
                    </h1>
                </div>
                <span className="hidden md:inline-flex items-center gap-2 text-sm glow-pill px-3 py-1 rounded-full">
                    轻量 · 专注 · 易用
                </span>
            </header>

            <div className="relative overflow-hidden">
                <div className="absolute -top-32 left-1/2 h-72 w-[780px] -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-100 via-teal-50 to-amber-50 blur-3xl opacity-80" />
                <div className="absolute right-0 top-24 h-48 w-48 rounded-full bg-amber-100/60 blur-2xl" />
            </div>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-10 px-6 py-12">
                <div className="w-full lg:w-[420px] space-y-6 fade-in-up">
                    <div className="space-y-3">
                        <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">Welcome</span>
                        <h2 className="text-4xl font-semibold text-slate-900">写作，从此更轻松</h2>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            登录后即可体验 AI 评分、润色与结构化反馈，让每一次写作更有方向。
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {['实时评分', '结构反馈', '班级协作', '积分体系'].map((item, index) => (
                            <div key={item} className={`surface-float rounded-xl p-3 text-xs text-slate-600 fade-in-up delay-${index + 1}`}>
                                {item}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="w-full max-w-md surface-float rounded-3xl p-8 lift fade-in-up delay-2">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                            <LogIn className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-semibold text-slate-900">用户登录</h3>
                            <p className="text-xs text-slate-500">使用账号密码登录 AI 作文助手</p>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
                            {error}
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
                                placeholder="输入用户名"
                                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-slate-500 flex items-center">
                                <Lock className="w-4 h-4 mr-2" /> 密码
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="输入密码"
                                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    disabled={isLoading}
                                />
                                记住密码（仅记住账号）
                            </label>
                            <button
                                type="button"
                                onClick={() => navigate('/forgot-password')}
                                className="text-emerald-600 hover:text-emerald-700 font-semibold"
                                disabled={isLoading}
                            >
                                忘记密码？
                            </button>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:bg-emerald-700 transition duration-300 disabled:bg-emerald-300 flex items-center justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> 正在登录...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5 mr-2" /> 登录
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
                        <span>还没有账号？</span>
                        <button
                            onClick={() => navigate('/register')}
                            className="font-semibold text-emerald-600 hover:text-emerald-700"
                            disabled={isLoading}
                        >
                            立即注册
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
