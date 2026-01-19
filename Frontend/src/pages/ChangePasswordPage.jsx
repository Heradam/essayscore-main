import React, { useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client.js';

const ChangePasswordPage = () => {
    const navigate = useNavigate();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (newPassword !== confirmPassword) {
            setError('两次输入的密码不一致。');
            return;
        }

        setIsLoading(true);
        try {
            await apiRequest('/api/v1/change-password', {
                method: 'POST',
                data: { oldPassword, newPassword },
            });
            localStorage.setItem('authMustChange', 'false');
            setSuccess('密码修改成功。');
            const role = localStorage.getItem('authRole');
            setTimeout(() => {
                if (role === 'teacher' || role === 'admin') {
                    navigate(role === 'admin' ? '/admin/dashboard' : '/teacher/classes');
                } else {
                    navigate('/');
                }
            }, 800);
        } catch (err) {
            setError(err.message || '密码修改失败。');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                <div className="flex items-center mb-6">
                    <KeyRound className="w-6 h-6 text-indigo-500 mr-2" />
                    <h1 className="text-2xl font-bold text-gray-800">修改密码</h1>
                </div>
                <p className="text-sm text-gray-500 mb-6">为保障账号安全，请设置新密码。</p>

                {error && (
                    <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg mb-4 border border-red-200">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-green-100 text-green-700 px-3 py-2 rounded-lg mb-4 border border-green-200">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">旧密码</label>
                        <input
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-400"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center">
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                提交中...
                            </span>
                        ) : (
                            '保存新密码'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordPage;
