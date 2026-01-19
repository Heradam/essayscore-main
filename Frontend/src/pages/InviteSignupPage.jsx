import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const InviteSignupPage = () => {
    const { code } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (code) {
            sessionStorage.setItem('signupInviteCode', code);
        }
        navigate('/register');
    }, [code, navigate]);

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="flex items-center text-gray-600">
                <Loader2 className="w-5 h-5 mr-2 animate-spin text-indigo-500" />
                正在跳转注册页面...
            </div>
        </div>
    );
};

export default InviteSignupPage;
