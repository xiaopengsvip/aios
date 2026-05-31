'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface Role {
  id: string;
  name: string;
  label: string;
  description: string | null;
  permissions: string[];
  color: string | null;
  isSystem: boolean;
  sortOrder: number;
  isActive: boolean;
  _count?: { users: number };
}

const availablePermissions = [
  { id: 'admin.users', label: '用户管理', group: '管理后台' },
  { id: 'admin.models', label: '模型管理', group: '管理后台' },
  { id: 'admin.providers', label: '供应商管理', group: '管理后台' },
  { id: 'admin.keys', label: '密钥管理', group: '管理后台' },
  { id: 'admin.billing', label: '计费管理', group: '管理后台' },
  { id: 'admin.monitor', label: '监控面板', group: '管理后台' },
  { id: 'admin.tenants', label: '租户管理', group: '管理后台' },
  { id: 'admin.pages', label: '页面管理', group: '管理后台' },
  { id: 'admin.roles', label: '角色管理', group: '管理后台' },
  { id: 'nav.all', label: '所有导航', group: '导航' },
  { id: 'nav.chat', label: 'AI 对话', group: '导航' },
  { id: 'nav.image', label: 'AI 绘图', group: '导航' },
  { id: 'nav.video', label: 'AI 视频', group: '导航' },
  { id: 'nav.audio', label: 'AI 音频', group: '导航' },
  { id: 'nav.agent', label: 'AI 智能体', group: '导航' },
  { id: 'nav.workflow', label: '工作流', group: '导航' },
  { id: 'nav.code', label: '代码工作台', group: '导航' },
  { id: 'nav.files', label: '文件管理', group: '导航' },
  { id: 'nav.knowledge', label: '知识库', group: '导航' },
  { id: 'nav.prompts', label: '提示词库', group: '导航' },
  { id: 'nav.marketplace', label: '应用市场', group: '导航' },
  { id: 'nav.credits', label: '积分中心', group: '导航' },
  { id: 'nav.apiPlatform', label: 'API 平台', group: '导航' },
  { id: 'nav.usage', label: '使用统计', group: '导航' },
  { id: 'nav.settings', label: '设置', group: '导航' },
];

