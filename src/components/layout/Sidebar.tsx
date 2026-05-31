'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '@/components/ui/ThemeToggle';
import LanguageToggle from '@/components/ui/LanguageToggle';
import { useTranslations } from 'next-intl';

/* ─── User Context ─── */
interface UserInfo {
  id: string;
  numericAccount: string | null;
  username: string;
  email: string | null;
  displayName: string | null;
  avatar: string | null;
  role: string;
  status?: string;
  locale?: string;
  balance?: string;
  creditLimit?: string;
  tenantId?: string | null;
}

const UserContext = createContext<UserInfo | null>(null);
export const useUser = () => useContext(UserContext);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.user) setUser(data.user); })
      .catch(() => {});
  }, []);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

/* ─── Drawer Context ─── */
type DrawerCtx = { open: boolean; setOpen: (v: boolean) => void; toggle: () => void };
const DrawerContext = createContext<DrawerCtx>({ open: false, setOpen: () => {}, toggle: () => {} });
export const useDrawer = () => useContext(DrawerContext);

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  return (
    <DrawerContext.Provider value={{ open, setOpen, toggle }}>
      {children}
    </DrawerContext.Provider>
  );
}

/* ─── Multi-Account Storage ─── */
interface SavedAccount {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  numericAccount: string | null;
  role: string;
  savedAt: number;
}

const ACCOUNTS_KEY = 'aios_accounts';
const MAX_ACCOUNTS = 5;

function getSavedAccounts(): SavedAccount[] {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]'); }
  catch { return []; }
}

