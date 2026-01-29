import React, { useEffect, useMemo, useState } from 'react';
import {
    BookOpen,
    Check,
    Copy,
    Loader2,
    PlusCircle,
    RefreshCcw,
    X,
} from 'lucide-react';
import { apiRequest } from '../api/client.js';
import TeacherHeader from './TeacherHeader.jsx';
import Pagination from '../components/Pagination.jsx';

const TeacherPage = ({ onLogout, role, view = 'all' }) => {
    const [classes, setClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState(() => {
        return localStorage.getItem('teacherSelectedClassId');
    });
    const [members, setMembers] = useState([]);
    const [requests, setRequests] = useState([]);
    const [history, setHistory] = useState([]);
    const [currentEssay, setCurrentEssay] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [groupEdits, setGroupEdits] = useState({});
    const [classesPage, setClassesPage] = useState(1);
    const [membersPage, setMembersPage] = useState(1);
    const [requestsPage, setRequestsPage] = useState(1);
    const [historyPage, setHistoryPage] = useState(1);
    const [studentsPage, setStudentsPage] = useState(1);
    const [classForm, setClassForm] = useState({ name: '', grade: '', subject: '', requireApproval: true });
    const gradeOptions = [
        { value: '', label: '请选择年级' },
        { value: '小学一年级', label: '小学一年级' },
        { value: '小学二年级', label: '小学二年级' },
        { value: '小学三年级', label: '小学三年级' },
        { value: '小学四年级', label: '小学四年级' },
        { value: '小学五年级', label: '小学五年级' },
        { value: '小学六年级', label: '小学六年级' },
        { value: '初中一年级', label: '初中一年级' },
        { value: '初中二年级', label: '初中二年级' },
        { value: '初中三年级', label: '初中三年级' },
        { value: '高中一年级', label: '高中一年级' },
        { value: '高中二年级', label: '高中二年级' },
        { value: '高中三年级', label: '高中三年级' },
    ];
    const subjectOptions = [
        { value: '', label: '请选择科目' },
        { value: '语文', label: '语文' },
        { value: '英语', label: '英语' },
    ];
    const viewMode = view || 'all';
    const showClasses = viewMode === 'classes' || viewMode === 'manage' || viewMode === 'history' || viewMode === 'all';
    const showManage = viewMode === 'manage' || viewMode === 'all';
    const showHistory = viewMode === 'history' || viewMode === 'all';
    const gridClassName = viewMode === 'all'
        ? 'grid-cols-1 lg:grid-cols-3'
        : (viewMode === 'manage' || viewMode === 'history')
            ? 'grid-cols-1 lg:grid-cols-2'
            : 'grid-cols-1';

    const [newClass, setNewClass] = useState({
        name: '',
        grade: '',
        subject: '',
        requireApproval: true,
    });

    const selectedClass = useMemo(
        () => classes.find((item) => String(item.id) === String(selectedClassId)) || null,
        [classes, selectedClassId]
    );
    const inviteQrUrl = useMemo(() => {
        if (!selectedClass?.inviteLink) {
            return '';
        }
        const encoded = encodeURIComponent(selectedClass.inviteLink);
        return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encoded}`;
    }, [selectedClass?.inviteLink]);

    const classesPageSize = 6;
    const membersPageSize = 6;
    const requestsPageSize = 6;
    const historyPageSize = 6;
    const studentsPageSize = 8;

    const totalClassesPages = Math.max(1, Math.ceil(classes.length / classesPageSize));
    const totalMembersPages = Math.max(1, Math.ceil(members.length / membersPageSize));
    const totalRequestsPages = Math.max(1, Math.ceil(requests.length / requestsPageSize));
    const totalHistoryPages = Math.max(1, Math.ceil(history.length / historyPageSize));
    const totalStudentsPages = Math.max(1, Math.ceil(members.length / studentsPageSize));

    const pagedClasses = classes.slice((classesPage - 1) * classesPageSize, classesPage * classesPageSize);
    const pagedMembers = members.slice((membersPage - 1) * membersPageSize, membersPage * membersPageSize);
    const pagedRequests = requests.slice((requestsPage - 1) * requestsPageSize, requestsPage * requestsPageSize);
    const pagedHistory = history.slice((historyPage - 1) * historyPageSize, historyPage * historyPageSize);
    const pagedStudents = members.slice((studentsPage - 1) * studentsPageSize, studentsPage * studentsPageSize);

    const updateSelectedClass = (classId) => {
        setSelectedClassId(classId);
        if (classId) {
            localStorage.setItem('teacherSelectedClassId', String(classId));
        } else {
            localStorage.removeItem('teacherSelectedClassId');
        }
    };

    const loadClasses = async (keepSelection = true) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiRequest('/api/v1/teacher/classes');
            setClasses(data);
            const hasSelection = selectedClassId && data.some((item) => String(item.id) === String(selectedClassId));
            if (!keepSelection || !hasSelection) {
                updateSelectedClass(data[0]?.id || null);
            }
        } catch (err) {
            setError(err.message || '加载班级失败。');
        } finally {
            setIsLoading(false);
        }
    };

    const loadMembers = async (classId) => {
        try {
            const data = await apiRequest(`/api/v1/teacher/classes/${classId}/members`);
            setMembers(data);
        } catch (err) {
            setError(err.message || '加载学生名单失败。');
            setMembers([]);
        }
    };

    const loadRequests = async (classId) => {
        try {
            const data = await apiRequest(`/api/v1/teacher/classes/${classId}/requests`);
            setRequests(data);
        } catch (err) {
            setError(err.message || '加载申请列表失败。');
            setRequests([]);
        }
    };

    const loadHistory = async (username) => {
        setIsLoading(true);
        setError(null);
        setCurrentEssay(null);
        setSelectedStudent(username);
        try {
            const data = await apiRequest(`/api/v1/teacher/history/${username}`);
            setHistory(data);
        } catch (err) {
            setError(err.message || '加载学生历史失败。');
            setHistory([]);
        } finally {
            setIsLoading(false);
        }
    };

    const loadEssay = async (essayId) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiRequest(`/api/v1/teacher/essay/${essayId}`);
            setCurrentEssay(data);
        } catch (err) {
            setError(err.message || '加载作文详情失败。');
            setCurrentEssay(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadClasses(true);
    }, []);

    useEffect(() => {
        if (selectedClassId) {
            loadMembers(selectedClassId);
            loadRequests(selectedClassId);
            setSelectedStudent(null);
            setHistory([]);
            setCurrentEssay(null);
            setMembersPage(1);
            setRequestsPage(1);
            setHistoryPage(1);
            setStudentsPage(1);
        }
    }, [selectedClassId]);

    useEffect(() => {
        if (selectedClass) {
            setClassForm({
                name: selectedClass.name || '',
                grade: selectedClass.grade || '',
                subject: selectedClass.subject || '',
                requireApproval: !!selectedClass.requireApproval,
            });
        }
    }, [selectedClass]);

    useEffect(() => {
        setClassesPage(1);
    }, [classes]);

    useEffect(() => {
        setMembersPage(1);
        setStudentsPage(1);
    }, [members]);

    useEffect(() => {
        setRequestsPage(1);
    }, [requests]);

    useEffect(() => {
        setHistoryPage(1);
    }, [history]);

    const handleCreateClass = async () => {
        if (!newClass.name.trim()) {
            setError('班级名不能为空。');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiRequest('/api/v1/teacher/classes', {
                method: 'POST',
                data: newClass,
            });
            setNewClass({ name: '', grade: '', subject: '', requireApproval: true });
            await loadClasses(false);
            updateSelectedClass(data.id);
        } catch (err) {
            setError(err.message || '创建班级失败。');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateClass = async (patch) => {
        if (!selectedClassId) {
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await apiRequest(`/api/v1/teacher/classes/${selectedClassId}`, {
                method: 'PATCH',
                data: patch,
            });
            await loadClasses();
        } catch (err) {
            setError(err.message || '更新班级失败。');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegenerateInvite = async () => {
        if (!selectedClassId) {
            return;
        }
        const confirmed = window.confirm('确定要重置邀请码吗？旧链接将失效。');
        if (!confirmed) {
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiRequest(`/api/v1/teacher/classes/${selectedClassId}/invite`, {
                method: 'POST',
            });
            setClasses((prev) => prev.map((item) => (
                item.id === selectedClassId
                    ? { ...item, inviteCode: data.inviteCode, inviteLink: data.inviteLink }
                    : item
            )));
        } catch (err) {
            setError(err.message || '更新邀请码失败。');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyInvite = async (value) => {
        try {
            await navigator.clipboard.writeText(value);
        } catch (err) {
            setError('复制失败，请手动复制。');
        }
    };

    const handleRemoveMember = async (username) => {
        if (!selectedClassId) {
            return;
        }
        const confirmed = window.confirm(`确认移除学生 ${username} 吗？`);
        if (!confirmed) {
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await apiRequest(`/api/v1/teacher/classes/${selectedClassId}/members/${username}`, {
                method: 'DELETE',
            });
            await loadMembers(selectedClassId);
        } catch (err) {
            setError(err.message || '移除失败。');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateGroup = async (username) => {
        if (!selectedClassId) {
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await apiRequest(`/api/v1/teacher/classes/${selectedClassId}/members/${username}`, {
                method: 'PATCH',
                data: { group: groupEdits[username] || '' },
            });
            await loadMembers(selectedClassId);
        } catch (err) {
            setError(err.message || '更新分组失败。');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (username) => {
        if (!selectedClassId) {
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await apiRequest(`/api/v1/teacher/classes/${selectedClassId}/requests/${username}/approve`, {
                method: 'POST',
            });
            await loadMembers(selectedClassId);
            await loadRequests(selectedClassId);
        } catch (err) {
            setError(err.message || '审核失败。');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = async (username) => {
        if (!selectedClassId) {
            return;
        }
        const confirmed = window.confirm(`确认拒绝 ${username} 的加入申请吗？`);
        if (!confirmed) {
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await apiRequest(`/api/v1/teacher/classes/${selectedClassId}/requests/${username}/reject`, {
                method: 'POST',
            });
            await loadRequests(selectedClassId);
        } catch (err) {
            setError(err.message || '审核失败。');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <TeacherHeader role={role} onLogout={onLogout} />

            <main className={`max-w-7xl mx-auto p-4 md:p-10 grid ${gridClassName} gap-8`}>
                {showClasses && (
                <section className="surface-float rounded-3xl p-5 md:p-7 space-y-6 fade-in-up">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-slate-900">班级列表</h2>
                            <span className="text-xs text-slate-400">共 {classes.length} 个班级</span>
                        </div>
                        {isLoading && classes.length === 0 ? (
                            <div className="flex items-center justify-center text-gray-500">
                                <Loader2 className="w-5 h-5 mr-2 animate-spin text-emerald-600" />
                                正在加载...
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {classes.length === 0 && (
                                    <p className="text-sm text-gray-500">暂无班级，请先创建。</p>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {pagedClasses.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => updateSelectedClass(item.id)}
                                            className={`text-left px-3 py-3 rounded-2xl transition border ${
                                                String(selectedClassId) === String(item.id)
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                                                    : 'hover:bg-slate-50 text-slate-700 border-slate-200'
                                            }`}
                                        >
                                            <p className="font-medium truncate">{item.name}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {[item.grade, item.subject].filter(Boolean).join(' / ') || '未设置'}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                                <Pagination
                                    page={classesPage}
                                    totalPages={totalClassesPages}
                                    onPageChange={setClassesPage}
                                />
                            </div>
                        )}
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="text-md font-semibold text-slate-800 mb-2">创建班级</h3>
                        <div className="space-y-2">
                            <input
                                type="text"
                                placeholder="班级名"
                                value={newClass.name}
                                onChange={(e) => setNewClass((prev) => ({ ...prev, name: e.target.value }))}
                                className="w-full p-2 border border-slate-200 rounded-xl focus:ring-emerald-300 focus:border-emerald-300"
                            />
                            <select
                                value={newClass.grade}
                                onChange={(e) => setNewClass((prev) => ({ ...prev, grade: e.target.value }))}
                                className="w-full p-2 border border-slate-200 rounded-xl focus:ring-emerald-300 focus:border-emerald-300"
                            >
                                {gradeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={newClass.subject}
                                onChange={(e) => setNewClass((prev) => ({ ...prev, subject: e.target.value }))}
                                className="w-full p-2 border border-slate-200 rounded-xl focus:ring-emerald-300 focus:border-emerald-300"
                            >
                                {subjectOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <label className="flex items-center text-sm text-gray-600 space-x-2">
                                <input
                                    type="checkbox"
                                    checked={newClass.requireApproval}
                                    onChange={(e) => setNewClass((prev) => ({ ...prev, requireApproval: e.target.checked }))}
                                />
                                <span>学生加入需审核</span>
                            </label>
                            <button
                                onClick={handleCreateClass}
                                className="w-full flex items-center justify-center bg-emerald-600 text-white py-2 rounded-xl hover:bg-emerald-700 transition shadow-md"
                            >
                                <PlusCircle className="w-4 h-4 mr-2" />
                                创建班级
                            </button>
                        </div>
                    </div>
                </section>
                )}

                {showManage && (
                <section className="surface-float rounded-3xl p-5 md:p-7 space-y-6 fade-in-up delay-1">
                    <h2 className="text-xl font-semibold text-slate-900">班级管理</h2>
                    {!selectedClass ? (
                        <p className="text-sm text-gray-500">请选择一个班级。</p>
                    ) : (
                        <>
                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
                                <div className="grid gap-4 md:grid-cols-[1fr_auto] items-start">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-500">邀请码</p>
                                                <p className="text-lg font-semibold text-emerald-700">{selectedClass.inviteCode}</p>
                                            </div>
                                            <button
                                                onClick={() => handleCopyInvite(selectedClass.inviteCode)}
                                                className="flex items-center text-emerald-600 hover:text-emerald-800 text-sm"
                                            >
                                                <Copy className="w-4 h-4 mr-1" />
                                                复制
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-500">邀请链接</p>
                                                <p className="text-xs text-gray-600 break-all">{selectedClass.inviteLink}</p>
                                            </div>
                                            <button
                                                onClick={() => handleCopyInvite(selectedClass.inviteLink)}
                                                className="flex items-center text-emerald-600 hover:text-emerald-800 text-sm"
                                            >
                                                <Copy className="w-4 h-4 mr-1" />
                                                复制
                                            </button>
                                        </div>
                                        <button
                                            onClick={handleRegenerateInvite}
                                            className="inline-flex items-center text-sm text-emerald-700 hover:text-emerald-900"
                                        >
                                            <RefreshCcw className="w-4 h-4 mr-1" />
                                            重置邀请码
                                        </button>
                                    </div>
                                    {inviteQrUrl && (
                                        <div className="flex flex-col items-center gap-2 bg-white border border-emerald-100 rounded-2xl p-3 shadow-sm">
                                            <img
                                                src={inviteQrUrl}
                                                alt="班级邀请二维码"
                                                className="w-36 h-36 rounded-xl border border-gray-100"
                                            />
                                            <span className="text-xs text-gray-500">扫码加入班级</span>
                                            <button
                                                onClick={() => handleCopyInvite(selectedClass.inviteLink)}
                                                className="text-xs text-emerald-700 hover:text-emerald-900"
                                            >
                                                复制链接
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <input
                                    type="text"
                                    value={classForm.name}
                                    onChange={(e) => setClassForm((prev) => ({ ...prev, name: e.target.value }))}
                                    className="w-full p-2 border border-slate-200 rounded-xl"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        value={classForm.grade}
                                        onChange={(e) => setClassForm((prev) => ({ ...prev, grade: e.target.value }))}
                                        className="w-full p-2 border border-slate-200 rounded-xl"
                                    >
                                        {gradeOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={classForm.subject}
                                        onChange={(e) => setClassForm((prev) => ({ ...prev, subject: e.target.value }))}
                                        className="w-full p-2 border border-slate-200 rounded-xl"
                                    >
                                        {subjectOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <label className="flex items-center text-sm text-gray-600 space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={!!classForm.requireApproval}
                                        onChange={(e) => setClassForm((prev) => ({ ...prev, requireApproval: e.target.checked }))}
                                    />
                                    <span>学生加入需审核</span>
                                </label>
                                <button
                                    onClick={() => handleUpdateClass({
                                        name: classForm.name,
                                        grade: classForm.grade,
                                        subject: classForm.subject,
                                        requireApproval: classForm.requireApproval,
                                    })}
                                    className="w-full bg-emerald-600 text-white py-2 rounded-xl hover:bg-emerald-700 transition shadow-md"
                                >
                                    保存设置
                                </button>
                            </div>

                            <div>
                                <h3 className="text-md font-semibold text-slate-800 mb-2">学生名单</h3>
                                {members.length === 0 ? (
                                    <p className="text-sm text-gray-500">暂无学生。</p>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {pagedMembers.map((member) => (
                                                <div key={member.username} className="border border-slate-200 rounded-2xl p-3 bg-white shadow-sm">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium text-gray-800">{member.username}</span>
                                                        <button
                                                            onClick={() => handleRemoveMember(member.username)}
                                                            className="text-xs text-rose-500 hover:text-rose-600"
                                                        >
                                                            移除
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <Pagination
                                            page={membersPage}
                                            totalPages={totalMembersPages}
                                            onPageChange={setMembersPage}
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 className="text-md font-semibold text-slate-800 mb-2">加入申请</h3>
                                {requests.length === 0 ? (
                                    <p className="text-sm text-gray-500">暂无申请。</p>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {pagedRequests.map((req) => (
                                                <div key={req.username} className="flex items-center justify-between border border-slate-200 rounded-2xl p-3 bg-white shadow-sm">
                                                    <span className="text-sm text-gray-800">{req.username}</span>
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => handleApprove(req.username)}
                                                            className="text-emerald-600 hover:text-emerald-700"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(req.username)}
                                                            className="text-rose-500 hover:text-rose-600"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <Pagination
                                            page={requestsPage}
                                            totalPages={totalRequestsPages}
                                            onPageChange={setRequestsPage}
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </section>
                )}

                {showHistory && (
                <section className="surface-float rounded-3xl p-5 md:p-7 fade-in-up delay-2">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">
                                学生历史 {selectedStudent ? `- ${selectedStudent}` : ''}
                            </h2>
                            <p className="text-xs text-slate-400 mt-1">按学生查看作文历史</p>
                        </div>
                        {selectedStudent && (
                            <span className="text-xs text-slate-400">共 {history.length} 篇</span>
                        )}
                    </div>
                    {error && (
                        <div className="mb-4 bg-red-50 text-red-700 px-3 py-2 rounded-xl border border-red-200">
                            {error}
                        </div>
                    )}
                    {viewMode === 'history' && (
                        <div className="mb-4">
                            <h3 className="text-md font-semibold text-gray-800 mb-2">学生列表</h3>
                            {members.length === 0 ? (
                                <p className="text-sm text-gray-500">暂无学生。</p>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {pagedStudents.map((member) => (
                                            <button
                                                key={member.username}
                                                onClick={() => loadHistory(member.username)}
                                                className="text-left px-4 py-3 rounded-2xl border border-slate-200 hover:border-emerald-200 hover:shadow-sm transition bg-white/70"
                                            >
                                                <span className="font-medium text-gray-800">{member.username}</span>
                                                <p className="text-xs text-slate-400 mt-1">点击查看作文</p>
                                            </button>
                                        ))}
                                    </div>
                                    <Pagination
                                        page={studentsPage}
                                        totalPages={totalStudentsPages}
                                        onPageChange={setStudentsPage}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                    {!selectedStudent ? (
                        <p className="text-sm text-gray-500">请选择学生查看历史。</p>
                    ) : (
                        <div className="space-y-4">
                            {history.length === 0 ? (
                                <p className="text-sm text-gray-500">暂无历史记录。</p>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {pagedHistory.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => loadEssay(item.id)}
                                                className="text-left p-4 rounded-2xl border border-slate-200 hover:border-emerald-200 hover:shadow-md transition bg-white/80 relative overflow-hidden"
                                            >
                                                <div className="absolute top-3 right-3 text-[10px] px-2 py-1 rounded-full bg-white/80 border border-slate-200 text-slate-500">
                                                    {new Date(item.timestamp).toLocaleDateString('zh-CN')}
                                                </div>
                                                <p className="font-semibold text-gray-800 line-clamp-2">
                                                    {item.title || '无标题作文'}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-2">点击查看评分与润色</p>
                                            </button>
                                        ))}
                                    </div>
                                    <Pagination
                                        page={historyPage}
                                        totalPages={totalHistoryPages}
                                        onPageChange={setHistoryPage}
                                    />
                                </>
                            )}
                        </div>
                    )}

                    {currentEssay && (
                        <div className="mt-6 border-t border-slate-200 pt-6">
                            <div className="flex items-center mb-3">
                                <BookOpen className="w-5 h-5 text-emerald-600 mr-2" />
                                <h3 className="text-lg font-bold text-gray-800">作文详情</h3>
                            </div>
                            <div className="space-y-5 text-sm text-gray-700">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                                        <p className="text-xs text-slate-400 mb-2">题目要求</p>
                                        <p className="whitespace-pre-wrap leading-relaxed">{currentEssay.topic}</p>
                                    </div>
                                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                                        <p className="text-xs text-emerald-700 mb-2">评分</p>
                                        <p className="text-3xl font-semibold text-emerald-700">{currentEssay.score}</p>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                    <p className="font-semibold text-gray-800">原文</p>
                                    <p className="whitespace-pre-wrap mt-2 leading-relaxed">{currentEssay.originalContent}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                    <p className="font-semibold text-gray-800">反馈</p>
                                    {currentEssay.feedback && currentEssay.feedback.length > 0 ? (
                                        <div className="mt-3 space-y-3">
                                            {currentEssay.feedback.map((item, index) => (
                                                <div key={`${item.type}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                                                    <span className="font-semibold text-emerald-700">{item.type}</span>
                                                    <p className="text-sm text-slate-600 mt-1">{item.detail}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="mt-2 text-gray-500">暂无反馈。</p>
                                    )}
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                    <p className="font-semibold text-gray-800">润色后文章</p>
                                    <p className="whitespace-pre-wrap mt-2 leading-relaxed">{currentEssay.revisedContent}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
                )}
            </main>
        </div>
    );
};

export default TeacherPage;
