import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../api/client.js';

const InvitePage = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('正在处理邀请...');

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            sessionStorage.setItem('inviteCode', code || '');
            sessionStorage.setItem('authError', '请先登录，再加入班级。');
            navigate('/login');
            return;
        }

        const joinClass = async () => {
            try {
                const result = await apiRequest('/api/v1/classes/join', {
                    method: 'POST',
                    data: { code },
                });
                setStatus('success');
                setMessage(result.message || '加入成功');
                sessionStorage.removeItem('inviteCode');
            } catch (err) {
                setStatus('error');
                setMessage(err.message || '加入失败');
            }
        };

        joinClass();
    }, [code, navigate]);

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                {status === 'loading' && (
                    <div className="flex flex-col items-center text-gray-600">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
                        <p>{message}</p>
                    </div>
                )}
                {status === 'success' && (
                    <div className="flex flex-col items-center text-gray-700">
                        <CheckCircle2 className="w-8 h-8 text-green-500 mb-4" />
                        <p className="mb-6">{message}</p>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                        >
                            返回首页
                        </button>
                    </div>
                )}
                {status === 'error' && (
                    <div className="flex flex-col items-center text-gray-700">
                        <XCircle className="w-8 h-8 text-red-500 mb-4" />
                        <p className="mb-6">{message}</p>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                        >
                            返回首页
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InvitePage;
