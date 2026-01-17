import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { Identity } from '@dfinity/agent';

interface InternetIdentityContextType {
  identity: Identity | null;
  isInitializing: boolean;
  isLoggingIn: boolean;
  login: () => Promise<void>;
  clear: () => Promise<void>;
}

const InternetIdentityContext = createContext<InternetIdentityContextType | undefined>(undefined);

export function InternetIdentityProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const authClient = await AuthClient.create();
        const isAuthenticated = await authClient.isAuthenticated();

        if (isAuthenticated) {
          setIdentity(authClient.getIdentity());
        }
      } catch (error) {
        console.error('Error initializing auth client:', error);
      } finally {
        setIsInitializing(false);
      }
    }

    init();
  }, []);

  const login = async () => {
    setIsLoggingIn(true);
    try {
      const authClient = await AuthClient.create();
      
      await authClient.login({
        identityProvider: import.meta.env.VITE_II_URL || 'https://identity.ic0.app',
        onSuccess: () => {
          setIdentity(authClient.getIdentity());
          setIsLoggingIn(false);
        },
        onError: (error) => {
          console.error('Login error:', error);
          setIsLoggingIn(false);
        },
      });
    } catch (error) {
      console.error('Error during login:', error);
      setIsLoggingIn(false);
    }
  };

  const clear = async () => {
    try {
      const authClient = await AuthClient.create();
      await authClient.logout();
      setIdentity(null);
    } catch (error) {
      console.error('Error clearing identity:', error);
    }
  };

  return (
    <InternetIdentityContext.Provider
      value={{
        identity,
        isInitializing,
        isLoggingIn,
        login,
        clear,
      }}
    >
      {children}
    </InternetIdentityContext.Provider>
  );
}

export function useInternetIdentity() {
  const context = useContext(InternetIdentityContext);
  if (context === undefined) {
    throw new Error('useInternetIdentity must be used within InternetIdentityProvider');
  }
  return context;
}
