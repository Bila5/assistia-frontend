import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Organization() {
  const navigate = useNavigate();
  const [org, setOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [inviteRole, setInviteRole] = useState("member");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/organization")
      .then(res => { setOrg(res.data.organization); setMembers(res.data.members); })
      .catch(err => { if (err.response?.status === 404) setCreating(true); })
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setError("");
    try { const res = await api.post("/organization", form); setOrg(res.data); setCreating(false); }
    catch (err) { setError(err.response?.data?.message || "Erro ao criar organização"); }
  };

  const handleInvite = async () => {
    try { const res = await api.post("/organization/invite", { role: inviteRole }); setInviteLink(res.data.link); }
    catch (err) { setError(err.response?.data?.message || "Erro ao gerar convite"); }
  };

  const s = {
    page: { minHeight: "100vh", background: "#0f1f3d", color: "#fff", padding: "2rem", fontFamily: "sans-serif" },
    card: { background: "#1a2f5e", borderRadius: "12px", padding: "2rem", maxWidth: "700px", margin: "0 auto" },
    title: { color: "#c9a84c", fontSize: "1.8rem", fontWeight: "bold", marginBottom: "1.5rem" },
    label: { display: "block", marginBottom: "0.4rem", color: "#94a3b8", fontSize: "0.9rem" },
    input: { width: "100%", padding: "0.7rem 1rem", borderRadius: "8px", border: "1px solid #2a3f6f", background: "#0f1f3d", color: "#fff", marginBottom: "1rem", boxSizing: "border-box" },
    btn: { background: "#c9a84c", color: "#0f1f3d", border: "none", borderRadius: "8px", padding: "0.7rem 1.5rem", fontWeight: "bold", cursor: "pointer", marginRight: "0.5rem" },
    btnSec: { background: "transparent", color: "#c9a84c", border: "1px solid #c9a84c", borderRadius: "8px", padding: "0.7rem 1.5rem", fontWeight: "bold", cursor: "pointer" },
    memberCard: { background: "#0f1f3d", borderRadius: "8px", padding: "1rem", marginBottom: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" },
    badge: { background: "#c9a84c22", color: "#c9a84c", borderRadius: "20px", padding: "0.2rem 0.8rem", fontSize: "0.8rem" },
    error: { background: "#ff444422", color: "#ff6b6b", borderRadius: "8px", padding: "0.8rem", marginBottom: "1rem" },
    inviteBox: { background: "#0f1f3d", borderRadius: "8px", padding: "1rem", marginTop: "1rem", wordBreak: "break-all", color: "#c9a84c" },
    back: { color: "#94a3b8", cursor: "pointer", marginBottom: "1.5rem", display: "inline-block" },
    select: { padding: "0.7rem 1rem", borderRadius: "8px", border: "1px solid #2a3f6f", background: "#0f1f3d", color: "#fff", marginRight: "0.5rem" },
  };

  if (loading) return <div style={s.page}><div style={{ textAlign: "center", paddingTop: "5rem", color: "#94a3b8" }}>A carregar...</div></div>;

  return (
    <div style={s.page}>
      <div style={s.card}>
        <span style={s.back} onClick={() => navigate("/dashboard")}>← Voltar</span>
        {creating ? (
          <>
            <div style={s.title}>Criar Organização</div>
            {error && <div style={s.error}>{error}</div>}
            <form onSubmit={handleCreate}>
              <label style={s.label}>Nome *</label>
              <input style={s.input} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="Ex: Empresa Lda" />
              <label style={s.label}>Email</label>
              <input style={s.input} type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@empresa.com" />
              <label style={s.label}>Telefone</label>
              <input style={s.input} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+258 84 000 0000" />
              <button style={s.btn} type="submit">Criar</button>
              <button style={s.btnSec} type="button" onClick={() => navigate("/dashboard")}>Cancelar</button>
            </form>
          </>
        ) : (
          <>
            <div style={s.title}>🏢 {org?.name}</div>
            <div style={{ color: "#94a3b8", marginBottom: "0.5rem" }}>📧 {org?.email || "—"}</div>
            <div style={{ color: "#94a3b8", marginBottom: "2rem" }}>📞 {org?.phone || "—"}</div>
            <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#c9a84c", marginBottom: "1rem" }}>Membros ({members.length})</div>
            {members.map(m => (
              <div key={m.id} style={s.memberCard}>
                <div><div style={{ fontWeight: "bold" }}>{m.name}</div><div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{m.email}</div></div>
                <span style={s.badge}>{m.role}</span>
              </div>
            ))}
            <div style={{ marginTop: "2rem", borderTop: "1px solid #2a3f6f", paddingTop: "1.5rem" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#c9a84c", marginBottom: "1rem" }}>Convidar Membro</div>
              {error && <div style={s.error}>{error}</div>}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <select style={s.select} value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                  <option value="member">Membro</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                <button style={s.btn} onClick={handleInvite}>Gerar Link</button>
              </div>
              {inviteLink && (
                <div style={s.inviteBox}>
                  <div style={{ color: "#94a3b8", marginBottom: "0.5rem", fontSize: "0.85rem" }}>Link de convite:</div>
                  {inviteLink}
                  <button style={{...s.btnSec, marginLeft: "1rem", padding: "0.3rem 0.8rem", fontSize: "0.85rem"}}
                    onClick={() => navigator.clipboard.writeText(inviteLink)}>Copiar</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
