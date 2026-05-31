'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { siteConfig } from '@/config/site';
import ThemeToggle from '@/components/ui/ThemeToggle';
import LanguageToggle from '@/components/ui/LanguageToggle';

// ═══════════════════════════════════════════════════════════
// Animation Variants
// ═══════════════════════════════════════════════════════════
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.4, 0.25, 1] as const },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// ═══════════════════════════════════════════════════════════
// Animated Demo (Hero Right Side)
// ═══════════════════════════════════════════════════════════
function HeroDemo() {
  const [typedText, setTypedText] = useState('');
  const [showResponse, setShowResponse] = useState(false);
  const [agentSteps, setAgentSteps] = useState<number[]>([]);
  const fullText = '帮我写一个Python快速排序算法';
  const responseText = `def quicksort(arr):
    """快速排序算法"""
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)`;

  useEffect(() => {
    let i = 0;
    const typeTimer = setInterval(() => {
      if (i < fullText.length) {
        setTypedText(fullText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(typeTimer);
        setTimeout(() => setShowResponse(true), 500);
        // Agent steps
        [0, 1, 2, 3].forEach((step, idx) => {
          setTimeout(() => setAgentSteps(prev => [...prev, step]), 800 + idx * 600);
        });
      }
    }, 60);
    return () => clearInterval(typeTimer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="relative"
    >
      {/* Glow background */}
      <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-purple-500/10 to-pink-500/20 rounded-3xl blur-2xl opacity-60" />

      <div className="relative rounded-2xl border border-border bg-card/90 backdrop-blur-xl overflow-hidden shadow-2xl">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card/50">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-xs text-muted-foreground font-mono">aios.vios.top/chat</span>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>

        {/* Chat content */}
        <div className="p-4 sm:p-6 space-y-4 min-h-[320px] sm:min-h-[400px]">
          {/* Model selector bar */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-400 font-medium">MiMo V2.5 Pro</span>
            <span>·</span>
            <span>Streaming</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Online
            </span>
          </div>

          {/* User message */}
          <div className="flex justify-end">
            <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-md bg-primary text-primary-foreground text-sm">
              {typedText}
              <span className="inline-block w-0.5 h-4 bg-white/70 ml-0.5 animate-pulse" />
            </div>
          </div>

          {/* AI Response */}
          <AnimatePresence>
            {showResponse && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                  AI
                </div>
                <div className="flex-1 space-y-3">
                  <pre className="text-xs sm:text-sm bg-card/50 rounded-xl p-3 sm:p-4 overflow-x-auto border border-border">
                    <code className="text-green-400">{responseText}</code>
                  </pre>

                  {/* Agent steps */}
                  <div className="space-y-1.5">
                    {agentSteps.map((step) => {
                      const labels = ['分析代码需求', '生成算法代码', '添加详细注释', '代码优化检查'];
                      return (
                        <motion.div
                          key={step}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                        >
                          <span className="w-4 h-4 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-[10px]">✓</span>
                          {labels[step]}
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Token stats */}
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1">
                    <span>📊 248 tokens</span>
                    <span>⚡ 1.2s</span>
                    <span>💰 $0.003</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// Feature Card
// ═══════════════════════════════════════════════════════════
function FeatureCard({ icon, name, desc, tag, span2 }: {
  icon: string; name: string; desc: string; tag: string; span2?: boolean;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className={`group relative rounded-2xl border border-border bg-card/50 p-5 sm:p-6 hover:border-indigo-500/30 hover:bg-card/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/5 ${span2 ? 'md:col-span-2' : ''}`}
    >
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <span className="text-2xl sm:text-3xl">{icon}</span>
        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          {tag}
        </span>
      </div>
      <h3 className="text-base sm:text-lg font-semibold mb-2">{name}</h3>
      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{desc}</p>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// Counter Animation
// ═══════════════════════════════════════════════════════════
function Counter({ end, suffix = '', duration = 2 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// ═══════════════════════════════════════════════════════════
// FAQ Accordion
// ═══════════════════════════════════════════════════════════
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 sm:py-5 text-left hover:text-primary transition-colors"
      >
        <span className="font-medium text-sm sm:text-base pr-4">{q}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          className="text-xl text-muted-foreground shrink-0"
        >
          +
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-4 sm:pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Main Landing Page
// ═══════════════════════════════════════════════════════════
export default function LandingPage() {
  const t = useTranslations('landing');
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check auth status — logged in users go to /chat
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) {
          router.replace('/chat');
        } else {
          setCheckingAuth(false);
        }
      })
      .catch(() => setCheckingAuth(false));
  }, [router]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Show nothing while checking auth (prevents flash of landing page)
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const featureKeys = ['chat', 'agent', 'workflow', 'mcp', 'knowledge', 'video', 'image', 'audio'] as const;
  const featureIcons = ['💬', '🤖', '⚡', '🔌', '📚', '🎬', '🎨', '🎤'];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* ── Navbar ───────────────────────────────────────── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'glass shadow-lg' : ''}`}>
        <div className="container-responsive flex items-center justify-between h-14 sm:h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <img src="/icons/icon-192.png" alt="AIOS" className="w-8 h-8 rounded-lg object-cover" />
            <span className="hidden xs:inline">AIOS</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 lg:gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">{t('nav.features')}</a>
            <a href="#stats" className="hover:text-foreground transition-colors">{t('nav.pricing')}</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle />
            <ThemeToggle />
            <Link href="/login" className="hidden sm:inline-flex text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">
              {t('nav.login')}
            </Link>
            <Link href="/register" className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium">
              {t('nav.register')}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ─────────────────────────────────── */}
      <section className="relative pt-24 sm:pt-32 md:pt-40 pb-12 sm:pb-20">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.15),transparent)]" />

        <div className="container-responsive relative">
          <div className="grid lg:grid-cols-[45%_1fr] gap-8 lg:gap-12 xl:gap-16 items-center">

            {/* Left: Copy */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="text-center lg:text-left"
            >
              {/* Badge */}
              <motion.div variants={fadeUp} custom={0}>
                <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-xs sm:text-sm text-indigo-400 font-medium mb-6 sm:mb-8">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  {t('hero.badge')}
                </span>
              </motion.div>

              {/* Title */}
              <motion.h1 variants={fadeUp} custom={1} className="text-hero font-extrabold tracking-tight mb-4 sm:mb-6">
                <span className="text-gradient">{t('hero.title').split('，')[0]}，</span>
                <br />
                {t('hero.title').split('，').slice(1).join('，')}
              </motion.h1>

              {/* Subtitle */}
              <motion.p variants={fadeUp} custom={2} className="text-fluid-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-6 sm:mb-8 leading-relaxed">
                {t('hero.subtitle')}
              </motion.p>

              {/* CTAs */}
              <motion.div variants={fadeUp} custom={3} className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-4 mb-8 sm:mb-10">
                <Link href="/register" className="btn-magnetic px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm sm:text-base hover:bg-primary/90 transition-all shadow-lg shadow-indigo-500/25">
                  {t('hero.cta')} →
                </Link>
                <Link href="/demo" className="px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl border border-border text-sm sm:text-base font-medium hover:bg-accent transition-all">
                  {t('hero.ctaSecondary')}
                </Link>
                <Link href="/docs" className="px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors">
                  {t('hero.ctaGhost')}
                </Link>
              </motion.div>

              {/* Stats row */}
              <motion.div variants={fadeUp} custom={4} className="flex flex-wrap justify-center lg:justify-start gap-x-5 sm:gap-x-8 gap-y-2">
                {[t('hero.statsModels'), t('hero.statsMCP'), t('hero.statsUptime'), t('hero.statsUsers')].map((stat, i) => (
                  <span key={i} className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    {stat}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            {/* Right: Demo */}
            <div className="hidden md:block">
              <HeroDemo />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Bento Grid ──────────────────────────── */}
      <section id="features" className="py-16 sm:py-24 md:py-32">
        <div className="container-responsive">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="text-center mb-12 sm:mb-16"
          >
            <motion.h2 variants={fadeUp} className="text-display mb-3 sm:mb-4">{t('features.title')}</motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-fluid-lg text-muted-foreground max-w-2xl mx-auto">
              {t('features.subtitle')}
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"
          >
            {featureKeys.map((key, i) => (
              <FeatureCard
                key={key}
                icon={featureIcons[i]}
                name={t(`features.${key}.name`)}
                desc={t(`features.${key}.desc`)}
                tag={t(`features.${key}.tag`)}
                span2={key === 'chat' || key === 'agent'}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Stats Section ────────────────────────────────── */}
      <section id="stats" className="py-16 sm:py-24 md:py-32 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(99,102,241,0.08),transparent)]" />
        <div className="container-responsive relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-12 sm:mb-16"
          >
            <motion.h2 variants={fadeUp} className="text-display mb-3 sm:mb-4">{t('stats.title')}</motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-fluid-lg text-muted-foreground">{t('stats.subtitle')}</motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
          >
            {[
              { num: 50, suffix: '+', label: t('stats.models') },
              { num: 12, suffix: 'K+', label: t('stats.agents') },
              { num: 1, suffix: 'M+', label: t('stats.workflows') },
              { num: 86, suffix: 'B+', label: t('stats.tokens') },
            ].map((stat, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="text-center p-5 sm:p-8 rounded-2xl border border-border bg-card/30 hover:bg-card/60 transition-all"
              >
                <div className="text-fluid-3xl sm:text-fluid-4xl font-extrabold text-gradient mb-2">
                  <Counter end={stat.num} suffix={stat.suffix} />
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────── */}
      <section className="py-16 sm:py-24 md:py-32">
        <div className="container-responsive">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-12 sm:mb-16"
          >
            <motion.h2 variants={fadeUp} className="text-display mb-3 sm:mb-4">{t('testimonials.title')}</motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-fluid-lg text-muted-foreground">{t('testimonials.subtitle')}</motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="p-5 sm:p-6 rounded-2xl border border-border bg-card/50 hover:bg-card/80 transition-all"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <span key={j} className="text-yellow-500 text-sm">★</span>
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-5 sm:mb-6 italic">
                  &ldquo;{t(`testimonials.items.${i}.quote`)}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                    {t(`testimonials.items.${i}.avatar`)}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{t(`testimonials.items.${i}.name`)}</div>
                    <div className="text-xs text-muted-foreground">{t(`testimonials.items.${i}.role`)}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section id="faq" className="py-16 sm:py-24 md:py-32">
        <div className="container-responsive max-w-3xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-12 sm:mb-16"
          >
            <motion.h2 variants={fadeUp} className="text-display mb-3 sm:mb-4">{t('faq.title')}</motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-fluid-lg text-muted-foreground">{t('faq.subtitle')}</motion.p>
          </motion.div>

          <div className="rounded-2xl border border-border bg-card/30 px-5 sm:px-8">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <FAQItem key={i} q={t(`faq.items.${i}.q`)} a={t(`faq.items.${i}.a`)} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ──────────────────────────────────── */}
      <section className="py-16 sm:py-24 md:py-32">
        <div className="container-responsive">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-8 sm:p-12 md:p-16 text-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_0%,rgba(99,102,241,0.2),transparent)]" />
            <div className="relative">
              <h2 className="text-display mb-3 sm:mb-4">{t('cta.title')}</h2>
              <p className="text-fluid-lg text-muted-foreground max-w-xl mx-auto mb-6 sm:mb-8">{t('cta.subtitle')}</p>
              <Link href="/register" className="btn-magnetic inline-flex px-7 sm:px-10 py-3 sm:py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base sm:text-lg hover:bg-primary/90 transition-all shadow-lg shadow-indigo-500/25">
                {t('cta.button')}
              </Link>
              <p className="mt-4 text-xs text-muted-foreground">{t('cta.note')}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-border py-12 sm:py-16">
        <div className="container-responsive">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 mb-10 sm:mb-12">
            {(['product', 'resources', 'company', 'legal'] as const).map((section) => {
              const links: Record<string, { key: string; href: string }[]> = {
                product: [
                  { key: 'chat', href: '/chat' },
                  { key: 'agent', href: '/agent' },
                  { key: 'workflow', href: '/workflow' },
                  { key: 'mcp', href: '/marketplace' },
                  { key: 'pricing', href: '/p/pricing' },
                ],
                resources: [
                  { key: 'docs', href: '/docs' },
                  { key: 'api', href: '/api-platform' },
                  { key: 'blog', href: '/p/blog' },
                  { key: 'changelog', href: '/p/changelog' },
                  { key: 'status', href: '/p/status' },
                ],
                company: [
                  { key: 'about', href: '/p/about' },
                  { key: 'careers', href: '/p/careers' },
                  { key: 'contact', href: '/p/contact' },
                  { key: 'partners', href: '/p/partners' },
                ],
                legal: [
                  { key: 'privacy', href: '/p/privacy' },
                  { key: 'terms', href: '/p/terms' },
                  { key: 'security', href: '/p/security' },
                ],
              };
              return (
                <div key={section}>
                  <h4 className="font-semibold text-sm mb-3 sm:mb-4">{t(`footer.${section}.title`)}</h4>
                  <ul className="space-y-2">
                    {links[section].map((link) => (
                      <li key={link.key}>
                        <Link href={link.href} className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">
                          {t(`footer.${section}.${link.key}`)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 sm:pt-8 border-t border-border">
            <div className="flex items-center gap-2">
              <img src="/icons/icon-192.png" alt="AIOS" className="w-7 h-7 rounded-lg object-cover" />
              <span className="text-sm font-semibold">AIOS</span>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {t('footer.copyright')} · v{siteConfig.version}
            </div>
            <div className="flex items-center gap-3">
              <a href={siteConfig.github} target="_blank" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
