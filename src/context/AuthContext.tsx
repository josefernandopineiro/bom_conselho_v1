
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

  useEffect(() => {
    // Check if user is logged in from localStorage on component mount
    try {
      const loggedInStatus = localStorage.getItem('isLoggedIn') === 'true';
      const storedRole = localStorage.getItem('userRole') as UserRole;
      const storedSchool = localStorage.getItem('currentSchoolName') || undefined;

      if (loggedInStatus && storedRole) {
        setIsLoggedIn(true);
        setUserRole(storedRole);
        setCurrentSchool(storedSchool);
      }
    } catch (error) {
      console.error('[AuthContext] Error restoring session:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (role: UserRole, schoolName?: string) => {
    setIsLoggedIn(true);
    setUserRole(role);
    setCurrentSchool(schoolName);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', role || '');
    if (schoolName) {
      localStorage.setItem('currentSchoolName', schoolName);
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setCurrentSchool(undefined);
    // Clear all auth-related data from localStorage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentSchoolName');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, userRole, currentSchool, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
