import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

function Dashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [stats, setStats] = useState({
        totalConversations: 0,
        totalMessages: 0,
        totalTasks: 0,
        pendingTasks: 0,
        doneTasks: 0,
        highPriorityTasks: 0,
    });
    const [recentConversations, setRecentConversations] = useState([]);

    useEffect(() => {
        api.get('/conversations').then(res => {
            const conversations = res.data;
            setRecentConversations(conversations.slice(0, 5));
            setStats(prev => ({ ...prev, totalConversations: conversations.length }));

            let totalMessages = 0;
            let totalTasks = 0;
            let pendingTasks = 0;
            let doneTasks = 0;
            let highPriorityTasks = 0;

            const promises = conversations.map(c =>
                api.get(`/conversations/${c.id}`).then(res => {
                    totalMessages += res.data.messages.length;
                    totalTasks += res.data.tasks.length;
                    pendingTasks += res.data.tasks.filter(t => t.status === 'pending').length;
                    doneTasks += res.data.tasks.filter(t => t.status === 'done').length;
                    highPriorityTasks += res.data.tasks.filter(t => t.priority === 'high' && t.status === 'pending').length;
                })
            );

            Promise.all(promises).then(() => {
                setStats({ totalConversations: conversations.length, totalMessages, totalTasks, pendingTasks, doneTasks, highPriorityTasks });
            });
        });
    }, []);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
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
                <h1 style={styles.title}>📊 Dashboard</h1>

                {/* Estatísticas */}
                <div style={styles.statsGrid}>
                    <div style={styles.statCard}>
                        <div style={styles.statNumber}>{stats.totalConversations}</div>
                        <div style={styles.statLabel}>Conversas</div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={styles.statNumber}>{stats.totalMessages}</div>
                        <div style={styles.statLabel}>Mensagens</div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={styles.statNumber}>{stats.totalTasks}</div>
                        <div style={styles.statLabel}>Tarefas</div>
                    </div>
                    <div style={{...styles.statCard}}>
                        <div style={{...styles.statNumber, color:'#e05555'}}>{stats.pendingTasks}</div>
                        <div style={styles.statLabel}>Pendentes</div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={{...styles.statNumber, color:'#2a8a5a'}}>{stats.doneTasks}</div>
                        <div style={styles.statLabel}>Concluídas</div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={{...styles.statNumber, color:'#e05555'}}>{stats.highPriorityTasks}</div>
                        <div style={styles.statLabel}>🔴 Alta Prioridade</div>
                    </div>
                </div>

                {/* Conversas Recentes */}
                <div style={styles.card}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
                        <strong style={{color:'#0f1f3d', fontSize:'1.1rem'}}>🕐 Conversas Recentes</strong>
                        <Link to="/conversations" style={styles.btnGold}>Ver Todas</Link>
                    </div>
                    {recentConversations.length === 0
                        ? <p style={{color:'#aaa', fontStyle:'italic'}}>Ainda não tens conversas.</p>
                        : recentConversations.map(c => (
                            <div key={c.id} style={styles.convItem}>
                                <div>
                                    <Link to={`/conversations/${c.id}`} style={styles.convLink}>{c.title}</Link>
                                    <span style={styles.badge}>{c.type === 'meeting' ? 'Reunião' : 'Chat'}</span>
                                </div>
                            </div>
                        ))
                    }
                </div>
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
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' },
    statCard: { background: '#fff', border: '1px solid #dce4f0', borderRadius: '10px', padding: '1.5rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    statNumber: { fontSize: '2.5rem', color: '#c9a84c', fontFamily: 'serif', fontWeight: '700' },
    statLabel: { color: '#5a6a8a', fontSize: '0.9rem', marginTop: '4px' },
    card: { background: '#fff', border: '1px solid #dce4f0', borderRadius: '10px', padding: '1.8rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    convItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 0', borderBottom: '1px solid #eef2f8' },
    convLink: { color: '#0f1f3d', textDecoration: 'none', fontWeight: '600' },
    badge: { fontSize: '0.72rem', padding: '3px 8px', borderRadius: '20px', background: '#e8eef8', color: '#5a6a8a', marginLeft: '8px' },
    btnGold: { background: '#c9a84c', color: '#0f1f3d', border: 'none', padding: '8px 18px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', textDecoration: 'none', fontSize: '0.85rem' },
};
export default Dashboard;