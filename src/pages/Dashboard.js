import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

function Dashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const [stats, setStats] = useState({ totalConversations: 0, totalMessages: 0, totalTasks: 0, pendingTasks: 0, doneTasks: 0, highPriorityTasks: 0 });
    const [recentConversations, setRecentConversations] = useState([]);

    useEffect(() => {
        api.get("/conversations").then(res => {
            const conversations = Array.isArray(res.data) ? res.data : (res.data.data || []);
            setRecentConversations(conversations.slice(0, 5));
            setStats(prev => ({ ...prev, totalConversations: conversations.length }));

            let totalMessages = 0, totalTasks = 0, pendingTasks = 0, doneTasks = 0, highPriorityTasks = 0;
            const promises = conversations.map(c =>
                api.get(`/conversations/${c.id}`).then(res => {
                    const msgs = res.data.messages || [];
                    const tsks = res.data.tasks || [];
                    totalMessages += msgs.length;
                    totalTasks += tsks.length;
                    pendingTasks += tsks.filter(t => t.status === "pending").length;
                    doneTasks += tsks.filter(t => t.status === "done").length;
                    highPriorityTasks += tsks.filter(t => t.priority === "high" && t.status === "pending").length;
                })
            );
            Promise.all(promises).then(() => {
                setStats({ totalConversations: conversations.length, totalMessages, totalTasks, pendingTasks, doneTasks, highPriorityTasks });
            });
        }).catch(() => {});
    }, []);

    const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login"); };

    return (
        <div style={s.container}>
            <nav style={s.navbar}>
                <span style={s.brand}>Assist<span style={{color:"#fff"}}>IA</span></span>
                <div style={s.navLinks}>
                    <Link to="/dashboard" style={s.navLink}>Dashboard</Link>
                    <Link to="/conversations" style={s.navLink}>Conversas</Link>
                    <Link to="/organization" style={s.navLink}>🏢 Organizacao</Link>
                    <span style={s.navUser}>{user.name}</span>
                    <button onClick={logout} style={s.logoutBtn}>Sair</button>
                </div>
            </nav>
            <div style={s.content}>
                <h1 style={s.title}>📊 Dashboard</h1>
                <div style={s.statsGrid}>
                    <div style={s.statCard}><div style={s.statNumber}>{stats.totalConversations}</div><div style={s.statLabel}>Conversas</div></div>
                    <div style={s.statCard}><div style={s.statNumber}>{stats.totalMessages}</div><div style={s.statLabel}>Mensagens</div></div>
                    <div style={s.statCard}><div style={s.statNumber}>{stats.totalTasks}</div><div style={s.statLabel}>Tarefas</div></div>
                    <div style={s.statCard}><div style={{...s.statNumber,color:"#e05555"}}>{stats.pendingTasks}</div><div style={s.statLabel}>Pendentes</div></div>
                    <div style={s.statCard}><div style={{...s.statNumber,color:"#2a8a5a"}}>{stats.doneTasks}</div><div style={s.statLabel}>Concluidas</div></div>
                    <div style={s.statCard}><div style={{...s.statNumber,color:"#e05555"}}>{stats.highPriorityTasks}</div><div style={s.statLabel}>🔴 Alta Prioridade</div></div>
                </div>
                <div style={s.card}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
                        <strong style={{color:"#0f1f3d",fontSize:"1.1rem"}}>🕐 Conversas Recentes</strong>
                        <Link to="/conversations" style={s.btnGold}>Ver Todas</Link>
                    </div>
                    {recentConversations.length === 0
                        ? <p style={{color:"#aaa",fontStyle:"italic"}}>Ainda nao ha conversas.</p>
                        : recentConversations.map(c => (
                            <div key={c.id} style={s.convItem}>
                                <Link to={`/conversations/${c.id}`} style={s.convLink}>{c.title}</Link>
                                <span style={s.badge}>{c.type}</span>
                            </div>
                        ))
                    }
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
    title:{fontFamily:"serif",color:"#0f1f3d",fontSize:"1.8rem",marginBottom:"1.5rem"},
    statsGrid:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"1rem",marginBottom:"1.5rem"},
    statCard:{background:"#fff",border:"1px solid #dce4f0",borderRadius:"10px",padding:"1.5rem",textAlign:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},
    statNumber:{fontSize:"2rem",fontWeight:"bold",color:"#0f1f3d"},
    statLabel:{color:"#5a6a8a",fontSize:"0.9rem",marginTop:"0.3rem"},
    card:{background:"#fff",border:"1px solid #dce4f0",borderRadius:"10px",padding:"1.8rem",marginBottom:"1.5rem",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},
    btnGold:{background:"#c9a84c",color:"#0f1f3d",border:"none",padding:"8px 18px",borderRadius:"6px",fontWeight:"700",cursor:"pointer",textDecoration:"none",fontSize:"0.9rem"},
    convItem:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.8rem 0",borderBottom:"1px solid #eef2f8"},
    convLink:{color:"#0f1f3d",textDecoration:"none",fontWeight:"600"},
    badge:{background:"#e8eef8",color:"#5a6a8a",borderRadius:"20px",padding:"3px 10px",fontSize:"0.8rem"},
};

export default Dashboard;
