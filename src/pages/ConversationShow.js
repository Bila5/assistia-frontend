import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api";

function ConversationShow() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [senderName, setSenderName] = useState("");
    const [content, setContent] = useState("");
    const [taskTitle, setTaskTitle] = useState("");
    const [assignedTo, setAssignedTo] = useState("");
    const [priority, setPriority] = useState("medium");
    const [deadline, setDeadline] = useState("");
    const [aiLoading, setAiLoading] = useState(false);

    // Google Calendar
    const [googleConnected, setGoogleConnected] = useState(false);
    const [showCalendarForm, setShowCalendarForm] = useState(false);
    const [calendarForm, setCalendarForm] = useState({ title: '', description: '', start: '', end: '' });
    const [calendarLoading, setCalendarLoading] = useState(false);
    const [calendarMsg, setCalendarMsg] = useState('');

    // Zoom
    const [zoomConnected, setZoomConnected] = useState(false);
    const [showZoomForm, setShowZoomForm] = useState(false);
    const [zoomForm, setZoomForm] = useState({ topic: '', start_time: '', duration: 60 });
    const [zoomLoading, setZoomLoading] = useState(false);
    const [zoomMsg, setZoomMsg] = useState('');

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    useEffect(() => {
        api.get(`/conversations/${id}`).then(res => {
            setConversation(res.data);
            setMessages(res.data.messages || []);
            setTasks(res.data.tasks || []);
        });
        api.get('/google/status').then(res => setGoogleConnected(res.data.connected)).catch(() => {});
        api.get('/zoom/status').then(res => setZoomConnected(res.data.connected)).catch(() => {});

        // Verificar se voltou do Zoom OAuth
        const params = new URLSearchParams(window.location.search);
        if (params.get('zoom') === 'success' && params.get('zoom_token')) {
            api.post('/zoom/save-token', { token: params.get('zoom_token') })
                .then(() => { setZoomConnected(true); setZoomMsg('✅ Zoom ligado com sucesso!'); })
                .catch(() => {});
            window.history.replaceState({}, '', window.location.pathname);
        }
        if (params.get('google') === 'success') {
            setGoogleConnected(true);
            setCalendarMsg('✅ Google Calendar ligado com sucesso!');
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [id]);

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        const res = await api.post(`/conversations/${id}/messages`, { sender_name: senderName, content });
        setMessages([...messages, res.data]);
        setSenderName(""); setContent("");
    };

    const addTask = async (e) => {
        e.preventDefault();
        const payload = { title: taskTitle, assigned_to: assignedTo, priority };
        if (deadline) payload.deadline = deadline;
        const res = await api.post(`/conversations/${id}/tasks`, payload);
        setTasks([...tasks, res.data]);
        setTaskTitle(""); setAssignedTo(""); setDeadline("");
    };

    const toggleTask = async (taskId) => {
        const res = await api.patch(`/tasks/${taskId}/toggle`);
        setTasks(tasks.map(t => t.id === taskId ? res.data : t));
    };

    const summarize = async () => {
        setAiLoading(true);
        try {
            const res = await api.post(`/conversations/${id}/summarize`);
            setConversation({...conversation, summary: res.data.summary});
        } catch { alert("Erro ao gerar resumo."); }
        finally { setAiLoading(false); }
    };

    const extractTasks = async () => {
        setAiLoading(true);
        try {
            await api.post(`/conversations/${id}/extract-tasks`);
            const t = await api.get(`/conversations/${id}/tasks`);
            setTasks(t.data);
        } catch { alert("Erro ao extrair tarefas."); }
        finally { setAiLoading(false); }
    };

    // Google Calendar
    const connectGoogle = async () => {
        const res = await api.get('/google/redirect');
        window.location.href = res.data.url;
    };

    const createCalendarEvent = async (e) => {
        e.preventDefault();
        setCalendarLoading(true);
        setCalendarMsg('');
        try {
            const res = await api.post(`/conversations/${id}/calendar`, calendarForm);
            setCalendarMsg('✅ ' + res.data.message);
            setConversation({...conversation, calendar_event_url: res.data.event_url});
            setShowCalendarForm(false);
        } catch (err) {
            if (err.response?.data?.needs_auth) connectGoogle();
            else setCalendarMsg('❌ ' + (err.response?.data?.message || 'Erro ao criar evento'));
        } finally { setCalendarLoading(false); }
    };

    // Zoom
    const connectZoom = async () => {
        const res = await api.get('/zoom/redirect');
        window.location.href = res.data.url;
    };

    const createZoomMeeting = async (e) => {
        e.preventDefault();
        setZoomLoading(true);
        setZoomMsg('');
        try {
            const res = await api.post(`/conversations/${id}/zoom`, zoomForm);
            setZoomMsg('✅ ' + res.data.message);
            setConversation({...conversation, meeting_url: res.data.join_url, meeting_provider: 'zoom'});
            setShowZoomForm(false);
        } catch (err) {
            if (err.response?.data?.needs_auth) connectZoom();
            else setZoomMsg('❌ ' + (err.response?.data?.message || 'Erro ao criar reunião'));
        } finally { setZoomLoading(false); }
    };

    const providerLabel = { zoom: 'Zoom', google_meet: 'Google Meet', other: 'Reunião' };
    const providerColor = { zoom: '#1a5aae', google_meet: '#1a7a4a', other: '#5a6a8a' };
    const providerBg    = { zoom: '#e8f0ff', google_meet: '#e8f8f0', other: '#f0f4ff' };

    if (!conversation) return <div style={{padding:"2rem"}}>A carregar...</div>;

    return (
        <div style={s.container}>
            <nav style={s.navbar}>
                <span style={s.brand}>Assist<span style={{color:"#fff"}}>IA</span></span>
                <div style={s.navLinks}>
                    <Link to="/dashboard"     style={s.navLink}>Dashboard</Link>
                    <Link to="/conversations" style={s.navLink}>Conversas</Link>
                    <Link to="/tasks"         style={s.navLink}>Tarefas</Link>
                    <Link to="/organization"  style={s.navLink}>Organização</Link>
                    <span style={s.navUser}>{user.name}</span>
                    <button onClick={logout} style={s.logoutBtn}>Sair</button>
                </div>
            </nav>
            <div style={s.content}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem",flexWrap:"wrap",gap:"1rem"}}>
                    <div>
                        <Link to="/conversations" style={{color:"#5a6a8a",textDecoration:"none",fontSize:"0.9rem"}}>← Conversas</Link>
                        <h1 style={s.title}>{conversation.title}</h1>
                    </div>
                    <div style={{display:"flex",gap:"0.8rem",flexWrap:"wrap"}}>
                        <button onClick={summarize} style={s.btnGold} disabled={aiLoading}>{aiLoading ? "..." : "✨ Resumir"}</button>
                        <button onClick={extractTasks} style={s.btnBlue} disabled={aiLoading}>{aiLoading ? "..." : "📋 Extrair Tarefas"}</button>
                        {googleConnected
                            ? <button onClick={() => setShowCalendarForm(!showCalendarForm)} style={s.btnGoogle}>📅 Google Calendar</button>
                            : <button onClick={connectGoogle} style={s.btnGoogle}>🔗 Ligar Google</button>
                        }
                        {zoomConnected
                            ? <button onClick={() => setShowZoomForm(!showZoomForm)} style={s.btnZoom}>📹 Criar Zoom</button>
                            : <button onClick={connectZoom} style={s.btnZoom}>🔗 Ligar Zoom</button>
                        }
                    </div>
                </div>

                {/* Link reunião existente */}
                {conversation.meeting_url && (
                    <div style={{...s.meetBanner, borderColor: providerColor[conversation.meeting_provider] || '#1a73e8', background: providerBg[conversation.meeting_provider] || '#e8f4fd'}}>
                        <span style={{color:"#0f1f3d"}}>📹 <strong>{providerLabel[conversation.meeting_provider] || 'Reunião'}</strong></span>
                        <a href={conversation.meeting_url} target="_blank" rel="noreferrer"
                            style={{...s.meetLink, background: providerColor[conversation.meeting_provider] || '#1a73e8'}}>
                            Entrar na Reunião →
                        </a>
                    </div>
                )}

                {/* Link Google Calendar */}
                {conversation.calendar_event_url && (
                    <div style={{background:"#e8f8f0",border:"1px solid #1a7a4a",borderRadius:"8px",padding:"1rem 1.5rem",marginBottom:"1.5rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{color:"#0f1f3d"}}>📅 <strong>Evento no Google Calendar</strong></span>
                        <a href={conversation.calendar_event_url} target="_blank" rel="noreferrer"
                            style={{background:"#1a7a4a",color:"#fff",padding:"8px 16px",borderRadius:"6px",textDecoration:"none",fontWeight:"600"}}>Ver Evento →</a>
                    </div>
                )}

                {/* Mensagens de sucesso/erro */}
                {calendarMsg && <div style={s.msgBox}>{calendarMsg}</div>}
                {zoomMsg && <div style={s.msgBox}>{zoomMsg}</div>}

                {/* Formulário Google Calendar */}
                {showCalendarForm && (
                    <div style={s.card}>
                        <strong style={{color:"#0f1f3d"}}>📅 Criar Evento no Google Calendar</strong>
                        <form onSubmit={createCalendarEvent} style={{marginTop:"1rem"}}>
                            <input style={s.input} type="text" placeholder="Título do evento" value={calendarForm.title}
                                onChange={e => setCalendarForm({...calendarForm, title: e.target.value})} required />
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
                                <div>
                                    <label style={s.label}>Início</label>
                                    <input style={s.input} type="datetime-local" value={calendarForm.start}
                                        onChange={e => setCalendarForm({...calendarForm, start: e.target.value})} required />
                                </div>
                                <div>
                                    <label style={s.label}>Fim</label>
                                    <input style={s.input} type="datetime-local" value={calendarForm.end}
                                        onChange={e => setCalendarForm({...calendarForm, end: e.target.value})} required />
                                </div>
                            </div>
                            <textarea style={{...s.input,height:"70px",resize:"vertical"}} placeholder="Descrição (opcional)"
                                value={calendarForm.description} onChange={e => setCalendarForm({...calendarForm, description: e.target.value})} />
                            <div style={{display:"flex",gap:"1rem"}}>
                                <button style={s.btnGoogle} type="submit" disabled={calendarLoading}>{calendarLoading ? "A criar..." : "📅 Criar Evento"}</button>
                                <button style={s.btnCancel} type="button" onClick={() => setShowCalendarForm(false)}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Formulário Zoom */}
                {showZoomForm && (
                    <div style={s.card}>
                        <strong style={{color:"#0f1f3d"}}>📹 Criar Reunião Zoom</strong>
                        <form onSubmit={createZoomMeeting} style={{marginTop:"1rem"}}>
                            <input style={s.input} type="text" placeholder="Tema da reunião" value={zoomForm.topic}
                                onChange={e => setZoomForm({...zoomForm, topic: e.target.value})} required />
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
                                <div>
                                    <label style={s.label}>Data e hora</label>
                                    <input style={s.input} type="datetime-local" value={zoomForm.start_time}
                                        onChange={e => setZoomForm({...zoomForm, start_time: e.target.value})} required />
                                </div>
                                <div>
                                    <label style={s.label}>Duração (minutos)</label>
                                    <input style={s.input} type="number" min="1" value={zoomForm.duration}
                                        onChange={e => setZoomForm({...zoomForm, duration: e.target.value})} />
                                </div>
                            </div>
                            <div style={{display:"flex",gap:"1rem"}}>
                                <button style={s.btnZoom} type="submit" disabled={zoomLoading}>{zoomLoading ? "A criar..." : "📹 Criar Reunião"}</button>
                                <button style={s.btnCancel} type="button" onClick={() => setShowZoomForm(false)}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Resumo IA */}
                <div style={s.card}>
                    <strong style={{color:"#0f1f3d"}}>🤖 Resumo com IA</strong>
                    {conversation.summary
                        ? <div style={s.summaryBox}><pre style={{whiteSpace:"pre-wrap",fontFamily:"inherit"}}>{conversation.summary}</pre></div>
                        : <p style={{color:"#aaa",fontStyle:"italic",marginTop:"0.5rem"}}>Clica em "✨ Resumir" para gerar.</p>
                    }
                </div>

                <div style={s.grid}>
                    {/* Mensagens */}
                    <div style={s.card}>
                        <strong style={{color:"#0f1f3d"}}>💬 Mensagens</strong>
                        <div style={{marginTop:"1rem",maxHeight:"300px",overflowY:"auto"}}>
                            {messages.length === 0
                                ? <p style={{color:"#aaa",fontStyle:"italic"}}>Sem mensagens ainda.</p>
                                : messages.map(m => (
                                    <div key={m.id} style={s.messageItem}>
                                        <div style={s.messageSender}>{m.sender_name || m.sender_role}</div>
                                        <div style={s.messageContent}>{m.content}</div>
                                    </div>
                                ))
                            }
                        </div>
                        <form onSubmit={sendMessage} style={{marginTop:"1.5rem"}}>
                            <input style={s.input} type="text" placeholder="O teu nome" value={senderName} onChange={e=>setSenderName(e.target.value)} required />
                            <textarea style={s.input} placeholder="Mensagem..." value={content} onChange={e=>setContent(e.target.value)} rows={3} required />
                            <button style={{...s.btnBlue,width:"100%"}} type="submit">Enviar Mensagem</button>
                        </form>
                    </div>

                    {/* Tarefas */}
                    <div style={s.card}>
                        <strong style={{color:"#0f1f3d"}}>✅ Tarefas</strong>
                        <div style={{marginTop:"1rem",maxHeight:"300px",overflowY:"auto"}}>
                            {tasks.length === 0
                                ? <p style={{color:"#aaa",fontStyle:"italic"}}>Sem tarefas. Usa "📋 Extrair Tarefas".</p>
                                : tasks.map(t => (
                                    <div key={t.id} style={s.taskItem}>
                                        <div>
                                            <span style={{textDecoration:t.status==="done"?"line-through":"none",color:t.status==="done"?"#aaa":"#0f1f3d"}}>
                                                {t.priority==="high"?"🔴":t.priority==="medium"?"🟡":"🟢"} {t.title}
                                            </span>
                                            <div style={{fontSize:"0.82rem",color:"#5a6a8a",marginTop:"2px"}}>
                                                {t.assigned_to && <span>→ {t.assigned_to} </span>}
                                                {t.deadline && <span>📅 {new Date(t.deadline).toLocaleDateString('pt-PT')}</span>}
                                            </div>
                                        </div>
                                        <button onClick={()=>toggleTask(t.id)} style={t.status==="pending"?s.btnToggleDone:s.btnTogglePending}>
                                            {t.status==="pending"?"Concluir":"Reabrir"}
                                        </button>
                                    </div>
                                ))
                            }
                        </div>
                        <form onSubmit={addTask} style={{marginTop:"1.5rem"}}>
                            <input style={s.input} type="text" placeholder="Título da tarefa" value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} required />
                            <input style={s.input} type="text" placeholder="Atribuir a (opcional)" value={assignedTo} onChange={e=>setAssignedTo(e.target.value)} />
                            <input style={s.input} type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} />
                            <select style={s.input} value={priority} onChange={e=>setPriority(e.target.value)}>
                                <option value="low">🟢 Baixa</option>
                                <option value="medium">🟡 Média</option>
                                <option value="high">🔴 Alta</option>
                            </select>
                            <button style={{...s.btnGreen,width:"100%"}} type="submit">Adicionar Tarefa</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

const s = {
    container:{minHeight:"100vh",background:"#f4f6fb"},
    navbar:{background:"#0f1f3d",borderBottom:"2px solid #c9a84c",padding:"0 2rem",height:"65px",display:"flex",alignItems:"center",justifyContent:"space-between"},
    brand:{fontFamily:"serif",fontSize:"1.5rem",color:"#c9a84c",letterSpacing:"1px"},
    navLinks:{display:"flex",alignItems:"center",gap:"1.5rem"},
    navLink:{color:"#a0b0c8",fontSize:"0.9rem",textDecoration:"none"},
    navUser:{color:"#a0b0c8",fontSize:"0.9rem"},
    logoutBtn:{color:"#c9a84c",fontSize:"0.85rem",border:"1px solid #c9a84c",padding:"6px 14px",borderRadius:"4px",background:"none",cursor:"pointer"},
    content:{padding:"2rem",maxWidth:"1100px",margin:"0 auto"},
    title:{fontFamily:"serif",color:"#0f1f3d",fontSize:"1.8rem",margin:"0.3rem 0 0"},
    card:{background:"#fff",border:"1px solid #dce4f0",borderRadius:"10px",padding:"1.8rem",marginBottom:"1.5rem",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},
    grid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.5rem"},
    input:{width:"100%",padding:"10px 14px",borderRadius:"6px",border:"1px solid #dce4f0",marginBottom:"1rem",fontSize:"0.95rem",boxSizing:"border-box"},
    label:{fontSize:"0.85rem",color:"#5a6a8a",display:"block",marginBottom:"4px"},
    btnGold:{background:"#c9a84c",color:"#0f1f3d",border:"none",padding:"10px 22px",borderRadius:"6px",fontWeight:"700",cursor:"pointer"},
    btnBlue:{background:"#0f1f3d",color:"#fff",border:"none",padding:"10px 22px",borderRadius:"6px",fontWeight:"600",cursor:"pointer"},
    btnGreen:{background:"#1a5a3a",color:"#fff",border:"none",padding:"10px 22px",borderRadius:"6px",fontWeight:"600",cursor:"pointer"},
    btnGoogle:{background:"#1a7a4a",color:"#fff",border:"none",padding:"10px 22px",borderRadius:"6px",fontWeight:"600",cursor:"pointer"},
    btnZoom:{background:"#1a5aae",color:"#fff",border:"none",padding:"10px 22px",borderRadius:"6px",fontWeight:"600",cursor:"pointer"},
    btnCancel:{background:"none",color:"#5a6a8a",border:"1px solid #dce4f0",padding:"10px 22px",borderRadius:"6px",cursor:"pointer"},
    summaryBox:{background:"#fffbf0",borderLeft:"3px solid #c9a84c",padding:"14px 18px",borderRadius:"0 6px 6px 0",color:"#2a3a5a",lineHeight:"1.7",marginTop:"1rem"},
    messageItem:{padding:"10px 0",borderBottom:"1px solid #eef2f8"},
    messageSender:{color:"#c9a84c",fontWeight:"700",fontSize:"0.9rem"},
    messageContent:{color:"#2a3a5a",marginTop:"2px"},
    taskItem:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"10px 0",borderBottom:"1px solid #eef2f8"},
    btnToggleDone:{background:"#f0fff4",border:"1px solid #2a8a2a",color:"#1a6a1a",padding:"4px 12px",borderRadius:"4px",cursor:"pointer",fontSize:"0.8rem",flexShrink:0},
    btnTogglePending:{background:"#f0f4ff",border:"1px solid #2a5aae",color:"#1a3a8a",padding:"4px 12px",borderRadius:"4px",cursor:"pointer",fontSize:"0.8rem",flexShrink:0},
    meetBanner:{border:"1px solid",borderRadius:"8px",padding:"1rem 1.5rem",marginBottom:"1.5rem",display:"flex",justifyContent:"space-between",alignItems:"center"},
    meetLink:{color:"#fff",padding:"8px 16px",borderRadius:"6px",textDecoration:"none",fontWeight:"600"},
    msgBox:{background:"#f0fff4",border:"1px solid #2a8a2a",borderRadius:"8px",padding:"1rem",marginBottom:"1rem",color:"#1a5a1a"},
};

export default ConversationShow;