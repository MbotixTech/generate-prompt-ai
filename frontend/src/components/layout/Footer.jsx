import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/contexts/toast.context';
import { useAuth } from '@/contexts/auth.context';

export default function Footer() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    subject: '',
    message: ''
  });
  
  // Pre-fill form with user data if logged in
  useEffect(() => {
    if (user) {
      setFormData(prevData => ({
        ...prevData,
        name: user.name || '',
        email: user.email || '',
        username: user.username || ''
      }));
    }
  }, [user, isContactOpen]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.name.trim()) {
      toast({
        title: "Validasi Error",
        description: "Nama tidak boleh kosong",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      toast({
        title: "Validasi Error",
        description: "Email tidak valid",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.username.trim()) {
      toast({
        title: "Validasi Error",
        description: "Username tidak boleh kosong",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.subject.trim()) {
      toast({
        title: "Validasi Error",
        description: "Subjek tidak boleh kosong",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.message.trim() || formData.message.length < 10) {
      toast({
        title: "Validasi Error",
        description: "Pesan terlalu pendek (minimal 10 karakter)",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      
      // Send the message through our secure backend API
      const response = await fetch(`${apiUrl}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          username: formData.username,
          subject: formData.subject,
          message: formData.message
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Pesan Anda telah terkirim ke tim support! Kami akan segera menghubungi Anda.",
          variant: "default",
        });
        // Reset form and close contact form
        setFormData({ name: '', email: '', username: '', subject: '', message: '' });
        setIsContactOpen(false);
      } else {
        toast({
          title: "Gagal",
          description: `Gagal mengirim pesan: ${data.message || 'Coba lagi nanti'}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat mengirim pesan. Periksa koneksi internet Anda.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="w-full border-t bg-background py-4">
      <div className="container">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} MBOTIX Prompt Generator. All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsContactOpen(!isContactOpen)}
              className="text-sm flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              Hubungi Support
            </button>
          </div>
        </div>
        
      {isContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-card shadow-lg rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <div>
                <h3 className="text-lg font-medium">Hubungi Support</h3>
                <p className="text-sm text-muted-foreground">
                  Silakan isi form dibawah ini untuk menghubungi tim support kami.
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={() => setIsContactOpen(false)}
              >
                ✕
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" id="contactForm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="text-sm font-medium block mb-1">
                          Nama <span className="text-red-500">*</span>
                        </label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Nama Anda"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full"
                          autoComplete="name"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="text-sm font-medium block mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="Email Anda"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full"
                          autoComplete="email"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="username" className="text-sm font-medium block mb-1">
                        Username <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="username"
                        name="username"
                        placeholder="Username Anda"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        className="w-full"
                        autoComplete="username"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Masukkan username yang Anda gunakan di aplikasi ini
                      </p>
                    </div>
                    
                    <div>
                      <label htmlFor="subject" className="text-sm font-medium block mb-1">
                        Subjek <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="subject"
                        name="subject"
                        placeholder="Subjek"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="text-sm font-medium block mb-1">
                        Pesan <span className="text-red-500">*</span>
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Jelaskan masalah atau pertanyaan Anda secara detail"
                        value={formData.message}
                        onChange={handleChange}
                        rows={4}
                        required
                        className="w-full min-h-[120px]"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Minimal 10 karakter
                      </p>
                    </div>
                    
                    <div className="flex justify-between items-center border-t pt-4 mt-4">
                      <p className="text-xs text-muted-foreground">
                        <span className="text-red-500">*</span> Wajib diisi
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsContactOpen(false)}
                          size="sm"
                        >
                          Batal
                        </Button>
                        <Button type="submit" disabled={isSubmitting} size="sm" className="submit-btn">
                          {isSubmitting ? (
                            <><span className="animate-spin mr-2">⟳</span> Mengirim...</>
                          ) : (
                            "Kirim Pesan"
                          )}
                        </Button>
                      </div>
                    </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </footer>
  );
}
