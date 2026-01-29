import React, { useEffect, useState } from 'react';
import { Cpu, Loader2, RefreshCcw, Plus, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../api/client.js';
import AdminHeader from './AdminHeader.jsx';

const AdminLLMPage = ({ onLogout }) => {
    const [status, setStatus] = useState(null);
    const [configs, setConfigs] = useState([]);
    const [form, setForm] = useState({ modelName: '', provider: '', baseUrl: '', apiKey: '' });
    const [editingId, setEditingId] = useState(null);
    const [editDialog, setEditDialog] = useState({ open: false, config: null });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadStatus = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiRequest('/api/v1/admin/llm/status');
            setStatus(data);
            const list = await apiRequest('/api/v1/admin/llm/configs');
            setConfigs(list);
        } catch (err) {
            setError(err.message || 'LLM 状态加载失败。');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadStatus();
    }, []);

    const used = status?.usedTokens ?? 0;
    const quota = status?.quotaTokens ?? null;
    const remaining = status?.remainingTokens ?? null;
    const usageRatio = quota ? Math.min((used / quota) * 100, 100) : 0;

    const handleSubmit = async () => {
        if (!form.modelName || (!editingId && !form.apiKey)) {
            setError('modelName 与 apiKey 为必填项。');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            if (editingId) {
                await apiRequest(`/api/v1/admin/llm/configs/${editingId}`, {
                    method: 'PATCH',
                    data: {
                        modelName: form.modelName,
                        provider: form.provider,
                        baseUrl: form.baseUrl,
                        apiKey: form.apiKey,
                    },
                });
            } else {
                await apiRequest('/api/v1/admin/llm/configs', {
                    method: 'POST',
                    data: {
                        modelName: form.modelName,
                        provider: form.provider,
                        baseUrl: form.baseUrl,
                        apiKey: form.apiKey,
                    },
                });
            }
            setForm({ modelName: '', provider: '', baseUrl: '', apiKey: '' });
            setEditingId(null);
            await loadStatus();
        } catch (err) {
            setError(err.message || (editingId ? '更新模型失败。' : '新增模型失败。'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleActivate = async (configId) => {
        setIsLoading(true);
        setError(null);
        try {
            await apiRequest(`/api/v1/admin/llm/configs/${configId}/activate`, {
                method: 'POST',
            });
            await loadStatus();
        } catch (err) {
            setError(err.message || '切换模型失败。');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (config) => {
        setEditingId(config.id);
        setForm({
            modelName: config.modelName || '',
            provider: config.provider || '',
            baseUrl: config.baseUrl || '',
            apiKey: '',
        });
        setEditDialog({ open: true, config });
    };

    const handleDelete = async (config) => {
        const confirmed = window.confirm(`确认删除模型 ${config.modelName} 吗？`);
        if (!confirmed) {
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await apiRequest(`/api/v1/admin/llm/configs/${config.id}`, {
                method: 'DELETE',
            });
            await loadStatus();
        } catch (err) {
            setError(err.message || '删除模型失败。');
        } finally {
            setIsLoading(false);
        }
    };

    const closeEditDialog = () => {
        setEditDialog({ open: false, config: null });
        setEditingId(null);
        setForm({ modelName: '', provider: '', baseUrl: '', apiKey: '' });
    };

    return (
        <div className="min-h-screen admin-shell pb-10">
            <AdminHeader onLogout={onLogout} />
            <main className="max-w-6xl mx-auto p-4 md:p-10 space-y-6">
                <section className="admin-panel rounded-3xl p-6 md:p-8 fade-in-up">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">LLM Console</p>
                            <h2 className="text-2xl font-semibold text-slate-900">模型使用概览</h2>
                            <p className="text-sm text-slate-500 mt-1">当前统计周期：{status?.month || '—'}</p>
                        </div>
                        <button
                            onClick={loadStatus}
                            className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-2xl hover:bg-emerald-700 transition text-sm shadow-md"
                        >
                            <RefreshCcw className="w-4 h-4" />
                            刷新
                        </button>
                    </div>

                    {error && (
                        <div className="mt-4 bg-red-50 text-red-700 px-3 py-2 rounded-xl border border-red-200">
                            {error}
                        </div>
                    )}

                    {isLoading && !status ? (
                        <div className="flex items-center justify-center py-10 text-gray-500">
                            <Loader2 className="w-5 h-5 mr-2 animate-spin text-emerald-600" />
                            正在加载...
                        </div>
                    ) : (
                        <div className="mt-6 space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
                                <div className="admin-panel rounded-3xl p-6 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                                            <Cpu className="w-6 h-6" />
                                        </div>
                                        <div>
                                        <p className="text-xs text-slate-400">当前模型</p>
                                        <p className="text-xl font-semibold text-slate-900">{status?.model || '—'}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm text-slate-600">
                                        <span>本月已用 Token</span>
                                        <span className="font-semibold text-slate-900">{used.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-slate-600">
                                        <span>剩余额度</span>
                                        <span className="font-semibold text-emerald-700">
                                            {remaining !== null ? remaining.toLocaleString() : '未配置'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-slate-400">
                                        <span>最后一次调用</span>
                                        <span>{status?.lastUsedAt ? new Date(status.lastUsedAt).toLocaleString('zh-CN') : '—'}</span>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500"
                                            style={{ width: quota ? `${usageRatio}%` : '0%' }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">
                                        {quota ? `已使用 ${usageRatio.toFixed(1)}%` : '未设置 LLM_TOKEN_QUOTA'}
                                    </p>
                                </div>
                                </div>

                                <div className="admin-panel rounded-3xl p-6 space-y-4">
                                    <h3 className="text-lg font-semibold text-slate-900">配置提示</h3>
                                    <ul className="text-sm text-slate-600 space-y-3">
                                        <li>仅展示与统计当前激活模型的 token 使用。</li>
                                        <li>模型配置会保存在数据库，请妥善管理密钥。</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="admin-panel rounded-3xl p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-slate-900">模型配置</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {configs.length === 0 ? (
                                        <div className="text-sm text-slate-500">暂无模型配置。</div>
                                    ) : (
                                        configs.map((item) => (
                                            <div key={item.id} className="rounded-2xl border border-slate-200 bg-white/70 p-4 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs text-slate-400">Model</p>
                                                        <p className="text-base font-semibold text-slate-900">{item.modelName}</p>
                                                    </div>
                                                    {item.isActive ? (
                                                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            使用中
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleActivate(item.id)}
                                                            className="text-xs text-emerald-700 hover:text-emerald-900"
                                                        >
                                                            设为当前
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-500">Provider: {item.provider || '—'}</div>
                                                <div className="text-xs text-slate-500">Base URL: {item.baseUrl || '默认'}</div>
                                                <div className="text-xs text-slate-500">API Key: {item.apiKeyMasked}</div>
                                                <div className="flex items-center gap-3 pt-2 text-xs">
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="text-slate-600 hover:text-slate-900"
                                                    >
                                                        编辑
                                                    </button>
                                                    {!item.isActive && (
                                                        <button
                                                            onClick={() => handleDelete(item)}
                                                            className="text-rose-500 hover:text-rose-700"
                                                        >
                                                            删除
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="admin-panel rounded-3xl p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-slate-900">新增模型</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500">模型名称（必填）</label>
                                        <input
                                            value={form.modelName}
                                            onChange={(e) => setForm((prev) => ({ ...prev, modelName: e.target.value }))}
                                            placeholder="例如：qwen-max / gpt-4o-mini"
                                            className="w-full p-3 rounded-xl border border-slate-200"
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500">供应商（可选）</label>
                                        <input
                                            value={form.provider}
                                            onChange={(e) => setForm((prev) => ({ ...prev, provider: e.target.value }))}
                                            placeholder="例如：DashScope / OpenAI / DeepSeek"
                                            className="w-full p-3 rounded-xl border border-slate-200"
                                            autoComplete="organization"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500">Base URL（可选）</label>
                                        <input
                                            value={form.baseUrl}
                                            onChange={(e) => setForm((prev) => ({ ...prev, baseUrl: e.target.value }))}
                                            placeholder="例如：https://dashscope.aliyuncs.com/compatible-mode/v1"
                                            className="w-full p-3 rounded-xl border border-slate-200"
                                            autoComplete="url"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500">API Key（必填）</label>
                                        <input
                                            type="password"
                                            value={form.apiKey}
                                            onChange={(e) => setForm((prev) => ({ ...prev, apiKey: e.target.value }))}
                                            placeholder="以 sk- 开头或供应商提供的密钥"
                                            className="w-full p-3 rounded-xl border border-slate-200"
                                            autoComplete="new-password"
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400">
                                    提示：只有当前“激活”的模型会参与评分。API Key 将仅保存一份脱敏显示。
                                </p>
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={handleSubmit}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
                                    >
                                        <Plus className="w-4 h-4" />
                                        添加模型
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            </main>

            {editDialog.open && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
                    <div className="admin-panel w-full max-w-lg rounded-3xl p-6 space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900">编辑模型</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500">模型名称（必填）</label>
                                <input
                                    value={form.modelName}
                                    onChange={(e) => setForm((prev) => ({ ...prev, modelName: e.target.value }))}
                                    className="w-full p-3 rounded-xl border border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500">供应商（可选）</label>
                                <input
                                    value={form.provider}
                                    onChange={(e) => setForm((prev) => ({ ...prev, provider: e.target.value }))}
                                    className="w-full p-3 rounded-xl border border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500">Base URL（可选）</label>
                                <input
                                    value={form.baseUrl}
                                    onChange={(e) => setForm((prev) => ({ ...prev, baseUrl: e.target.value }))}
                                    className="w-full p-3 rounded-xl border border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500">API Key（留空不修改）</label>
                                <input
                                    type="password"
                                    value={form.apiKey}
                                    onChange={(e) => setForm((prev) => ({ ...prev, apiKey: e.target.value }))}
                                    placeholder="不修改可留空"
                                    className="w-full p-3 rounded-xl border border-slate-200"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={closeEditDialog}
                                className="px-4 py-2 rounded-2xl border border-slate-200 text-slate-600 hover:text-slate-900"
                                disabled={isLoading}
                            >
                                取消
                            </button>
                            <button
                                onClick={async () => {
                                    await handleSubmit();
                                    closeEditDialog();
                                }}
                                className="px-4 py-2 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
                                disabled={isLoading}
                            >
                                保存修改
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLLMPage;
