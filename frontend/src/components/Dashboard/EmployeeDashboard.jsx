import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import FeaturesPanel from "../FeaturesPanel";

const API = import.meta.env.VITE_API_URL;

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [usersList, setUsersList] = useState([]); 
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // --- calendar helpers for monthly attendance ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const changeMonth = (offset) => {
    const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + offset));
    setCurrentDate(new Date(newDate));
  };
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const getAttendanceForDate = (day) => {
    if (!user || !user.attendance) return null;
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;
    return user.attendance.find(a => a.date === dateString);
  };
  
  // --- NAVIGATION STATE ---
  const [currentView, setCurrentView] = useState("dashboard"); // 'dashboard', 'teams', 'chat'

  // --- MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("identity");

  // --- MY TASKS STATE ---
  const [myTasks, setMyTasks] = useState([]);
  const [taskFilter, setTaskFilter] = useState("Pending"); 

  // --- TEAMS STATE ---
  const [myTeams, setMyTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamViewMode, setTeamViewMode] = useState("tasks");
  const [teamMessages, setTeamMessages] = useState([]);
  const [teamChatInput, setTeamChatInput] = useState("");
  const teamChatEndRef = useRef(null);

  // --- DIRECT CHAT STATE ---
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [attachment, setAttachment] = useState(null); 
  const chatEndRef = useRef(null);

  // --- FORM STATE ---
  const [leaveForm, setLeaveForm] = useState({ type: "Sick Leave", startDate: "", endDate: "", reason: "" });
  
  // Profile Form State
  const [form, setForm] = useState({ 
    name: "", email: "", password: "", image: null,
    gender: "", personalEmail: "", mobile: "", address: "",
    department: "", designation: "", salary: "", employmentStatus: "",
    totalLeaves: "", remainingLeaves: ""
  });

  // ---------------- 1. Load Data ----------------
  const fetchUserData = async () => {
    const storedData = localStorage.getItem("user");
    if (!storedData) { navigate("/"); return; }

    const storedUser = JSON.parse(storedData);
    if (!user) setUser(storedUser); 

    const userId = storedUser.id || storedUser._id;
    if (userId) {
      try {
        const res = await fetch(`${API}/users/${userId}`);
        if (res.ok) {
          const freshData = await res.json();
          setUser(freshData);
          localStorage.setItem("user", JSON.stringify(freshData));
        }
        const allRes = await fetch(`${API}/users`);
        if (allRes.ok) setUsersList(await allRes.json());
      } catch (err) { console.log("Server unreachable."); }
    }
  };

  useEffect(() => { fetchUserData(); }, [navigate]);

  // ---------------- 2. MODAL & UPDATE HANDLERS (ROBUST VERSION) ----------------
  const openEditModal = () => {
    // Populate form with current user data
    setForm({
        name: user.name || "", 
        email: user.email || "", 
        password: "", 
        image: null, 
        gender: user.gender || "Male", 
        personalEmail: user.personalEmail || "", 
        mobile: user.mobile || "", 
        address: user.address || "",
        // Read-only fields
        department: user.department || "", 
        designation: user.designation || "", 
        salary: user.salary || "", 
        employmentStatus: user.employmentStatus || "Active",
        totalLeaves: user.leaves?.total || 24, 
        remainingLeaves: user.leaves?.remaining || 24
    });
    setActiveTab("identity");
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
        const formData = new FormData();
        
        // Identity
        formData.append("name", form.name);
        formData.append("email", form.email);
        if (form.password) formData.append("password", form.password);
        
        // Personal
        formData.append("gender", form.gender || "");
        formData.append("personalEmail", form.personalEmail || ""); 
        formData.append("mobile", form.mobile || "");
        formData.append("address", form.address || "");
        
        // Image
        if (form.image instanceof File) {
            formData.append("image", form.image);
        }

        const res = await fetch(`${API}/users/${user._id}`, { 
            method: "PUT", 
            body: formData 
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Update failed");
        }
        
        await fetchUserData(); 
        setIsModalOpen(false);
        alert("Profile updated successfully ✅");

    } catch (err) { 
        console.error("Save Error:", err);
        alert("Error updating profile: " + err.message); 
    } finally { 
        setSaving(false); 
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setForm({ ...form, image: e.target.files[0] });

  // ---------------- 3. LOGIC BLOCKS ----------------
  // Tasks
  useEffect(() => { if (!user) return; const interval = setInterval(() => { const allTasksDb = JSON.parse(localStorage.getItem("individual_tasks_db") || "{}"); const myAssignedTasks = allTasksDb[user._id] || []; if (JSON.stringify(myAssignedTasks) !== JSON.stringify(myTasks)) setMyTasks(myAssignedTasks); }, 1000); return () => clearInterval(interval); }, [user, myTasks]);
  const handleToggleMyTask = (taskId) => { if(!user) return; const allTasksDb = JSON.parse(localStorage.getItem("individual_tasks_db") || "{}"); const tasks = allTasksDb[user._id] || []; const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status: t.status === "Completed" ? "Pending" : "Completed" } : t); allTasksDb[user._id] = updatedTasks; localStorage.setItem("individual_tasks_db", JSON.stringify(allTasksDb)); setMyTasks(updatedTasks); };
  const displayedTasks = myTasks.filter(t => t.status === taskFilter);
  
  // Teams
  useEffect(() => { if (!user) return; const interval = setInterval(() => { const allTeams = JSON.parse(localStorage.getItem("team_database") || "[]"); const relevantTeams = allTeams.filter(t => t.members.includes(user._id)); if (JSON.stringify(relevantTeams) !== JSON.stringify(myTeams)) { setMyTeams(relevantTeams); if (selectedTeam) { const updatedSelected = relevantTeams.find(t => t.id === selectedTeam.id); if (updatedSelected) setSelectedTeam(updatedSelected); } } }, 1000); return () => clearInterval(interval); }, [user, myTeams, selectedTeam]);
  const handleToggleTeamTask = (taskId) => { if (!selectedTeam) return; const allTeams = JSON.parse(localStorage.getItem("team_database") || "[]"); const updatedTeams = allTeams.map(t => { if (t.id === selectedTeam.id) { return { ...t, tasks: t.tasks.map(task => task.id === taskId ? { ...task, status: task.status === "Completed" ? "Pending" : "Completed" } : task) }; } return t; }); localStorage.setItem("team_database", JSON.stringify(updatedTeams)); };
  
  // Chat
  useEffect(() => { if (!selectedTeam || teamViewMode !== 'chat') return; const interval = setInterval(() => { const db = JSON.parse(localStorage.getItem("team_chat_database") || "{}"); const msgs = db[selectedTeam.id] || []; if (msgs.length !== teamMessages.length) setTeamMessages(msgs); }, 1000); return () => clearInterval(interval); }, [selectedTeam, teamViewMode, teamMessages]);
  const handleSendTeamMessage = (e) => { e.preventDefault(); if ((!teamChatInput.trim() && !attachment) || !selectedTeam) return; const newMessage = { sender: user.name, text: teamChatInput, file: attachment, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }; const db = JSON.parse(localStorage.getItem("team_chat_database") || "{}"); const msgs = db[selectedTeam.id] || []; db[selectedTeam.id] = [...msgs, newMessage]; localStorage.setItem("team_chat_database", JSON.stringify(db)); setTeamMessages([...msgs, newMessage]); setTeamChatInput(""); setAttachment(null); };
  useEffect(() => { teamChatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [teamMessages, teamViewMode]);
  useEffect(() => { if (!user) return; const interval = setInterval(() => { const allChats = JSON.parse(localStorage.getItem("chat_database") || "{}"); const myMessages = allChats[user._id] || []; if (myMessages.length !== messages.length) setMessages(myMessages); }, 1000); return () => clearInterval(interval); }, [user, messages]);
  const handleSendMessage = (e) => { e.preventDefault(); if ((!chatInput.trim() && !attachment) || !user) return; const newMessage = { sender: "Employee", text: chatInput, file: attachment, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }; const allChats = JSON.parse(localStorage.getItem("chat_database") || "{}"); const userChats = allChats[user._id] || []; allChats[user._id] = [...userChats, newMessage]; localStorage.setItem("chat_database", JSON.stringify(allChats)); setMessages(allChats[user._id]); setChatInput(""); setAttachment(null); };
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  const handleFileSelect = (e) => { const file = e.target.files[0]; if (file) { if (file.size > 500000) { alert("Max 500KB"); return; } const reader = new FileReader(); reader.onload = (ev) => { setAttachment({ name: file.name, type: file.type, data: ev.target.result }); }; reader.readAsDataURL(file); } };
  
  // Other
  const markAttendance = async (type) => { try { const res = await fetch(`${API}/attendance`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user._id, type }) }); if (res.ok) { alert(type === "clock-in" ? "Clocked In ☀️" : "Clocked Out 🌙"); fetchUserData(); } else { const data = await res.json(); alert(data.message); } } catch (error) { alert("Error marking attendance"); } };
  const applyLeave = async (e) => { e.preventDefault(); try { const res = await fetch(`${API}/leave/apply`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user._id, leaveType: leaveForm.type, startDate: leaveForm.startDate, endDate: leaveForm.endDate, reason: leaveForm.reason }) }); if (res.ok) { alert("Leave Request Submitted 📝"); setLeaveForm({ type: "Sick Leave", startDate: "", endDate: "", reason: "" }); fetchUserData(); } else { alert("Failed to submit request"); } } catch (error) { alert("Error submitting leave"); } };
  const handleLogout = () => { localStorage.removeItem("user"); navigate("/"); };

  if (!user) return <div style={{padding:40, textAlign:"center", color:"#57606a"}}>Loading...</div>;
  const todayDate = new Date().toISOString().split('T')[0];
  const todayRecord = user.attendance?.find(r => r.date === todayDate);

  // --- STYLES ---
  const styles = {
    page: { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif", backgroundColor: "#F6F8FA", minHeight: "100vh", position: "absolute", top:0, left:0, width:"100%", display: "flex", flexDirection: "column", color: "#24292f" },
    header: { backgroundColor: "#24292f", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    logoutBtn: { backgroundColor: "#cf222e", color: "white", border: "1px solid rgba(255,255,255,0.1)", padding: "6px 14px", borderRadius: "6px", fontWeight: "600", cursor: "pointer", fontSize: "12px" },
    tabBar: { backgroundColor: "#ffffff", borderBottom: "1px solid #d0d7de", padding: "0 32px", display: "flex", gap: "24px" },
    tabBtn: (active) => ({ padding: "12px 0", background: "transparent", border: "none", borderBottom: active ? "2px solid #fd8c73" : "2px solid transparent", fontWeight: active ? "600" : "400", color: active ? "#24292f" : "#57606a", cursor: "pointer", fontSize: "14px" }),
    counter: { backgroundColor: "rgba(175,184,193,0.2)", color: "#24292f", borderRadius: "20px", padding: "2px 6px", fontSize: "11px", fontWeight: "600", marginLeft: "6px" },
    
    container: { maxWidth: "1100px", margin: "32px auto", padding: "0 24px", width: "100%" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" },
    card: { backgroundColor: "#ffffff", border: "1px solid #d0d7de", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", overflow: "hidden" },
    sectionTitle: { fontSize: "15px", fontWeight: "600", color: "#24292f", marginBottom: "16px", borderBottom: "1px solid #e1e4e8", paddingBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    row: { display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "14px", color: "#57606a" },
    
    primaryBtn: { backgroundColor: "#2da44e", color: "#ffffff", border: "1px solid rgba(27,31,36,0.15)", padding: "6px 16px", borderRadius: "6px", fontWeight: "600", fontSize: "13px", cursor: "pointer", boxShadow: "0 1px 0 rgba(27,31,36,0.1)" },
    defaultBtn: { backgroundColor: "#f6f8fa", color: "#24292f", border: "1px solid rgba(27,31,36,0.15)", padding: "6px 16px", borderRadius: "6px", fontWeight: "500", fontSize: "13px", cursor: "pointer" },
    formInput: { width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d0d7de", fontSize: "14px", marginTop: "4px", boxSizing: "border-box", background: "#f6f8fa" },
    badge: (status) => { let bg = "#f6f8fa", col = "#57606a", border = "#d0d7de"; if (["Active", "Present", "Approved"].includes(status)) { bg = "#dafbe1"; col = "#1a7f37"; border = "rgba(26,127,55,0.2)"; } else if (["Resigned", "Terminated", "Absent", "Rejected"].includes(status)) { bg = "#ffebe9"; col = "#cf222e"; border = "rgba(207,34,46,0.2)"; } return { backgroundColor: bg, color: col, border: `1px solid ${border}`, padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "600" }; },
    
    // Modal
    modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 },
    modalContent: { backgroundColor: "#ffffff", borderRadius: "6px", width: "650px", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 24px rgba(140,149,159,0.2)", overflow: "hidden" },
    
    // Chat & Teams
    splitViewContainer: { display: "flex", height: "calc(100vh - 180px)", border: "1px solid #d0d7de", borderRadius: "8px", backgroundColor: "#ffffff", overflow: "hidden" },
    sidebar: { width: "260px", borderRight: "1px solid #d0d7de", display: "flex", flexDirection: "column", backgroundColor: "#f6f8fa" },
    mainContent: { flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#fff" },
    sidebarItem: (active) => ({ padding: "14px 20px", cursor: "pointer", borderBottom: "1px solid #e1e4e8", display: "flex", alignItems: "center", gap: "12px", backgroundColor: active ? "#ffffff" : "transparent", borderLeft: active ? "3px solid #fd8c73" : "3px solid transparent" }),
    chatHeader: { padding: "16px 24px", borderBottom: "1px solid #d0d7de", backgroundColor: "#f6f8fa", fontWeight: "600", display: "flex", alignItems: "center", gap: "12px", fontSize: "14px" },
    chatMessages: { flex: 1, padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", backgroundColor: "#ffffff" },
    bubble: (isMe) => ({ maxWidth: "70%", padding: "10px 16px", borderRadius: "8px", fontSize: "14px", lineHeight: "1.5", alignSelf: isMe ? "flex-end" : "flex-start", backgroundColor: isMe ? "#ddf4ff" : "#f6f8fa", color: "#24292f", border: isMe ? "1px solid #54aeff" : "1px solid #d0d7de" }),
    inputArea: { padding: "16px 24px", borderTop: "1px solid #d0d7de", backgroundColor: "#ffffff", display: "flex", gap: "12px", alignItems: "center" },
    filePreview: { display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", fontSize: "12px", color: "#166534", marginBottom: "8px" },
    teamHeader: { padding: "20px 24px", borderBottom: "1px solid #d0d7de", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f6f8fa" },
    teamSection: { padding: "24px", borderBottom: "1px solid #f0f0f0" },
    memberTag: { display: "inline-flex", alignItems: "center", padding: "4px 10px", background: "#f3f4f6", borderRadius: "20px", fontSize: "12px", marginRight: "8px", border: "1px solid #d0d7de", color: "#57606a", fontWeight: "500" },
    taskItem: { display: "flex", alignItems: "center", padding: "12px", background: "#ffffff", borderRadius: "6px", marginBottom: "10px", border: "1px solid #d0d7de", gap: "12px", cursor: "pointer", transition: "0.2s" },
    checkbox: (checked) => ({ width: "18px", height: "18px", borderRadius: "4px", border: checked ? "none" : "2px solid #d0d7de", backgroundColor: checked ? "#2da44e" : "white", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "12px" }),
    filterTab: (active) => ({ padding: "4px 12px", borderRadius: "20px", border: "1px solid transparent", backgroundColor: active ? "#2da44e" : "#f6f8fa", color: active ? "white" : "#57606a", fontSize: "12px", fontWeight: "600", cursor: "pointer", marginRight: "6px" }),
    /* calendar styles */
    calendarGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginTop: "16px" },
    calendarHeader: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", textAlign: "center", fontWeight: "600", fontSize: "12px", color: "#57606a", marginBottom: "8px" },
    dayCell: (status) => ({ height: "80px", border: "1px solid #d0d7de", borderRadius: "6px", padding: "6px", fontSize: "13px", fontWeight: "500", backgroundColor: status === "Present" ? "#dafbe1" : status === "Absent" || status === "Late" ? "#ffebe9" : "white", color: status === "Present" ? "#1a7f37" : status === "Absent" || status === "Late" ? "#cf222e" : "#24292f", display: "flex", flexDirection: "column", justifyContent: "space-between" }),
    emptyCell: { height: "80px", backgroundColor: "#f6f8fa", borderRadius: "6px", border: "1px dashed #d0d7de" },
    calNav: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", padding: "0 8px" },
    calTitle: { fontSize: "16px", fontWeight: "600" },
    calBtn: { background: "none", border: "1px solid #d0d7de", borderRadius: "4px", padding: "4px 12px", cursor: "pointer", fontWeight: "bold" }
  };

  return (
    <div style={styles.page}>
      
      {/* HEADER */}
      <div style={styles.header}>
        <div style={{ fontFamily: '"Inter", sans-serif', fontWeight: 600, color: '#ffffff', fontSize: '18px', display:"flex", alignItems:"center", gap:"10px" }}>
          <span>EMPLOYEE PORTAL</span>
          <span style={{fontSize: '13px', opacity: 0.7, fontWeight: "400", background:"rgba(255,255,255,0.1)", padding:"2px 8px", borderRadius:"12px"}}>{user.name}</span>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>Sign out</button>
      </div>

      {/* TABS */}
      <div style={styles.tabBar}>
        <button style={styles.tabBtn(currentView === "dashboard")} onClick={() => setCurrentView("dashboard")}>Dashboard</button>
        <button style={styles.tabBtn(currentView === "teams")} onClick={() => setCurrentView("teams")}>Teams <span style={styles.counter}>{myTeams.length}</span></button>
        <button style={styles.tabBtn(currentView === "chat")} onClick={() => setCurrentView("chat")}>Messages</button>
        {/* NEW FEATURE TABS */}
        <button style={styles.tabBtn(currentView === "announcements")} onClick={() => setCurrentView("announcements")}>📢 Announcements</button>
        <button style={styles.tabBtn(currentView === "goals")} onClick={() => setCurrentView("goals")}>🎯 Goals</button>
        <button style={styles.tabBtn(currentView === "analytics")} onClick={() => setCurrentView("analytics")}>📊 Analytics</button>
      </div>

      <div style={styles.container}>
        
        {/* --- VIEW: DASHBOARD --- */}
        {currentView === "dashboard" && (
          <div style={{overflowY: "auto", flex: 1}}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px"}}>
              <h2 style={{margin:0, color: "#24292f", fontSize:"22px", fontWeight:"600"}}>Overview</h2>
              <button onClick={openEditModal} style={styles.primaryBtn}>Edit Profile</button>
            </div>

            <div style={styles.grid}>
              {/* 1. Identity Card */}
              <div style={styles.card}>
                <div style={{textAlign: "center", marginBottom: "20px"}}>
                  <img src={`${API}/users/${user._id}/photo?t=${Date.now()}`} style={{width: "90px", height: "90px", borderRadius: "50%", border: "4px solid #f6f8fa", boxShadow:"0 2px 4px rgba(0,0,0,0.1)"}} onError={(e) => e.target.style.display = 'none'} />
                  <h3 style={{margin: "12px 0 4px", fontSize: "18px", fontWeight: "600"}}>{user.name}</h3>
                  <span style={{backgroundColor: "#f6f8fa", color: "#57606a", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600", border: "1px solid #d0d7de"}}>{user.designation || "Employee"}</span>
                </div>
                <div style={styles.row}><span style={{fontWeight:"500"}}>Employee ID</span><b style={{fontFamily:"monospace", color:"#24292f"}}>{user.customId || "N/A"}</b></div>
                <div style={styles.row}><span style={{fontWeight:"500"}}>Status</span><span style={styles.badge(user.employmentStatus)}>{user.employmentStatus || "Active"}</span></div>
              </div>

              {/* Contact Information Card */}
              <div style={styles.card}>
                <h4 style={{margin:"0 0 12px 0", fontSize:"14px", fontWeight:"600", color:"#24292f"}}>📞 Contact Information</h4>
                <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", fontSize:"13px"}}>
                    <div>
                        <p style={{color:"#57606a", margin:"0 0 4px 0", fontWeight:"500"}}>Mobile</p>
                        <p style={{margin:0, color:"#24292f", fontFamily:"monospace"}}>{user.mobile || "Not Added"}</p>
                    </div>
                    <div>
                        <p style={{color:"#57606a", margin:"0 0 4px 0", fontWeight:"500"}}>Email</p>
                        <p style={{margin:0, color:"#0969da", wordBreak:"break-all"}}>{user.email}</p>
                    </div>
                    <div style={{gridColumn:"1 / -1"}}>
                        <p style={{color:"#57606a", margin:"0 0 4px 0", fontWeight:"500"}}>Personal Email</p>
                        <p style={{margin:0, color:"#0969da", wordBreak:"break-all"}}>{user.personalEmail || "Not Added"}</p>
                    </div>
                </div>
              </div>

              {/* Personal Information Card */}
              <div style={styles.card}>
                <h4 style={{margin:"0 0 12px 0", fontSize:"14px", fontWeight:"600", color:"#24292f"}}>👤 Personal Information</h4>
                <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", fontSize:"13px"}}>
                    <div>
                        <p style={{color:"#57606a", margin:"0 0 4px 0", fontWeight:"500"}}>Gender</p>
                        <p style={{margin:0, color:"#24292f"}}>{user.gender || "Not Specified"}</p>
                    </div>
                    <div>
                        <p style={{color:"#57606a", margin:"0 0 4px 0", fontWeight:"500"}}>Address</p>
                        <p style={{margin:0, color:"#24292f", whiteSpace:"pre-wrap"}}>{user.address || "Not Added"}</p>
                    </div>
                </div>
              </div>

              {/* 2. Work Profile Card */}
              <div style={styles.card}>
                <div style={styles.sectionTitle}>Work Profile</div>
                <div style={{fontSize:"13px", lineHeight:"2.2"}}>
                    <div style={styles.row}><span style={{color:"#57606a"}}>Shift Type</span> <b>{user.shiftType || "Day"}</b></div>
                    <div style={styles.row}><span style={{color:"#57606a"}}>Location</span> <b>{user.workLocation || "Office"}</b></div>
                    <div style={styles.row}><span style={{color:"#57606a"}}>Salary</span> <b style={{color:"#1a7f37"}}>${user.salary ? Number(user.salary).toLocaleString() : "0"}</b></div>
                </div>
              </div>

              {/* 3. Leave Balance Card */}
              <div style={styles.card}>
                <div style={styles.sectionTitle}>Leave Balance</div>
                <div style={{display:"flex", gap:"15px", marginBottom:"15px"}}>
                    <div style={{flex:1, background:"#f6f8fa", padding:"15px", borderRadius:"8px", textAlign:"center", border:"1px solid #d0d7de"}}>
                        <div style={{fontSize:"24px", fontWeight:"600", color:"#24292f"}}>{user.leaves?.total || 24}</div>
                        <div style={{fontSize:"11px", color:"#57606a", fontWeight:"500", marginTop:"5px"}}>TOTAL</div>
                    </div>
                    <div style={{flex:1, background:"#dafbe1", padding:"15px", borderRadius:"8px", textAlign:"center", border:"1px solid #bbf7d0"}}>
                        <div style={{fontSize:"24px", fontWeight:"600", color:"#166534"}}>{user.leaves?.remaining || 24}</div>
                        <div style={{fontSize:"11px", color:"#166534", fontWeight:"500", marginTop:"5px"}}>REMAINING</div>
                    </div>
                </div>
                <div style={{fontSize:"12px", color:"#57606a", textAlign:"center"}}>
                    Used: <b style={{color:"#cf222e"}}>{(user.leaves?.total || 24) - (user.leaves?.remaining || 24)}</b> days
                </div>
              </div>

              {/* 4. Attendance Card */}
              <div style={styles.card}>
                <div style={styles.sectionTitle}>Today's Attendance</div>
                <div style={{textAlign: "center", padding: "16px 0", flex:1, display:"flex", flexDirection:"column", justifyContent:"center"}}>
                  <div style={{fontSize: "36px", fontWeight: "300", marginBottom: "20px", color:"#24292f", fontFamily:"monospace"}}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  {!todayRecord ? (
                    <button onClick={() => markAttendance("clock-in")} style={{...styles.primaryBtn, padding: "10px", fontSize: "14px"}}>Clock In ☀️</button>
                  ) : (
                    <div>
                       <div style={{marginBottom: "16px", fontSize: "14px", display:"flex", justifyContent:"center", gap:"20px"}}>
                         <span style={{color: "#1a7f37", fontWeight: "600", background:"#dafbe1", padding:"4px 8px", borderRadius:"6px"}}>In: {todayRecord.loginTime}</span>
                         {todayRecord.logoutTime && <span style={{color: "#cf222e", fontWeight: "600", background:"#ffebe9", padding:"4px 8px", borderRadius:"6px"}}>Out: {todayRecord.logoutTime}</span>}
                       </div>
                       <button onClick={() => markAttendance("clock-out")} disabled={!!todayRecord.logoutTime} style={{...styles.primaryBtn, backgroundColor: todayRecord.logoutTime ? "#f6f8fa" : "#cf222e", color: todayRecord.logoutTime ? "#8c959f" : "white", border: "1px solid rgba(27,31,36,0.15)", width:"100%"}}>{todayRecord.logoutTime ? "Shift Completed" : "Clock Out 🌙"}</button>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. My Tasks Box */}
              <div style={styles.card}>
                <div style={styles.sectionTitle}>
                    <span>My Tasks</span>
                    <span style={styles.counter}>{myTasks.filter(t => t.status === "Pending").length}</span>
                </div>
                <div style={{marginBottom: "16px", display:"flex"}}>
                    <button onClick={() => setTaskFilter("Pending")} style={styles.filterTab(taskFilter === "Pending")}>Pending</button>
                    <button onClick={() => setTaskFilter("Completed")} style={styles.filterTab(taskFilter === "Completed")}>Done</button>
                </div>
                <div style={{flex: 1, overflowY: "auto", maxHeight: "250px", paddingRight:"4px"}}>
                    {displayedTasks.length === 0 && <div style={{textAlign:"center", padding:"30px", color:"#8c959f", fontSize:"13px", fontStyle:"italic"}}>No {taskFilter.toLowerCase()} tasks.</div>}
                    {displayedTasks.map(task => (
                        <div key={task.id} style={styles.taskItem} onClick={() => handleToggleMyTask(task.id)}>
                            <div style={styles.checkbox(task.status === "Completed")}>{task.status === "Completed" && "✓"}</div>
                            <div style={{flex:1}}>
                                <div style={{fontSize: "13px", fontWeight: "500", textDecoration: task.status === "Completed" ? "line-through" : "none", color: task.status === "Completed" ? "#8c959f" : "#24292f", marginBottom:"2px"}}>{task.description}</div>
                                <div style={{fontSize: "11px", color: "#8c959f"}}>Due: {task.deadline || "No date"}</div>
                            </div>
                        </div>
                    ))}
                </div>
              </div>

              {/* Attendance Calendar (monthly) */}
              <div style={styles.card}>
                <h4 style={{margin:"0 0 16px 0", fontSize:"14px", fontWeight:"600"}}>📅 Attendance Calendar</h4>
                <div style={styles.calNav}>
                  <button onClick={() => changeMonth(-1)} style={styles.calBtn}>←</button>
                  <span style={styles.calTitle}>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                  <button onClick={() => changeMonth(1)} style={styles.calBtn}>→</button>
                </div>
                <div style={styles.calendarHeader}>{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}</div>
                <div style={styles.calendarGrid}>
                  {Array.from({ length: getFirstDayOfMonth(currentDate) }).map((_, i) => <div key={"empty-"+i} style={styles.emptyCell}></div>)}
                  {Array.from({ length: getDaysInMonth(currentDate) }).map((_, i) => {
                    const day = i + 1;
                    const record = getAttendanceForDate(day);
                    return (
                      <div key={day} style={styles.dayCell(record ? record.status : null)}>
                        <span>{day}</span>
                        {record && <span style={{fontSize:"10px", textAlign:"center", opacity:0.8}}>{record.status === "Present" ? `${record.loginTime} - ${record.logoutTime}` : record.status}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 6. Request Leave */}
              <div style={styles.card}>
                <div style={styles.sectionTitle}>Request Leave</div>
                <form onSubmit={applyLeave} style={{display:"flex", flexDirection:"column", gap:"12px"}}>
                  <select style={styles.formInput} value={leaveForm.type} onChange={e => setLeaveForm({...leaveForm, type: e.target.value})}><option>Sick Leave</option><option>Casual Leave</option></select>
                  <div style={{display:"flex", gap:"10px"}}>
                    <input type="date" required style={styles.formInput} value={leaveForm.startDate} onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})} />
                    <input type="date" required style={styles.formInput} value={leaveForm.endDate} onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})} />
                  </div>
                  <input placeholder="Reason for leave..." required style={styles.formInput} value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} />
                  <button type="submit" style={{...styles.primaryBtn, backgroundColor:"#9a6700", borderColor:"transparent", width:"100%", marginTop:"5px"}}>Submit Request</button>
                </form>
              </div>
              
              {/* 7. Leave History */}
              <div style={styles.card}>
                <div style={styles.sectionTitle}>Leave History</div>
                <div style={{maxHeight: "180px", overflowY: "auto"}}>
                  <table style={{width: "100%", fontSize: "13px", borderCollapse: "collapse"}}>
                    <tbody>
                      {user.leaveRequests?.length > 0 ? (
                        user.leaveRequests.slice().reverse().map((req, i) => (
                          <tr key={i} style={{borderBottom:"1px solid #f0f0f0"}}>
                            <td style={{padding:"8px 0", fontWeight:"500"}}>{req.leaveType}</td>
                            <td style={{color:"#57606a"}}>{new Date(req.startDate).toLocaleDateString()}</td>
                            <td style={{textAlign:"right"}}><span style={styles.badge(req.status)}>{req.status}</span></td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="3" style={{textAlign:"center", padding:"20px", color:"#8c959f", fontStyle:"italic"}}>No leave history found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* --- VIEW: TEAMS --- */}
        {currentView === "teams" && (
          <div style={styles.splitViewContainer}>
            <div style={styles.sidebar}>
                <div style={{padding:"16px", borderBottom:"1px solid #d0d7de", fontWeight:"600", color:"#57606a", fontSize:"13px", textTransform:"uppercase", letterSpacing:"0.5px"}}>My Teams</div>
                <div style={{overflowY:"auto", flex:1}}>
                    {myTeams.length === 0 && <div style={{padding:"30px", color:"#9ca3af", textAlign:"center", fontSize:"13px", fontStyle:"italic"}}>You are not in any teams yet.</div>}
                    {myTeams.map(t => (
                        <div key={t.id} style={styles.sidebarItem(selectedTeam && selectedTeam.id === t.id)} onClick={() => { setSelectedTeam(t); setTeamViewMode("tasks"); }}>
                            <div style={{width:"32px", height:"32px", borderRadius:"6px", background:"#ddf4ff", color:"#0969da", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"bold", fontSize:"12px"}}>{t.name.substring(0,2).toUpperCase()}</div>
                            <div><div style={{fontSize:"13px", fontWeight:"600"}}>{t.name}</div></div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={styles.mainContent}>
                {selectedTeam ? (
                    <>
                        <div style={styles.teamHeader}>
                            <div>
                                <h2 style={{margin:"0 0 4px 0", fontSize:"18px"}}>{selectedTeam.name}</h2>
                                <p style={{margin:0, color:"#57606a", fontSize:"13px"}}>{selectedTeam.description || "No description."}</p>
                            </div>
                            <div style={{display:"flex", gap:"8px"}}>
                                <button onClick={() => setTeamViewMode("tasks")} style={teamViewMode==="tasks" ? styles.primaryBtn : styles.defaultBtn}>Tasks</button>
                                <button onClick={() => setTeamViewMode("chat")} style={teamViewMode==="chat" ? styles.primaryBtn : styles.defaultBtn}>Chat</button>
                            </div>
                        </div>
                        
                        {teamViewMode === "tasks" ? (
                            <>
                                <div style={styles.teamSection}>
                                    <h4 style={{marginTop:0, marginBottom:"12px", fontSize:"12px", color:"#57606a", textTransform:"uppercase", fontWeight:"600"}}>Members</h4>
                                    <div>
                                        {selectedTeam.members.map(memId => {
                                            const mem = usersList.find(u => u._id === memId);
                                            return mem ? <span key={memId} style={styles.memberTag}>{mem.name}</span> : null;
                                        })}
                                    </div>
                                </div>
                                <div style={{...styles.teamSection, borderBottom:"none", flex:1, overflowY:"auto"}}>
                                    <h4 style={{marginTop:0, marginBottom:"12px", fontSize:"12px", color:"#57606a", textTransform:"uppercase", fontWeight:"600"}}>Tasks</h4>
                                    {selectedTeam.tasks.length === 0 && <div style={{color:"#9ca3af", fontSize:"13px", fontStyle:"italic", textAlign:"center", marginTop:"20px"}}>No active tasks for this team.</div>}
                                    {selectedTeam.tasks.map(task => (
                                        <div key={task.id} style={styles.taskItem} onClick={() => handleToggleTeamTask(task.id)}>
                                            <div style={styles.checkbox(task.status === "Completed")}>{task.status === "Completed" && "✓"}</div>
                                            <span style={{fontSize:"13px", textDecoration: task.status === "Completed" ? "line-through" : "none", color: task.status === "Completed" ? "#8c959f" : "#24292f", fontWeight:"500"}}>{task.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={styles.chatMessages}>
                                    {teamMessages.length === 0 && <div style={{textAlign:"center", color:"#9ca3af", fontSize:"13px", marginTop:"40px"}}>No messages yet.</div>}
                                    {teamMessages.map((msg, idx) => (
                                        <div key={idx} style={styles.bubble(msg.sender === user.name)}>
                                            <div style={{fontWeight:"bold", fontSize:"10px", marginBottom:"2px", color: msg.sender === user.name ? "white" : "#0969da"}}>{msg.sender === user.name ? "You" : msg.sender}</div>
                                            {msg.file && (
                                              <div style={{marginBottom: "5px"}}>
                                                {msg.file.type.startsWith("image/") ? <img src={msg.file.data} alt="attachment" style={{maxWidth: "100%", borderRadius: "8px", maxHeight: "200px"}} /> : <div style={{background:"rgba(0,0,0,0.1)", padding:"8px", borderRadius:"4px", fontSize:"12px"}}>📎 {msg.file.name}</div>}
                                              </div>
                                            )}
                                            {msg.text}
                                            <div style={{fontSize:"10px", opacity:0.7, marginTop:"4px", textAlign:"right"}}>{msg.time}</div>
                                        </div>
                                    ))}
                                    <div ref={teamChatEndRef}></div>
                                </div>
                                <div style={styles.inputArea}>
                                    {attachment && <div style={styles.filePreview}><span>📎 {attachment.name}</span><button onClick={() => setAttachment(null)} style={{background:"none", border:"none", cursor:"pointer", color:"#ef4444", fontWeight:"bold"}}>✕</button></div>}
                                    <label style={{cursor:"pointer", padding:"8px", color:"#6b7280", fontSize:"20px"}}>📎 <input type="file" style={{display:"none"}} onChange={handleFileSelect} /></label>
                                    <form onSubmit={handleSendTeamMessage} style={{display:"flex", flex:1, gap:"10px"}}>
                                        <input style={{...styles.formInput, marginTop:0, background:"white"}} placeholder="Message team..." value={teamChatInput} onChange={(e) => setTeamChatInput(e.target.value)} />
                                        <button type="submit" style={styles.primaryBtn}>Send</button>
                                    </form>
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <div style={{display:"flex", alignItems:"center", justifyContent:"center", height:"100%", color:"#57606a", flexDirection:"column", gap:"10px"}}>
                        <div style={{fontSize:"40px"}}>👋</div>
                        <div>Select a team from the sidebar</div>
                    </div>
                )}
            </div>
          </div>
        )}

        {/* --- VIEW: MESSAGES (DIRECT CHAT WITH MANAGER) --- */}
        {currentView === "chat" && (
          <div style={styles.splitViewContainer}>
            <div style={styles.sidebar}>
              <div style={{padding:"16px", fontWeight:"600", fontSize:"13px", color:"#57606a", borderBottom:"1px solid #d0d7de", textTransform:"uppercase", letterSpacing:"0.5px"}}>Direct Messages</div>
              <div style={{overflowY:"auto", flex:1}}>
                <div style={styles.sidebarItem(true)}>
                  <div style={{width:"32px", height:"32px", borderRadius:"50%", backgroundColor:"#ddf4ff", color:"#0969da", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"bold", fontSize:"12px"}}>M</div>
                  <div><div style={{fontSize:"13px", fontWeight:"600"}}>Manager</div><div style={{fontSize:"11px", color:"#1a7f37"}}>Online</div></div>
                </div>
              </div>
            </div>
            <div style={styles.mainContent}>
              <div style={styles.chatHeader}>
                <div style={{width:"24px", height:"24px", borderRadius:"50%", backgroundColor:"#e0e7ff", color:"#3730a3", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"bold", fontSize:"10px"}}>M</div>
                Manager
              </div>
              <div style={styles.chatMessages}>
                {messages.length === 0 && <div style={{textAlign:"center", color:"#8c959f", fontSize:"13px", marginTop:"40px"}}>Send a message to your manager.</div>}
                {messages.map((msg, idx) => (
                  <div key={idx} style={styles.bubble(msg.sender === "Employee")}>
                    {msg.file && (<div style={{marginBottom: "5px"}}>{msg.file.type.startsWith("image/") ? <img src={msg.file.data} alt="attachment" style={{maxWidth: "100%", borderRadius: "8px", maxHeight: "200px"}} /> : <div style={{background:"rgba(0,0,0,0.1)", padding:"8px", borderRadius:"4px", fontSize:"12px"}}>📎 {msg.file.name}</div>}</div>)}
                    {msg.text}
                    <div style={{fontSize:"10px", opacity:0.7, marginTop:"4px", textAlign:"right"}}>{msg.time}</div>
                  </div>
                ))}
                <div ref={chatEndRef}></div>
              </div>
              <div style={styles.inputArea}>
                {attachment && <div style={styles.filePreview}><span>📎 {attachment.name}</span><button onClick={() => setAttachment(null)} style={{background:"none", border:"none", cursor:"pointer", color:"#ef4444", fontWeight:"bold"}}>✕</button></div>}
                <label style={{cursor:"pointer", padding:"8px", color:"#6b7280", fontSize:"20px"}}>
                  📎 <input type="file" style={{display:"none"}} onChange={handleFileSelect} />
                </label>
                <form onSubmit={handleSendMessage} style={{display:"flex", flex:1, gap:"10px"}}>
                  <input placeholder="Type a message..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} style={{...styles.formInput, marginTop:0, background: "white"}} />
                  <button type="submit" style={styles.primaryBtn}>Send</button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* --- NEW FEATURE VIEWS --- */}
        {(currentView === "announcements" || currentView === "goals" || currentView === "analytics") && (
          <FeaturesPanel 
            API={API} 
            currentView={currentView} 
            setCurrentView={setCurrentView}
            userId={user?._id || JSON.parse(localStorage.getItem("user"))?.id}
            managerRole={false}
          />
        )}

      </div>

      {/* --- MODAL FOR EDIT PROFILE (FULL TABS) --- */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{padding:"16px", borderBottom:"1px solid #d0d7de", display:"flex", justifyContent:"space-between", alignItems:"center", backgroundColor:"#f6f8fa"}}>
              <h3 style={{margin:0, fontSize:"14px", fontWeight:"600"}}>Edit Profile</h3>
              <button onClick={() => setIsModalOpen(false)} style={{background:"none", border:"none", fontSize:"18px", cursor:"pointer", color:"#57606a"}}>✕</button>
            </div>
            
            <div style={{display:"flex", borderBottom:"1px solid #d0d7de", padding:"0 16px"}}>
              {["identity", "personal", "work", "leaves"].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{padding:"12px", border:"none", borderBottom: activeTab===tab ? "2px solid #fd8c73" : "none", background:"none", cursor:"pointer", fontWeight: activeTab===tab?"600":"400", textTransform:"capitalize", fontSize:"13px", color: activeTab===tab?"#24292f":"#57606a"}}>{tab}</button>
              ))}
            </div>

            <div style={{padding:"24px", overflowY:"auto"}}>
              <form onSubmit={handleModalSubmit} style={{display:"flex", flexDirection:"column", gap:"16px"}}>
                {activeTab === "identity" && (
                  <>
                    <label style={{fontSize:"12px", fontWeight:"500", marginBottom:"-10px"}}>Full Name</label>
                    <input name="name" value={form.name} onChange={handleChange} style={styles.formInput} required />
                    <label style={{fontSize:"12px", fontWeight:"500", marginBottom:"-10px"}}>Email (Login)</label>
                    <input name="email" value={form.email} onChange={handleChange} style={styles.formInput} required />
                    <label style={{fontSize:"12px", fontWeight:"500", marginBottom:"-10px"}}>Change Password (Optional)</label>
                    <input name="password" type="password" placeholder="New Password" value={form.password} onChange={handleChange} style={styles.formInput} />
                    <input type="file" onChange={handleFileChange} style={{fontSize:"13px"}} />
                  </>
                )}
                {activeTab === "personal" && (
                  <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px"}}>
                    <div><label style={{fontSize:"12px", fontWeight:"500"}}>Mobile</label><input name="mobile" value={form.mobile} onChange={handleChange} style={styles.formInput} /></div>
                    <div><label style={{fontSize:"12px", fontWeight:"500"}}>Gender</label><select name="gender" value={form.gender} onChange={handleChange} style={styles.formInput}><option>Male</option><option>Female</option></select></div>
                    <div style={{gridColumn:"span 2"}}><label style={{fontSize:"12px", fontWeight:"500"}}>Address</label><input name="address" value={form.address} onChange={handleChange} style={styles.formInput} /></div>
                    <div style={{gridColumn:"span 2"}}><label style={{fontSize:"12px", fontWeight:"500"}}>Personal Email</label><input name="personalEmail" value={form.personalEmail} onChange={handleChange} style={styles.formInput} /></div>
                  </div>
                )}
                {activeTab === "work" && (
                  <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", opacity: 0.6}}>
                    <div><label style={{fontSize:"12px"}}>Department</label><input value={form.department} disabled style={styles.formInput} title="Read-only" /></div>
                    <div><label style={{fontSize:"12px"}}>Designation</label><input value={form.designation} disabled style={styles.formInput} title="Read-only" /></div>
                    <div><label style={{fontSize:"12px"}}>Salary</label><input value={form.salary} disabled style={styles.formInput} title="Read-only" /></div>
                    <div><label style={{fontSize:"12px"}}>Status</label><input value={form.employmentStatus} disabled style={styles.formInput} title="Read-only" /></div>
                  </div>
                )}
                {activeTab === "leaves" && (
                  <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", opacity: 0.6}}>
                    <div><label style={{fontSize:"12px"}}>Total Leaves</label><input value={form.totalLeaves} disabled style={styles.formInput} /></div>
                    <div><label style={{fontSize:"12px"}}>Remaining</label><input value={form.remainingLeaves} disabled style={styles.formInput} /></div>
                  </div>
                )}
                <div style={{display:"flex", justifyContent:"flex-end", marginTop:"10px"}}>
                  <button type="submit" style={styles.primaryBtn}>{saving ? "Saving..." : "Save Changes"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default EmployeeDashboard;