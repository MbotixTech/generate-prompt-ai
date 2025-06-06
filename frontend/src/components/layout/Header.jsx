import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth.context';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { User, LogOut, Crown, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="font-bold text-base md:text-xl whitespace-nowrap">
            <span className="hidden sm:inline">{t('common.app_name')}</span>
            <span className="sm:hidden">MBOTIX</span>
          </Link>
          {user && user.role && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              user.role === 'pro' ? 'bg-primary text-primary-foreground' : 
              user.role === 'admin' ? 'bg-destructive text-destructive-foreground' : 
              'bg-muted text-muted-foreground'
            }`}>
              {user.role.toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-4 mr-4">
            <Link 
              to="/dashboard" 
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {t('common.dashboard')}
            </Link>
            
            {user && user.role === 'free' && (
              <Link 
                to="/upgrade" 
                className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1"
              >
                <Crown className="h-4 w-4" />
                {t('common.upgrade_pro')}
              </Link>
            )}
            
            {user && user.role === 'admin' && (
              <Link 
                to="/admin" 
                className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1"
              >
                <ShieldCheck className="h-4 w-4" />
                {t('common.admin_panel')}
              </Link>
            )}
          </nav>
          
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">{user.username}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                aria-label={t('common.logout')}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Button onClick={() => navigate('/login')}>{t('common.login')}</Button>
          )}
        </div>
      </div>
    </header>
  );
}
