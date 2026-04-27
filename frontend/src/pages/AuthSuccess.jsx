import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { loginWithToken } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            loginWithToken(token).then(() => {
                navigate('/');
            });
        } else {
            navigate('/login');
        }
    }, [searchParams, navigate, loginWithToken]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
            <div className="loader"></div>
            <p style={{ marginTop: '20px', fontWeight: 'bold' }}>Authenticating your account...</p>
        </div>
    );
};

export default AuthSuccess;
