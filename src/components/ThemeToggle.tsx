import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  // Ao carregar, verifica se o usuário já tinha uma preferência salva
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full w-10 h-10 bg-white/10 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 hover:bg-white/20 transition-all"
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-yellow-400 transition-all animate-in zoom-in duration-300" />
      ) : (
        <Moon className="h-5 w-5 text-slate-700 dark:text-slate-100 transition-all animate-in zoom-in duration-300" />
      )}
      <span className="sr-only">Alternar tema</span>
    </Button>
  );
}