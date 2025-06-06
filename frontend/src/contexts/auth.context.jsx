import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import { api } from '@/services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp < currentTime) {
          // Token expired, log out
          logout();
        } else {
          // Token valid, fetch user data
          fetchUserData(token);
        }
      } catch (error) {
        console.error('Invalid token:', error);
        logout();
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async (token) => {
    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await api.get('/user/me');
      setUser(response.data.user);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      logout();
    }
  };

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      // Make sure we're sending the correct field names that the backend expects
      const loginData = {
        username: credentials.email || credentials.username, // Backend accepts both email or username in the username field
        password: credentials.password
      };
      
      const response = await api.post('/auth/login', loginData);
      const { token, user, verificationNeeded } = response.data;
      
      // Check if email verification is needed
      if (verificationNeeded) {
        // Store minimal data for verification page
        localStorage.setItem('pendingVerification', JSON.stringify({
          userId: user.id,
          email: user.email,
          username: user.username
        }));
        
        // Set limited token
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Return special value to indicate verification needed
        // This will be handled by the Login component
        return 'verification_needed';
      }
      
      // If verification not needed (already verified or admin)
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setError(error.response?.data?.message || 'Gagal login. Silakan coba lagi.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user, verificationSent } = response.data;
      
      // Check if email verification is needed
      if (!user.verified) {
        // Store minimal data for verification page
        localStorage.setItem('pendingVerification', JSON.stringify({
          userId: user.id,
          email: user.email,
          username: user.username
        }));
        
        // Set limited token
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Redirect to verification page
        window.location.href = '/verify-email';
        return false;
      }
      
      // If no verification needed (admin accounts)
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      setError(error.response?.data?.message || 'Gagal mendaftar. Silakan coba lagi.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (resetData) => {
    setLoading(true);
    setError(null);
    
    try {
      await api.post('/auth/reset-password', resetData);
      return true;
    } catch (error) {
      console.error('Password reset failed:', error);
      setError(error.response?.data?.message || 'Gagal reset password. Silakan coba lagi.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Verify email with verification code
  const verifyEmail = async (verificationData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/auth/verify-email', verificationData);
      const { token, user } = response.data;
      
      // Update token with full-access token
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      return true;
    } catch (error) {
      console.error('Email verification failed:', error);
      // Set error message but also throw the error so the component can handle it
      setError(error.response?.data?.message || 'Verifikasi email gagal. Silakan coba lagi.');
      throw error; // Re-throw the error so the component can display a toast message
    } finally {
      setLoading(false);
    }
  };
  
  // Resend verification code
  const resendVerificationCode = async (userId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/auth/resend-verification', { userId });
      return true;
    } catch (error) {
      console.error('Resend verification failed:', error);
      setError(error.response?.data?.message || 'Gagal mengirim kode verifikasi. Silakan coba lagi.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Save the current theme preference before logout
    const currentTheme = localStorage.getItem('theme');
    
    // Clear all authentication-related data
    localStorage.removeItem('token');
    localStorage.removeItem('pendingVerification');
    localStorage.removeItem('resetPasswordData');
    delete api.defaults.headers.common['Authorization'];
    
    // If theme preference was saved, make sure it's restored
    if (currentTheme) {
      localStorage.setItem('theme', currentTheme);
    }
    
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        resetPassword,
        verifyEmail,
        resendVerificationCode,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
