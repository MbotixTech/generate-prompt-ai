import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function UpgradeToProPage() {
  const { t } = useTranslation();
  const telegramAdmin = "https://t.me/xiaogarpu"; // Replace with actual Telegram username
  
  const subscriptionPlans = [
    {
      name: t('upgrade.daily'),
      price: 'Rp 9.000',
      duration: t('upgrade.daily_duration'),
      features: [
        t('upgrade.feature_unlimited_access'),
        t('upgrade.feature_no_daily_limit'),
        t('upgrade.feature_priority')
      ],
      buttonText: t('upgrade.buy_daily')
    },
    {
      name: t('upgrade.monthly'),
      price: 'Rp 79.000',
      duration: t('upgrade.monthly_duration'),
      features: [
        t('upgrade.feature_unlimited_access'),
        t('upgrade.feature_no_daily_limit'),
        t('upgrade.feature_priority'),
        t('upgrade.feature_discount_daily')
      ],
      buttonText: t('upgrade.buy_monthly'),
      highlighted: true
    },
    {
      name: t('upgrade.yearly'),
      price: 'Rp 649.000',
      duration: t('upgrade.yearly_duration'),
      features: [
        t('upgrade.feature_unlimited_access'),
        t('upgrade.feature_no_daily_limit'),
        t('upgrade.feature_priority'),
        t('upgrade.feature_discount_monthly'),
        t('upgrade.feature_bonus_days')
      ],
      buttonText: t('upgrade.buy_yearly')
    }
  ];
  
  const handleUpgrade = (plan) => {
    // Open Telegram chat with admin
    window.open(telegramAdmin, '_blank');
  };
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">
          <span className="block sm:hidden mb-1">MBOTIX</span>
          <span>{t('upgrade.title')}</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('upgrade.subtitle')}
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {subscriptionPlans.map((plan, index) => (
          <Card key={index} className={`flex flex-col ${plan.highlighted ? 'border-primary shadow-md' : ''}`}>
            <CardHeader>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{t('upgrade.subscription')} {plan.duration}</CardDescription>
              <div className="mt-2">
                <span className="text-3xl font-bold">{plan.price}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-green-500 dark:text-green-400 mr-2">✓</span>
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => handleUpgrade(plan)} 
                className="w-full"
                variant={plan.highlighted ? "default" : "outline"}
              >
                {plan.buttonText}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="bg-muted p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">{t('upgrade.how_to_title')}</h2>
        <ol className="list-decimal ml-5 space-y-2">
          <li>{t('upgrade.step_choose')}</li>
          <li>{t('upgrade.step_contact')}</li>
          <li>{t('upgrade.step_send_info')}</li>
          <li>{t('upgrade.step_payment')}</li>
          <li>{t('upgrade.step_confirmation')}</li>
        </ol>
        
        <div className="mt-6 flex items-center gap-4">
          <span className="font-semibold">{t('upgrade.need_help')}</span>
          <Button variant="outline" onClick={() => window.open(telegramAdmin, '_blank')}>
            {t('upgrade.contact_admin')}
          </Button>
        </div>
      </div>
    </div>
  );
}
