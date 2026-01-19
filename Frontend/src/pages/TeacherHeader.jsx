import React from 'react';
import { LogOut, Shield, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const TeacherHeader = ({ role, onLogout }) => {
    const location = useLocation();
    const getLinkClass = (path) => {
        const isActive = location.pathname === path;
        return `px-3 py-1 rounded-full transition ${isActive ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`;
    };

    return (
        <header className="sticky top-0 bg-white shadow-lg p-4 flex items-center justify-between z-30">
            <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-800 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-indigo-500" />
                    教师工作台
                </h1>
                <nav className="hidden md:flex items-center ml-6 space-x-2 text-sm">
                    <Link to="/teacher/classes" className={getLinkClass('/teacher/classes')}>班级</Link>
                    <Link to="/teacher/manage" className={getLinkClass('/teacher/manage')}>管理</Link>
                    <Link to="/teacher/history" className={getLinkClass('/teacher/history')}>历史</Link>
                </nav>
            </div>

            <div className="flex items-center space-x-3">
                {role === 'admin' && (
                    <Link
                        to="/admin"
                        className="flex items-center bg-yellow-50 text-yellow-700 font-medium py-2 px-4 rounded-full shadow-sm hover:bg-yellow-100 transition duration-150 text-sm"
                    >
                        <Shield className="w-4 h-4 mr-2" />
                        管理后台
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
};

export default TeacherHeader;
