import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/toast.context';
import { useAuth } from '@/contexts/auth.context';
import { api } from '@/services/api';
import VeoPromptForm from '@/components/forms/VeoPromptForm';
import ImagePromptForm from '@/components/forms/ImagePromptForm';
import PromptHistory from '@/components/prompt/PromptHistory';
import QuotaDisplay from '@/components/prompt/QuotaDisplay';
import { Tutorial } from '@/components/ui/tutorial';

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('veo');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });

  // Effect for fetching history and checking if new user should see tutorial
  useEffect(() => {
    if (user) {
      fetchHistory(activeTab);
      
      // Check if the user should see the tutorial (ONLY for first-time users)
      const hasSeenTutorial = localStorage.getItem('tutorial_completed');
      
      // Only show tutorial automatically for new users who have never seen it
      if (!hasSeenTutorial) {
        setShowTutorial(true);
      }
    }
  }, [user, activeTab]);
  
  // Separate effect for handling tutorial closure event
  useEffect(() => {
    const handleTutorialClosed = () => {
      setShowTutorial(false);
    };
    
    window.addEventListener('tutorialClosed', handleTutorialClosed);
    
    return () => {
      window.removeEventListener('tutorialClosed', handleTutorialClosed);
    };
  }, []);

  const fetchHistory = async (type = null, page = 1) => {
    try {
      setIsLoading(true);
      const params = { page, limit: 5 };
      
      if (type && type !== 'all') {
        params.type = type;
      }
      
      const response = await api.get('/prompt/history', { params });
      setHistory(response.data.prompts);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch history:', error);
      toast({
        title: t('common.error'),
        description: t('history.error_message', 'Gagal memuat riwayat prompt'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    fetchHistory(value === 'all' ? null : value);
  };

  const handlePromptCreated = () => {
    fetchHistory(activeTab);
  };

  // Function to handle showing the tutorial again
  const handleShowTutorial = () => {
    // Set the state first to trigger immediate rendering
    setShowTutorial(true);
    
    // Then remove the localStorage items to reset the tutorial state
    // This ensures future auto-displays will work properly
    localStorage.removeItem('tutorial_completed');
    localStorage.removeItem('tutorial_language');
  };

  return (
    <div className="space-y-6">
      {showTutorial && user && <Tutorial 
        onStepChange={(step) => {
          // Automatically switch to the relevant tab based on tutorial step
          if (step === 1) { // Video prompt step
            setActiveTab('veo');
          } else if (step === 2) { // Image prompt step
            setActiveTab('image');
          } else if (step === 3) { // History step
            setActiveTab('all');
          } else {
            setActiveTab('veo');
          }
        }} 
        forceShow={true}
      />}
      
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            <span className="block sm:hidden mb-1">MBOTIX</span>
            <span>{t('common.dashboard')}</span>
          </h1>
          <p className="text-muted-foreground">{t('common.create_prompt')}</p>
          <Button 
            variant="link" 
            size="sm" 
            className="px-0 text-xs text-muted-foreground"
            onClick={handleShowTutorial}
          >
            {t('common.show_tutorial')}
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          {user && <QuotaDisplay user={user} />}
          
          {user && user.role === 'free' && (
            <Button
              onClick={() => navigate('/upgrade')}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              {t('common.upgrade_pro')}
            </Button>
          )}
        </div>
      </div>
      
      {user && user.role === 'free' && (
        <div className="bg-muted p-4 rounded-lg flex justify-between items-center">
          <div className="flex-1">
            <h3 className="font-medium text-foreground">{t('upgrade.cta')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('upgrade.description')}
            </p>
          </div>
          <Button
            onClick={() => navigate('/upgrade')}
            variant="outline"
            className="whitespace-nowrap"
          >
            {t('upgrade.view_details')}
          </Button>
        </div>
      )}
      
      <Tabs defaultValue="veo" className="space-y-4" onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="veo">{t('tabs.video_prompt')}</TabsTrigger>
          <TabsTrigger value="image">{t('tabs.image_prompt')}</TabsTrigger>
          <TabsTrigger value="all">{t('tabs.history')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="veo">
          <Card>
            <CardContent className="pt-6">
              <VeoPromptForm onSuccess={handlePromptCreated} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="image">
          <Card>
            <CardContent className="pt-6">
              <ImagePromptForm onSuccess={handlePromptCreated} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="all">
          <Card>
            <CardContent className="pt-6">
              <PromptHistory 
                isLoading={isLoading} 
                history={history}
                pagination={pagination}
                onPageChange={(page) => fetchHistory(activeTab === 'all' ? null : activeTab, page)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
