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
    console.group("🔐 [Auth] Login Attempt");
    console.log("Email:", email);
    console.log("Bypass Mode:", isBypass);
    
    if (isBypass) {
      setTimeout(() => {
        console.log("✅ [Auth] Bypass Successful. Logged in as Demo User.");
        setIsAuthenticated(true);
        setUser({ username: 'Demo User', email: email || 'demo@dundee.ac.uk' });
        setIsLoading(false);
        console.groupEnd();
      }, 800);
    } else {
      console.warn("⚠️ [Auth] Real Cognito not configured in local env.");
      alert("Cognito is currently offline. Please use the 'Bypass Login' button.");
      setIsLoading(false);
      console.groupEnd();
    }
  };

  const logout = () => {
    console.log("👋 [Auth] User Logged Out");
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