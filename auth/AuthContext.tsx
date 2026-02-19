import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signIn as cognitoSignIn,
  signUp as cognitoSignUp,
  confirmSignUp as cognitoConfirmSignUp,
  signOut as cognitoSignOut,
  getCurrentSession,
  getUserAttributes,
  SignUpParams,
  UserAttributes,
} from "./authService";

interface AuthContextType {
  user: UserAttributes | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (params: SignUpParams) => Promise<void>;
  confirmCode: (email: string, code: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserAttributes | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const session = await getCurrentSession();
      if (session && session.isValid()) {
        const attrs = await getUserAttributes();
        setUser(attrs);
        setIsAuthenticated(true);
      }
    } catch {
      // No valid session
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    await cognitoSignIn(email, password);
    const attrs = await getUserAttributes();
    setUser(attrs);
    setIsAuthenticated(true);
  };

  const register = async (params: SignUpParams) => {
    await cognitoSignUp(params);
  };

  const confirmCode = async (email: string, code: string) => {
    await cognitoConfirmSignUp(email, code);
  };

  const logout = () => {
    cognitoSignOut();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        confirmCode,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
