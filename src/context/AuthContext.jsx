import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // exp is in seconds, Date.now() is ms
        return payload.exp * 1000 < Date.now();
    } catch {
        return true; // malformed token → treat as expired
    }
}

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => {
        const stored = localStorage.getItem('token');
        if (stored && isTokenExpired(stored)) {
            localStorage.removeItem('token');
            return null;
        }
        return stored || null;
    });

    useEffect(() => {
        if (token && isTokenExpired(token)) {
            logout();
        }
    }, [token]);

    const login = (newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);