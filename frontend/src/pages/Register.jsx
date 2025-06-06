import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormField } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth.context';
import { useToast } from '@/contexts/toast.context';

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();
  
  const password = watch("password", "");
  
  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const success = await registerUser(data);
      if (success) {
        toast({
          title: t('auth.register_success'),
          description: t('auth.account_created'),
          variant: "default",
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error(error);
      toast({
        title: t('auth.register_failed'),
        description: error.response?.data?.message || t('auth.register_error'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/50">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold tracking-tight">MBOTIX Prompt Generator</h1>
            </div>
            <CardTitle className="text-2xl font-bold text-center">{t('common.register')}</CardTitle>
            <CardDescription className="text-center">
              {t('auth.register_description', { app_name: t('common.app_name') })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                name="username"
                label={t('auth.username')}
                error={errors.username?.message}
              >
                <Input
                  id="username"
                  placeholder={t('auth.username_placeholder')}
                  {...register("username", {
                    required: t('auth.username_required'),
                    minLength: {
                      value: 3,
                      message: t('auth.username_min_length'),
                    },
                  })}
                />
              </FormField>
              <FormField
                name="email"
                label={t('auth.email')}
                error={errors.email?.message}
              >
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  {...register("email", {
                    required: t('auth.email_required'),
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: t('auth.email_invalid'),
                    },
                  })}
                />
              </FormField>
              <FormField
                name="password"
                label={t('auth.password')}
                error={errors.password?.message}
              >
                <Input
                  id="password"
                  type="password"
                  placeholder={t('auth.password_placeholder')}
                  {...register("password", {
                    required: t('auth.password_required'),
                    minLength: {
                      value: 6,
                      message: t('auth.password_min_length'),
                    },
                  })}
                />
              </FormField>
              <FormField
                name="confirmPassword"
                label={t('auth.confirm_password')}
                error={errors.confirmPassword?.message}
              >
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t('auth.confirm_password_placeholder')}
                  {...register("confirmPassword", {
                    required: t('auth.confirm_password_required'),
                    validate: (value) => value === password || t('auth.password_mismatch'),
                  })}
                />
              </FormField>
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? t('common.loading') : t('common.register')}
              </Button>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col">
            <p className="text-center text-sm text-muted-foreground">
              {t('auth.have_account')}{" "}
              <Button variant="link" className="p-0" onClick={() => navigate("/login")}>
                {t('common.login')}
              </Button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
