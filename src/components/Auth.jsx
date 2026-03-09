import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import './Auth.css';

const Auth = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mode, setMode] = useState('login'); // 'login' or 'signup'
    const [message, setMessage] = useState('');

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            if (mode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage('¡Registro con éxito! Revisa tu email para confirmar.');
            }
        } catch (error) {
            setMessage(error.error_description || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <img 
                            src="https://ofimaticadigital.es/wp-content/uploads/2021/07/logo-ofimatica-digital-v5.png" 
                            alt="Ofimática Digital" 
                            onError={(e) => {
                                e.target.onerror = null; 
                                e.target.src = "https://ui-avatars.com/api/?name=Ofimatica+Digital&background=0087c1&color=fff&size=128";
                            }}
                        />
                    </div>
                    <h1>{mode === 'login' ? 'Bienvenido de nuevo' : 'Crea una cuenta'}</h1>
                    <p>{mode === 'login' ? 'Accede al generador de presupuestos' : 'Regístrate para empezar a crear'}</p>
                </div>

                <form className="auth-form" onSubmit={handleAuth}>
                    <div className="input-group">
                        <label>Email</label>
                        <div className="input-wrapper">
                            <Mail size={18} />
                            <input 
                                type="email" 
                                placeholder="tu@email.com" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Contraseña</label>
                        <div className="input-wrapper">
                            <Lock size={18} />
                            <input 
                                type="password" 
                                placeholder="••••••••" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required 
                            />
                        </div>
                    </div>

                    {message && <div className={`auth-message ${message.includes('éxito') ? 'success' : 'error'}`}>{message}</div>}

                    <button className="primary-btn w-full" type="submit" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (mode === 'login' ? 'Entrar' : 'Registrarse')}
                        {!loading && <ArrowRight size={20} />}
                    </button>
                </form>

                <div className="auth-footer">
                    <span>
                        {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                    </span>
                    <button className="text-btn" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
                        {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;
