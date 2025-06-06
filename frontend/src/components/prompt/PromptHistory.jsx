import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PromptHistory({ isLoading, history, pagination, onPageChange }) {
  const { t, i18n } = useTranslation();
  
  if (isLoading) {
    return <div className="flex justify-center p-6">{t('common.loading')}</div>;
  }
  
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">{t('history.no_history')}</p>
      </div>
    );
  }
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString(i18n.language === 'id' ? 'id-ID' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const truncateText = (text, maxLength = 100) => {
    return text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text;
  };
  
  return (
    <div className="space-y-4">
      {history.map((prompt) => (
        <Card key={prompt._id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex justify-between">
              <span>
                {prompt.type === 'veo' ? t('tabs.video_prompt') : t('tabs.image_prompt')}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                {formatDate(prompt.createdAt)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md overflow-auto max-h-[200px] text-foreground border border-border">
              {truncateText(prompt.aiResult, 200)}
            </pre>
          </CardContent>
        </Card>
      ))}
      
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            {t('common.previous')}
          </Button>
          <div className="flex items-center text-sm">
            {t('pagination.page_of_total', {page: pagination.page, total: pagination.pages})}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.pages}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            {t('common.next')}
          </Button>
        </div>
      )}
    </div>
  );
}
