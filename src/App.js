import React, { useState, useEffect } from "react";
import { supabase } from "./supabase"; // adjust if your file path is different

const PRIORITIES = [
  { label: "High", color: "#f87171", weight: 3 },
  { label: "Normal", color: "#facc15", weight: 2 },
  { label: "Low", color: "#4ade80", weight: 1 },
];

function getPriority(idx) {
  return PRIORITIES[idx] || PRIORITIES[1];
}

function calcMainProgress(subcats) {
  let total = 0, done = 0;
  subcats.forEach(sub => {
    if (sub.subs.length === 0) return;
    let subtot = 0, subdone = 0;
    sub.subs.forEach(s => {
      const p = getPriority(s.priority);
      subtot += p.weight;
      if (s.done) subdone += p.weight;
    });
    if (subtot > 0) {
      total += subtot;
      done += subdone;
    }
  });
  return total ? Math.round((done / total) * 100) : 0;
}

function flattenIds(cats) {
  let ids = [];
  cats.forEach(c => {
    ids.push(c.id);
    c.subcats.forEach(s => {
      ids.push(s.id);
      s.subs.forEach(sub => ids.push(sub.id));
    });
  });
  return ids;
}

// ---------- Auth component ----------
function Auth({ onSignIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signin");
  const [error, setError] = useState("");

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    let res;
    if (mode === "signup") {
      res = await supabase.auth.signUp({ email, password });
    } else {
      res = await supabase.auth.signInWithPassword({ email, password });
    }
    if (res.error) setError(res.error.message);
    else if (res.data?.user) onSignIn(res.data.user);
  };

  return (
    <div style={{ marginTop: 70, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h2 style={{ marginBottom: 24 }}>Sign {mode === "signup" ? "Up" : "In"} to Team Planner</h2>
      <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 12, width: 300 }}>
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ padding: 9, fontSize: 16, borderRadius: 7, border: "1px solid #d1d5db" }} />
        <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: 9, fontSize: 16, borderRadius: 7, border: "1px solid #d1d5db" }} />
        <button type="submit" style={{ background: "#2563eb", color: "#fff", borderRadius: 7, padding: 9, fontWeight: 600, fontSize: 16, border: "none", cursor: "pointer" }}>
          {mode === "signup" ? "Sign Up" : "Sign In"}
        </button>
        {error && <div style={{ color: "red", fontSize: 14 }}>{error}</div>}
      </form>
      <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} style={{ marginTop: 12, color: "#2563eb", border: "none", background: "none", cursor: "pointer" }}>
        {mode === "signin" ? "Need an account? Sign Up" : "Already have an account? Sign In"}
      </button>
    </div>
  );
}

// ---------- Sub-components ----------

function SubSubtask({ sub, onToggle, onDelete, onEdit, onPriority }) {
  const pri = getPriority(sub.priority);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6, padding: "2px 0",
      fontSize: 13
    }}>
      <button
        title="Mark done/undone"
        onClick={onToggle}
        style={{
          width: 20, height: 20,
          borderRadius: "50%",
          border: `2px solid ${pri.color}`,
          background: sub.done ? pri.color : "transparent",
          color: sub.done ? "#fff" : pri.color,
          fontWeight: "bold", fontSize: 13, cursor: "pointer", outline: "none"
        }}
      >
        {sub.done ? "✔" : ""}
      </button>
      <span style={{
        flex: 1,
        color: sub.done ? "#b5b5b5" : "#222",
        textDecoration: sub.done ? "line-through" : ""
      }}>{sub.title}</span>
      <select
        value={sub.priority}
        onChange={e => onPriority(+e.target.value)}
        style={{
          background: pri.color, color: "#fff", border: "none", borderRadius: 5, padding: "0 6px",
          fontSize: 12
        }}>
        {PRIORITIES.map((p, i) => (
          <option value={i} key={p.label} style={{ color: "#000" }}>{p.label}</option>
        ))}
      </select>
      <button title="Edit" onClick={onEdit} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 13, marginLeft: 3 }}>✏️</button>
      <button title="Delete" onClick={onDelete} style={{ color: "#f87171", border: "none", background: "none", cursor: "pointer", fontSize: 13 }}>🗑️</button>
    </div>
  );
}

