import React, { useEffect, useState } from 'react';
import { Cpu, Loader2, RefreshCcw, Plus, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../api/client.js';
import AdminHeader from './AdminHeader.jsx';

const PROVIDER_PRESETS = {
    DashScope: {
        provider: 'DashScope',
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        modelName: 'qwen-plus',
    },
    DeepSeek: {
        provider: 'DeepSeek',
        baseUrl: 'https://api.deepseek.com/v1',
        modelName: 'deepseek-chat',
    },
    OpenAI: {
        provider: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        modelName: 'gpt-4o-mini',
    },
    Groq: {
        provider: 'Groq',
        baseUrl: 'https://api.groq.com/openai/v1',
        modelName: 'llama-3.3-70b-versatile',
    },
    OpenRouter: {
        provider: 'OpenRouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        modelName: 'openrouter/free',
    },
};

const AdminLLMPage = ({ onLogout }) => {
    const [status, setStatus] = useState(null);
    const [configs, setConfigs] = useState([]);
    const [form, setForm] = useState({ modelName: '', provider: '', baseUrl: '', apiKey: '', quotaTokens: '', isActive: true });
    const [editingId, setEditingId] = useState(null);
    const [editDialog, setEditDialog] = useState({ open: false, config: null });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [testResult, setTestResult] = useState(null);
    const [balanceMap, setBalanceMap] = useState({});
    const [balanceLoadingId, setBalanceLoadingId] = useState(null);

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
    const hasQuota = quota !== null && quota !== undefined;
    const usageRatio = hasQuota && quota > 0 ? Math.min((used / quota) * 100, 100) : 0;

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
                        quotaTokens: form.quotaTokens === '' ? null : form.quotaTokens,
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
                        quotaTokens: form.quotaTokens === '' ? null : form.quotaTokens,
                        isActive: !!form.isActive,
                    },
                });
            }
            setForm({ modelName: '', provider: '', baseUrl: '', apiKey: '', quotaTokens: '', isActive: true });
            setTestResult(null);
            setEditingId(null);
            await loadStatus();
        } catch (err) {
            setError(err.message || (editingId ? '更新模型失败。' : '新增模型失败。'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestConnection = async () => {
        if (!form.modelName || !form.apiKey) {
            setError('测试连通性需要填写 modelName 和 apiKey。');
            return;
        }
        setIsLoading(true);
        setError(null);
        setTestResult(null);
        try {
            const result = await apiRequest('/api/v1/admin/llm/test', {
                method: 'POST',
                data: {
                    modelName: form.modelName,
                    provider: form.provider,
                    baseUrl: form.baseUrl,
                    apiKey: form.apiKey,
                },
            });
            setTestResult(result);
        } catch (err) {
            setError(err.message || '连通性测试失败。');
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
            quotaTokens: config.quotaTokens ?? '',
            isActive: !!config.isActive,
        });
        setTestResult(null);
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

    const handleQueryBalance = async (configId) => {
        setBalanceLoadingId(configId);
        setError(null);
        try {
            const result = await apiRequest(`/api/v1/admin/llm/configs/${configId}/balance`);
            setBalanceMap((prev) => ({ ...prev, [configId]: result }));
        } catch (err) {
            setError(err.message || '余额查询失败。');
        } finally {
            setBalanceLoadingId(null);
        }
    };

    const closeEditDialog = () => {
        setEditDialog({ open: false, config: null });
        setEditingId(null);
        setForm({ modelName: '', provider: '', baseUrl: '', apiKey: '', quotaTokens: '', isActive: true });
        setTestResult(null);
    };

    const applyPreset = (presetName) => {
        const preset = PROVIDER_PRESETS[presetName];
        if (!preset) {
            return;
        }
        setForm((prev) => ({
            ...prev,
            provider: preset.provider,
            baseUrl: preset.baseUrl,
            modelName: prev.modelName || preset.modelName,
        }));
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
                            <p className="text-xs text-slate-400 mt-1">
                                当前来源：{status?.source === 'db' ? '数据库激活配置' : '环境变量默认配置'}
                            </p>
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
                                            {remaining !== null && remaining !== undefined ? remaining.toLocaleString() : '未配置'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-slate-400">
                                        <span>最后一次调用</span>
                                        <span>{status?.lastUsedAt ? new Date(status.lastUsedAt).toLocaleString('zh-CN') : '—'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-slate-400">
                                        <span>运行 Base URL</span>
                                        <span className="truncate max-w-[16rem] text-right">{status?.baseUrl || '—'}</span>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500"
                                            style={{ width: hasQuota ? `${usageRatio}%` : '0%' }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">
                                        {hasQuota ? `已使用 ${usageRatio.toFixed(1)}%` : '未设置当前模型额度'}
                                    </p>
                                </div>
                                </div>

                                <div className="admin-panel rounded-3xl p-6 space-y-4">
                                    <h3 className="text-lg font-semibold text-slate-900">配置提示</h3>
                                    <ul className="text-sm text-slate-600 space-y-3">
                                        <li>仅展示与统计当前激活模型的 token 使用。</li>
                                        <li>模型配置会保存在数据库，请妥善管理密钥。</li>
                                        <li>新增后建议先做“测试连通性”，再激活投入使用。</li>
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
                                                <div className="text-xs text-slate-500">本月已用: {(item.usedTokens ?? 0).toLocaleString()}</div>
                                                <div className="text-xs text-slate-500">模型额度: {item.quotaTokens !== null && item.quotaTokens !== undefined ? item.quotaTokens.toLocaleString() : '未配置'}</div>
                                                <div className="text-xs text-slate-500">剩余额度: {item.remainingTokens !== null && item.remainingTokens !== undefined ? item.remainingTokens.toLocaleString() : '未配置'}</div>
                                                <div className="text-xs text-slate-500">最后调用: {item.lastUsedAt ? new Date(item.lastUsedAt).toLocaleString('zh-CN') : '—'}</div>
                                                <div className="text-xs text-slate-500">API Key: {item.apiKeyMasked}</div>
                                                {balanceMap[item.id] && (
                                                    <div className="text-xs rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-slate-600 space-y-1">
                                                        <div>余额来源: {balanceMap[item.id].provider || item.provider || 'Unknown'}</div>
                                                        {balanceMap[item.id].supported ? (
                                                            <>
                                                                <div>可用状态: {balanceMap[item.id].isAvailable ? '可用' : '不可用'}</div>
                                                                <div>总余额: {balanceMap[item.id].totalBalance ?? '—'} {balanceMap[item.id].currency || ''}</div>
                                                                <div>赠送余额: {balanceMap[item.id].grantedBalance ?? '—'}</div>
                                                                <div>充值余额: {balanceMap[item.id].toppedUpBalance ?? '—'}</div>
                                                            </>
                                                        ) : (
                                                            <div>{balanceMap[item.id].message || '当前提供商暂不支持余额查询。'}</div>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-3 pt-2 text-xs">
                                                    <button
                                                        onClick={() => handleQueryBalance(item.id)}
                                                        className="text-emerald-700 hover:text-emerald-900"
                                                        disabled={balanceLoadingId === item.id}
                                                    >
                                                        {balanceLoadingId === item.id ? '查询中...' : '查询余额'}
                                                    </button>
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
                                <div className="flex flex-wrap gap-2">
                                    {Object.keys(PROVIDER_PRESETS).map((name) => (
                                        <button
                                            key={name}
                                            onClick={() => applyPreset(name)}
                                            className="px-3 py-1.5 rounded-full border border-slate-200 text-xs text-slate-600 hover:text-slate-900 hover:border-slate-300"
                                        >
                                            套用 {name}
                                        </button>
                                    ))}
                                </div>
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
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500">模型额度 Token（可选）</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={form.quotaTokens}
                                            onChange={(e) => setForm((prev) => ({ ...prev, quotaTokens: e.target.value }))}
                                            placeholder="例如：1000000"
                                            className="w-full p-3 rounded-xl border border-slate-200"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500">创建后立即激活</label>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setForm((prev) => ({ ...prev, isActive: true }))}
                                                className={`px-3 py-2 rounded-2xl text-sm border transition ${
                                                    form.isActive
                                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                                        : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
                                                }`}
                                                aria-pressed={!!form.isActive}
                                            >
                                                立即激活
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setForm((prev) => ({ ...prev, isActive: false }))}
                                                className={`px-3 py-2 rounded-2xl text-sm border transition ${
                                                    !form.isActive
                                                        ? 'bg-slate-900 text-white border-slate-900'
                                                        : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
                                                }`}
                                                aria-pressed={!form.isActive}
                                            >
                                                仅保存配置
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                {testResult && (
                                    <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                                        连通性测试成功：model={testResult.model}，baseUrl={testResult.baseUrl}
                                    </div>
                                )}
                                <p className="text-xs text-slate-400">
                                    提示：额度是“每个模型独立配置”。只有当前“激活”的模型会参与评分。API Key 将仅保存一份脱敏显示。
                                </p>
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={handleTestConnection}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-slate-200 text-slate-700 hover:text-slate-900"
                                    >
                                        测试连通性
                                    </button>
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
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500">模型额度 Token（可选）</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.quotaTokens}
                                    onChange={(e) => setForm((prev) => ({ ...prev, quotaTokens: e.target.value }))}
                                    placeholder="留空表示不限制"
                                    className="w-full p-3 rounded-xl border border-slate-200"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={handleTestConnection}
                                className="px-4 py-2 rounded-2xl border border-slate-200 text-slate-600 hover:text-slate-900"
                                disabled={isLoading}
                            >
                                测试连通性
                            </button>
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
