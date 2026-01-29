import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCcw, Search, UserCog } from 'lucide-react';
import { apiRequest } from '../api/client.js';
import AdminHeader from './AdminHeader.jsx';
import Pagination from '../components/Pagination.jsx';

const ROLES = ['user', 'teacher', 'admin'];
const SUBJECTS = ['', '语文', '英语'];
const GRADES = ['', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const VIEW_CONFIGS = {
    users: {
        roleFilter: '',
        showRoleFilter: true,
        showRoleColumn: true,
        showRoleEdit: true,
        showProfileFields: true,
        showStatusEdit: true,
        showSaveAction: true,
        showPointsActions: true,
        showResetPassword: true,
    },
    students: {
        roleFilter: 'user',
        showRoleFilter: false,
        showRoleColumn: false,
        showRoleEdit: false,
        showProfileFields: false,
        showStatusEdit: true,
        showSaveAction: true,
        showPointsActions: true,
        showResetPassword: true,
    },
    teachers: {
        roleFilter: 'teacher',
        showRoleFilter: false,
        showRoleColumn: false,
        showRoleEdit: false,
        showProfileFields: true,
        showStatusEdit: true,
        showSaveAction: true,
        showPointsActions: false,
        showResetPassword: true,
    },
};

const AdminPage = ({ onLogout, view = 'users' }) => {
    const config = VIEW_CONFIGS[view] || VIEW_CONFIGS.users;
    const [query, setQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState(config.roleFilter);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [edits, setEdits] = useState({});
    const [page, setPage] = useState(1);
    const viewMode = view || 'users';
    const showUserFields = config.showProfileFields;
    const showPointsActions = config.showPointsActions;
    const showRoleFilter = config.showRoleFilter;
    const showRoleColumn = config.showRoleColumn;
    const showRoleEdit = config.showRoleEdit;
    const showResetPassword = config.showResetPassword;
    const showStatusEdit = config.showStatusEdit;
    const showSaveAction = config.showSaveAction;

    useEffect(() => {
        setRoleFilter(config.roleFilter);
    }, [view]);

    const loadUsers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (query.trim()) {
                params.append('query', query.trim());
            }
            if (roleFilter) {
                params.append('role', roleFilter);
            }
            const url = `/api/v1/admin/users${params.toString() ? `?${params}` : ''}`;
            const data = await apiRequest(url);
            setUsers(data);
            setEdits({});
        } catch (err) {
            setError(err.message || '加载用户列表失败。');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const mergedUser = (user) => ({
        ...user,
        ...(edits[user.username] || {}),
    });

    const handleEdit = (username, patch) => {
        setEdits((prev) => ({
            ...prev,
            [username]: {
                ...(prev[username] || {}),
                ...patch,
            },
        }));
    };

    const handleSave = async (user) => {
        const payload = edits[user.username];
        if (!payload) {
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await apiRequest(`/api/v1/admin/users/${user.username}`, {
                method: 'PATCH',
                data: payload,
            });
            await loadUsers();
        } catch (err) {
            setError(err.message || '更新失败。');
        } finally {
            setIsLoading(false);
        }
    };

    const [resetDialog, setResetDialog] = useState({ open: false, username: '' });

    const handleResetPassword = (user) => {
        setResetDialog({ open: true, username: user.username });
    };

    const confirmResetPassword = async () => {
        if (!resetDialog.username) {
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiRequest(`/api/v1/admin/users/${resetDialog.username}/reset-password`, {
                method: 'POST',
            });
            window.alert(`密码已重置为 123456\\n有效期至：${data.expiresAt || ''}`);
            await loadUsers();
        } catch (err) {
            setError(err.message || '重置失败。');
        } finally {
            setIsLoading(false);
            setResetDialog({ open: false, username: '' });
        }
    };

    const handleAdjustPoints = async (user) => {
        const deltaText = window.prompt('输入积分变动（可正可负）');
        if (deltaText === null) {
            return;
        }
        const delta = Number(deltaText);
        if (!Number.isInteger(delta)) {
            window.alert('积分变动必须为整数。');
            return;
        }
        const note = window.prompt('填写调整备注（必填）') || '';
        if (!note) {
            window.alert('备注不能为空。');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await apiRequest('/api/v1/admin/points/adjust', {
                method: 'POST',
                data: { username: user.username, delta, note },
            });
            window.alert('积分调整成功。');
        } catch (err) {
            setError(err.message || '积分调整失败。');
        } finally {
            setIsLoading(false);
        }
    };

    const tableRows = useMemo(() => users.map((user) => mergedUser(user)), [users, edits]);
    const pageSize = 9;
    const totalPages = Math.max(1, Math.ceil(tableRows.length / pageSize));
    const pagedUsers = useMemo(() => {
        const start = (page - 1) * pageSize;
        return tableRows.slice(start, start + pageSize);
    }, [page, pageSize, tableRows]);

    useEffect(() => {
        setPage(1);
    }, [users, roleFilter, query]);

    const viewTitle = viewMode === 'students' ? '学生管理' : viewMode === 'teachers' ? '教师管理' : '账号管理';

    return (
        <div className="min-h-screen admin-shell pb-10">
            <AdminHeader onLogout={onLogout} />

            <main className="max-w-7xl mx-auto p-4 md:p-10 space-y-6">
                <section className="admin-panel rounded-3xl p-5 md:p-7 fade-in-up">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">Console</p>
                            <h2 className="text-xl md:text-2xl font-semibold text-slate-900">{viewTitle}</h2>
                            <p className="text-sm text-slate-500 mt-1">共 {users.length} 位账号</p>
                        </div>
                        <div className="flex flex-1 flex-col md:flex-row gap-3 md:items-center md:justify-end">
                            <div className="flex items-center w-full md:w-80 bg-white/80 border border-slate-200/70 rounded-2xl px-3">
                                <Search className="w-4 h-4 text-gray-400 mr-2" />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="搜索用户名"
                                    className="flex-1 bg-transparent py-2 focus:outline-none text-sm"
                                />
                            </div>
                            {showRoleFilter && (
                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="border border-slate-200/70 rounded-2xl px-3 py-2 text-sm bg-white/80"
                                >
                                    <option value="">全部角色</option>
                                    {ROLES.map((role) => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            )}
                            <button
                                onClick={loadUsers}
                                className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-2xl hover:bg-emerald-700 transition text-sm shadow-md"
                            >
                                <RefreshCcw className="w-4 h-4" />
                                刷新
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 bg-red-50 text-red-700 px-3 py-2 rounded-xl border border-red-200">
                            {error}
                        </div>
                    )}

                    {isLoading && users.length === 0 ? (
                        <div className="flex items-center justify-center py-10 text-gray-500">
                            <Loader2 className="w-5 h-5 mr-2 animate-spin text-indigo-500" />
                            正在加载...
                        </div>
                    ) : (
                        <div className="mt-4">
                            {users.length === 0 && !isLoading ? (
                                <p className="text-sm text-gray-500 py-6">暂无用户。</p>
                            ) : (
                                <>
                                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                        {pagedUsers.map((user) => (
                                            <div key={user.username} className="admin-panel rounded-2xl p-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">Account</p>
                                                        <p className="text-lg font-semibold text-slate-900">{user.username}</p>
                                                    </div>
                                                    {showRoleColumn && (
                                                        <div className="text-right">
                                                            <p className="text-xs text-slate-400">角色</p>
                                                            {showRoleEdit ? (
                                                                <select
                                                                    value={user.role}
                                                                    onChange={(e) => handleEdit(user.username, { role: e.target.value })}
                                                                    className="border border-slate-200 rounded-lg px-2 py-1 text-sm bg-white/80"
                                                                >
                                                                    {ROLES.map((role) => (
                                                                        <option key={role} value={role}>{role}</option>
                                                                    ))}
                                                                </select>
                                                            ) : (
                                                                <span className="text-sm text-gray-700">{user.role}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between text-sm text-slate-600">
                                                    <span>状态</span>
                                                    <label className="inline-flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={user.isActive}
                                                            onChange={(e) => handleEdit(user.username, { isActive: e.target.checked })}
                                                            disabled={!showStatusEdit}
                                                        />
                                                        <span className="text-xs text-gray-600">
                                                            {user.isActive ? '启用' : '禁用'}
                                                        </span>
                                                    </label>
                                                </div>

                                                {showUserFields && (
                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                        <div>
                                                            <p className="text-xs text-slate-400 mb-1">年级</p>
                                                            <select
                                                                value={user.grade || ''}
                                                                onChange={(e) => handleEdit(user.username, { grade: e.target.value })}
                                                                className="border border-slate-200 rounded-lg px-2 py-1 text-sm bg-white/80 w-full"
                                                            >
                                                                {GRADES.map((grade) => (
                                                                    <option key={grade || 'none'} value={grade}>{grade || '未设置'}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-slate-400 mb-1">学科</p>
                                                            <select
                                                                value={user.subject || ''}
                                                                onChange={(e) => handleEdit(user.username, { subject: e.target.value })}
                                                                className="border border-slate-200 rounded-lg px-2 py-1 text-sm bg-white/80 w-full"
                                                            >
                                                                {SUBJECTS.map((subject) => (
                                                                    <option key={subject || 'none'} value={subject}>{subject || '未设置'}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <p className="text-xs text-slate-400 mb-1">工号</p>
                                                            <input
                                                                value={user.teacherId || ''}
                                                                onChange={(e) => handleEdit(user.username, { teacherId: e.target.value })}
                                                                className="border border-slate-200 rounded-lg px-2 py-1 text-sm bg-white/80 w-full"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    {showSaveAction && (
                                                        <button
                                                            onClick={() => handleSave(user)}
                                                            className="inline-flex items-center px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-sm"
                                                        >
                                                            <UserCog className="w-4 h-4 mr-1" />
                                                            保存
                                                        </button>
                                                    )}
                                                    {showPointsActions && (
                                                        <button
                                                            onClick={() => handleAdjustPoints(user)}
                                                            className="inline-flex items-center px-3 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm"
                                                        >
                                                            积分调整
                                                        </button>
                                                    )}
                                                    {showResetPassword && (
                                                        <button
                                                            onClick={() => handleResetPassword(user)}
                                                            className="inline-flex items-center px-3 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-sm"
                                                        >
                                                            重置密码
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Pagination
                                        page={page}
                                        totalPages={totalPages}
                                        onPageChange={setPage}
                                        className="mt-6"
                                    />
                                </>
                            )}
                        </div>
                    )}
                </section>
            </main>

            {resetDialog.open && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
                    <div className="admin-panel w-full max-w-md rounded-3xl p-6 space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900">重置密码</h3>
                        <p className="text-sm text-slate-600">
                            将用户 <span className="font-semibold">{resetDialog.username}</span> 的密码重置为
                            <span className="font-semibold text-emerald-700"> 123456</span>。
                            用户下次登录必须修改密码。
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setResetDialog({ open: false, username: '' })}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900"
                                disabled={isLoading}
                            >
                                取消
                            </button>
                            <button
                                type="button"
                                onClick={confirmResetPassword}
                                className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                                disabled={isLoading}
                            >
                                {isLoading ? '处理中...' : '确认重置'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPage;
