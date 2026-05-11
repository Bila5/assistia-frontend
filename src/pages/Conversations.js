import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

function Conversations() {
    const [conversations, setConversations] = useState([]);
    const [title, setTitle] = useState('');
    const [type, setType] = useState('meeting');
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        api.get('/conversations').then(res => setConversations(res.data));
    }, []);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        const res = await api.post('/conversations', { title, type });
        setConversations([res.data, ...conversations]);
        setTitle('');
    };

    const handleDelete = async (id) => {
        await api.delete(`/conversations/${id}`);
        setConversations(conversations.filter(c => c.id !== id));
    };

    return (
        <div style={styles.container}>
            <nav style={styles.navbar}>
                <span style={styles.brand}>Assist<span style={{color:'#fff'}}>IA</span></span>
                <div style={styles.navLinks}>
                    <Link to="/dashboard" style={styles.navLink}>Dashboard</Link>
                    <Link to="/conversations" style={styles.navLink}>Conversas</Link>
                    <span style={styles.navUser}>{user.name}</span>
                    <button onClick={logout} style={styles.logoutBtn}>Sair</button>
                </div>
            </nav>
            <div style={styles.content}>
                <h1 style={styles.title}>💬 Conversas</h1>

                <div style={styles.card}>
                    <form onSubmit={handleCreate} style={{display:'flex', gap:'1rem', alignItems:'center'}}>
                        <input style={{...styles.input, flex:1}} type="text" placeholder="Título da conversa" value={title} onChange={e => setTitle(e.target.value)} required />
                        <select style={styles.input} value={type} onChange={e => setType(e.target.value)}>
                            <option value="meeting">Reunião</option>
                            <option value="chat">Chat</option>
                        </select>
                        <button style={styles.button} type="submit">+ Nova</button>
                    </form>
                </div>

                {conversations.map(c => (
                    <div key={c.id} style={styles.convItem}>
                        <div>
                            <Link to={`/conversations/${c.id}`} style={styles.convLink}>{c.title}</Link>
                            <span style={styles.badge}>{c.type === 'meeting' ? 'Reunião' : 'Chat'}</span>
                        </div>
                        <button onClick={() => handleDelete(c.id)} style={styles.deleteBtn}>Apagar</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

const styles = {
    container: { minHeight: '100vh', background: '#f4f6fb' },
    navbar: { background: '#0f1f3d', borderBottom: '2px solid #c9a84c', padding: '0 2rem', height: '65px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    brand: { fontFamily: 'serif', fontSize: '1.5rem', color: '#c9a84c', letterSpacing: '1px' },
    navLinks: { display: 'flex', alignItems: 'center', gap: '1.5rem' },
    navLink: { color: '#a0b0c8', fontSize: '0.9rem', textDecoration: 'none' },
    navUser: { color: '#a0b0c8', fontSize: '0.9rem' },
    logoutBtn: { color: '#c9a84c', fontSize: '0.85rem', border: '1px solid #c9a84c', padding: '6px 14px', borderRadius: '4px', background: 'none', cursor: 'pointer' },
    content: { padding: '2rem', maxWidth: '1100px', margin: '0 auto' },
    title: { fontFamily: 'serif', color: '#0f1f3d', fontSize: '1.8rem', marginBottom: '1.5rem' },
    card: { background: '#fff', border: '1px solid #dce4f0', borderRadius: '10px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    input: { padding: '10px 14px', borderRadius: '6px', border: '1px solid #dce4f0', fontSize: '0.95rem' },
    button: { padding: '10px 22px', background: '#c9a84c', color: '#0f1f3d', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' },
    convItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: '#fff', border: '1px solid #dce4f0', borderRadius: '8px', marginBottom: '0.8rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
    convLink: { color: '#0f1f3d', textDecoration: 'none', fontWeight: '600', fontSize: '1rem' },
    badge: { fontSize: '0.72rem', padding: '3px 8px', borderRadius: '20px', background: '#e8eef8', color: '#5a6a8a', marginLeft: '8px' },
    deleteBtn: { background: 'none', border: 'none', color: '#e05555', cursor: 'pointer', fontSize: '0.85rem' },
};

export default Conversations;