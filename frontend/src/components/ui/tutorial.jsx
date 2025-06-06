import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/auth.context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export function Tutorial({ onStepChange, forceShow = false }) {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [userLanguage, setUserLanguage] = useState(i18n.language);

  // Only check localStorage on first mount to determine visibility
  useEffect(() => {
    // If explicitly shown through forceShow, always show it regardless of localStorage
    if (!forceShow) {
      const hasSeenTutorial = localStorage.getItem('tutorial_completed');
      if (hasSeenTutorial) {
        setIsVisible(false);
      }
    }
  }, [forceShow]); // Only run this effect once on mount with the forceShow value

  // Separate effect for language changes that doesn't affect visibility
  useEffect(() => {
    // Update language state when i18n language changes
    setUserLanguage(i18n.language);
    
    // Add event listener for language changes
    const handleLanguageChange = () => {
      setUserLanguage(i18n.language);
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  // Create tutorial steps based on user's role (free or pro) and language
  const getTutorialSteps = () => {
    const isPro = user?.role === 'pro';
    // Use the stored language value to ensure consistency during the tutorial
    const currentLanguage = userLanguage;
    
    return [
      // Step 1: Welcome
      {
        title: t('tutorial.welcome_title'),
        description: t('tutorial.welcome_description')
      },
      // Step 2: Video Prompts
      {
        title: t('tutorial.video_title'),
        description: isPro 
          ? t('tutorial.video_description_pro')
          : t('tutorial.video_description_free')
      },
      // Step 3: Image Prompts
      {
        title: t('tutorial.image_title'),
        description: isPro 
          ? t('tutorial.image_description_pro')
          : t('tutorial.image_description_free')
      },
      // Step 4: History
      {
        title: t('tutorial.history_title'),
        description: t('tutorial.history_description')
      },
      // Step 5: Pro features (only show to free users)
      ...(!isPro ? [{
        title: t('tutorial.upgrade_title'),
        description: t('tutorial.upgrade_description')
      }] : [])
    ];
  };

  const tutorialSteps = getTutorialSteps();
  
  // Re-generate tutorial steps when language changes
  useEffect(() => {
    // This will trigger a re-render with the new language
    setCurrentStep(currentStep);
    
    // Notify parent component about current step
    if (onStepChange && typeof onStepChange === 'function') {
      onStepChange(currentStep);
    }
  }, [userLanguage, currentStep, onStepChange]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      if (onStepChange && typeof onStepChange === 'function') {
        onStepChange(nextStep);
      }
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      if (onStepChange && typeof onStepChange === 'function') {
        onStepChange(prevStep);
      }
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    // Store that the tutorial is completed with the language it was completed in
    localStorage.setItem('tutorial_completed', 'true');
    localStorage.setItem('tutorial_language', userLanguage);
    
    // Create and dispatch a custom event to notify the Dashboard that the tutorial was closed
    const event = new CustomEvent('tutorialClosed');
    window.dispatchEvent(event);
  };

  if (!isVisible) {
    return null;
  }

  const currentTutorial = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <Card className="max-w-lg w-full shadow-xl">
        <CardHeader className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4"
            onClick={handleClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
          <CardTitle className="text-xl md:text-2xl">{currentTutorial.title}</CardTitle>
          <div className="flex items-center mt-2">
            <div className="flex space-x-1 mr-2">
              {tutorialSteps.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`w-2 h-2 rounded-full ${idx === currentStep ? 'bg-primary' : 'bg-muted'}`}
                />
              ))}
            </div>
            <CardDescription>
              {t('tutorial.step_counter', { current: currentStep + 1, total: tutorialSteps.length })}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-base">{currentTutorial.description}</p>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-6"
          >
            {t('tutorial.previous')}
          </Button>
          <Button 
            onClick={handleNext}
            className="px-6"
          >
            {isLastStep ? t('tutorial.finish') : t('tutorial.next')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
