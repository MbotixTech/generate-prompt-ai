import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/contexts/toast.context';
import { useAuth } from '@/contexts/auth.context';
import { api } from '@/services/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });
  const [search, setSearch] = useState('');
  const [durationInput, setDurationInput] = useState({
    userId: null,
    days: '',
    type: 'daily'
  });
  
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'free'
  });
  
  const [resetPassword, setResetPassword] = useState({
    userId: null,
    newPassword: ''
  });
  
  const [subscriptionStats, setSubscriptionStats] = useState(null);
  const [checkingSubscriptions, setCheckingSubscriptions] = useState(false);
  const [notificationTest, setNotificationTest] = useState({
    message: '',
    type: 'info'
  });
  const [sendingNotification, setSendingNotification] = useState(false);
  
  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  // Fetch users
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user]);
  
  const fetchUsers = async (page = 1) => {
    try {
      setIsLoading(true);
      const params = { page, limit: 10 };
      
      if (search) {
        params.search = search;
      }
      
      const response = await api.get('/admin/users', { params });
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data pengguna",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRoleUpdate = async (userId, newRole) => {
    try {
      await api.patch(`/admin/user/${userId}/role`, { role: newRole });
      
      // Update local state to reflect the change
      setUsers(users.map(user => 
        user._id === userId ? { ...user, role: newRole } : user
      ));
      
      toast({
        title: "Berhasil",
        description: `Role pengguna berhasil diubah menjadi ${newRole}`,
        variant: "default",
      });
    } catch (error) {
      console.error('Failed to update user role:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Gagal mengubah role pengguna",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteUser = async (userId) => {
    if (!confirm('Yakin ingin menghapus pengguna ini?')) return;
    
    try {
      await api.delete(`/admin/user/${userId}`);
      
      // Remove from local state
      setUsers(users.filter(user => user._id !== userId));
      
      toast({
        title: "Berhasil",
        description: "Pengguna berhasil dihapus",
        variant: "default",
      });
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Gagal menghapus pengguna",
        variant: "destructive",
      });
    }
  };

  const handleAddSubscriptionDays = async (userId) => {
    try {
      if (!durationInput.days || parseInt(durationInput.days) <= 0) {
        toast({
          title: "Error",
          description: "Durasi harus lebih dari 0 hari",
          variant: "destructive",
        });
        return;
      }

      await api.post(`/admin/user/${userId}/duration`, { 
        durationDays: parseInt(durationInput.days),
        durationType: durationInput.type
      });
      
      // Refresh user data
      fetchUsers(pagination.page);
      
      // Reset input
      setDurationInput({ userId: null, days: '', type: 'daily' });
      
      toast({
        title: "Berhasil",
        description: `Berhasil menambahkan durasi langganan Pro`,
        variant: "default",
      });
    } catch (error) {
      console.error('Failed to add subscription days:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Gagal menambahkan durasi langganan",
        variant: "destructive",
      });
    }
  };
  
  const handleSetUnlimited = async (userId) => {
    try {
      await api.post(`/admin/user/${userId}/unlimited`);
      
      // Refresh user data
      fetchUsers(pagination.page);
      
      toast({
        title: "Berhasil",
        description: "Berhasil mengatur langganan tidak terbatas",
        variant: "default",
      });
    } catch (error) {
      console.error('Failed to set unlimited subscription:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Gagal mengatur langganan tidak terbatas",
        variant: "destructive",
      });
    }
  };
  
  const handleCheckSubscriptions = async (checkOnly = false) => {
    try {
      setCheckingSubscriptions(true);
      setSubscriptionStats(null);
      
      const response = await api.post(`/admin/check-subscriptions?checkOnly=${checkOnly}`);
      
      setSubscriptionStats(response.data);
      
      // Refresh user data to reflect any changes
      if (!checkOnly && response.data.stats.downgraded > 0) {
        fetchUsers(pagination.page);
      }
      
      toast({
        title: "Berhasil",
        description: response.data.message,
        variant: "default",
      });
    } catch (error) {
      console.error('Failed to check subscriptions:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Gagal memeriksa status langganan",
        variant: "destructive",
      });
    } finally {
      setCheckingSubscriptions(false);
    }
  };
  
  const handleResetPassword = async (userId) => {
    try {
      if (!resetPassword.newPassword || resetPassword.newPassword.length < 6) {
        toast({
          title: "Error",
          description: "Password minimal 6 karakter",
          variant: "destructive",
        });
        return;
      }

      await api.post(`/admin/user/${userId}/reset-password`, { 
        newPassword: resetPassword.newPassword 
      });
      
      // Reset input
      setResetPassword({ userId: null, newPassword: '' });
      
      toast({
        title: "Berhasil",
        description: "Password berhasil direset",
        variant: "default",
      });
    } catch (error) {
      console.error('Failed to reset password:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Gagal reset password",
        variant: "destructive",
      });
    }
  };
  
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      // Validate inputs
      if (!newUser.username || !newUser.email || !newUser.password) {
        toast({
          title: "Error",
          description: "Semua kolom harus diisi",
          variant: "destructive",
        });
        return;
      }
      
      await api.post(`/admin/users`, newUser);
      
      // Refresh user data and reset form
      fetchUsers(pagination.page);
      setNewUser({
        username: '',
        email: '',
        password: '',
        role: 'free'
      });
      
      toast({
        title: "Berhasil",
        description: "Pengguna baru berhasil dibuat",
        variant: "default",
      });
    } catch (error) {
      console.error('Failed to create user:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Gagal membuat pengguna baru",
        variant: "destructive",
      });
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getSubscriptionStatus = (user) => {
    if (!user.subscriptionExpires) return 'Tidak aktif';
    
    const expiryDate = new Date(user.subscriptionExpires);
    const currentDate = new Date();
    
    // Check if subscription expires more than 50 years in future (unlimited)
    if (expiryDate.getFullYear() - currentDate.getFullYear() > 50) {
      return 'Tidak terbatas';
    }
    
    // Check if subscription is expired
    if (expiryDate < currentDate) {
      return (
        <span className="text-red-600 font-medium flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Kadaluarsa {formatDate(user.subscriptionExpires)}
        </span>
      );
    }
    
    // Calculate days remaining
    const daysRemaining = Math.ceil((expiryDate - currentDate) / (1000 * 60 * 60 * 24));
    
    // Color based on how close to expiry
    let statusColor = 'text-green-600';
    if (daysRemaining <= 3) {
      statusColor = 'text-red-600';
    } else if (daysRemaining <= 7) {
      statusColor = 'text-amber-600';
    }
    
    return (
      <span className={`${statusColor} font-medium flex items-center`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {daysRemaining} hari lagi ({formatDate(user.subscriptionExpires)})
      </span>
    );
  };
  
  const checkAllSubscriptions = async (checkOnly = false) => {
    setCheckingSubscriptions(true);
    setSubscriptionStats(null);
    try {
      const response = await api.post(`/admin/check-subscriptions?checkOnly=${checkOnly}`);
      setSubscriptionStats(response.data);
      
      // Refresh user data to reflect any changes
      if (!checkOnly && response.data.stats?.downgraded > 0) {
        fetchUsers(pagination.page);
      }
      
      toast({
        title: "Berhasil",
        description: response.data.message,
        variant: "default",
      });
    } catch (error) {
      console.error('Failed to check subscriptions:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Gagal memperbarui status langganan",
        variant: "destructive",
      });
    } finally {
      setCheckingSubscriptions(false);
    }
  };
  
  const handleTestNotification = async () => {
    setSendingNotification(true);
    try {
      const response = await api.post('/admin/test-notification', {
        message: notificationTest.message,
        type: notificationTest.type
      });
      
      toast({
        title: "Berhasil",
        description: "Notifikasi berhasil dikirim",
        variant: "default",
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
      toast({
        title: "Error",
        description: "Gagal mengirim notifikasi",
        variant: "destructive",
      });
    } finally {
      setSendingNotification(false);
    }
  };
  
  if (!user || user.role !== 'admin') {
    return <div className="flex justify-center p-6">Loading...</div>;
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">
          <span className="block sm:hidden mb-1">MBOTIX</span>
          <span>Admin Panel</span>
        </h1>
        <p className="text-muted-foreground">Kelola pengguna MBOTIX Prompt Generator</p>
      </div>
      
      <Tabs defaultValue="user-list">
        <TabsList className="mb-4">
          <TabsTrigger value="user-list">Daftar Pengguna</TabsTrigger>
          <TabsTrigger value="create-user">Tambah Pengguna</TabsTrigger>
          <TabsTrigger value="subscription-mgmt">Kelola Langganan</TabsTrigger>
        </TabsList>
        
        <TabsContent value="user-list">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Pengguna</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Input
                    type="text"
                    placeholder="Cari username atau email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-64"
                  />
                  <Button onClick={() => fetchUsers()}>Cari</Button>
                </div>
                
                <div className="border rounded-md">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted">
                        <th className="p-2 text-left text-foreground">Username</th>
                        <th className="p-2 text-left text-foreground">Email</th>
                        <th className="p-2 text-left text-foreground">Role</th>
                        <th className="p-2 text-left text-foreground">Tanggal Daftar</th>
                        <th className="p-2 text-left text-foreground">Status Langganan</th>
                        <th className="p-2 text-left text-foreground">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan="6" className="p-4 text-center">Loading...</td>
                        </tr>
                      ) : users.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-4 text-center">Tidak ada data pengguna</td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user._id} className="border-t">
                            <td className="p-2">{user.username}</td>
                            <td className="p-2">{user.email}</td>
                            <td className="p-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                user.role === 'pro' ? 'bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                user.role === 'admin' ? 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="p-2">{formatDate(user.createdAt)}</td>
                            <td className="p-2">{getSubscriptionStatus(user)}</td>
                            <td className="p-2">
                              {user.role !== 'admin' && (
                                <div className="space-y-2 divide-y">
                                  <div className="flex gap-2 pb-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRoleUpdate(
                                        user._id, 
                                        user.role === 'free' ? 'pro' : 'free'
                                      )}
                                    >
                                      {user.role === 'free' ? 'Upgrade to Pro' : 'Downgrade to Free'}
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeleteUser(user._id)}
                                    >
                                      Hapus
                                    </Button>
                                  </div>
                                  
                                  <div className="flex flex-col gap-2 pt-2">
                                    <p className="text-xs font-medium text-foreground dark:text-gray-300">Tambah Langganan</p>
                                    <div className="flex gap-2 items-center">
                                      <Input 
                                        type="number" 
                                        min="1"
                                        placeholder="Jumlah" 
                                        className="w-20 placeholder:text-muted-foreground"
                                        value={durationInput.userId === user._id ? durationInput.days : ''}
                                        onChange={(e) => setDurationInput({
                                          ...durationInput,
                                          userId: user._id,
                                          days: e.target.value
                                        })}
                                        onClick={() => setDurationInput({
                                          ...durationInput,
                                          userId: user._id
                                        })}
                                      />
                                      <select 
                                        className="px-2 py-2 border rounded-md bg-background text-foreground"
                                        value={durationInput.userId === user._id ? durationInput.type : 'daily'}
                                        onChange={(e) => setDurationInput({
                                          ...durationInput,
                                          userId: user._id,
                                          type: e.target.value
                                        })}
                                      >
                                        <option value="daily">Hari</option>
                                        <option value="monthly">Bulan</option>
                                        <option value="yearly">Tahun</option>
                                      </select>
                                      <Button
                                        size="sm"
                                        onClick={() => handleAddSubscriptionDays(user._id)}
                                        disabled={durationInput.userId !== user._id || !durationInput.days}
                                      >
                                        Tambah
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleSetUnlimited(user._id)}
                                      >
                                        Set Tidak Terbatas
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-col gap-2 pt-2">
                                    <p className="text-xs font-medium text-foreground dark:text-gray-300">Reset Password</p>
                                    <div className="flex gap-2 items-center">
                                      <Input 
                                        type="password" 
                                        placeholder="Password Baru" 
                                        className="w-40 placeholder:text-muted-foreground"
                                        value={resetPassword.userId === user._id ? resetPassword.newPassword : ''}
                                        onChange={(e) => setResetPassword({
                                          userId: user._id,
                                          newPassword: e.target.value
                                        })}
                                        onClick={() => setResetPassword({
                                          userId: user._id,
                                          newPassword: resetPassword.userId === user._id ? resetPassword.newPassword : ''
                                        })}
                                      />
                                      <Button
                                        size="sm"
                                        onClick={() => handleResetPassword(user._id)}
                                        disabled={resetPassword.userId !== user._id || !resetPassword.newPassword}
                                      >
                                        Reset Password
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {pagination.pages > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => fetchUsers(pagination.page - 1)}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center text-sm">
                      Page {pagination.page} of {pagination.pages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.pages}
                      onClick={() => fetchUsers(pagination.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="subscription-mgmt">
          <Card>
            <CardHeader>
              <CardTitle>Kelola Langganan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex flex-wrap gap-4">
                  <Button
                    onClick={() => checkAllSubscriptions(true)}
                    disabled={checkingSubscriptions}
                    variant="outline"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Periksa Status Langganan (Read Only)
                  </Button>
                  <Button
                    onClick={() => checkAllSubscriptions(false)}
                    disabled={checkingSubscriptions}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Periksa & Downgrade Langganan Kadaluarsa
                  </Button>
                </div>
                
                {checkingSubscriptions && (
                  <div className="flex items-center justify-center p-4">
                    <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="ml-2">Memeriksa status langganan...</span>
                  </div>
                )}
                
                {subscriptionStats && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2">Hasil Pemeriksaan Langganan</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-muted-foreground">Status:</p>
                        <p className="font-medium">{subscriptionStats.message}</p>
                      </div>
                      
                      {subscriptionStats.stats && (
                        <div>
                          <p className="text-muted-foreground mb-1">Statistik:</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div className="border rounded p-2">
                              <p className="text-xs">Sebelum</p>
                              <p className="font-medium">Pro: {subscriptionStats.stats.before.pro || 0}</p>
                              <p className="font-medium">Free: {subscriptionStats.stats.before.free || 0}</p>
                            </div>
                            <div className="border rounded p-2">
                              <p className="text-xs">Sesudah</p>
                              <p className="font-medium">Pro: {subscriptionStats.stats.after.pro || 0}</p>
                              <p className="font-medium">Free: {subscriptionStats.stats.after.free || 0}</p>
                            </div>
                            <div className="border rounded p-2">
                              <p className="text-xs">Perubahan</p>
                              <p className="font-medium">Downgraded: {subscriptionStats.stats.downgraded}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {subscriptionStats.soonToExpire && subscriptionStats.soonToExpire.length > 0 && (
                        <div>
                          <p className="text-muted-foreground mb-1">Langganan yang akan segera kadaluarsa:</p>
                          <div className="border rounded overflow-auto max-h-60">
                            <table className="min-w-full">
                              <thead className="bg-muted/50">
                                <tr>
                                  <th className="p-2 text-left text-xs font-medium">Pengguna</th>
                                  <th className="p-2 text-left text-xs font-medium">Email</th>
                                  <th className="p-2 text-left text-xs font-medium">Kadaluarsa</th>
                                  <th className="p-2 text-left text-xs font-medium">Sisa Hari</th>
                                </tr>
                              </thead>
                              <tbody>
                                {subscriptionStats.soonToExpire.map((user) => (
                                  <tr key={user.id} className="border-t">
                                    <td className="p-2">{user.username}</td>
                                    <td className="p-2">{user.email}</td>
                                    <td className="p-2">{formatDate(user.expiresAt)}</td>
                                    <td className="p-2">
                                      <span className={`font-medium ${
                                        user.daysLeft <= 1 ? 'text-red-600' :
                                        user.daysLeft <= 3 ? 'text-amber-600' :
                                        'text-green-600'
                                      }`}>
                                        {user.daysLeft} hari
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="border rounded-lg p-4 mt-6">
                  <h3 className="font-semibold text-lg mb-2">Uji Sistem Notifikasi</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="notification-message">Pesan Notifikasi</Label>
                      <Input
                        id="notification-message"
                        placeholder="Masukkan pesan untuk notifikasi uji"
                        value={notificationTest.message}
                        onChange={(e) => setNotificationTest({ ...notificationTest, message: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="notification-type">Jenis Notifikasi</Label>
                      <select
                        id="notification-type"
                        className="w-full px-3 py-2 border rounded-md"
                        value={notificationTest.type}
                        onChange={(e) => setNotificationTest({ ...notificationTest, type: e.target.value })}
                      >
                        <option value="info">Info</option>
                        <option value="warning">Peringatan</option>
                        <option value="error">Error</option>
                      </select>
                    </div>
                    
                    <Button 
                      onClick={handleTestNotification}
                      disabled={sendingNotification || !notificationTest.message}
                    >
                      {sendingNotification ? (
                        <>
                          <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Mengirim Notifikasi...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          Kirim Notifikasi Uji
                        </>
                      )}
                    </Button>
                    
                    <div className="bg-muted/30 rounded-lg p-3 text-sm">
                      <p className="font-medium mb-1">Tentang Sistem Notifikasi:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Notifikasi akan dikirim ke Telegram untuk admin</li>
                        <li>Email notifikasi akan dikirim ke pengguna tentang langganan yang akan kedaluarsa</li>
                        <li>Notifikasi berjalan otomatis setiap hari melalui cron job</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="create-user">
          <Card>
            <CardHeader>
              <CardTitle>Tambah Pengguna Baru</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-username">Username</Label>
                  <Input
                    id="new-username"
                    type="text" 
                    placeholder="Username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="new-email">Email</Label>
                  <Input
                    id="new-email"
                    type="email" 
                    placeholder="Email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="new-password">Password</Label>
                  <Input
                    id="new-password"
                    type="password" 
                    placeholder="Password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="new-role">Role</Label>
                  <select 
                    id="new-role"
                    className="px-3 py-2 border rounded-md w-full"
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                  </select>
                </div>
                
                <Button type="submit" className="w-full">Tambah Pengguna</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