function SubCategoryCard({
  subcat,
  onAddSubSub,
  onToggleSubSub,
  onDelete,
  onEdit,
  onDeleteSubSub,
  onEditSubSub,
  onToggleSubSubPriority
}) {
  return (
    <div style={{
      background: "#f5faff",
      borderRadius: 10,
      boxShadow: "0 1px 5px #0001",
      margin: "0 8px 0 0",
      padding: 12,
      minWidth: 170,
      width: 170,
      display: "flex",
      flexDirection: "column"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>{subcat.title}</span>
        <button title="Edit" onClick={onEdit} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 13 }}>✏️</button>
        <button title="Delete" onClick={onDelete} style={{ color: "#f87171", border: "none", background: "none", cursor: "pointer", fontSize: 13 }}>🗑️</button>
      </div>
      <div style={{ margin: "8px 0 0 0" }}>
        {subcat.subs.length === 0 ? (
          <div style={{ color: "#aaa", fontSize: 12 }}>No subs yet.</div>
        ) : subcat.subs.map(sub => (
          <SubSubtask
            key={sub.id}
            sub={sub}
            onToggle={() => onToggleSubSub(subcat.id, sub.id)}
            onDelete={() => onDeleteSubSub(subcat.id, sub.id)}
            onEdit={() => onEditSubSub(subcat.id, sub.id)}
            onPriority={newPriority => onToggleSubSubPriority(subcat.id, sub.id, newPriority)}
          />
        ))}
      </div>
      <button
        onClick={onAddSubSub}
        style={{
          marginTop: 7,
          width: "100%",
          padding: "4px 0",
          borderRadius: 7,
          background: "#e0f2fe",
          border: "none",
          fontWeight: "bold",
          color: "#2563eb",
          fontSize: 12,
          cursor: "pointer"
        }}
      >+ Add 3rd Level</button>
    </div>
  );
}

function CategoryCard({
  cat,
  onAddSub,
  onDelete,
  onEdit,
  onAddSubSub,
  onToggleSubSub,
  onDeleteSub,
  onDeleteSubSub,
  onEditSub,
  onEditSubSub,
  onToggleSubSubPriority,
  onToggleCat,
}) {
  const progress = calcMainProgress(cat.subcats);
  return (
    <div style={{
      background: "#fff",
      borderRadius: 13,
      boxShadow: "0 2px 8px #0001",
      margin: "16px 0",
      padding: 18,
      maxWidth: "98%",
      width: "100%",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <button
          onClick={onToggleCat}
          style={{
            width: 28, height: 28,
            borderRadius: "50%",
            border: "2px solid #3b82f6",
            background: cat.done ? "#3b82f6" : "#fff",
            color: cat.done ? "#fff" : "#3b82f6",
            fontWeight: "bold",
            fontSize: 15,
            cursor: "pointer",
            outline: "none"
          }}
          title="Mark done/undone"
        >
          {cat.done ? "✔" : ""}
        </button>
        <span style={{
          fontSize: 17,
          fontWeight: 600,
          color: cat.done ? "#b5b5b5" : "#18181b",
          textDecoration: cat.done ? "line-through" : "",
          flex: 1
        }}>
          {cat.title}
        </span>
        <button title="Edit" onClick={onEdit} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 15, marginLeft: 2 }}>✏️</button>
        <button title="Delete" onClick={onDelete} style={{ color: "#f87171", border: "none", background: "none", cursor: "pointer", fontSize: 15 }}>🗑️</button>
      </div>
      <div style={{
        margin: "10px 0 4px 0",
        height: 9,
        borderRadius: 6,
        background: "#e5e7eb",
        position: "relative"
      }}>
        <div
          style={{
            position: "absolute",
            left: 0, top: 0, bottom: 0,
            width: `${progress}%`,
            background: progress === 100 ? "#22c55e" : "#3b82f6",
            borderRadius: 6,
            transition: "width .3s"
          }}
        />
        <span style={{
          position: "absolute",
          right: 10, top: -5, fontSize: 11, color: "#222", fontWeight: 600
        }}>{progress}%</span>
      </div>
      <div
        style={{
          marginTop: 5,
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))"
        }}
      >
        {cat.subcats.length === 0 ? (
          <div style={{ color: "#aaa", fontSize: 12, padding: 15 }}>No subcategories yet.</div>
        ) : cat.subcats.map(subcat => (
          <SubCategoryCard
            key={subcat.id}
            subcat={subcat}
            onAddSubSub={() => onAddSubSub(cat.id, subcat.id)}
            onToggleSubSub={(subcatId, subId) => onToggleSubSub(cat.id, subcatId, subId)}
            onDelete={() => onDeleteSub(cat.id, subcat.id)}
            onEdit={() => onEditSub(cat.id, subcat.id)}
            onDeleteSubSub={(subcatId, subId) => onDeleteSubSub(cat.id, subcat.id, subId)}
            onEditSubSub={(subcatId, subId) => onEditSubSub(cat.id, subcat.id, subId)}
            onToggleSubSubPriority={(subcatId, subId, newPriority) => onToggleSubSubPriority(cat.id, subcat.id, subId, newPriority)}
          />
        ))}
      </div>
      <button
        onClick={onAddSub}
        style={{
          marginTop: 9,
          width: "100%",
          padding: "5px 0",
          borderRadius: 7,
          background: "#f1f5f9",
          border: "none",
          fontWeight: "bold",
          color: "#3b82f6",
          fontSize: 14,
          cursor: "pointer"
        }}
      >+ Add 2nd Level</button>
    </div>
  );
}

