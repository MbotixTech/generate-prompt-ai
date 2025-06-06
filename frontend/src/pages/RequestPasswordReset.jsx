import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/toast.context';
import { api } from '@/services/api';

export default function RequestPasswordResetPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  // Check if we already have reset data when component mounts
  React.useEffect(() => {
    // Clear any existing reset data to start fresh
    localStorage.removeItem('resetPasswordData');
  }, []);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  
  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/request-password-reset', {
        email: data.email
      });
      
      // Check if the email exists in the system
      if (response.data.emailExists === false) {
        // Email doesn't exist, show error
        toast({
          title: "Email Tidak Terdaftar",
          description: "Email yang Anda masukkan tidak terdaftar dalam sistem kami",
          variant: "destructive",
        });
        return;
      }
      
      // Store the userId for the verification step
      if (response.data.userId) {
        localStorage.setItem('resetPasswordData', JSON.stringify({
          userId: response.data.userId,
          email: data.email,
          expiresAt: response.data.expiresAt
        }));
        
        // Navigate to verification page
        navigate('/reset-password/verify');
      } else {
        // Show success message
        setEmailSent(true);
      }
      
      toast({
        title: "Kode Reset Terkirim",
        description: "Silakan periksa email Anda untuk kode reset password",
        variant: "default",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Permintaan Gagal",
        description: error.response?.data?.message || "Terjadi kesalahan saat memproses permintaan",
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
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            Masukkan email Anda untuk menerima kode reset password
          </CardDescription>
        </CardHeader>
        
        {!emailSent ? (
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  {...register("email", { 
                    required: "Email wajib diisi",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Format email tidak valid"
                    }
                  })}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-destructive text-xs">{errors.email.message}</p>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-3">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Mengirim..." : "Kirim Kode Reset"}
              </Button>
              
              <div className="w-full text-center">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/login')}
                  className="text-sm text-muted-foreground hover:text-primary">
                  Kembali ke halaman login
                </Button>
              </div>
            </CardFooter>
          </form>
        ) : (
          <CardContent className="space-y-6 text-center">
            <div className="bg-primary-foreground border border-primary/20 rounded-lg p-4">
              <p className="font-semibold mb-2">Email dengan instruksi reset password telah dikirim.</p>
              <p className="text-sm text-muted-foreground mb-3">
                Silakan periksa kotak masuk email Anda dan ikuti instruksi yang diberikan.
              </p>
              <p className="text-xs text-primary">
                Pastikan untuk memeriksa folder spam jika Anda tidak melihat email dalam kotak masuk.
              </p>
            </div>
            
            <Button 
              onClick={() => navigate('/login')} 
              className="w-full"
            >
              Kembali ke Login
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