function saveAccount(account: SavedAccount) {
  const accounts = getSavedAccounts().filter(a => a.id !== account.id);
  accounts.unshift({ ...account, savedAt: Date.now() });
  if (accounts.length > MAX_ACCOUNTS) accounts.length = MAX_ACCOUNTS;
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function removeSavedAccount(id: string) {
  const accounts = getSavedAccounts().filter(a => a.id !== id);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

/* ─── User Menu (with logout & multi-account) ─── */
function UserMenu({ collapsed }: { collapsed: boolean }) {
  const user = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [switching, setSwitching] = useState<string | null>(null);
  const tCommon = useTranslations('common');

  // Load saved accounts & auto-save current user
  useEffect(() => {
    if (user) {
      saveAccount({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        numericAccount: user.numericAccount || null,
        role: user.role,
        savedAt: Date.now(),
      });
    }
    setSavedAccounts(getSavedAccounts());
  }, [user]);

  // Reset confirmLogout when menu closes
  useEffect(() => {
    if (!open) setConfirmLogout(false);
  }, [open]);

  const handleLogout = async () => {
    if (user) removeSavedAccount(user.id);
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
    const remaining = getSavedAccounts();
    if (remaining.length > 0) {
      await handleSwitchAccount(remaining[0].id);
    } else {
      window.location.href = '/login';
    }
  };

  const handleSwitchAccount = async (targetId: string) => {
    if (targetId === user?.id) return;
    setSwitching(targetId);
    try {
      const res = await fetch('/api/auth/switch-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetId }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error); }
      setOpen(false);
      window.location.reload();
    } catch (e: any) {
      alert(e.message || '切换失败');
      setSwitching(null);
    }
  };

  const handleRemoveAccount = (targetId: string) => {
    removeSavedAccount(targetId);
    setSavedAccounts(getSavedAccounts());
  };

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const roleLabel: Record<string, string> = {
    SUPER_ADMIN: '超级管理员',
    ADMIN: '管理员',
    USER: '普通用户',
    GUEST: '访客',
  };

  const otherAccounts = savedAccounts.filter(a => a.id !== user?.id);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-accent cursor-pointer transition-all text-left"
      >
        {user?.avatar ? (
          <img src={user.avatar} alt="" className="w-8 h-8 rounded-full shrink-0 object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold shrink-0 text-white">
            {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
          </div>
        )}
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.displayName || user?.username || '未登录'}</div>
            <div className="text-xs text-zinc-500 truncate">{user?.numericAccount ? `AI: ${user.numericAccount}` : user?.email || `ID: ${user?.id?.slice(-8) || '---'}`}</div>
          </div>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-0 right-0 mb-1 z-50 bg-popover border border-border rounded-xl shadow-xl overflow-hidden"
            >
              {user && (
                <div className="p-4 border-b border-border relative">
                  {/* Close button */}
                  <button onClick={() => setOpen(false)} className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" aria-label="关闭">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  {/* Avatar + name */}
                  <div className="flex items-center gap-3 mb-3">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/30" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white ring-2 ring-primary/30">
                        {(user.displayName || user.username || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{user.displayName || user.username}</div>
                      <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                    </div>
                  </div>

                  {/* Detail rows */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">系统ID</span>
                      <button
                        onClick={handleCopyId}
                        className="font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="点击复制完整 ID"
                      >
                        {copied ? '✓ 已复制' : `${user.id.slice(0, 8)}...${user.id.slice(-4)}`}
                      </button>
                    </div>
                    {user.numericAccount && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">AI 账号</span>
                        <span className="font-mono font-medium">{user.numericAccount}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">用户名</span>
                      <span className="font-medium">{user.username}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">角色</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        user.role === 'SUPER_ADMIN' ? 'bg-amber-500/15 text-amber-400' :
                        user.role === 'ADMIN' ? 'bg-red-500/15 text-red-400' :
                        'bg-primary/15 text-primary'
                      }`}>
                        {roleLabel[user.role] || user.role}
                      </span>
                    </div>
                    {user.status && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">状态</span>
                        <span className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-green-500' : 'bg-zinc-500'}`} />
                          {user.status === 'ACTIVE' ? '正常' : user.status}
                        </span>
                      </div>
                    )}
                    {user.balance !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">余额</span>
                        <span className="font-medium">{Number(user.balance || 0).toLocaleString()} 积分</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Other accounts */}
              {otherAccounts.length > 0 && (
                <div className="px-3 py-2 border-b border-border">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider px-1 mb-1.5">切换账号</div>
                  {otherAccounts.map(acc => (
                    <div key={acc.id} className="flex items-center gap-2 px-1 py-1.5 rounded-lg hover:bg-accent group">
                      <button
                        onClick={() => handleSwitchAccount(acc.id)}
                        disabled={switching === acc.id}
                        className="flex items-center gap-2 flex-1 min-w-0 text-left disabled:opacity-50"
                      >
                        {acc.avatar ? (
                          <img src={acc.avatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold shrink-0 text-white">
                            {(acc.displayName || acc.username || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">{acc.displayName || acc.username}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{acc.numericAccount ? `AI: ${acc.numericAccount}` : acc.username}</div>
                        </div>
                        {switching === acc.id && <div className="animate-spin w-3 h-3 border border-indigo-500 border-t-transparent rounded-full" />}
                      </button>
                      <button
                        onClick={() => handleRemoveAccount(acc.id)}
                        className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all"
                        title="移除该账号"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="py-1">
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                >
                  <span>⚙️</span>
                  <span>{tCommon('settings')}</span>
                </Link>
                <button
                  onClick={() => {
                    if (confirmLogout) {
                      handleLogout();
                    } else {
                      setConfirmLogout(true);
                      setTimeout(() => setConfirmLogout(false), 3000);
                    }
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                    confirmLogout ? 'text-white bg-red-600 hover:bg-red-500' : 'text-red-500 hover:bg-red-500/10'
                  }`}
                >
                  <span>{confirmLogout ? '⚠️' : '🚪'}</span>
                  <span>{confirmLogout ? '再次点击确认退出' : '退出登录'}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Role-based access ─── */
type Role = 'SUPER_ADMIN' | 'ADMIN' | 'USER' | 'GUEST';

/** Admin items each role can see (index into adminKeys). */
const adminAccess: Record<Role, number[]> = {
  SUPER_ADMIN: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], // all including installs
  ADMIN:       [0, 2, 5, 6, 8, 9],              // users, models, billing, monitor, pages, installs
  USER:        [],
  GUEST:       [],
};

/** Nav indices GUEST can access. */
const guestAllowedNav = new Set([0, 1, 10]); // chat, image, marketplace

/* ─── Nav Data ─── */
const navKeys = ['chat', 'image', 'video', 'audio', 'agent', 'workflow', 'code', 'files', 'knowledge', 'prompts', 'marketplace', 'credits', 'apiPlatform', 'usage', 'settings'] as const;
const navIcons = ['💬', '🎨', '🎬', '🎤', '🤖', '⚡', '💻', '📁', '📚', '📝', '🏪', '💰', '🔌', '📊', '⚙️'];
const navHrefs = ['/chat', '/image', '/video', '/audio', '/agent', '/workflow', '/code', '/files', '/knowledge', '/prompts', '/marketplace', '/credits', '/api-platform', '/usage', '/settings'];

const adminKeys = ['users', 'roles', 'models', 'providers', 'keys', 'billing', 'monitor', 'tenants', 'pages', 'installs'] as const;
const adminIcons = ['👥', '🎭', '🧠', '🔌', '🔑', '💰', '📊', '🏢', '📄', '📱'];
const adminHrefs = ['/admin/users', '/admin/roles', '/admin/models', '/admin/providers', '/admin/keys', '/admin/billing', '/admin/monitor', '/admin/tenants', '/admin/pages', '/admin/installs'];

/* ─── Sidebar Content (shared between desktop & drawer) ─── */
function SidebarContent({
  collapsed,
  onToggleCollapse,
  showAdmin,
  onToggleAdmin,
  onNavClick,
  isDrawer,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  showAdmin: boolean;
  onToggleAdmin: () => void;
  onNavClick?: () => void;
  isDrawer?: boolean;
}) {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const user = useUser();

  const handleLinkClick = useCallback(() => {
    onNavClick?.();
  }, [onNavClick]);

  return (
    <div className={`flex flex-col h-full ${isDrawer ? 'bg-card' : 'bg-card/50 backdrop-blur-sm'}`}>
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border shrink-0">
        <Link href="/chat" className="flex items-center gap-3 overflow-hidden" onClick={handleLinkClick}>
          <img src="/icons/icon-192.png" alt="AIOS" className="w-8 h-8 rounded-lg shrink-0 object-cover" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-semibold text-sm whitespace-nowrap"
              >
                {tCommon('appName')}
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {isDrawer && (
          <button
            onClick={onNavClick}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors text-muted-foreground"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {!isDrawer && (
          <button
            onClick={onToggleCollapse}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-accent transition-colors text-muted-foreground"
            title={collapsed ? tCommon('more') : tCommon('less')}
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        )}
      </div>

      {/* New Chat */}
      <div className="p-3">
        <Link
          href="/chat"
          onClick={handleLinkClick}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600/20 transition-all text-sm"
        >
          <span>✨</span>
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                {t('chat')}
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {navKeys.map((key, i) => {
          // GUEST only sees allowed nav items
          if (user?.role === 'GUEST' && !guestAllowedNav.has(i)) return null;
          
          const isActive = pathname === navHrefs[i];
          return (
            <Link
              key={navHrefs[i]}
              href={navHrefs[i]}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <span className="text-base shrink-0">{navIcons[i]}</span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                    {t(key)}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}

        {/* Admin - only for roles with admin access */}
        {adminAccess[user?.role as Role || 'USER']?.length > 0 && (
          <div className="pt-4 mt-4 border-t border-border">
            <button
              onClick={onToggleAdmin}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-zinc-300 w-full transition-all"
            >
              <span className="text-base shrink-0">🛡️</span>
              {!collapsed && (
                <>
                  <span className="flex-1 text-left whitespace-nowrap">{t('admin')}</span>
                  <svg className={`w-3.5 h-3.5 transition-transform ${showAdmin ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
            <AnimatePresence>
              {showAdmin && !collapsed && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  {adminKeys.map((key, i) => {
                    // Check if this admin item is allowed for the user's role
                    if (!adminAccess[user?.role as Role || 'USER']?.includes(i)) return null;
                    
                    const isActive = pathname === adminHrefs[i];
                    return (
                      <Link
                        key={adminHrefs[i]}
                        href={adminHrefs[i]}
                        onClick={handleLinkClick}
                        className={`flex items-center gap-3 px-3 py-2 ml-3 rounded-lg text-sm transition-all ${
                          isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                        }`}
                      >
                        <span className="text-sm shrink-0">{adminIcons[i]}</span>
                        <span className="whitespace-nowrap">{t(key)}</span>
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </nav>

      {/* Bottom: settings + user */}
      <div className="p-3 border-t border-border shrink-0">
        <div className="flex items-center justify-between px-1 mb-2">
          {!collapsed && <span className="text-xs text-muted-foreground">{tCommon('settings')}</span>}
          <div className="flex items-center gap-0.5">
            <LanguageToggle className="!w-8 !h-8" />
            <ThemeToggle className="!w-8 !h-8" />
          </div>
        </div>
        <UserMenu collapsed={collapsed} />
      </div>
    </div>
  );
}

/* ─── Desktop Sidebar ─── */
function DesktopSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
      className="h-screen hidden lg:flex flex-col border-r border-border relative shrink-0"
    >
      <SidebarContent
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        showAdmin={showAdmin}
        onToggleAdmin={() => setShowAdmin(!showAdmin)}
      />
    </motion.aside>
  );
}

/* ─── Mobile/Tablet Drawer ─── */
function DrawerSidebar() {
  const { open, setOpen } = useDrawer();
  const pathname = usePathname();
  const [showAdmin, setShowAdmin] = useState(false);

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname, setOpen]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.25, ease: [0.25, 0.4, 0.25, 1] }}
            className="fixed left-0 top-0 bottom-0 w-[280px] z-50 lg:hidden border-r border-border"
          >
            <SidebarContent
              collapsed={false}
              onToggleCollapse={() => {}}
              showAdmin={showAdmin}
              onToggleAdmin={() => setShowAdmin(!showAdmin)}
              onNavClick={() => setOpen(false)}
              isDrawer
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Export: Sidebar (desktop + drawer combined) ─── */
export default function Sidebar() {
  return (
    <>
      <DesktopSidebar />
      <DrawerSidebar />
    </>
  );
}
