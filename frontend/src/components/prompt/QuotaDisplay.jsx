import React from 'react';
import { useTranslation } from 'react-i18next';

export default function QuotaDisplay({ user }) {
  const { t } = useTranslation();
  if (!user) return null;
  
  // Pro users have unlimited quota
  if (user.role === 'pro' || user.role === 'admin') {
    return (
      <div className="bg-primary/10 text-primary dark:bg-primary/30 dark:text-primary-foreground rounded-md py-1 px-3 text-sm">
        <span className="font-semibold">Pro User:</span> {t('common.unlimited')}
      </div>
    );
  }
  
  // Free users have limited quota (2 per day)
  const used = user.promptsToday || 0;
  const limit = 2;
  const remaining = limit - used;
  const percentage = (used / limit) * 100;
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-foreground">
          {t('common.quota_used', { used, total: limit })}
        </span>
        <span className="text-muted-foreground dark:text-gray-400">&nbsp;{remaining} {t('history.load_more')}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${percentage >= 100 ? 'bg-destructive' : 'bg-primary'}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
