import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api";

function ConversationShow() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [senderName, setSenderName] = useState("");
    const [content, setContent] = useState("");
    const [taskTitle, setTaskTitle] = useState("");
    const [assignedTo, setAssignedTo] = useState("");
    const [priority, setPriority] = useState("medium");
    const [showMeetModal, setShowMeetModal] = useState(false);
    const [meetTitle, setMeetTitle] = useState("");
    const [meetStart, setMeetStart] = useState("");
    const [meetEnd, setMeetEnd] = useState("");
    const [meetLoading, setMeetLoading] = useState(false);
    const [googleToken, setGoogleToken] = useState(null);
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    useEffect(() => {
        api.get(`/conversations/${id}`).then(res => {
            setConversation(res.data);
            setMessages(res.data.messages || []);
            setTasks(res.data.tasks || []);
        });
        const token = searchParams.get("google_token");
        if (token) { setGoogleToken(token); setShowMeetModal(true); }
    }, [id]);

    const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login"); };
    const sendMessage = async (e) => { e.preventDefault(); const res = await api.post(`/conversations/${id}/messages`, { sender_name: senderName, content }); setMessages([...messages, res.data]); setSenderName(""); setContent(""); };
    const addTask = async (e) => { e.preventDefault(); const res = await api.post(`/conversations/${id}/tasks`, { title: taskTitle, assigned_to: assignedTo, priority }); setTasks([...tasks, res.data]); setTaskTitle(""); setAssignedTo(""); };
    const toggleTask = async (taskId) => { const res = await api.patch(`/tasks/${taskId}/toggle`); setTasks(tasks.map(t => t.id === taskId ? res.data : t)); };
    const summarize = async () => { const res = await api.post(`/conversations/${id}/summarize`); setConversation({...conversation, summary: res.data.summary}); };
    const extractTasks = async () => { const res = await api.post(`/conversations/${id}/extract-tasks`); api.get(`/conversations/${id}/tasks`).then(r => setTasks(r.data)); alert(res.data.message); };

    const handleGoogleMeet = async () => {
        if (!googleToken) { const res = await api.get(`/auth/google?conversation_id=${id}`); window.location.href = res.data.url; }
        else { setShowMeetModal(true); }
    };

    const createMeet = async (e) => {
        e.preventDefault(); setMeetLoading(true);
        try {
            const res = await api.post(`/conversations/${id}/meet`, { access_token: googleToken, title: meetTitle, start: meetStart, end: meetEnd });
            setConversation({...conversation, meet_link: res.data.meet_link, meet_title: res.data.title});
            setShowMeetModal(false); alert("Reuniao criada com sucesso!");
        } catch { alert("Erro ao criar reuniao."); }
        finally { setMeetLoading(false); }
    };

    if (!conversation) return <div style={{padding:"2rem"}}>A carregar...</div>;

    return (
        <div style={s.container}>
            <nav style={s.navbar}>
                <span style={s.brand}>Assist<span style={{color:"#fff"}}>IA</span></span>
                <div style={s.navLinks}>
                    <Link to="/dashboard" style={s.navLink}>Dashboard</Link>
                    <Link to="/conversations" style={s.navLink}>Conversas</Link>
                    <span style={s.navUser}>{user.name}</span>
                    <button onClick={logout} style={s.logoutBtn}>Sair</button>
                </div>
            </nav>
            <div style={s.content}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem"}}>
                    <h1 style={s.title}>{conversation.title}</h1>
                    <button onClick={handleGoogleMeet} style={s.btnMeet}>📹 Criar Reuniao Google Meet</button>
                </div>
                {conversation.meet_link && (
                    <div style={s.meetBanner}>
                        <span>📹 <strong>{conversation.meet_title}</strong></span>
                        <a href={conversation.meet_link} target="_blank" rel="noreferrer" style={s.meetLink}>Entrar na Reuniao →</a>
                    </div>
                )}
                {showMeetModal && (
                    <div style={s.modalOverlay}>
                        <div style={s.modal}>
                            <h2 style={{color:"#0f1f3d",marginBottom:"1.5rem"}}>📹 Criar Reuniao Google Meet</h2>
                            <form onSubmit={createMeet}>
                                <label style={s.label}>Titulo</label>
                                <input style={s.input} value={meetTitle} onChange={e=>setMeetTitle(e.target.value)} placeholder="Ex: Reuniao de equipa" required />
                                <label style={s.label}>Inicio</label>
                                <input style={s.input} type="datetime-local" value={meetStart} onChange={e=>setMeetStart(e.target.value)} required />
                                <label style={s.label}>Fim</label>
                                <input style={s.input} type="datetime-local" value={meetEnd} onChange={e=>setMeetEnd(e.target.value)} required />
                                <div style={{display:"flex",gap:"1rem",marginTop:"1rem"}}>
                                    <button style={s.btnGold} type="submit" disabled={meetLoading}>{meetLoading?"A criar...":"Criar Reuniao"}</button>
                                    <button style={s.btnCancel} type="button" onClick={()=>setShowMeetModal(false)}>Cancelar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                <div style={s.card}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
                        <strong style={{color:"#0f1f3d"}}>🤖 Resumo com IA</strong>
                        <button onClick={summarize} style={s.btnGold}>Gerar Resumo</button>
                    </div>
                    {conversation.summary ? <div style={s.summaryBox}><pre style={{whiteSpace:"pre-wrap",fontFamily:"inherit"}}>{conversation.summary}</pre></div> : <p style={{color:"#aaa",fontStyle:"italic"}}>Ainda nao ha resumo.</p>}
                </div>
                <div style={s.grid}>
                    <div style={s.card}>
                        <strong style={{color:"#0f1f3d"}}>💬 Mensagens</strong>
                        <div style={{marginTop:"1rem"}}>
                            {messages.map(m => (<div key={m.id} style={s.messageItem}><div style={s.messageSender}>{m.sender_name}</div><div style={s.messageContent}>{m.content}</div></div>))}
                        </div>
                        <form onSubmit={sendMessage} style={{marginTop:"1.5rem"}}>
                            <input style={s.input} type="text" placeholder="Nome" value={senderName} onChange={e=>setSenderName(e.target.value)} required />
                            <textarea style={s.input} placeholder="Mensagem..." value={content} onChange={e=>setContent(e.target.value)} rows={3} required />
                            <button style={{...s.btnBlue,width:"100%"}} type="submit">Enviar Mensagem</button>
                        </form>
                    </div>
                    <div style={s.card}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <strong style={{color:"#0f1f3d"}}>✅ Tarefas</strong>
                            <button onClick={extractTasks} style={{...s.btnGold,fontSize:"0.8rem",padding:"7px 14px"}}>🤖 Extrair</button>
                        </div>
                        <div style={{marginTop:"1rem"}}>
                            {tasks.map(t => (
                                <div key={t.id} style={s.taskItem}>
                                    <span style={{textDecoration:t.status==="done"?"line-through":"none",color:t.status==="done"?"#aaa":"#0f1f3d"}}>
                                        {t.priority==="high"?"🔴":t.priority==="medium"?"🟡":"🟢"} {t.title}
                                        {t.assigned_to && <span style={{color:"#aaa",fontSize:"0.85rem"}}> ({t.assigned_to})</span>}
                                    </span>
                                    <button onClick={()=>toggleTask(t.id)} style={t.status==="pending"?s.btnToggleDone:s.btnTogglePending}>{t.status==="pending"?"Concluir":"Reabrir"}</button>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={addTask} style={{marginTop:"1.5rem"}}>
                            <input style={s.input} type="text" placeholder="Titulo da tarefa" value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} required />
                            <input style={s.input} type="text" placeholder="Atribuir a (opcional)" value={assignedTo} onChange={e=>setAssignedTo(e.target.value)} />
                            <select style={s.input} value={priority} onChange={e=>setPriority(e.target.value)}>
                                <option value="low">🟢 Baixa</option>
                                <option value="medium">🟡 Media</option>
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
    title:{fontFamily:"serif",color:"#0f1f3d",fontSize:"1.8rem",margin:0},
    card:{background:"#fff",border:"1px solid #dce4f0",borderRadius:"10px",padding:"1.8rem",marginBottom:"1.5rem",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},
    grid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.5rem"},
    input:{width:"100%",padding:"10px 14px",borderRadius:"6px",border:"1px solid #dce4f0",marginBottom:"1rem",fontSize:"0.95rem",boxSizing:"border-box"},
    label:{display:"block",marginBottom:"4px",color:"#5a6a8a",fontSize:"0.85rem"},
    btnGold:{background:"#c9a84c",color:"#0f1f3d",border:"none",padding:"10px 22px",borderRadius:"6px",fontWeight:"700",cursor:"pointer"},
    btnBlue:{background:"#0f1f3d",color:"#fff",border:"none",padding:"10px 22px",borderRadius:"6px",fontWeight:"600",cursor:"pointer"},
    btnGreen:{background:"#1a5a3a",color:"#fff",border:"none",padding:"10px 22px",borderRadius:"6px",fontWeight:"600",cursor:"pointer"},
    btnMeet:{background:"#1a73e8",color:"#fff",border:"none",padding:"10px 20px",borderRadius:"6px",fontWeight:"600",cursor:"pointer",fontSize:"0.9rem"},
    btnCancel:{background:"none",color:"#5a6a8a",border:"1px solid #dce4f0",padding:"10px 22px",borderRadius:"6px",cursor:"pointer"},
    summaryBox:{background:"#fffbf0",borderLeft:"3px solid #c9a84c",padding:"14px 18px",borderRadius:"0 6px 6px 0",color:"#2a3a5a",lineHeight:"1.7"},
    messageItem:{padding:"10px 0",borderBottom:"1px solid #eef2f8"},
    messageSender:{color:"#c9a84c",fontWeight:"700",fontSize:"0.9rem"},
    messageContent:{color:"#2a3a5a",marginTop:"2px"},
    taskItem:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #eef2f8"},
    btnToggleDone:{background:"#f0fff4",border:"1px solid #2a8a2a",color:"#1a6a1a",padding:"4px 12px",borderRadius:"4px",cursor:"pointer",fontSize:"0.8rem"},
    btnTogglePending:{background:"#f0f4ff",border:"1px solid #2a5aae",color:"#1a3a8a",padding:"4px 12px",borderRadius:"4px",cursor:"pointer",fontSize:"0.8rem"},
    meetBanner:{background:"#e8f4fd",border:"1px solid #1a73e8",borderRadius:"8px",padding:"1rem 1.5rem",marginBottom:"1.5rem",display:"flex",justifyContent:"space-between",alignItems:"center"},
    meetLink:{background:"#1a73e8",color:"#fff",padding:"8px 16px",borderRadius:"6px",textDecoration:"none",fontWeight:"600"},
    modalOverlay:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000},
    modal:{background:"#fff",borderRadius:"12px",padding:"2rem",width:"100%",maxWidth:"480px",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"},
};

export default ConversationShow;