const colorOptions = [
  { value: 'bg-purple-500/10 text-purple-500 border-purple-500/20', label: '紫色', preview: 'bg-purple-500' },
  { value: 'bg-amber-500/10 text-amber-500 border-amber-500/20', label: '琥珀', preview: 'bg-amber-500' },
  { value: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', label: '翠绿', preview: 'bg-emerald-500' },
  { value: 'bg-blue-500/10 text-blue-500 border-blue-500/20', label: '蓝色', preview: 'bg-blue-500' },
  { value: 'bg-red-500/10 text-red-500 border-red-500/20', label: '红色', preview: 'bg-red-500' },
  { value: 'bg-pink-500/10 text-pink-500 border-pink-500/20', label: '粉色', preview: 'bg-pink-500' },
  { value: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20', label: '青色', preview: 'bg-cyan-500' },
  { value: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', label: '灰色', preview: 'bg-zinc-500' },
];

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    description: '',
    permissions: [] as string[],
    color: colorOptions[3].value,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/admin/roles');
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      label: '',
      description: '',
      permissions: ['nav.all'],
      color: colorOptions[3].value,
    });
    setError('');
    setShowModal(true);
  };

  const handleEdit = (role: Role) => {
    if (role.isSystem) {
      alert('系统内置角色不可编辑');
      return;
    }
    setEditingRole(role);
    setFormData({
      name: role.name,
      label: role.label,
      description: role.description || '',
      permissions: Array.isArray(role.permissions) ? role.permissions : [],
      color: role.color || colorOptions[3].value,
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.label) {
      setError('角色标识和名称必填');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const url = editingRole ? '/api/admin/roles' : '/api/admin/roles';
      const method = editingRole ? 'PUT' : 'POST';
      const body = editingRole
        ? { id: editingRole.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '保存失败');
        return;
      }

      setShowModal(false);
      fetchRoles();
    } catch (error) {
      setError('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role: Role) => {
    if (role.isSystem) {
      alert('系统内置角色不可删除');
      return;
    }

    if (!confirm(`确定要删除角色 "${role.label}" 吗？`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/roles?id=${role.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || '删除失败');
        return;
      }

      fetchRoles();
    } catch (error) {
      alert('删除失败');
    }
  };

  const togglePermission = (permId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">角色管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理系统角色和权限，自定义不同角色的访问控制
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          + 创建角色
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <motion.div
            key={role.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${role.color || 'bg-muted text-muted-foreground'}`}>
                  {role.label}
                </span>
                {role.isSystem && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    系统
                  </span>
                )}
              </div>
              {!role.isSystem && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(role)}
                    className="p-1.5 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                    title="编辑"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(role)}
                    className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors text-muted-foreground hover:text-red-500"
                    title="删除"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {role.description || '暂无描述'}
            </p>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>标识: <code className="bg-muted px-1 py-0.5 rounded">{role.name}</code></span>
              <span>{role._count?.users || 0} 个用户</span>
            </div>

            {/* Permissions Preview */}
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-xs text-muted-foreground mb-2">权限:</div>
              <div className="flex flex-wrap gap-1">
                {(Array.isArray(role.permissions) ? role.permissions : []).slice(0, 3).map((perm) => {
                  const permInfo = availablePermissions.find(p => p.id === perm);
                  return (
                    <span key={perm} className="text-[10px] bg-accent px-1.5 py-0.5 rounded">
                      {permInfo?.label || perm}
                    </span>
                  );
                })}
                {(Array.isArray(role.permissions) ? role.permissions : []).length > 3 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{(Array.isArray(role.permissions) ? role.permissions : []).length - 3}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h2 className="text-lg font-semibold">
                    {editingRole ? '编辑角色' : '创建新角色'}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-accent rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                  {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Name & Label */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1.5">
                          角色标识 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="如: editor, moderator"
                          disabled={!!editingRole}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                        />
                        <p className="text-xs text-muted-foreground mt-1">小写字母开头，可含数字和下划线</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">
                          显示名称 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.label}
                          onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                          placeholder="如: 编辑者, 版主"
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium mb-1.5">描述</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="角色描述..."
                        rows={2}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      />
                    </div>

                    {/* Color */}
                    <div>
                      <label className="block text-sm font-medium mb-1.5">颜色</label>
                      <div className="flex flex-wrap gap-2">
                        {colorOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setFormData(prev => ({ ...prev, color: opt.value }))}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                              formData.color === opt.value
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:bg-accent'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full ${opt.preview}`} />
                            <span className="text-sm">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Permissions */}
                    <div>
                      <label className="block text-sm font-medium mb-1.5">权限</label>
                      <div className="space-y-3">
                        {/* Admin permissions */}
                        <div>
                          <div className="text-xs text-muted-foreground mb-2">管理后台</div>
                          <div className="flex flex-wrap gap-2">
                            {availablePermissions.filter(p => p.group === '管理后台').map((perm) => (
                              <button
                                key={perm.id}
                                onClick={() => togglePermission(perm.id)}
                                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                                  formData.permissions.includes(perm.id)
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border hover:bg-accent text-muted-foreground'
                                }`}
                              >
                                {perm.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Nav permissions */}
                        <div>
                          <div className="text-xs text-muted-foreground mb-2">导航访问</div>
                          <div className="flex flex-wrap gap-2">
                            {availablePermissions.filter(p => p.group === '导航').map((perm) => (
                              <button
                                key={perm.id}
                                onClick={() => togglePermission(perm.id)}
                                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                                  formData.permissions.includes(perm.id)
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border hover:bg-accent text-muted-foreground'
                                }`}
                              >
                                {perm.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm hover:bg-accent rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {saving ? '保存中...' : (editingRole ? '保存修改' : '创建角色')}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
