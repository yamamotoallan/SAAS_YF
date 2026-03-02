import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api, getToken, setToken, setUser, removeToken, removeUser, getUser } from '../../services/api';
import type { User } from '../../types/api';

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUserState] = useState<User | null>(getUser());
    const [token, setTokenState] = useState<string | null>(getToken());
    const [loading, setLoading] = useState(!!getToken());

    useEffect(() => {
        const stored = getToken();
        if (!stored) { setLoading(false); return; }

        api.auth.me()
            .then((me) => {
                setUserState(me);
                setUser(me);
            })
            .catch(() => {
                removeToken();
                removeUser();
                setTokenState(null);
                setUserState(null);
            })
            .finally(() => setLoading(false));
    }, []);

    const login = async (email: string, password: string) => {
        const { token: t, user: u } = await api.auth.login(email, password);
        setToken(t);
        setUser(u);
        setTokenState(t);
        setUserState(u);
    };

    const logout = () => {
        removeToken();
        removeUser();
        setTokenState(null);
        setUserState(null);
    };

    return (
        <AuthContext.Provider value={{
            user, token, loading, login, logout,
            isAuthenticated: !!token && !!user,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
