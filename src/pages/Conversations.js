import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

function Conversations() {
    const [conversations, setConversations] = useState([]);
    const [title, setTitle] = useState('');
    const [type, setType] = useState('meeting');
    const [meetingUrl, setMeetingUrl] = useState('');
    const [showForm, setShowForm] = useState(false);
    const navigate = useNavigate();
    const raw = localStorage.getItem("user");
    const user = raw && raw !== "undefined" ? JSON.parse(raw) : {};

    useEffect(() => {
        api.get('/conversations').then(res => {
            const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
            setConversations(data);
        });
    }, []);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        const payload = { title, type };
        if (meetingUrl) payload.meeting_url = meetingUrl;
        const res = await api.post('/conversations', payload);
        setConversations([res.data, ...conversations]);
        setTitle(''); setMeetingUrl(''); setShowForm(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Apagar esta conversa?')) return;
        await api.delete(`/conversations/${id}`);
        setConversations(conversations.filter(c => c.id !== id));
    };

    const providerLabel = { zoom: 'Zoom', google_meet: 'Google Meet', other: 'Link' };
    const typeLabel = { meeting: 'Reunião', chat: 'Chat', whatsapp: 'WhatsApp' };

    return (
        <div style={styles.container}>
            <nav style={styles.navbar}>
                <span style={styles.brand}>Assist<span style={{color:'#fff'}}>IA</span></span>
                <div style={styles.navLinks}>
                    <Link to="/dashboard"     style={styles.navLink}>Dashboard</Link>
                    <Link to="/conversations" style={styles.navLink}>Conversas</Link>
                    <Link to="/tasks"         style={styles.navLink}>Tarefas</Link>
                    <Link to="/organization"  style={styles.navLink}>Organização</Link>
                    <span style={styles.navUser}>{user.name}</span>
                    <button onClick={logout} style={styles.logoutBtn}>Sair</button>
                </div>
            </nav>
            <div style={styles.content}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
                    <h1 style={styles.title}>💬 Conversas</h1>
                    <button style={styles.button} onClick={() => setShowForm(!showForm)}>+ Nova Conversa</button>
                </div>

                {showForm && (
                    <div style={styles.card}>
                        <form onSubmit={handleCreate}>
                            <div style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}>
                                <input style={{...styles.input,flex:2,minWidth:'200px'}} type="text" placeholder="Título da conversa" value={title} onChange={e => setTitle(e.target.value)} required />
                                <select style={{...styles.input,flex:1}} value={type} onChange={e => setType(e.target.value)}>
                                    <option value="meeting">Reunião (Zoom / Meet)</option>
                                    <option value="chat">Chat</option>
                                    <option value="whatsapp">WhatsApp</option>
                                </select>
                            </div>
                            {type === 'meeting' && (
                                <div>
                                    <input style={{...styles.input,width:'100%'}} type="url" placeholder="Link da reunião (ex: https://zoom.us/j/... ou https://meet.google.com/...)" value={meetingUrl} onChange={e => setMeetingUrl(e.target.value)} />
                                    <small style={{color:'#5a6a8a',display:'block',marginTop:'-0.5rem',marginBottom:'1rem'}}>O provider (Zoom / Google Meet) é detectado automaticamente</small>
                                </div>
                            )}
                            <div style={{display:'flex',gap:'1rem'}}>
                                <button style={styles.button} type="submit">Criar</button>
                                <button style={styles.btnCancel} type="button" onClick={() => setShowForm(false)}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                )}

                {conversations.map(c => (
                    <div key={c.id} style={styles.convItem}>
                        <div>
                            <Link to={`/conversations/${c.id}`} style={styles.convLink}>{c.title}</Link>
                            <span style={styles.badge}>{typeLabel[c.type] || c.type}</span>
                            {c.meeting_provider && (
                                <span style={{...styles.badge, background: c.meeting_provider === 'zoom' ? '#e8f0ff' : '#e8f8f0', color: c.meeting_provider === 'zoom' ? '#1a5aae' : '#1a7a4a'}}>
                                    {providerLabel[c.meeting_provider]}
                                </span>
                            )}
                            {c.summary && <span style={{...styles.badge, background:'#f0fff4', color:'#1a6a1a'}}>✓ Resumido</span>}
                        </div>
                        <button onClick={() => handleDelete(c.id)} style={styles.deleteBtn}>Apagar</button>
                    </div>
                ))}

                {conversations.length === 0 && (
                    <div style={{textAlign:'center',padding:'3rem',color:'#aaa'}}>
                        <div style={{fontSize:'3rem',marginBottom:'1rem'}}>💬</div>
                        <p>Ainda não há conversas. Cria a primeira!</p>
                    </div>
                )}
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
    title: { fontFamily: 'serif', color: '#0f1f3d', fontSize: '1.8rem', margin: 0 },
    card: { background: '#fff', border: '1px solid #dce4f0', borderRadius: '10px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    input: { padding: '10px 14px', borderRadius: '6px', border: '1px solid #dce4f0', fontSize: '0.95rem', boxSizing: 'border-box', marginBottom: '1rem' },
    button: { padding: '10px 22px', background: '#c9a84c', color: '#0f1f3d', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' },
    btnCancel: { padding: '10px 22px', background: 'none', color: '#5a6a8a', border: '1px solid #dce4f0', borderRadius: '6px', cursor: 'pointer' },
    convItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: '#fff', border: '1px solid #dce4f0', borderRadius: '8px', marginBottom: '0.8rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
    convLink: { color: '#0f1f3d', textDecoration: 'none', fontWeight: '600', fontSize: '1rem' },
    badge: { fontSize: '0.72rem', padding: '3px 8px', borderRadius: '20px', background: '#e8eef8', color: '#5a6a8a', marginLeft: '8px' },
    deleteBtn: { background: 'none', border: 'none', color: '#e05555', cursor: 'pointer', fontSize: '0.85rem' },
};

export default Conversations;