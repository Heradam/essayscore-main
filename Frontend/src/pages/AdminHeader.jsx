import React from 'react';
import { LogOut, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const AdminHeader = ({ onLogout }) => {
    const location = useLocation();
    const getLinkClass = (path) => {
        const isActive = location.pathname === path;
        return `px-4 py-2 rounded-full text-sm transition ${isActive ? 'glow-pill shadow-md' : 'text-slate-600 hover:bg-white/70'}`;
    };

    return (
        <header className="sticky top-0 z-30">
            <div className="admin-panel mx-4 mt-4 rounded-3xl px-4 py-3 md:px-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow">
                            <Shield className="w-5 h-5" />
                        </span>
                        <div>
                            <h1 className="text-lg md:text-xl font-semibold text-slate-900">管理后台</h1>
                            <p className="text-xs text-slate-500">系统运营与用户管理中心</p>
                        </div>
                        <nav className="hidden lg:flex items-center ml-6 space-x-2 text-sm">
                            <Link to="/admin/dashboard" className={getLinkClass('/admin/dashboard')}>仪表盘</Link>
                            <Link to="/admin/students" className={getLinkClass('/admin/students')}>学生管理</Link>
                            <Link to="/admin/teachers" className={getLinkClass('/admin/teachers')}>教师管理</Link>
                            <Link to="/admin/points" className={getLinkClass('/admin/points')}>积分管理</Link>
                            <Link to="/admin/llm" className={getLinkClass('/admin/llm')}>LLM 管理</Link>
                        </nav>
                    </div>
                    <nav className="flex flex-wrap lg:hidden items-center gap-2 text-sm">
                        <Link to="/admin/dashboard" className={getLinkClass('/admin/dashboard')}>仪表盘</Link>
                        <Link to="/admin/students" className={getLinkClass('/admin/students')}>学生管理</Link>
                        <Link to="/admin/teachers" className={getLinkClass('/admin/teachers')}>教师管理</Link>
                        <Link to="/admin/points" className={getLinkClass('/admin/points')}>积分管理</Link>
                        <Link to="/admin/llm" className={getLinkClass('/admin/llm')}>LLM 管理</Link>
                    </nav>
                    <button
                        onClick={() => {
                            if (window.confirm('确认退出登录吗？')) {
                                onLogout();
                            }
                        }}
                        className="flex items-center justify-center gap-2 bg-rose-500 text-white font-medium py-2 px-4 rounded-2xl shadow-lg hover:bg-rose-600 transition duration-150 text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        退出
                    </button>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
