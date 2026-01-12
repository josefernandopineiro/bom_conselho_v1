
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'admin' | 'teacher' | 'coordinator' | null;

interface AuthContextType {
  isLoggedIn: boolean;
  userRole: UserRole;
  login: (role: UserRole, schoolName?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  userRole: null,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentSchool, setCurrentSchool] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Check if user is logged in from localStorage on component mount
    const loggedInStatus = localStorage.getItem('isLoggedIn') === 'true';
    const storedRole = localStorage.getItem('userRole') as UserRole;
    const storedSchool = localStorage.getItem('currentSchoolName') || undefined;
    
    if (loggedInStatus && storedRole) {
      setIsLoggedIn(true);
      setUserRole(storedRole);
      setCurrentSchool(storedSchool);
    }
  }, []);

  const login = (role: UserRole, schoolName?: string) => {
    setIsLoggedIn(true);
    setUserRole(role);
    setCurrentSchool(schoolName);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', role || '');
    if (schoolName) localStorage.setItem('currentSchoolName', schoolName);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
