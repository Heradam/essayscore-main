import React from 'react';
import { LogOut, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const AdminHeader = ({ onLogout }) => {
    const location = useLocation();
    const getLinkClass = (path) => {
        const isActive = location.pathname === path;
        return `px-3 py-1 rounded-full transition ${isActive ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`;
    };

    return (
        <header className="sticky top-0 bg-white shadow-lg p-4 flex items-center justify-between z-30">
            <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-800 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-indigo-500" />
                    管理后台
                </h1>
                <nav className="hidden md:flex items-center ml-6 space-x-2 text-sm">
                    <Link to="/admin/dashboard" className={getLinkClass('/admin/dashboard')}>仪表盘</Link>
                    <Link to="/admin/students" className={getLinkClass('/admin/students')}>学生管理</Link>
                    <Link to="/admin/teachers" className={getLinkClass('/admin/teachers')}>教师管理</Link>
                    <Link to="/admin/points" className={getLinkClass('/admin/points')}>积分管理</Link>
                </nav>
            </div>

            <button
                onClick={() => {
                    if (window.confirm('确认退出登录吗？')) {
                        onLogout();
                    }
                }}
                className="flex items-center bg-red-500 text-white font-medium py-2 px-4 rounded-full shadow-md hover:bg-red-600 transition duration-150 text-sm"
            >
                <LogOut className="w-4 h-4 mr-2" />
                退出
            </button>
        </header>
    );
};

export default AdminHeader;
