import type { Config } from 'tailwindcss'
const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}','./lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:{'50':'#F0F4FB','100':'#D9E3F4','200':'#B3C7E9','300':'#8DAEDE','400':'#5A89CB','500':'#1E3A5F','600':'#163050','700':'#0F2035','800':'#0A1525','900':'#050B14',DEFAULT:'#1E3A5F',foreground:'#FFFFFF'},
        accent: {'50':'#FDF8EC','100':'#F9EECA','200':'#F3DC95','300':'#ECC95A','400':'#D4B96A','500':'#C9A84C','600':'#B8943D','700':'#96762A',DEFAULT:'#C9A84C',foreground:'#0F2035'},
        sidebar:'#0C1E36','sidebar-light':'#132540','sidebar-hover':'rgba(255,255,255,0.06)','sidebar-active':'rgba(201,168,76,0.12)','sidebar-border':'rgba(255,255,255,0.07)',
        success:{DEFAULT:'#16A34A','50':'#F0FDF4','100':'#DCFCE7'},
        warning:{DEFAULT:'#D97706','50':'#FFFBEB','100':'#FEF3C7'},
        danger: {DEFAULT:'#DC2626','50':'#FEF2F2','100':'#FEE2E2'},
        info:   {DEFAULT:'#0284C7','50':'#F0F9FF','100':'#E0F2FE'},
        surface:'#FFFFFF','surface-raised':'#F5F7FA','surface-overlay':'#ECEEF2',
        'text-primary':'#0F172A','text-secondary':'#475569','text-muted':'#94A3B8',
        'border-subtle':'#E8EBF0','border-default':'#D1D5DB','border-strong':'#9CA3AF',
      },
      fontFamily: {
        display:['"Cairo Display"','Cairo','system-ui','sans-serif'],
        sans:   ['Cairo','Tajawal','system-ui','sans-serif'],
        mono:   ['"IBM Plex Mono"','Consolas','monospace'],
      },
      boxShadow: {
        'card':    '0 2px 8px rgba(15,32,53,0.06),0 1px 3px rgba(15,32,53,0.04)',
        'elevated':'0 8px 24px rgba(15,32,53,0.10),0 2px 8px rgba(15,32,53,0.06)',
        'modal':   '0 24px 64px rgba(15,32,53,0.18),0 8px 24px rgba(15,32,53,0.08)',
      },
      borderRadius:{sm:'6px',DEFAULT:'10px',md:'12px',lg:'16px',xl:'20px','2xl':'24px'},
      backgroundImage: {
        'gradient-primary':'linear-gradient(135deg,#1E3A5F 0%,#0F2035 100%)',
        'gradient-accent': 'linear-gradient(135deg,#D4B96A 0%,#C9A84C 100%)',
        'gradient-hero':   'linear-gradient(135deg,#0C1E36 0%,#1E3A5F 50%,#163050 100%)',
      },
    },
  },
  plugins: [],
}
export default config
