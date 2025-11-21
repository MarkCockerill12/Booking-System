import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { username: string; email: string } | null;
  login: (email: string, pass: string, isBypass?: boolean) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = (email: string, pass: string, isBypass: boolean = false) => {
    setIsLoading(true);
    
    if (isBypass) {
      // Simulate network delay for realism
      setTimeout(() => {
        console.log("Bypassing Cognito for Demo...");
        setIsAuthenticated(true);
        setUser({ username: 'Demo User', email: email || 'demo@dundee.ac.uk' });
        setIsLoading(false);
      }, 800);
    } else {
      // Place real Cognito logic here later
      alert("Cognito is currently offline. Please use the 'Bypass Login' button.");
      setIsLoading(false);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};