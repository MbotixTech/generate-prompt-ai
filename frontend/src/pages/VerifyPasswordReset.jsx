import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/toast.context';
import { api } from '@/services/api';

export default function VerifyPasswordResetPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  
  // Get user data from local storage
  const resetData = JSON.parse(localStorage.getItem('resetPasswordData') || '{}');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();
  
  const password = watch("newPassword", "");
  
  useEffect(() => {
    // Only redirect if there's no valid reset data and reset is not complete yet
    if (!resetComplete && (!resetData?.userId || !resetData?.email)) {
      navigate('/reset-password');
      toast({
        title: "Permintaan Reset Invalid",
        description: "Silakan mulai proses reset password dari awal",
        variant: "destructive",
      });
    }
  }, [resetData, navigate, toast, resetComplete]);
  
  const onSubmit = async (data) => {
    if (!resetData.userId) return;
    
    setIsLoading(true);
    try {
      await api.post('/auth/verify-reset-password', {
        userId: resetData.userId,
        verificationCode: data.verificationCode,
        newPassword: data.newPassword
      });
      
      // Set reset complete first before showing toast to avoid conflicts
      setResetComplete(true);
      
      // Clear reset data
      localStorage.removeItem('resetPasswordData');
      
      // Only show success toast after we've updated state
      toast({
        title: "Password Berhasil Direset",
        description: "Silakan login dengan password baru Anda",
        variant: "default",
      });
      
      // Navigate to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Password reset error:', error);
      
      let errorMessage = "Kode verifikasi tidak valid atau telah kadaluwarsa";
      
      // Check for specific error messages from the backend
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 404) {
        errorMessage = "Pengguna tidak ditemukan. Silakan coba lagi.";
      } else if (error.response?.status === 400) {
        errorMessage = "Kode verifikasi tidak valid atau sudah kadaluwarsa.";
      }
      
      toast({
        title: "Reset Password Gagal",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/50">
      <Card className="w-[380px] shadow-lg">
        <CardHeader>
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold tracking-tight">MBOTIX Prompt Generator</h1>
          </div>
          <CardTitle>Verifikasi Reset Password</CardTitle>
          <CardDescription>
            {resetComplete 
              ? "Password Anda berhasil direset"
              : `Masukkan kode verifikasi yang dikirim ke ${resetData?.email || 'email Anda'}`
            }
          </CardDescription>
        </CardHeader>
        
        {!resetComplete ? (
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="verificationCode" className="text-sm font-medium">
                  Kode Verifikasi
                </label>
                <Input
                  id="verificationCode"
                  type="text"
                  placeholder="Masukkan kode 6 digit"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  {...register("verificationCode", { 
                    required: "Kode verifikasi wajib diisi",
                    pattern: {
                      value: /^[0-9]{6}$/,
                      message: "Kode verifikasi harus berupa 6 digit angka"
                    }
                  })}
                  className={errors.verificationCode ? "border-destructive" : ""}
                />
                {errors.verificationCode && (
                  <p className="text-destructive text-xs">{errors.verificationCode.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium">
                  Password Baru
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  {...register("newPassword", { 
                    required: "Password baru wajib diisi",
                    minLength: {
                      value: 6,
                      message: "Password minimal 6 karakter"
                    }
                  })}
                  className={errors.newPassword ? "border-destructive" : ""}
                />
                {errors.newPassword && (
                  <p className="text-destructive text-xs">{errors.newPassword.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Konfirmasi Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...register("confirmPassword", { 
                    required: "Konfirmasi password wajib diisi",
                    validate: value => 
                      value === password || "Password tidak sesuai"
                  })}
                  className={errors.confirmPassword ? "border-destructive" : ""}
                />
                {errors.confirmPassword && (
                  <p className="text-destructive text-xs">{errors.confirmPassword.message}</p>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-3">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Memproses..." : "Reset Password"}
              </Button>
              
              <div className="w-full text-center">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/reset-password')}
                  className="text-sm text-muted-foreground hover:text-primary">
                  Kembali ke permintaan reset
                </Button>
              </div>
            </CardFooter>
          </form>
        ) : (
          <CardContent className="space-y-6 text-center">
            <div className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-lg p-4">
              <p className="font-medium">Password berhasil direset!</p>
              <p className="text-sm mt-1">Anda akan dialihkan ke halaman login...</p>
            </div>
            
            <Button 
              onClick={() => navigate('/login')} 
              className="w-full"
            >
              Login Sekarang
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
