"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Monitor, Moon, Sun } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="p-2 rounded-md border border-gray-300 dark:border-gray-600">
        <div className="w-5 h-5" />
      </button>
    );
  }

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getIcon = () => {
    if (theme === "system") {
      return <Monitor className="w-5 h-5" />;
    }
    return theme === "dark" ? (
      <Moon className="w-5 h-5 dark:text-white text-black" />
    ) : (
      <Sun className="w-5 h-5 dark:text-white text-black" />
    );
  };

  const getTooltipContent = () => {
    if (theme === "system") {
      return `Theme: System (${resolvedTheme === "dark" ? "Dark" : "Light"})`;
    }
    return `Theme: ${theme === "dark" ? "Dark" : "Light"}`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant={"outline"} onClick={toggleTheme} size={"icon"}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={theme}
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 1, opacity: 0 }}
                exit={{ scale: 0, opacity: 1 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                {getIcon()}
              </motion.div>
            </AnimatePresence>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Theme</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
