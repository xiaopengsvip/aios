import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{ts,tsx,mdx}',
    './messages/**/*.json',
  ],
  theme: {
    // ── Responsive Breakpoints ──────────────────────────────
    screens: {
      'xs': '390px',      // Small phone
      'sm': '430px',      // Large phone
      'md': '768px',      // Tablet portrait
      'lg': '1024px',     // Tablet landscape / small desktop
      'xl': '1280px',     // Desktop
      '2xl': '1440px',    // Large desktop
      '3xl': '1728px',    // Ultra-wide small
      '4xl': '1920px',    // Ultra-wide
      '5xl': '2560px',    // Super ultra-wide
      '6xl': '3440px',    // Ultra-ultra-wide
      '7xl': '3840px',    // 4K
    },
    extend: {
      // ── Design Tokens ────────────────────────────────────
      colors: {
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          foreground: 'var(--surface-foreground)',
        },
        success: {
          DEFAULT: 'var(--success)',
          foreground: 'var(--success-foreground)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          foreground: 'var(--warning-foreground)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      // ── Fluid Spacing (clamp) ────────────────────────────
      spacing: {
        'fluid-xs': 'clamp(0.25rem, 0.5vw, 0.5rem)',
        'fluid-sm': 'clamp(0.5rem, 1vw, 1rem)',
        'fluid-md': 'clamp(1rem, 2vw, 2rem)',
        'fluid-lg': 'clamp(1.5rem, 3vw, 3rem)',
        'fluid-xl': 'clamp(2rem, 4vw, 4rem)',
        'fluid-2xl': 'clamp(3rem, 6vw, 6rem)',
      },
      // ── Fluid Typography ─────────────────────────────────
      fontSize: {
        'fluid-xs': ['clamp(0.7rem, 0.65rem + 0.25vw, 0.8rem)', { lineHeight: '1.5' }],
        'fluid-sm': ['clamp(0.8rem, 0.75rem + 0.25vw, 0.875rem)', { lineHeight: '1.5' }],
        'fluid-base': ['clamp(0.875rem, 0.8rem + 0.35vw, 1rem)', { lineHeight: '1.6' }],
        'fluid-lg': ['clamp(1rem, 0.9rem + 0.5vw, 1.25rem)', { lineHeight: '1.5' }],
        'fluid-xl': ['clamp(1.25rem, 1rem + 1vw, 1.75rem)', { lineHeight: '1.4' }],
        'fluid-2xl': ['clamp(1.5rem, 1.2rem + 1.5vw, 2.25rem)', { lineHeight: '1.3' }],
        'fluid-3xl': ['clamp(2rem, 1.5rem + 2vw, 3rem)', { lineHeight: '1.2' }],
        'fluid-4xl': ['clamp(2.5rem, 1.8rem + 3vw, 4rem)', { lineHeight: '1.1' }],
        'fluid-hero': ['clamp(2.5rem, 2rem + 4vw, 5.75rem)', { lineHeight: '1.05' }],
      },
      // ── Container Sizes ──────────────────────────────────
      maxWidth: {
        'container-xs': 'min(96%, 640px)',
        'container-sm': 'min(96%, 768px)',
        'container-md': 'min(96%, 1024px)',
        'container-lg': 'min(96%, 1280px)',
        'container-xl': 'min(96%, 1440px)',
        'container-2xl': 'min(96%, 1920px)',
        'container-3xl': 'min(96%, 2400px)',
        'container-4xl': 'min(96%, 3000px)',
        'container-5xl': 'min(96%, 3400px)',
      },
      // ── Sidebar & Panel Sizes ────────────────────────────
      width: {
        'sidebar': 'clamp(240px, 15vw, 280px)',
        'sidebar-collapsed': 'clamp(56px, 4vw, 72px)',
        'panel-right': 'clamp(280px, 20vw, 380px)',
        'panel-chat-left': 'clamp(220px, 15vw, 260px)',
        'panel-chat-right': 'clamp(260px, 18vw, 320px)',
      },
      // ── Animations ───────────────────────────────────────
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'fade-in-down': 'fadeInDown 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'pulse-dot': 'pulseDot 2s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'blur-reveal': 'blurReveal 0.6s ease-out',
        'count-up': 'countUp 0.8s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'typing': 'typing 1.5s steps(3) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(99, 102, 241, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.8)' },
        },
        blurReveal: {
          '0%': { opacity: '0', filter: 'blur(10px)' },
          '100%': { opacity: '1', filter: 'blur(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        typing: {
          '0%': { content: '"."' },
          '33%': { content: '".."' },
          '66%': { content: '"..."' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      // ── Backdrop ─────────────────────────────────────────
      backdropBlur: {
        'xs': '2px',
      },
      // ── Grid Templates ───────────────────────────────────
      gridTemplateColumns: {
        'dashboard': 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
        'bento': 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
        'chat': 'var(--chat-left, 260px) 1fr var(--chat-right, 320px)',
        'workspace': 'var(--sidebar-w, 280px) 1fr var(--panel-w, 0px)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
