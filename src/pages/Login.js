import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/login', { email, password });
            console.log('Response:', response.data);
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            navigate('/dashboard');
        } catch (err) {
            console.log('Error:', err);
            setError('Credenciais inválidas!');
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>Assist<span style={styles.ia}>IA</span></h1>
                <h2 style={styles.subtitle}>Entrar</h2>
                {error && <div style={styles.error}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <input style={styles.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                    <input style={styles.input} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                    <button style={styles.button} type="submit">Entrar</button>
                </form>
                <p style={{textAlign:'center', marginTop:'1rem'}}>
                    Não tens conta? <Link to="/register">Regista-te</Link>
                </p>
            </div>
        </div>
    );
}

const styles = {
    container: { minHeight: '100vh', background: '#f4f6fb', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    card: { background: '#fff', padding: '2.5rem', borderRadius: '10px', boxShadow: '0 2px 16px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px' },
    title: { fontFamily: 'serif', color: '#c9a84c', textAlign: 'center', fontSize: '2rem', marginBottom: '0.5rem' },
    ia: { color: '#0f1f3d' },
    subtitle: { textAlign: 'center', color: '#0f1f3d', marginBottom: '1.5rem' },
    input: { width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #dce4f0', marginBottom: '1rem', fontSize: '0.95rem', boxSizing: 'border-box' },
    button: { width: '100%', padding: '12px', background: '#c9a84c', color: '#0f1f3d', border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' },
    error: { background: '#fff0f0', border: '1px solid #e05555', color: '#e05555', padding: '10px', borderRadius: '6px', marginBottom: '1rem' },
};

export default Login;