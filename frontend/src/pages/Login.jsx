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
import { useTheme } from '@/contexts/theme.context';
import { Moon, Sun } from 'lucide-react';
import { api } from '@/services/api';

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  
  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors },
  } = useForm();
  
  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await login(data);
      
      if (response === true) {
        // Successful login and already verified
        toast({
          title: t('auth.login_success'),
          description: t('auth.welcome_back'),
          variant: "default",
        });
        navigate('/dashboard');
      } else if (response === false) {
        // General login failure
        toast({
          title: t('auth.login_failed'),
          description: t('auth.invalid_credentials'),
          variant: "destructive",
        });
      } else if (response === 'verification_needed') {
        // Successful login but email verification needed
        toast({
          title: t('auth.verification_required'),
          description: t('auth.verification_code_sent', {
            email: JSON.parse(localStorage.getItem('pendingVerification') || '{}').email
          }),
          variant: "default",
        });
        navigate('/verify-email');
      }
    } catch (error) {
      console.error(error);
      toast({
        title: t('common.error'),
        description: t('auth.login_error'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const onResetSubmit = async (data) => {
    setResetLoading(true);
    try {
      await api.post('/auth/reset-password', {
        username: data.username,
        newPassword: data.newPassword
      });
      
      toast({
        title: t('common.success'),
        description: t('auth.password_reset_success'),
        variant: "default",
      });
      setShowResetForm(false);
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || t('auth.password_reset_error'),
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/50">
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>
      <div className="w-full max-w-md">
        {!showResetForm ? (
          <Card>
            <CardHeader className="space-y-1">
              <div className="text-center mb-4">
                <h1 className="text-2xl font-bold tracking-tight">MBOTIX Prompt Generator</h1>
              </div>
              <CardTitle className="text-2xl font-bold text-center">{t('common.login')}</CardTitle>
              <CardDescription className="text-center">
                {t('auth.login_instruction')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  name="email"
                  label={t('auth.username_or_email')}
                  error={errors.email?.message}
                >
                  <Input
                    id="email"
                    placeholder={t('auth.username_or_email_placeholder')}
                    {...register("email", { required: t('auth.username_required') })}
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
                    {...register("password", { required: t('auth.password_required') })}
                  />
                </FormField>
                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? t('common.loading') : t('common.login')}
                </Button>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <p className="text-center text-sm text-muted-foreground">
                {t('auth.no_account')}{" "}
                <Button variant="link" className="p-0" onClick={() => navigate("/register")}>
                  {t('common.register')}
                </Button>
              </p>
              <p className="text-center text-sm text-muted-foreground">
                {t('auth.forgot_password')}{" "}
                <Button variant="link" className="p-0" onClick={() => navigate("/reset-password")}>
                  {t('auth.reset_password')}
                </Button>
              </p>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardHeader className="space-y-1">
              <div className="text-center mb-4">
                <h1 className="text-2xl font-bold tracking-tight">MBOTIX Prompt Generator</h1>
              </div>
              <CardTitle className="text-2xl font-bold text-center">{t('auth.reset_password')}</CardTitle>
              <CardDescription className="text-center">
                {t('auth.reset_password_instruction')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetSubmit(onResetSubmit)} className="space-y-4">
                <FormField
                  name="username"
                  label={t('auth.username')}
                  error={resetErrors.username?.message}
                >
                  <Input
                    id="reset-username"
                    placeholder={t('auth.username_placeholder')}
                    {...registerReset("username", { required: t('auth.username_required') })}
                  />
                </FormField>
                <FormField
                  name="newPassword"
                  label={t('auth.new_password')}
                  error={resetErrors.newPassword?.message}
                >
                  <Input
                    id="new-password"
                    type="password"
                    placeholder={t('auth.new_password_placeholder')}
                    {...registerReset("newPassword", { 
                      required: t('auth.new_password_required'),
                      minLength: {
                        value: 6,
                        message: t('auth.password_min_length')
                      } 
                    })}
                  />
                </FormField>
                <FormField
                  name="confirmPassword"
                  label={t('auth.confirm_password')}
                  error={resetErrors.confirmPassword?.message}
                >
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder={t('auth.confirm_password_placeholder')}
                    {...registerReset("confirmPassword", { 
                      required: t('auth.confirm_password_required'),
                      validate: (value, formValues) => 
                        value === formValues.newPassword || t('auth.password_mismatch')
                    })}
                  />
                </FormField>
                <Button className="w-full" type="submit" disabled={resetLoading}>
                  {resetLoading ? t('common.loading') : t('auth.reset_password')}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col">
              <Button variant="link" className="p-0" onClick={() => setShowResetForm(false)}>
                {t('auth.back_to_login')}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
