import React from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { GET_ME, SHOPPING_CART_TRANSFER } from '../lib/graphql';

interface AuthContext {
  user: string | null;
  token: string | null;
  onLogin: (username: string, password: string) => void;
  onLogout: () => void;
  shoppingCartCount: number;
}

export const AuthContext = React.createContext<AuthContext>({
  token: null,
  user: null,
  onLogin: () => {},
  onLogout: () => {},
  shoppingCartCount: 0,
});
export const useAuth = () => React.useContext(AuthContext);

export function AuthProvider({ children, client }: any) {
  const navigate = useNavigate();
  const [token, setToken] = React.useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = React.useState<string | null>(localStorage.getItem('user'));
  const { data, refetch } = useQuery(GET_ME, { client });
  const [shoppingCartTransfer] = useMutation(SHOPPING_CART_TRANSFER, { client });

  if (!localStorage.getItem('token') && data?.me?.token) {
    localStorage.setItem('token', data?.me?.token);
  }

  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_GRAPHQL_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', result.user);
      setToken(result.token);
      setUser(result.user);
      await shoppingCartTransfer({ variables: { fromId: data?.me?.username } });
      await refetch();
      navigate('/');
    } catch (error) {
      console.error('error', error);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    const { data } = await refetch();
    localStorage.setItem('token', data?.me?.token);
    setToken(data?.me?.token);
    setUser(null);
    navigate('/');
  };

  const value = {
    token,
    user,
    onLogin: handleLogin,
    onLogout: handleLogout,
    shoppingCartCount: data?.me?.shoppingCart?.totalCount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
