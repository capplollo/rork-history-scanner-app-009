import { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

interface User {
  id: string;
  email: string;
  fullName: string;
  isEmailConfirmed: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (fullName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  confirmEmail: (token: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  checkAuthStatus: () => Promise<void>;
}

const AUTH_STORAGE_KEY = '@auth_user';
const USERS_STORAGE_KEY = '@registered_users';

export const [AuthProvider, useAuth] = createContextHook<AuthContextType>(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isAuthenticated = user !== null && user.isEmailConfirmed;

  const saveUser = useCallback(async (userData: User) => {
    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  }, []);

  const getRegisteredUsers = useCallback(async (): Promise<User[]> => {
    try {
      const users = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      return users ? JSON.parse(users) : [];
    } catch (error) {
      console.error('Error getting registered users:', error);
      return [];
    }
  }, []);

  const saveRegisteredUsers = useCallback(async (users: User[]) => {
    try {
      await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Error saving registered users:', error);
    }
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log('User loaded from storage:', parsedUser.email);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const users = await getRegisteredUsers();
      const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!foundUser) {
        return { success: false, error: 'Invalid email or password' };
      }
      
      if (!foundUser.isEmailConfirmed) {
        return { success: false, error: 'Please confirm your email before logging in' };
      }
      
      // In a real app, you'd verify the password hash
      // For demo purposes, we'll accept any password for registered users
      await saveUser(foundUser);
      console.log('User logged in:', foundUser.email);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  }, [getRegisteredUsers, saveUser]);

  const signup = useCallback(async (fullName: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const users = await getRegisteredUsers();
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (existingUser) {
        return { success: false, error: 'An account with this email already exists' };
      }
      
      const newUser: User = {
        id: Date.now().toString(),
        email: email.toLowerCase(),
        fullName,
        isEmailConfirmed: false // Require email confirmation
      };
      
      const updatedUsers = [...users, newUser];
      await saveRegisteredUsers(updatedUsers);
      
      console.log('User registered:', newUser.email);
      
      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Registration failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  }, [getRegisteredUsers, saveRegisteredUsers]);

  const confirmEmail = useCallback(async (token: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const users = await getRegisteredUsers();
      // For demo purposes, we'll confirm any user that exists
      // In a real app, you'd validate the token
      
      if (users.length === 0) {
        return { success: false, error: 'No account found to confirm' };
      }
      
      // Get the most recently registered user (for demo)
      const userToConfirm = users[users.length - 1];
      userToConfirm.isEmailConfirmed = true;
      
      const updatedUsers = users.map(u => 
        u.id === userToConfirm.id ? userToConfirm : u
      );
      
      await saveRegisteredUsers(updatedUsers);
      await saveUser(userToConfirm);
      
      console.log('Email confirmed for user:', userToConfirm.email);
      
      return { success: true };
    } catch (error) {
      console.error('Email confirmation error:', error);
      return { success: false, error: 'Email confirmation failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  }, [getRegisteredUsers, saveRegisteredUsers, saveUser]);

  const resetPassword = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await getRegisteredUsers();
      
      // For security, we always return success (don't reveal if email exists)
      console.log('Password reset requested for:', email);
      
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: 'Password reset failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  }, [getRegisteredUsers]);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      console.log('User logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  // Load user from storage on app start
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return useMemo(() => ({
    user,
    isLoading,
    isAuthenticated,
    login,
    signup,
    logout,
    confirmEmail,
    resetPassword,
    checkAuthStatus
  }), [user, isLoading, isAuthenticated, login, signup, logout, confirmEmail, resetPassword, checkAuthStatus]);
});