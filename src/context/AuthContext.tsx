
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'admin' | 'teacher' | 'coordinator' | null;

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  userRole: UserRole;
  currentSchool?: string;
  login: (role: UserRole, schoolName?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session duration: 24 hours in milliseconds
const SESSION_DURATION = 24 * 60 * 60 * 1000;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentSchool, setCurrentSchool] = useState<string | undefined>(undefined);

  const isSessionExpired = (loginTimestamp: string): boolean => {
    const timestamp = parseInt(loginTimestamp, 10);
    if (isNaN(timestamp)) return true;
    const now = Date.now();
    return (now - timestamp) > SESSION_DURATION;
  };

  const performLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setCurrentSchool(undefined);
    // Clear all auth-related data from localStorage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentSchoolName');
    localStorage.removeItem('loginTimestamp');
  };

  useEffect(() => {
    // Check if user is logged in from localStorage on component mount
    try {
      const loggedInStatus = localStorage.getItem('isLoggedIn') === 'true';
      const storedRole = localStorage.getItem('userRole') as UserRole;
      const storedSchool = localStorage.getItem('currentSchoolName') || undefined;
      const loginTimestamp = localStorage.getItem('loginTimestamp');

      if (loggedInStatus && storedRole) {
        // Check if session has expired
        if (loginTimestamp && isSessionExpired(loginTimestamp)) {
          console.log('[AuthContext] Session expired, logging out');
          performLogout();
        } else {
          setIsLoggedIn(true);
          setUserRole(storedRole);
          setCurrentSchool(storedSchool);
        }
      }
    } catch (error) {
      console.error('[AuthContext] Error restoring session:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check session expiration periodically (every 5 minutes)
  useEffect(() => {
    if (!isLoggedIn) return;

    const interval = setInterval(() => {
      const loginTimestamp = localStorage.getItem('loginTimestamp');
      if (loginTimestamp && isSessionExpired(loginTimestamp)) {
        console.log('[AuthContext] Session expired during use, logging out');
        performLogout();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const login = (role: UserRole, schoolName?: string) => {
    const now = Date.now();
    setIsLoggedIn(true);
    setUserRole(role);
    setCurrentSchool(schoolName);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', role || '');
    localStorage.setItem('loginTimestamp', now.toString());
    if (schoolName) {
      localStorage.setItem('currentSchoolName', schoolName);
    }
  };

  const logout = () => {
    performLogout();
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, userRole, currentSchool, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
