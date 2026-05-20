import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

function Dashboard() {
    const navigate = useNavigate();
    const raw = localStorage.getItem("user");
    const user = raw && raw !== "undefined" ? JSON.parse(raw) : {};
    const [conversations, setConversations] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get("/conversations"),
            api.get("/tasks"),
        ]).then(([c, t]) => {
            const data = Array.isArray(c.data) ? c.data : (c.data.data || []);
            setConversations(data);
            setTasks(Array.isArray(t.data) ? t.data : []);
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const urgent = tasks.filter(t => t.priority === "high" && t.status !== "done");
    const pending = tasks.filter(t => t.status === "pending");
    const done    = tasks.filter(t => t.status === "done");

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
                <h1 style={s.title}>Olá, {user.name?.split(' ')[0]} 👋</h1>
                {loading ? <p style={{color:"#aaa"}}>A carregar...</p> : <>
                    <div style={s.statsGrid}>
                        <div style={s.statCard}><div style={s.statNumber}>{conversations.length}</div><div style={s.statLabel}>Conversas</div></div>
                        <div style={s.statCard}><div style={{...s.statNumber, color:"#c9a84c"}}>{pending.length}</div><div style={s.statLabel}>Tarefas pendentes</div></div>
                        <div style={s.statCard}><div style={{...s.statNumber, color:"#e05555"}}>{urgent.length}</div><div style={s.statLabel}>Alta prioridade</div></div>
                        <div style={s.statCard}><div style={{...s.statNumber, color:"#1a8a4a"}}>{done.length}</div><div style={s.statLabel}>Concluídas</div></div>
                    </div>

                    <div style={s.grid}>
                        <div style={s.card}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
                                <strong style={{color:"#0f1f3d",fontSize:"1.1rem"}}>Conversas Recentes</strong>
                                <Link to="/conversations" style={s.btnGold}>Ver Todas</Link>
                            </div>
                            {conversations.length === 0
                                ? <p style={{color:"#aaa",fontStyle:"italic"}}>Ainda não há conversas.</p>
                                : conversations.slice(0,5).map(c => (
                                    <div key={c.id} style={s.convItem}>
                                        <div>
                                            <Link to={"/conversations/"+c.id} style={s.convLink}>{c.title}</Link>
                                            <span style={s.badge}>{c.type}</span>
                                            {c.meeting_provider && <span style={{...s.badge, background:"#e8f4fd", color:"#1a73e8", marginLeft:"4px"}}>{c.meeting_provider === 'zoom' ? 'Zoom' : 'Meet'}</span>}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>

                        <div style={s.card}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
                                <strong style={{color:"#0f1f3d",fontSize:"1.1rem"}}>🔴 Tarefas Urgentes</strong>
                                <Link to="/tasks" style={s.btnGold}>Ver Todas</Link>
                            </div>
                            {urgent.length === 0
                                ? <p style={{color:"#aaa",fontStyle:"italic"}}>Sem tarefas urgentes 🎉</p>
                                : urgent.slice(0,5).map(t => (
                                    <div key={t.id} style={s.convItem}>
                                        <span style={{color:"#0f1f3d",fontWeight:"600"}}>{t.title}</span>
                                        <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
                                            {t.assigned_to && <span style={{color:"#5a6a8a",fontSize:"0.85rem"}}>→ {t.assigned_to}</span>}
                                            {t.deadline && <span style={{color:"#5a6a8a",fontSize:"0.85rem"}}>📅 {new Date(t.deadline).toLocaleDateString('pt-PT')}</span>}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </>}
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
    title:{fontFamily:"serif",color:"#0f1f3d",fontSize:"1.8rem",marginBottom:"1.5rem"},
    statsGrid:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"1rem",marginBottom:"1.5rem"},
    statCard:{background:"#fff",border:"1px solid #dce4f0",borderRadius:"10px",padding:"1.5rem",textAlign:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},
    statNumber:{fontSize:"2rem",fontWeight:"bold",color:"#0f1f3d"},
    statLabel:{color:"#5a6a8a",fontSize:"0.9rem",marginTop:"0.3rem"},
    grid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.5rem"},
    card:{background:"#fff",border:"1px solid #dce4f0",borderRadius:"10px",padding:"1.8rem",marginBottom:"1.5rem",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},
    btnGold:{background:"#c9a84c",color:"#0f1f3d",border:"none",padding:"8px 18px",borderRadius:"6px",fontWeight:"700",cursor:"pointer",textDecoration:"none",fontSize:"0.9rem"},
    convItem:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.8rem 0",borderBottom:"1px solid #eef2f8"},
    convLink:{color:"#0f1f3d",textDecoration:"none",fontWeight:"600"},
    badge:{background:"#e8eef8",color:"#5a6a8a",borderRadius:"20px",padding:"3px 10px",fontSize:"0.8rem",marginLeft:"8px"},
};

export default Dashboard;