// ---------- Main App ----------
let nextId = 1;
const createCat = title => ({
  id: nextId++, title, done: false, subcats: [],
});
const createSubcat = title => ({
  id: nextId++, title, subs: []
});
const createSub = (title, priority) => ({
  id: nextId++, title, done: false, priority
});

export default function App() {
  const [cats, setCats] = useState([]);
  const [input, setInput] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // AUTH CHECK ON LOAD
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
    // Listen for sign-in/sign-out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // LOAD DATA
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase.from("tasks").select("*").then(({ data, error }) => {
      if (data && data.length > 0) {
        setCats(data[0].data || []);
        nextId = 1 + Math.max(...flattenIds(data[0].data || []), 0);
      } else {
        setCats([]);
      }
      setLoading(false);
    });
    // Real-time subscription (optional)
    const channel = supabase.channel('realtime_tasks').on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tasks' },
      payload => {
        if (payload.new && payload.new.data) setCats(payload.new.data);
      }
    ).subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  // SAVE DATA
  function saveCats(newCats) {
    setCats(newCats);
    supabase.from("tasks").select("*").then(({ data }) => {
      if (data && data.length > 0) {
        supabase.from("tasks").update({ data: newCats }).eq("id", data[0].id);
      } else {
        supabase.from("tasks").insert([{ data: newCats }]);
      }
    });
  }

  // Main category
  function addCategory() {
    if (!input.trim()) return;
    saveCats([...cats, createCat(input)]);
    setInput(""); setShowAdd(false);
  }
  function editCat(id) {
    const cat = cats.find(c => c.id === id);
    const t = prompt("Edit category name:", cat.title);
    if (t && t.trim()) saveCats(cats.map(c => c.id === id ? { ...c, title: t.trim() } : c));
  }
  function delCat(id) {
    if (window.confirm("Delete this category?")) saveCats(cats.filter(c => c.id !== id));
  }
  function toggleCat(id) {
    saveCats(cats.map(c =>
      c.id !== id ? c : {
        ...c,
        done: !c.done,
        subcats: c.subcats.map(sc => ({
          ...sc,
          subs: sc.subs.map(s => ({ ...s, done: !c.done }))
        }))
      }
    ));
  }
  // Subcategory (2nd level)
  function addSub(id) {
    const t = prompt("2nd-level (subcategory) title?");
    if (!t || !t.trim()) return;
    saveCats(cats.map(c => c.id === id ? { ...c, subcats: [...c.subcats, createSubcat(t.trim())] } : c));
  }
  function editSub(cid, sid) {
    const cat = cats.find(c => c.id === cid);
    const sub = cat.subcats.find(s => s.id === sid);
    const t = prompt("Edit subcategory name:", sub.title);
    if (t && t.trim())
      saveCats(cats.map(c => c.id === cid ?
        { ...c, subcats: c.subcats.map(s => s.id === sid ? { ...s, title: t.trim() } : s) }
        : c
      ));
  }
  function delSub(cid, sid) {
    if (window.confirm("Delete this subcategory?"))
      saveCats(cats.map(c => c.id === cid ?
        { ...c, subcats: c.subcats.filter(s => s.id !== sid) }
        : c
      ));
  }
  // 3rd level
  function addSubSub(cid, sid) {
    const t = prompt("3rd-level (sub-subcategory) title?");
    if (!t || !t.trim()) return;
    const p = prompt("Priority: 0=High (Red), 1=Normal (Yellow), 2=Low (Green)", "1");
    const pi = [0,1,2].includes(+p) ? +p : 1;
    saveCats(cats.map(c => c.id === cid ?
      { ...c, subcats: c.subcats.map(s => s.id === sid ? { ...s, subs: [...s.subs, createSub(t.trim(), pi)] } : s) }
      : c
    ));
  }
  function editSubSub(cid, sid, ssid) {
    const cat = cats.find(c => c.id === cid);
    const subcat = cat.subcats.find(s => s.id === sid);
    const sub = subcat.subs.find(su => su.id === ssid);
    const t = prompt("Edit sub-subcategory name:", sub.title);
    if (t && t.trim())
      saveCats(cats.map(c => c.id === cid ?
        { ...c, subcats: c.subcats.map(s => s.id === sid ?
          { ...s, subs: s.subs.map(su => su.id === ssid ? { ...su, title: t.trim() } : su) }
          : s) }
        : c
      ));
  }
  function delSubSub(cid, sid, ssid) {
    if (window.confirm("Delete this item?"))
      saveCats(cats.map(c => c.id === cid ?
        { ...c, subcats: c.subcats.map(s => s.id === sid ?
          { ...s, subs: s.subs.filter(su => su.id !== ssid) }
          : s) }
        : c
      ));
  }
  function toggleSubSub(cid, sid, ssid) {
    saveCats(cats.map(c => c.id === cid ?
      { ...c, subcats: c.subcats.map(s => s.id === sid ?
        { ...s, subs: s.subs.map(su => su.id === ssid ? { ...su, done: !su.done } : su) }
        : s) }
      : c
    ));
  }
  function changeSubSubPriority(cid, sid, ssid, newPriority) {
    saveCats(cats.map(c => c.id === cid ?
      { ...c, subcats: c.subcats.map(s => s.id === sid ?
        { ...s, subs: s.subs.map(su => su.id === ssid ? { ...su, priority: newPriority } : su) }
        : s) }
      : c
    ));
  }

  if (loading) return <div>Loading...</div>;
  if (!user) return <Auth onSignIn={setUser} />;

  return (
    <div style={{
      background: "linear-gradient(135deg,#f0f6ff 0%,#e0fbfc 100%)",
      minHeight: "100vh", padding: "32px 0",
      fontFamily: "system-ui,sans-serif"
    }}>
      <div style={{
        maxWidth: "100vw", margin: "0 auto",
        padding: "0 12px",
      }}>
        <button style={{ float: "right", margin: 12 }} onClick={() => supabase.auth.signOut()}>Sign Out</button>
        <h2 style={{ fontSize: 24, color: "#2563eb", marginBottom: 10, fontWeight: 700 }}>🌟 My Team Task Planner</h2>
        <button
          onClick={() => setShowAdd(v => !v)}
          style={{
            marginBottom: 10,
            padding: "7px 12px",
            background: "#3b82f6",
            color: "#fff", border: "none", borderRadius: 7,
            fontSize: 14, fontWeight: 600, cursor: "pointer"
          }}>
          + Add Main Category
        </button>
        {showAdd && (
          <div style={{ marginBottom: 14, display: "flex", gap: 5 }}>
            <input
              placeholder="Main Category Title"
              value={input}
              onChange={e => setInput(e.target.value)}
              style={{ flex: 1, padding: "7px 10px", fontSize: 14, borderRadius: 7, border: "1px solid #d1d5db" }}
            />
            <button onClick={addCategory} style={{ background: "#22c55e", color: "#fff", border: "none", borderRadius: 7, padding: "7px 11px", fontWeight: 600 }}>Add</button>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {cats.length === 0 ? (
            <div style={{ color: "#aaa", fontSize: 15, marginTop: 25 }}>No categories yet. Add one above!</div>
          ) : cats.map(cat => (
            <CategoryCard
              key={cat.id}
              cat={cat}
              onAddSub={() => addSub(cat.id)}
              onDelete={() => delCat(cat.id)}
              onEdit={() => editCat(cat.id)}
              onAddSubSub={(cid, sid) => addSubSub(cid, sid)}
              onToggleSubSub={(cid, sid, ssid) => toggleSubSub(cid, sid, ssid)}
              onDeleteSub={(cid, sid) => delSub(cid, sid)}
              onDeleteSubSub={(cid, sid, ssid) => delSubSub(cid, sid, ssid)}
              onEditSub={(cid, sid) => editSub(cid, sid)}
              onEditSubSub={(cid, sid, ssid) => editSubSub(cid, sid, ssid)}
              onToggleSubSubPriority={(cid, sid, ssid, np) => changeSubSubPriority(cid, sid, ssid, np)}
              onToggleCat={() => toggleCat(cat.id)}
            />
          ))}
        </div>
        <div style={{ marginTop: 16, color: "#b5b5b5", fontSize: 11 }}>
          All team data is synced and secure.<br />
          <span style={{ fontSize: 12 }}>Powered by Supabase 💡</span>
        </div>
      </div>
    </div>
  );
}
