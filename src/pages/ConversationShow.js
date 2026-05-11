import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';

function ConversationShow() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [senderName, setSenderName] = useState('');
    const [content, setContent] = useState('');
    const [taskTitle, setTaskTitle] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [priority, setPriority] = useState('medium');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        api.get(`/conversations/${id}`).then(res => {
            setConversation(res.data);
            setMessages(res.data.messages || []);
            setTasks(res.data.tasks || []);
        });
    }, [id]);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        const res = await api.post(`/conversations/${id}/messages`, { sender_name: senderName, content });
        setMessages([...messages, res.data]);
        setSenderName('');
        setContent('');
    };

    const addTask = async (e) => {
        e.preventDefault();
        const res = await api.post(`/conversations/${id}/tasks`, { title: taskTitle, assigned_to: assignedTo, priority });
        setTasks([...tasks, res.data]);
        setTaskTitle('');
        setAssignedTo('');
    };

    const toggleTask = async (taskId) => {
        const res = await api.patch(`/tasks/${taskId}/toggle`);
        setTasks(tasks.map(t => t.id === taskId ? res.data : t));
    };

    const summarize = async () => {
        const res = await api.post(`/conversations/${id}/summarize`);
        setConversation({...conversation, summary: res.data.summary});
    };

    const extractTasks = async () => {
        const res = await api.post(`/conversations/${id}/extract-tasks`);
        api.get(`/conversations/${id}/tasks`).then(r => setTasks(r.data));
        alert(res.data.message);
    };

    if (!conversation) return <div style={{padding:'2rem'}}>A carregar...</div>;

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
                <h1 style={styles.title}>{conversation.title}</h1>

                {/* Resumo */}
                <div style={styles.card}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
                        <strong style={{color:'#0f1f3d'}}>🤖 Resumo com IA</strong>
                        <button onClick={summarize} style={styles.btnGold}>Gerar Resumo</button>
                    </div>
                    {conversation.summary
                        ? <div style={styles.summaryBox}><pre style={{whiteSpace:'pre-wrap', fontFamily:'inherit'}}>{conversation.summary}</pre></div>
                        : <p style={{color:'#aaa', fontStyle:'italic'}}>Ainda não há resumo.</p>
                    }
                </div>

                <div style={styles.grid}>
                    {/* Mensagens */}
                    <div style={styles.card}>
                        <strong style={{color:'#0f1f3d'}}>💬 Mensagens</strong>
                        <div style={{marginTop:'1rem'}}>
                            {messages.map(m => (
                                <div key={m.id} style={styles.messageItem}>
                                    <div style={styles.messageSender}>{m.sender_name}</div>
                                    <div style={styles.messageContent}>{m.content}</div>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={sendMessage} style={{marginTop:'1.5rem'}}>
                            <input style={styles.input} type="text" placeholder="Nome" value={senderName} onChange={e => setSenderName(e.target.value)} required />
                            <textarea style={styles.input} placeholder="Mensagem..." value={content} onChange={e => setContent(e.target.value)} rows={3} required />
                            <button style={{...styles.btnBlue, width:'100%'}} type="submit">Enviar Mensagem</button>
                        </form>
                    </div>

                    {/* Tarefas */}
                    <div style={styles.card}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <strong style={{color:'#0f1f3d'}}>✅ Tarefas</strong>
                            <button onClick={extractTasks} style={{...styles.btnGold, fontSize:'0.8rem', padding:'7px 14px'}}>🤖 Extrair</button>
                        </div>
                        <div style={{marginTop:'1rem'}}>
                            {tasks.map(t => (
                                <div key={t.id} style={styles.taskItem}>
                                    <span style={{textDecoration: t.status === 'done' ? 'line-through' : 'none', color: t.status === 'done' ? '#aaa' : '#0f1f3d'}}>
                                        {t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🟢'} {t.title}
                                        {t.assigned_to && <span style={{color:'#aaa', fontSize:'0.85rem'}}> ({t.assigned_to})</span>}
                                    </span>
                                    <button onClick={() => toggleTask(t.id)} style={t.status === 'pending' ? styles.btnToggleDone : styles.btnTogglePending}>
                                        {t.status === 'pending' ? 'Concluir' : 'Reabrir'}
                                    </button>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={addTask} style={{marginTop:'1.5rem'}}>
                            <input style={styles.input} type="text" placeholder="Título da tarefa" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} required />
                            <input style={styles.input} type="text" placeholder="Atribuir a (opcional)" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} />
                            <select style={styles.input} value={priority} onChange={e => setPriority(e.target.value)}>
                                <option value="low">🟢 Baixa</option>
                                <option value="medium">🟡 Média</option>
                                <option value="high">🔴 Alta</option>
                            </select>
                            <button style={{...styles.btnGreen, width:'100%'}} type="submit">Adicionar Tarefa</button>
                        </form>
                    </div>
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
    card: { background: '#fff', border: '1px solid #dce4f0', borderRadius: '10px', padding: '1.8rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
    input: { width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #dce4f0', marginBottom: '1rem', fontSize: '0.95rem', boxSizing: 'border-box' },
    btnGold: { background: '#c9a84c', color: '#0f1f3d', border: 'none', padding: '10px 22px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' },
    btnBlue: { background: '#0f1f3d', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
    btnGreen: { background: '#1a5a3a', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
    summaryBox: { background: '#fffbf0', borderLeft: '3px solid #c9a84c', padding: '14px 18px', borderRadius: '0 6px 6px 0', color: '#2a3a5a', lineHeight: '1.7' },
    messageItem: { padding: '10px 0', borderBottom: '1px solid #eef2f8' },
    messageSender: { color: '#c9a84c', fontWeight: '700', fontSize: '0.9rem' },
    messageContent: { color: '#2a3a5a', marginTop: '2px' },
    taskItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #eef2f8' },
    btnToggleDone: { background: '#f0fff4', border: '1px solid #2a8a2a', color: '#1a6a1a', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' },
    btnTogglePending: { background: '#f0f4ff', border: '1px solid #2a5aae', color: '#1a3a8a', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' },
};

export default ConversationShow;