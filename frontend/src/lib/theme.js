// Sistema de temas - Trading Calculator PRO
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'dark', // 'dark', 'light', 'system'
      
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },
      
      toggleTheme: () => {
        const current = get().theme;
        const next = current === 'dark' ? 'light' : 'dark';
        set({ theme: next });
        applyTheme(next);
      },
      
      initTheme: () => {
        const theme = get().theme;
        applyTheme(theme);
      }
    }),
    { name: 'trading-theme-storage' }
  )
);

function applyTheme(theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  let isDark;
  if (theme === 'system') {
    isDark = prefersDark;
  } else {
    isDark = theme === 'dark';
  }
  
  if (isDark) {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }
}

// Inicializar tema al cargar
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('trading-theme-storage');
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      applyTheme(state?.theme || 'dark');
    } catch {
      applyTheme('dark');
    }
  }
}
