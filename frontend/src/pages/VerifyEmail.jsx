import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth.context';
import { useToast } from '@/contexts/toast.context';

export default function VerifyEmailPage() {
  const { verifyEmail, resendVerificationCode } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // Get user data and token from location state or local storage
  const userData = location.state?.userData || JSON.parse(localStorage.getItem('pendingVerification') || '{}');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  
  useEffect(() => {
    if (!userData?.userId) {
      navigate('/login');
      toast({
        title: "Akses Ditolak",
        description: "Silakan login terlebih dahulu",
        variant: "destructive",
      });
    }
    
    // Start the countdown if set
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [userData, navigate, toast, countdown]);
  
  const onSubmit = async (data) => {
    if (!userData.userId) {
      toast({
        title: "Verifikasi Gagal",
        description: "Data tidak lengkap, silakan login kembali",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const success = await verifyEmail({
        userId: userData.userId,
        verificationCode: data.verificationCode
      });
      
      if (success) {
        toast({
          title: "Verifikasi Berhasil",
          description: "Email Anda telah diverifikasi",
          variant: "default",
        });
        
        // Clear pending verification data
        localStorage.removeItem('pendingVerification');
        
        // Navigate to dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Kode Verifikasi Salah",
        description: error.response?.data?.message || "Kode verifikasi tidak valid",
        variant: "destructive",
      });
      
      // Don't disable the button - allow the user to try again
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResendCode = async () => {
    if (!userData.userId) return;
    
    setResendLoading(true);
    try {
      const success = await resendVerificationCode(userData.userId);
      
      if (success) {
        toast({
          title: "Kode Verifikasi Terkirim",
          description: "Kode verifikasi baru telah dikirim ke email Anda",
          variant: "default",
        });
        
        // Set countdown for 60 seconds
        setCountdown(60);
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Gagal Mengirim Kode",
        description: error.response?.data?.message || "Terjadi kesalahan saat mengirim ulang kode",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/50">
      <Card className="w-[380px] shadow-lg">
        <CardHeader>
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold tracking-tight">MBOTIX Prompt Generator</h1>
          </div>
          <CardTitle>Verifikasi Email</CardTitle>
          <CardDescription>
            Masukkan kode verifikasi yang telah dikirim ke {userData?.email || 'email Anda'}
          </CardDescription>
        </CardHeader>
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
                className={errors.verificationCode ? "border-destructive" : ""}
                {...register("verificationCode", { 
                  required: "Kode verifikasi wajib diisi",
                  pattern: {
                    value: /^[0-9]{6}$/,
                    message: "Kode verifikasi harus berupa 6 digit angka"
                  }
                })}
              />
              {errors.verificationCode && (
                <p className="text-destructive text-xs">{errors.verificationCode.message}</p>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full">
              {isLoading ? "Memproses..." : "Verifikasi"}
            </Button>
            
            <div className="w-full text-center">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={handleResendCode} 
                disabled={resendLoading || countdown > 0}
                className="text-sm text-muted-foreground hover:text-primary">
                {countdown > 0 
                  ? `Kirim ulang (${countdown}s)` 
                  : resendLoading ? "Mengirim..." : "Tidak menerima kode? Kirim ulang"}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
