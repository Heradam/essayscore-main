import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCcw, Search, UserCog } from 'lucide-react';
import { apiRequest } from '../api/client.js';
import AdminHeader from './AdminHeader.jsx';

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

    const handleResetPassword = async (user) => {
        const confirmed = window.confirm(`确认重置 ${user.username} 的密码吗？`);
        if (!confirmed) {
            return;
        }
        const newPassword = window.prompt('请输入新密码（必填）') || '';
        if (!newPassword) {
            window.alert('新密码不能为空。');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiRequest(`/api/v1/admin/users/${user.username}/reset-password`, {
                method: 'POST',
                data: { password: newPassword },
            });
            window.alert(`密码已重置\\n有效期至：${data.expiresAt}`);
            await loadUsers();
        } catch (err) {
            setError(err.message || '重置失败。');
        } finally {
            setIsLoading(false);
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

    return (
        <div className="min-h-screen bg-gray-100">
            <AdminHeader onLogout={onLogout} />

            <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
                <section className="bg-white rounded-2xl shadow-xl p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex flex-1 gap-3">
                            <div className="flex items-center w-full bg-gray-50 border border-gray-200 rounded-lg px-3">
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
                                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="">全部角色</option>
                                    {ROLES.map((role) => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <button
                            onClick={loadUsers}
                            className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm"
                        >
                            <RefreshCcw className="w-4 h-4 mr-2" />
                            刷新
                        </button>
                    </div>

                    {error && (
                        <div className="mt-4 bg-red-100 text-red-700 px-3 py-2 rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}

                    {isLoading && users.length === 0 ? (
                        <div className="flex items-center justify-center py-10 text-gray-500">
                            <Loader2 className="w-5 h-5 mr-2 animate-spin text-indigo-500" />
                            正在加载...
                        </div>
                    ) : (
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500 border-b">
                                        <th className="py-2 pr-4">用户名</th>
                                        {showRoleColumn && <th className="py-2 pr-4">角色</th>}
                                        <th className="py-2 pr-4">状态</th>
                                        {showUserFields && <th className="py-2 pr-4">年级</th>}
                                        {showUserFields && <th className="py-2 pr-4">学科</th>}
                                        {showUserFields && <th className="py-2 pr-4">工号</th>}
                                        <th className="py-2 pr-4">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableRows.map((user) => (
                                        <tr key={user.username} className="border-b last:border-0">
                                            <td className="py-3 pr-4 font-medium text-gray-800">{user.username}</td>
                                            {showRoleColumn && (
                                                <td className="py-3 pr-4">
                                                    {showRoleEdit ? (
                                                        <select
                                                            value={user.role}
                                                            onChange={(e) => handleEdit(user.username, { role: e.target.value })}
                                                            className="border border-gray-200 rounded-lg px-2 py-1 text-sm"
                                                        >
                                                            {ROLES.map((role) => (
                                                                <option key={role} value={role}>{role}</option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <span className="text-sm text-gray-700">{user.role}</span>
                                                    )}
                                                </td>
                                            )}
                                            <td className="py-3 pr-4">
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
                                            </td>
                                            {showUserFields && (
                                                <td className="py-3 pr-4">
                                                    <select
                                                        value={user.grade || ''}
                                                        onChange={(e) => handleEdit(user.username, { grade: e.target.value })}
                                                        className="border border-gray-200 rounded-lg px-2 py-1 text-sm"
                                                    >
                                                        {GRADES.map((grade) => (
                                                            <option key={grade || 'none'} value={grade}>{grade || '未设置'}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                            )}
                                            {showUserFields && (
                                                <td className="py-3 pr-4">
                                                    <select
                                                        value={user.subject || ''}
                                                        onChange={(e) => handleEdit(user.username, { subject: e.target.value })}
                                                        className="border border-gray-200 rounded-lg px-2 py-1 text-sm"
                                                    >
                                                        {SUBJECTS.map((subject) => (
                                                            <option key={subject || 'none'} value={subject}>{subject || '未设置'}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                            )}
                                            {showUserFields && (
                                                <td className="py-3 pr-4">
                                                    <input
                                                        value={user.teacherId || ''}
                                                        onChange={(e) => handleEdit(user.username, { teacherId: e.target.value })}
                                                        className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-28"
                                                    />
                                                </td>
                                            )}
                                            <td className="py-3 pr-4 space-x-2">
                                                {showSaveAction && (
                                                    <button
                                                        onClick={() => handleSave(user)}
                                                        className="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-sm"
                                                    >
                                                        <UserCog className="w-4 h-4 mr-1" />
                                                        保存
                                                    </button>
                                                )}
                                                {showPointsActions && (
                                                    <button
                                                        onClick={() => handleAdjustPoints(user)}
                                                        className="inline-flex items-center text-gray-600 hover:text-gray-800 text-sm"
                                                    >
                                                        积分调整
                                                    </button>
                                                )}
                                                {showResetPassword && (
                                                    <button
                                                        onClick={() => handleResetPassword(user)}
                                                        className="inline-flex items-center text-red-500 hover:text-red-700 text-sm"
                                                    >
                                                        重置密码
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {users.length === 0 && !isLoading && (
                                <p className="text-sm text-gray-500 py-6">暂无用户。</p>
                            )}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default AdminPage;
