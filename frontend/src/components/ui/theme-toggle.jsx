import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/theme.context';

/**
 * A reusable theme toggle button component
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.variant - Button variant (default: "ghost")
 * @param {string} props.size - Button size (default: "icon")
 * @returns {JSX.Element} Theme toggle button
 */
export function ThemeToggle({ 
  className = "",
  variant = "ghost",
  size = "icon" 
}) {
  const { isDarkMode, toggleTheme } = useTheme();
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={className}
      aria-label="Toggle theme"
    >
      {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
