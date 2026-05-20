import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

export default function Tasks() {
    const navigate = useNavigate();
    const raw = localStorage.getItem("user");
    const user = raw && raw !== "undefined" ? JSON.parse(raw) : {};
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [editing, setEditing] = useState(null);
    const [editForm, setEditForm] = useState({});

    useEffect(() => {
        api.get("/tasks").then(res => {
            setTasks(Array.isArray(res.data) ? res.data : []);
        }).finally(() => setLoading(false));
    }, []);

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const toggleTask = async (id) => {
        const res = await api.patch(`/tasks/${id}/toggle`);
        setTasks(tasks.map(t => t.id === id ? res.data : t));
    };

    const deleteTask = async (id) => {
        if (!window.confirm("Apagar esta tarefa?")) return;
        await api.delete(`/tasks/${id}`);
        setTasks(tasks.filter(t => t.id !== id));
    };

    const saveEdit = async (id) => {
        const res = await api.patch(`/tasks/${id}`, editForm);
        setTasks(tasks.map(t => t.id === id ? res.data : t));
        setEditing(null);
    };

    const filtered = tasks.filter(t => {
        if (filter === "high")    return t.priority === "high";
        if (filter === "pending") return t.status === "pending";
        if (filter === "done")    return t.status === "done";
        return true;
    });

    const counts = {
        all:     tasks.length,
        high:    tasks.filter(t => t.priority === "high").length,
        pending: tasks.filter(t => t.status === "pending").length,
        done:    tasks.filter(t => t.status === "done").length,
    };

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
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem"}}>
                    <h1 style={s.title}>✅ Tarefas</h1>
                    <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
                        {[
                            {key:"all",     label:`Todas (${counts.all})`},
                            {key:"high",    label:`🔴 Alta (${counts.high})`},
                            {key:"pending", label:`Pendentes (${counts.pending})`},
                            {key:"done",    label:`Concluídas (${counts.done})`},
                        ].map(f => (
                            <button key={f.key} onClick={() => setFilter(f.key)}
                                style={filter === f.key ? s.filterActive : s.filterBtn}>
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? <p style={{color:"#aaa"}}>A carregar...</p> : filtered.length === 0 ? (
                    <div style={{textAlign:"center",padding:"3rem",color:"#aaa"}}>
                        <div style={{fontSize:"3rem",marginBottom:"1rem"}}>✅</div>
                        <p>Sem tarefas aqui. As tarefas são criadas nas conversas.</p>
                    </div>
                ) : filtered.map(t => (
                    <div key={t.id} style={s.taskCard}>
                        {editing === t.id ? (
                            <div>
                                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.8rem"}}>
                                    <input style={s.input} value={editForm.title || ""} onChange={e => setEditForm({...editForm, title: e.target.value})} placeholder="Título" />
                                    <input style={s.input} value={editForm.assigned_to || ""} onChange={e => setEditForm({...editForm, assigned_to: e.target.value})} placeholder="Atribuído a" />
                                    <input style={s.input} type="date" value={editForm.deadline || ""} onChange={e => setEditForm({...editForm, deadline: e.target.value})} />
                                    <select style={s.input} value={editForm.priority || "medium"} onChange={e => setEditForm({...editForm, priority: e.target.value})}>
                                        <option value="low">🟢 Baixa</option>
                                        <option value="medium">🟡 Média</option>
                                        <option value="high">🔴 Alta</option>
                                    </select>
                                    <select style={s.input} value={editForm.status || "pending"} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                                        <option value="pending">Pendente</option>
                                        <option value="in_progress">Em progresso</option>
                                        <option value="done">Concluída</option>
                                    </select>
                                </div>
                                <div style={{display:"flex",gap:"0.5rem",marginTop:"0.5rem"}}>
                                    <button style={s.btnGold} onClick={() => saveEdit(t.id)}>Guardar</button>
                                    <button style={s.btnCancel} onClick={() => setEditing(null)}>Cancelar</button>
                                </div>
                            </div>
                        ) : (
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                                <div style={{display:"flex",gap:"0.8rem",alignItems:"flex-start"}}>
                                    <input type="checkbox" checked={t.status === "done"} onChange={() => toggleTask(t.id)}
                                        style={{width:"16px",height:"16px",marginTop:"3px",accentColor:"#c9a84c",cursor:"pointer",flexShrink:0}} />
                                    <div>
                                        <div style={{fontWeight:"600",color:t.status==="done"?"#aaa":"#0f1f3d",textDecoration:t.status==="done"?"line-through":"none"}}>
                                            {t.priority==="high"?"🔴":t.priority==="medium"?"🟡":"🟢"} {t.title}
                                        </div>
                                        <div style={{fontSize:"0.82rem",color:"#5a6a8a",marginTop:"3px",display:"flex",gap:"12px"}}>
                                            {t.assigned_to && <span>→ {t.assigned_to}</span>}
                                            {t.deadline && <span>📅 {new Date(t.deadline).toLocaleDateString("pt-PT")}</span>}
                                            <span style={{background:"#e8eef8",borderRadius:"20px",padding:"1px 8px"}}>{t.status === "done" ? "Concluída" : t.status === "in_progress" ? "Em progresso" : "Pendente"}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{display:"flex",gap:"0.5rem",flexShrink:0}}>
                                    <button style={s.btnEdit} onClick={() => { setEditing(t.id); setEditForm({title:t.title,assigned_to:t.assigned_to||"",priority:t.priority,deadline:t.deadline||"",status:t.status}); }}>Editar</button>
                                    <button style={s.btnDelete} onClick={() => deleteTask(t.id)}>Apagar</button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
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
    taskCard:{background:"#fff",border:"1px solid #dce4f0",borderRadius:"8px",padding:"1rem 1.5rem",marginBottom:"0.8rem",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"},
    input:{padding:"8px 12px",borderRadius:"6px",border:"1px solid #dce4f0",fontSize:"0.9rem",width:"100%",boxSizing:"border-box"},
    btnGold:{background:"#c9a84c",color:"#0f1f3d",border:"none",padding:"8px 18px",borderRadius:"6px",fontWeight:"700",cursor:"pointer"},
    btnCancel:{background:"none",color:"#5a6a8a",border:"1px solid #dce4f0",padding:"8px 18px",borderRadius:"6px",cursor:"pointer"},
    btnEdit:{background:"none",color:"#0f1f3d",border:"1px solid #dce4f0",padding:"5px 12px",borderRadius:"4px",cursor:"pointer",fontSize:"0.85rem"},
    btnDelete:{background:"none",color:"#e05555",border:"none",padding:"5px 12px",cursor:"pointer",fontSize:"0.85rem"},
    filterBtn:{background:"none",color:"#5a6a8a",border:"1px solid #dce4f0",padding:"6px 14px",borderRadius:"20px",cursor:"pointer",fontSize:"0.85rem"},
    filterActive:{background:"#c9a84c",color:"#0f1f3d",border:"1px solid #c9a84c",padding:"6px 14px",borderRadius:"20px",cursor:"pointer",fontSize:"0.85rem",fontWeight:"700"},
};