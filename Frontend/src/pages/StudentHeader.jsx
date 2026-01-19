import React from 'react';
import { Edit3, LogOut, Shield, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const StudentHeader = ({ role, onLogout }) => (
    <header className="sticky top-0 bg-white shadow-lg p-4 flex items-center justify-between z-30">
        <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-800 flex items-center">
                <Edit3 className="w-5 h-5 mr-2 text-indigo-500" />
                AI 作文助手
            </h1>
            <nav className="hidden md:flex items-center ml-6 space-x-2 text-sm">
                <Link to="/" className="px-3 py-1 rounded-full hover:bg-gray-100">作文</Link>
                <Link to="/history" className="px-3 py-1 rounded-full hover:bg-gray-100">历史</Link>
                <Link to="/class" className="px-3 py-1 rounded-full hover:bg-gray-100">班级</Link>
                <Link to="/invite-center" className="px-3 py-1 rounded-full hover:bg-gray-100">邀请</Link>
                <Link to="/points" className="px-3 py-1 rounded-full hover:bg-gray-100">积分</Link>
            </nav>
        </div>

        <div className="flex items-center space-x-3">
            {role === 'admin' && (
                <Link
                    to="/admin/dashboard"
                    className="flex items-center bg-yellow-50 text-yellow-700 font-medium py-2 px-4 rounded-full shadow-sm hover:bg-yellow-100 transition duration-150 text-sm"
                >
                    <Shield className="w-4 h-4 mr-2" />
                    管理后台
                </Link>
            )}
            {(role === 'teacher' || role === 'admin') && (
                <Link
                    to="/teacher/classes"
                    className="flex items-center bg-indigo-50 text-indigo-700 font-medium py-2 px-4 rounded-full shadow-sm hover:bg-indigo-100 transition duration-150 text-sm"
                >
                    <Users className="w-4 h-4 mr-2" />
                    教师端
                </Link>
            )}
            <button
                onClick={onLogout}
                className="flex items-center bg-red-500 text-white font-medium py-2 px-4 rounded-full shadow-md hover:bg-red-600 transition duration-150 text-sm"
            >
                <LogOut className="w-4 h-4 mr-2" />
                登出
            </button>
        </div>
    </header>
);

export default StudentHeader;
