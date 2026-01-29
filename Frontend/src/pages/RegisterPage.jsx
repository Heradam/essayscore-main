// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { UserPlus, User, Lock, Loader2, Edit3, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client.js';

/**
 * 注册 API 调用函数
 * @param {object} data - 包含 username,password 的注册数据
 * @returns {Promise<object>} - 包含后端响应的 Promise
 */
const callRegisterApi = async (data) => {
    const url = '/api/v1/register';
    const payload = {
        username: data.username,
        password: data.password,
        phone: data.phone,
        email: data.email,
    };
    if (data.inviteCode) {
        payload.inviteCode = data.inviteCode;
    }

    try {
        await apiRequest(url, {
            method: 'POST',
            data: payload,
            handleUnauthorized: false,
        });
        return { success: true, message: '注册成功！' };
    } catch (error) {
        // 处理网络错误、JSON 解析错误或上面抛出的错误
        console.error("API Error during registration:", error);
        throw new Error(error.message || '网络连接失败，请检查您的连接。');
    }
};

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        phone: '',
        email: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [inviteCode] = useState(() => sessionStorage.getItem('signupInviteCode') || '');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (formData.password !== formData.confirmPassword) {
            setError('两次输入的密码不一致。');
            return;
        }

        setIsLoading(true);

        try {
            const result = await callRegisterApi({ ...formData, inviteCode });
            if (result.success) {
                setSuccess('注册成功！您将在 3 秒后跳转到登录页面...');
                if (inviteCode) {
                    sessionStorage.removeItem('signupInviteCode');
                }
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }
        } catch (err) {
            setError(err.message || '注册失败，请重试。');
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
                    注册完成即可领取积分
                </span>
            </header>

            <div className="relative overflow-hidden">
                <div className="absolute -top-32 left-1/2 h-72 w-[780px] -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-100 via-teal-50 to-amber-50 blur-3xl opacity-80" />
                <div className="absolute left-0 top-20 h-52 w-52 rounded-full bg-emerald-100/70 blur-2xl" />
            </div>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-10 px-6 py-12">
                <div className="w-full lg:w-[420px] space-y-6 fade-in-up">
                    <div className="space-y-3">
                        <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">Onboarding</span>
                        <h2 className="text-4xl font-semibold text-slate-900">开启你的写作陪伴</h2>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            完成注册后即可获得新用户积分，邀请同学还能解锁更多权益。
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {['新手奖励', '邀请加分', '课堂协作', '历史追踪'].map((item, index) => (
                            <div key={item} className={`surface-float rounded-xl p-3 text-xs text-slate-600 fade-in-up delay-${index + 1}`}>
                                {item}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="w-full max-w-md surface-float rounded-3xl p-8 lift fade-in-up delay-2">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                            <UserPlus className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-semibold text-slate-900">新用户注册</h3>
                            <p className="text-xs text-slate-500">填写账号信息，快速进入系统</p>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-6 text-sm">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {inviteCode && (
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-xs">
                                已检测到邀请链接：{inviteCode}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-slate-500 flex items-center">
                                <User className="w-4 h-4 mr-2" /> 用户名
                            </label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                placeholder="输入用户名"
                                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-slate-500 flex items-center">
                                <Phone className="w-4 h-4 mr-2" /> 手机号
                            </label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                placeholder="输入手机号"
                                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-slate-500 flex items-center">
                                <Mail className="w-4 h-4 mr-2" /> 邮箱
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="输入邮箱"
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
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="设置密码"
                                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-slate-500 flex items-center">
                                <Lock className="w-4 h-4 mr-2" /> 确认密码
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                placeholder="再次输入密码"
                                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition"
                                disabled={isLoading}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:bg-emerald-700 transition duration-300 disabled:bg-emerald-300 flex items-center justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> 正在注册...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5 mr-2" /> 注册
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
                        <span>已有账号？</span>
                        <button
                            onClick={() => navigate('/login')}
                            className="font-semibold text-emerald-600 hover:text-emerald-700"
                            disabled={isLoading}
                        >
                            返回登录
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
