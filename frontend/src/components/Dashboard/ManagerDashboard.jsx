import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import FeaturesPanel from "../FeaturesPanel";

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  
  // --- DATA STATE ---
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [managerName, setManagerName] = useState("Manager");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  
  // --- LOADING STATE ---
  const [actionLoading, setActionLoading] = useState({ id: null, action: null }); 
  const [isSaving, setIsSaving] = useState(false); 

  // --- NAVIGATION STATE ---
  const [currentView, setCurrentView] = useState("employees");
  const [selectedUser, setSelectedUser] = useState(null); 
  const [userTasks, setUserTasks] = useState([]);

  // --- GLOBAL TASKS STATE ---
  const [allTasksList, setAllTasksList] = useState([]);

  // --- TEAMS STATE ---
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: "", description: "" });
  const [newTask, setNewTask] = useState("");
  const [selectedMemberToAdd, setSelectedMemberToAdd] = useState("");
  const [teamViewMode, setTeamViewMode] = useState("tasks"); 
  const [teamMessages, setTeamMessages] = useState([]);
  const [teamChatInput, setTeamChatInput] = useState("");
  const teamChatEndRef = useRef(null);

  // --- INDIVIDUAL TASK ASSIGNMENT STATE ---
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTargetUser, setTaskTargetUser] = useState(null);
  const [individualTaskForm, setIndividualTaskForm] = useState({ description: "", deadline: "" });

  // --- CHAT STATE ---
  const [chatRecipient, setChatRecipient] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [currentChatHistory, setCurrentChatHistory] = useState([]); 
  const chatEndRef = useRef(null);

  // --- MODAL & FORM STATE ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("identity");
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({ 
    name: "", email: "", password: "", role: "employee", image: null,
    gender: "", personalEmail: "", mobile: "", address: "",
    employeeType: "Full-time", department: "", designation: "", 
    joiningDate: "", employmentStatus: "Active", 
    workLocation: "Office", shiftType: "Day", workingHours: "09:00 AM - 06:00 PM",
    salary: "", totalLeaves: 24, remainingLeaves: 24, attendanceStatus: "Absent"
  });

  // --- Check API is configured ---
  if (!API) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "red" }}>
        <h2>API URL not configured</h2>
        <p>Check your .env file and restart the server</p>
      </div>
    );
  }

  // ---------------- 1. INITIAL FETCH (FIXED CACHING) ----------------
  const fetchUsers = async () => { 
    try {
      setLoading(true);
      const response = await axios.get(`${API}/users`);
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (err) {
      console.error("Fetch Error:", err);
      alert("Failed to load employees. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { 
    fetchUsers(); 
    const storedUser = localStorage.getItem("user"); 
    if (storedUser) setManagerName(JSON.parse(storedUser).name);
    
    const storedTeams = JSON.parse(localStorage.getItem("team_database") || "[]");
    setTeams(storedTeams);
  }, []);

  useEffect(() => { 
    if (!searchQuery) { setFilteredUsers(users); } 
    else { 
      const lowerQ = searchQuery.toLowerCase(); 
      setFilteredUsers(users.filter(u => u.name.toLowerCase().includes(lowerQ) || u.email.toLowerCase().includes(lowerQ))); 
    } 
  }, [searchQuery, users]);

  // ---------------- 2. GLOBAL TASKS LOGIC ----------------
  const loadAllTasks = () => {
    const db = JSON.parse(localStorage.getItem("individual_tasks_db") || "{}");
    const list = [];
    Object.keys(db).forEach(userId => {
        const user = users.find(u => u._id === userId);
        if (user) {
            db[userId].forEach(task => {
                list.push({ ...task, userId: userId, userName: user.name, userAvatar: user._id });
            });
        }
    });
    list.sort((a, b) => (a.status === "Completed" ? 1 : -1));
    setAllTasksList(list);
  };

  useEffect(() => {
    if (currentView === "tasks") { loadAllTasks(); }
  }, [currentView, users]);

  const handleDeleteGlobalTask = (userId, taskId) => {
    if(!window.confirm("Remove this task assignment?")) return;
    const db = JSON.parse(localStorage.getItem("individual_tasks_db") || "{}");
    if (db[userId]) {
        db[userId] = db[userId].filter(t => t.id !== taskId);
        localStorage.setItem("individual_tasks_db", JSON.stringify(db));
        loadAllTasks(); 
    }
  };

  // ---------------- 3. INDIVIDUAL TASK LOGIC ----------------
  const openAssignTaskModal = (user) => {
    setTaskTargetUser(user);
    setIndividualTaskForm({ description: "", deadline: "" });
    setIsTaskModalOpen(true);
  };

  const handleAssignTaskSubmit = (e) => {
    e.preventDefault();
    if (!individualTaskForm.description || !taskTargetUser) return;
    const allTasks = JSON.parse(localStorage.getItem("individual_tasks_db") || "{}");
    const userTasks = allTasks[taskTargetUser._id] || [];
    const newTask = {
      id: Date.now(),
      description: individualTaskForm.description,
      deadline: individualTaskForm.deadline,
      status: "Pending",
      assignedDate: new Date().toLocaleDateString()
    };
    allTasks[taskTargetUser._id] = [...userTasks, newTask];
    localStorage.setItem("individual_tasks_db", JSON.stringify(allTasks));
    setIsTaskModalOpen(false);
    if (currentView === "tasks") loadAllTasks();
    if (currentView === "profile" && selectedUser?._id === taskTargetUser._id) loadUserTasks(taskTargetUser._id);
    alert(`Task assigned to ${taskTargetUser.name} ✅`);
  };

  const loadUserTasks = (userId) => {
    const allTasks = JSON.parse(localStorage.getItem("individual_tasks_db") || "{}");
    setUserTasks(allTasks[userId] || []);
  };

  const handleDeleteUserTask = (taskId) => {
    if(!selectedUser) return;
    const allTasks = JSON.parse(localStorage.getItem("individual_tasks_db") || "{}");
    const updatedTasks = (allTasks[selectedUser._id] || []).filter(t => t.id !== taskId);
    allTasks[selectedUser._id] = updatedTasks;
    localStorage.setItem("individual_tasks_db", JSON.stringify(allTasks));
    setUserTasks(updatedTasks);
  };

  // ---------------- 4. TEAM MANAGEMENT LOGIC ----------------
  const saveTeams = (updatedTeams) => { 
    setTeams(updatedTeams); 
    localStorage.setItem("team_database", JSON.stringify(updatedTeams)); 
  };

  const handleCreateTeam = (e) => { 
    e.preventDefault(); 
    if (!teamForm.name) return; 
    const newTeam = { id: Date.now(), name: teamForm.name, description: teamForm.description, members: [], tasks: [] }; 
    saveTeams([...teams, newTeam]); 
    setTeamForm({ name: "", description: "" }); 
    setIsTeamModalOpen(false); 
  };

  const handleDeleteTeam = (teamId) => { 
    if (window.confirm("Delete this team completely?")) { 
      const updated = teams.filter(t => t.id !== teamId); 
      saveTeams(updated); 
      setSelectedTeam(null); 
    } 
  };

  const handleAddMember = () => { 
    if (!selectedMemberToAdd || !selectedTeam) return; 
    if (selectedTeam.members.includes(selectedMemberToAdd)) { alert("User already in team!"); return; } 
    const updatedTeam = { ...selectedTeam, members: [...selectedTeam.members, selectedMemberToAdd] }; 
    const updatedTeams = teams.map(t => t.id === selectedTeam.id ? updatedTeam : t); 
    saveTeams(updatedTeams); 
    setSelectedTeam(updatedTeam); 
    setSelectedMemberToAdd(""); 
  };

  const handleRemoveMember = (memberId) => { 
    const updatedTeam = { ...selectedTeam, members: selectedTeam.members.filter(id => id !== memberId) }; 
    const updatedTeams = teams.map(t => t.id === selectedTeam.id ? updatedTeam : t); 
    saveTeams(updatedTeams); 
    setSelectedTeam(updatedTeam); 
  };

  const handleAddTask = (e) => { 
    e.preventDefault(); 
    if (!newTask || !selectedTeam) return; 
    const updatedTeam = { ...selectedTeam, tasks: [...selectedTeam.tasks, { id: Date.now(), text: newTask, status: "Pending" }] }; 
    const updatedTeams = teams.map(t => t.id === selectedTeam.id ? updatedTeam : t); 
    saveTeams(updatedTeams); 
    setSelectedTeam(updatedTeam); 
    setNewTask(""); 
  };

  const handleDeleteTask = (taskId) => { 
    const updatedTeam = { ...selectedTeam, tasks: selectedTeam.tasks.filter(t => t.id !== taskId) }; 
    const updatedTeams = teams.map(t => t.id === selectedTeam.id ? updatedTeam : t); 
    saveTeams(updatedTeams); 
    setSelectedTeam(updatedTeam); 
  };

  // ---------------- 5. CHAT LOGIC ----------------
  const handleSendTeamMessage = (e) => {
    e.preventDefault();
    if ((!teamChatInput.trim() && !attachment) || !selectedTeam) return;
    const newMessage = { sender: "Manager", text: teamChatInput, file: attachment, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    const db = JSON.parse(localStorage.getItem("team_chat_database") || "{}");
    const msgs = db[selectedTeam.id] || [];
    const updatedMsgs = [...msgs, newMessage];
    db[selectedTeam.id] = updatedMsgs;
    localStorage.setItem("team_chat_database", JSON.stringify(db));
    setTeamMessages(updatedMsgs);
    setTeamChatInput("");
    setAttachment(null);
  };
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    if ((!messageInput.trim() && !attachment) || !chatRecipient) return;
    const newMessage = { sender: "Manager", text: messageInput, file: attachment, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
    const allChats = JSON.parse(localStorage.getItem("chat_database") || "{}");
    const userChats = allChats[chatRecipient._id] || [];
    const updatedChats = [...userChats, newMessage];
    try {
      allChats[chatRecipient._id] = updatedChats;
      localStorage.setItem("chat_database", JSON.stringify(allChats));
      setCurrentChatHistory(updatedChats);
      setMessageInput("");
      setAttachment(null);
    } catch(err) { alert("Storage full."); }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500000) { alert("Max 500KB"); return; }
      const reader = new FileReader();
      reader.onload = (ev) => { setAttachment({ name: file.name, type: file.type, data: ev.target.result }); };
      reader.readAsDataURL(file);
    }
  };

  // ---------------- 7. STANDARD HANDLERS ----------------
  const handleLeaveAction = async (userId, leaveId, status) => {
    setActionLoading({ id: leaveId, action: status });
    try {
        await axios.post(`${API}/leave/respond`, {
            userId, leaveId, status
        });
        await fetchUsers(); 
    } catch (error) { 
      console.error("Leave action error:", error);
      alert("Failed to respond to leave request."); 
    }
    setActionLoading({ id: null, action: null });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this user?")) {
      setActionLoading({ id: id, action: "delete" }); 
      try {
        await axios.delete(`${API}/users/${id}`);
        await fetchUsers();
      } catch (error) { 
        console.error("Delete error:", error);
        alert("Delete failed"); 
      }
      setActionLoading({ id: null, action: null }); 
    }
  };

  const handleLogout = () => { localStorage.removeItem("user"); navigate("/"); };
  const changeMonth = (offset) => { const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + offset)); setCurrentDate(new Date(newDate)); };
  const getAttendanceForDate = (day) => { if (!selectedUser || !selectedUser.attendance) return null; const year = currentDate.getFullYear(); const month = String(currentDate.getMonth() + 1).padStart(2, '0'); const dayStr = String(day).padStart(2, '0'); const dateString = `${year}-${month}-${dayStr}`; return selectedUser.attendance.find(a => a.date === dateString); };
  
  // --- FORM HANDLERS (UPDATED) ---
  const openAddModal = () => { 
      setEditingId(null); 
      setActiveTab("identity"); 
      setForm({ 
          name: "", email: "", password: "", role: "employee", image: null, 
          gender: "", personalEmail: "", mobile: "", address: "", 
          employeeType: "Full-time", department: "", designation: "", 
          joiningDate: "", employmentStatus: "Active", 
          workLocation: "Office", shiftType: "Day", workingHours: "09:00 AM - 06:00 PM", 
          salary: "", totalLeaves: 24, remainingLeaves: 24, attendanceStatus: "Absent" 
      }); 
      setIsModalOpen(true); 
  };
  
  const openEditModal = (user) => { 
      setEditingId(user._id); 
      setActiveTab("identity"); 
      setForm({ 
          name: user.name, 
          email: user.email, 
          password: "", 
          role: user.role, 
          image: null, 
          gender: user.gender || "", 
          personalEmail: user.personalEmail || "", 
          mobile: user.mobile || "", 
          address: user.address || "", 
          employeeType: user.employeeType || "Full-time", 
          department: user.department || "", 
          designation: user.designation || "", 
          joiningDate: user.joiningDate ? user.joiningDate.split('T')[0] : "", 
          employmentStatus: user.employmentStatus || "Active", 
          workLocation: user.workLocation || "Office", 
          shiftType: user.shiftType || "Day", 
          workingHours: user.workingHours || "", 
          salary: user.salary || "", 
          totalLeaves: user.leaves?.total || 24, 
          remainingLeaves: user.leaves?.remaining || 24, 
          attendanceStatus: user.attendance?.status || "Absent" 
      }); 
      setIsModalOpen(true); 
  };
  
  // --- SUBMIT HANDLER (FIXED FOR DATA ISSUES) ---
  const handleSubmit = async (e) => { 
      e.preventDefault(); 
      setIsSaving(true); 

      const formData = new FormData(); 
      
      // Append fields manually. Exclude 'image' from auto-loop to prevent null string issues.
      Object.keys(form).forEach(key => { 
          if(key === "leaves" || key === "attendance" || key === "image") return; 
          
          if(form[key] !== null && form[key] !== undefined) {
             formData.append(key, form[key]); 
          }
      }); 
      
      // Complex objects
      formData.append("leaves", JSON.stringify({ total: form.totalLeaves, remaining: form.remainingLeaves })); 
      formData.append("attendance", JSON.stringify({ status: form.attendanceStatus })); 
      
      // Explicitly append image ONLY if it exists and is a File
      if(form.image instanceof File) {
          formData.append("image", form.image); 
      }

      const url = editingId ? `${API}/users/${editingId}` : `${API}/signup`; 
      const method = editingId ? "PUT" : "POST"; 

      try {
          const config = {
            method: method,
            headers: { "Content-Type": "multipart/form-data" }
          };
          
          const res = editingId 
            ? await axios.put(url, formData, config)
            : await axios.post(url, formData, config);

          await fetchUsers(); // Refresh data
          setIsModalOpen(false); 
          alert(editingId ? "Employee updated successfully!" : "Employee created successfully!");

      } catch (error) {
          console.error("Save failed", error);
          alert(`Failed to save: ${error.response?.data?.message || error.message}`);
      } finally {
          setIsSaving(false); 
      }
  };
  
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setForm({ ...form, image: e.target.files[0] });

  // Helpers
  const totalEmployees = users.length;
  const allLeaves = users.flatMap(u => (u.leaveRequests || []).map(r => ({...r, userId: u._id, userName: u.name}))).sort((a,b) => new Date(b.startDate) - new Date(a.startDate));
  const pendingCount = allLeaves.filter(r => r.status === "Pending").length;
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  // --- STYLES (GITHUB THEME) ---
  const styles = {
    page: { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif", backgroundColor: "#f6f8fa", minHeight: "100vh", color: "#24292f" },
    header: { backgroundColor: "#24292f", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    primaryBtn: { backgroundColor: "#2da44e", color: "#ffffff", border: "1px solid rgba(27,31,36,0.15)", padding: "5px 16px", borderRadius: "6px", fontWeight: "500", fontSize: "14px", cursor: "pointer", boxShadow: "0 1px 0 rgba(27,31,36,0.1)" },
    defaultBtn: { backgroundColor: "#f6f8fa", color: "#24292f", border: "1px solid rgba(27,31,36,0.15)", padding: "5px 16px", borderRadius: "6px", fontWeight: "500", fontSize: "14px", cursor: "pointer", boxShadow: "0 1px 0 rgba(27,31,36,0.04)" },
    dangerBtn: { backgroundColor: "#f6f8fa", color: "#cf222e", border: "1px solid rgba(27,31,36,0.15)", padding: "5px 16px", borderRadius: "6px", fontWeight: "500", fontSize: "14px", cursor: "pointer", boxShadow: "0 1px 0 rgba(27,31,36,0.04)" },
    miniBtn: { padding: "4px 10px", borderRadius: "6px", border: "1px solid rgba(27,31,36,0.15)", background: "#ffffff", cursor: "pointer", fontSize: "12px", fontWeight: "600", marginRight: "6px", color: "#24292f", boxShadow: "0 1px 0 rgba(27,31,36,0.04)" },
    tabBar: { backgroundColor: "#ffffff", borderBottom: "1px solid #d0d7de", padding: "0 32px", display: "flex", gap: "24px" },
    tabBtn: (active) => ({ padding: "12px 0", background: "transparent", border: "none", borderBottom: active ? "2px solid #fd8c73" : "2px solid transparent", fontWeight: active ? "600" : "400", color: active ? "#24292f" : "#57606a", cursor: "pointer", fontSize: "14px" }),
    counter: { backgroundColor: "rgba(175,184,193,0.2)", color: "#24292f", borderRadius: "20px", padding: "2px 6px", fontSize: "11px", fontWeight: "600", marginLeft: "6px" },
    container: { maxWidth: "1200px", margin: "24px auto", padding: "0 24px" },
    splitViewContainer: { display: "flex", height: "calc(100vh - 200px)", border: "1px solid #d0d7de", borderRadius: "6px", backgroundColor: "#ffffff", overflow: "hidden" },
    sidebar: { width: "280px", borderRight: "1px solid #d0d7de", display: "flex", flexDirection: "column", backgroundColor: "#f6f8fa" },
    sidebarItem: (active) => ({ padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #d0d7de", display: "flex", alignItems: "center", gap: "10px", backgroundColor: active ? "#ffffff" : "transparent", borderLeft: active ? "3px solid #fd8c73" : "3px solid transparent" }),
    mainContent: { flex: 1, display: "flex", flexDirection: "column" },
    chatHeader: { padding: "12px 20px", borderBottom: "1px solid #d0d7de", backgroundColor: "#f6f8fa", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px" },
    chatMessages: { flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", backgroundColor: "#ffffff" },
    bubble: (isMe) => ({ maxWidth: "70%", padding: "8px 14px", borderRadius: "6px", fontSize: "14px", lineHeight: "1.5", alignSelf: isMe ? "flex-end" : "flex-start", backgroundColor: isMe ? "#ddf4ff" : "#f6f8fa", color: "#24292f", border: isMe ? "1px solid #54aeff" : "1px solid #d0d7de" }),
    inputArea: { padding: "16px", borderTop: "1px solid #d0d7de", backgroundColor: "#ffffff", display: "flex", gap: "10px", alignItems: "center" },
    filePreview: { display: "flex", alignItems: "center", gap: "8px", padding: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", fontSize: "12px", color: "#166534", marginBottom: "8px" },
    teamHeader: { padding: "20px", borderBottom: "1px solid #d0d7de", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f6f8fa" },
    teamSection: { padding: "20px", borderBottom: "1px solid #d0d7de" },
    taskItem: { display: "flex", justifyContent: "space-between", padding: "12px", background: "#ffffff", borderRadius: "6px", marginBottom: "8px", border: "1px solid #d0d7de", alignItems: "center" },
    memberTag: { display: "inline-flex", alignItems: "center", padding: "2px 10px", background: "#ddf4ff", borderRadius: "20px", fontSize: "12px", marginRight: "8px", border: "1px solid #54aeff", color: "#0969da" },
    statsGrid: { display: "flex", gap: "16px", marginBottom: "24px" },
    statBox: { backgroundColor: "#ffffff", border: "1px solid #d0d7de", borderRadius: "6px", padding: "16px", flex: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" },
    statLabel: { fontSize: "12px", color: "#57606a", fontWeight: "600" },
    statValue: { fontSize: "24px", fontWeight: "300", marginTop: "4px" },
    tableCard: { border: "1px solid #d0d7de", borderRadius: "6px", overflow: "hidden", backgroundColor: "#ffffff" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
    th: { textAlign: "left", padding: "12px 16px", backgroundColor: "#f6f8fa", borderBottom: "1px solid #d0d7de", color: "#24292f", fontWeight: "600", fontSize: "13px" },
    td: { padding: "12px 16px", borderBottom: "1px solid #d0d7de", verticalAlign: "middle" },
    formInput: { width: "100%", padding: "6px 12px", borderRadius: "6px", border: "1px solid #d0d7de", fontSize: "14px", marginTop: "4px", boxSizing: "border-box", background: "#f6f8fa" },
    modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 },
    modalContent: { backgroundColor: "#ffffff", borderRadius: "6px", width: "650px", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 24px rgba(140,149,159,0.2)" },
    calendarGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginTop: "16px" },
    calendarHeader: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", textAlign: "center", fontWeight: "600", fontSize: "12px", color: "#57606a", marginBottom: "8px" },
    dayCell: (status) => ({ height: "80px", border: "1px solid #d0d7de", borderRadius: "6px", padding: "6px", fontSize: "13px", fontWeight: "500", backgroundColor: status === "Present" ? "#dafbe1" : status === "Absent" || status === "Late" ? "#ffebe9" : "white", color: status === "Present" ? "#1a7f37" : status === "Absent" || status === "Late" ? "#cf222e" : "#24292f", display: "flex", flexDirection: "column", justifyContent: "space-between" }),
    emptyCell: { height: "80px", backgroundColor: "#f6f8fa", borderRadius: "6px", border: "1px dashed #d0d7de" },
    calNav: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", padding: "0 8px" },
    calTitle: { fontSize: "16px", fontWeight: "600" },
    calBtn: { background: "none", border: "1px solid #d0d7de", borderRadius: "4px", padding: "4px 12px", cursor: "pointer", fontWeight: "bold" },
  };

  return (
    <div style={styles.page}>
      <style>{`body { margin: 0; padding: 0; background-color: #f6f8fa; } * { box-sizing: border-box; }`}</style>
      
      {/* HEADER */}
      <div style={styles.header}>
        <div style={{ fontFamily: '"Inter", sans-serif', fontWeight: 500, color: '#ffffff', fontSize: '20px', lineHeight: '1' }}>DASHBOARD <span style={{fontSize: '14px', opacity: 0.7, marginLeft: "10px", fontWeight: "400"}}>{managerName}</span></div>
        <button onClick={handleLogout} style={{backgroundColor: "#24292f", color: "white", border: "1px solid rgba(240,246,252,0.1)", padding: "5px 12px", borderRadius: "6px", fontWeight: "600", cursor: "pointer", fontSize: "12px"}}>Sign out</button>
      </div>

      {/* TABS */}
      <div style={styles.tabBar}>
        <button style={styles.tabBtn(currentView === "employees" || currentView === "profile")} onClick={() => {setCurrentView("employees"); setSelectedUser(null);}}>Employees <span style={styles.counter}>{totalEmployees}</span></button>
        <button style={styles.tabBtn(currentView === "leaves")} onClick={() => setCurrentView("leaves")}>Requests <span style={styles.counter}>{pendingCount}</span></button>
        <button style={styles.tabBtn(currentView === "teams")} onClick={() => setCurrentView("teams")}>Teams <span style={styles.counter}>{teams.length}</span></button>
        <button style={styles.tabBtn(currentView === "tasks")} onClick={() => setCurrentView("tasks")}>Tasks</button>
        <button style={styles.tabBtn(currentView === "chat")} onClick={() => setCurrentView("chat")}>Messages</button>
        {/* NEW FEATURE TABS */}
        <button style={styles.tabBtn(currentView === "announcements")} onClick={() => setCurrentView("announcements")}>📢 Announcements</button>
        <button style={styles.tabBtn(currentView === "departments")} onClick={() => setCurrentView("departments")}>🏢 Departments</button>
        <button style={styles.tabBtn(currentView === "goals")} onClick={() => setCurrentView("goals")}>🎯 Goals</button>
        <button style={styles.tabBtn(currentView === "analytics")} onClick={() => setCurrentView("analytics")}>📊 Analytics</button>
      </div>

      {/* CONTENT */}
      <div style={styles.container}>
        
        {/* --- VIEW: EMPLOYEES --- */}
        {currentView === "employees" && (
          <>
            <div style={styles.statsGrid}>
              <div style={styles.statBox}><span style={styles.statLabel}>Total Staff</span><div style={styles.statValue}>{totalEmployees}</div></div>
              <div style={styles.statBox}><span style={styles.statLabel}>Requests</span><div style={{...styles.statValue, color: "#9a6700"}}>{pendingCount}</div></div>
            </div>
            <div style={{display:"flex", justifyContent:"space-between", marginBottom:"16px"}}>
              <input placeholder="Find an employee..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{...styles.formInput, width:"300px", marginTop:0, backgroundColor: "#ffffff"}} />
              <button onClick={openAddModal} style={styles.primaryBtn}>New Employee</button>
            </div>
            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Name</th><th style={styles.th}>Role / Dept</th><th style={styles.th}>Contact</th><th style={{...styles.th, textAlign:"right"}}>Actions</th></tr></thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u._id} style={{backgroundColor:"#fff", borderBottom: "1px solid #e1e4e8"}}>
                      <td style={styles.td}><div style={{display:"flex", alignItems:"center", gap:"10px"}}><img src={`${API}/users/${u._id}/photo?t=${Date.now()}`} style={{width:"32px", height:"32px", borderRadius:"50%", border: "1px solid #d0d7de"}} onError={(e)=>e.target.style.display='none'} /><div><div style={{fontWeight:"600"}}>{u.name}</div><div style={{fontSize:"12px", color:"#57606a"}}>{u.customId}</div></div></div></td>
                      <td style={styles.td}>{u.designation} <span style={{color:"#57606a"}}>• {u.department}</span></td>
                      <td style={styles.td}>{u.email}</td>
                      <td style={{...styles.td, textAlign:"right"}}>
                        <button style={styles.miniBtn} onClick={() => { setSelectedUser(u); loadUserTasks(u._id); setCurrentView("profile"); }}>View</button>
                        <button style={styles.miniBtn} onClick={() => openEditModal(u)}>Edit</button>
                        <button style={{...styles.miniBtn, background: "#f0fdf4", color: "#1a7f37", borderColor: "rgba(26,127,55,0.2)"}} onClick={() => openAssignTaskModal(u)}>+ Task</button>
                        <button 
                            style={{...styles.miniBtn, color: "#cf222e", borderColor: "rgba(207,34,46,0.2)", background: "#fff5f5"}} 
                            onClick={() => handleDelete(u._id)}
                            disabled={actionLoading.id === u._id}
                        >
                            {actionLoading.id === u._id && actionLoading.action === "delete" ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* --- VIEW: LEAVES --- */}
        {currentView === "leaves" && (
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>Employee</th><th style={styles.th}>Type</th><th style={styles.th}>Dates</th><th style={styles.th}>Status</th><th style={{...styles.th, textAlign:"right"}}>Actions</th></tr></thead>
              <tbody>
                {allLeaves.map((req, i) => (
                  <tr key={i} style={{backgroundColor:"white", borderBottom: "1px solid #e1e4e8"}}>
                    <td style={styles.td}><b>{req.userName}</b></td>
                    <td style={styles.td}>{req.leaveType}</td>
                    <td style={styles.td}>{new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</td>
                    <td style={styles.td}>{req.status}</td>
                    <td style={{...styles.td, textAlign:"right"}}>
                        <button 
                            onClick={() => handleLeaveAction(req.userId, req._id, "Approved")} 
                            style={{...styles.miniBtn, color: "#1a7f37"}}
                            disabled={actionLoading.id === req._id}
                        >
                            {actionLoading.id === req._id && actionLoading.action === "Approved" ? "Approving..." : "Approve"}
                        </button>
                        <button 
                            onClick={() => handleLeaveAction(req.userId, req._id, "Rejected")} 
                            style={{...styles.miniBtn, color: "#cf222e"}}
                            disabled={actionLoading.id === req._id}
                        >
                            {actionLoading.id === req._id && actionLoading.action === "Rejected" ? "Rejecting..." : "Reject"}
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- VIEW: GLOBAL TASKS --- */}
        {currentView === "tasks" && (
          <div style={styles.tableCard}>
            <div style={{padding:"16px", borderBottom:"1px solid #d0d7de", backgroundColor:"#f6f8fa", fontWeight:"600"}}>All Assigned Tasks</div>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>Employee</th><th style={styles.th}>Task</th><th style={styles.th}>Due Date</th><th style={styles.th}>Status</th><th style={{...styles.th, textAlign:"right"}}>Actions</th></tr></thead>
              <tbody>
                {allTasksList.length === 0 && <tr><td colSpan="5" style={{padding:"40px", textAlign:"center", color: "#57606a"}}>No active tasks assigned.</td></tr>}
                {allTasksList.map((t) => (
                  <tr key={t.id} style={{backgroundColor:"white", borderBottom: "1px solid #e1e4e8"}}>
                    <td style={styles.td}>
                        <div style={{display:"flex", alignItems:"center", gap:"8px"}}>
                            <img src={`${API}/users/${t.userId}/photo?t=${Date.now()}`} style={{width:"24px", height:"24px", borderRadius:"50%"}} onError={(e)=>e.target.style.display='none'} />
                            <b>{t.userName}</b>
                        </div>
                    </td>
                    <td style={styles.td}>{t.description}</td>
                    <td style={styles.td}>{t.deadline}</td>
                    <td style={styles.td}>
                        <span style={{padding:"2px 8px", borderRadius:"12px", background: t.status === "Pending" ? "#fff8c5" : "#dafbe1", color: t.status === "Pending" ? "#9a6700" : "#1a7f37", fontSize:"12px", fontWeight:"600"}}>{t.status}</span>
                    </td>
                    <td style={{...styles.td, textAlign:"right"}}>
                        <button onClick={() => handleDeleteGlobalTask(t.userId, t.id)} style={{...styles.miniBtn, color: "#cf222e"}}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- VIEW: TEAMS --- */}
        {currentView === "teams" && (
          <div style={styles.splitViewContainer}>
            <div style={styles.sidebar}>
              <div style={{padding:"16px", borderBottom:"1px solid #d0d7de", display:"flex", justifyContent:"space-between", alignItems:"center"}}><span style={{fontWeight:"600", color:"#57606a"}}>Your Teams</span><button onClick={() => setIsTeamModalOpen(true)} style={{background:"none", border:"none", color:"#0969da", fontWeight:"bold", cursor:"pointer", fontSize:"18px"}}>+</button></div>
              <div style={{overflowY:"auto", flex:1}}>
                {teams.length === 0 && <div style={{padding:"20px", color:"#9ca3af", textAlign:"center", fontSize:"13px"}}>No teams yet</div>}
                {teams.map(t => (<div key={t.id} style={styles.sidebarItem(selectedTeam && selectedTeam.id === t.id)} onClick={() => { setSelectedTeam(t); setTeamViewMode("tasks"); }}><div style={{width:"32px", height:"32px", borderRadius:"6px", background:"#ddf4ff", color:"#0969da", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"bold", fontSize:"12px"}}>{t.name.substring(0,2).toUpperCase()}</div><div><div style={{fontSize:"13px", fontWeight:"600"}}>{t.name}</div><div style={{fontSize:"11px", color:"#57606a"}}>{t.members.length} members</div></div></div>))}
              </div>
            </div>
            <div style={styles.mainContent}>
              {selectedTeam ? (
                <>
                  <div style={styles.teamHeader}>
                    <div><h2 style={{margin:"0 0 5px 0", fontSize:"18px"}}>{selectedTeam.name}</h2><p style={{margin:0, color:"#57606a", fontSize:"13px"}}>{selectedTeam.description || "No description provided."}</p></div>
                    <div style={{display:"flex", gap:"10px"}}>
                        <button onClick={() => setTeamViewMode("tasks")} style={teamViewMode==="tasks" ? styles.primaryBtn : styles.defaultBtn}>Manage</button>
                        <button onClick={() => setTeamViewMode("chat")} style={teamViewMode==="chat" ? styles.primaryBtn : styles.defaultBtn}>Team Chat</button>
                        <button onClick={() => handleDeleteTeam(selectedTeam.id)} style={styles.dangerBtn}>Delete</button>
                    </div>
                  </div>
                  {teamViewMode === "tasks" ? (
                      <>
                        <div style={styles.teamSection}>
                            <h4 style={{marginTop:0, marginBottom:"10px"}}>Team Members</h4>
                            <div style={{display:"flex", gap:"10px", marginBottom:"15px"}}><select style={{...styles.formInput, width:"auto", marginTop:0, background: "white"}} value={selectedMemberToAdd} onChange={(e) => setSelectedMemberToAdd(e.target.value)}><option value="">Select Employee...</option>{users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.designation})</option>)}</select><button onClick={handleAddMember} style={styles.primaryBtn}>Add</button></div>
                            <div>{selectedTeam.members.length === 0 && <span style={{color:"#9ca3af", fontSize:"13px"}}>No members added.</span>}{selectedTeam.members.map(memId => { const user = users.find(u => u._id === memId); return user ? (<span key={memId} style={styles.memberTag}>{user.name} <button onClick={() => handleRemoveMember(memId)} style={{background:"none", border:"none", marginLeft:"5px", cursor:"pointer", color:"#0969da", fontWeight:"bold"}}>×</button></span>) : null; })}</div>
                        </div>
                        <div style={{...styles.teamSection, borderBottom:"none", flex:1, overflowY:"auto"}}>
                            <h4 style={{marginTop:0, marginBottom:"10px"}}>Assigned Tasks</h4>
                            <form onSubmit={handleAddTask} style={{display:"flex", gap:"10px", marginBottom:"15px"}}><input placeholder="New task..." value={newTask} onChange={(e) => setNewTask(e.target.value)} style={{...styles.formInput, marginTop:0, background: "white"}} /><button type="submit" style={styles.primaryBtn}>Assign</button></form>
                            <div>{selectedTeam.tasks.length === 0 && <span style={{color:"#9ca3af", fontSize:"13px"}}>No tasks assigned.</span>}{selectedTeam.tasks.map(task => (<div key={task.id} style={styles.taskItem}><span style={{fontSize:"13px", textDecoration: task.status === "Completed" ? "line-through" : "none", color: task.status === "Completed" ? "#8c959f" : "#24292f"}}>{task.text}</span><button onClick={() => handleDeleteTask(task.id)} style={{background:"none", border:"none", color:"#cf222e", cursor:"pointer", fontSize:"16px"}}>×</button></div>))}</div>
                        </div>
                      </>
                  ) : (
                      <>
                        <div style={styles.chatMessages}>{teamMessages.length === 0 && <div style={{textAlign:"center", color:"#8c959f", fontSize:"13px", marginTop:"40px"}}>No team messages yet.</div>}{teamMessages.map((msg, idx) => (<div key={idx} style={styles.bubble(msg.sender === "Manager")}>{msg.file && (<div style={{marginBottom: "5px"}}>{msg.file.type.startsWith("image/") ? <img src={msg.file.data} alt="attachment" style={{maxWidth: "100%", borderRadius: "8px", maxHeight: "200px"}} /> : <div style={{background:"rgba(0,0,0,0.1)", padding:"8px", borderRadius:"4px", fontSize:"12px"}}>📎 {msg.file.name}</div>}</div>)}{msg.text}<div style={{fontSize:"10px", opacity:0.7, marginTop:"4px", textAlign:"right"}}>{msg.time}</div></div>))}<div ref={teamChatEndRef}></div></div><div style={styles.inputArea}>{attachment && <div style={styles.filePreview}><span>📎 {attachment.name}</span><button onClick={() => setAttachment(null)} style={{background:"none", border:"none", cursor:"pointer", color:"#ef4444", fontWeight:"bold"}}>✕</button></div>}<label style={{cursor:"pointer", padding:"8px", color:"#6b7280", fontSize:"20px"}}>📎 <input type="file" style={{display:"none"}} onChange={handleFileSelect} /></label><form onSubmit={handleSendTeamMessage} style={{display:"flex", flex:1, gap:"10px"}}><input style={{...styles.formInput, marginTop:0, background: "white"}} placeholder="Message team..." value={teamChatInput} onChange={(e) => setTeamChatInput(e.target.value)} /><button type="submit" style={styles.primaryBtn}>Send</button></form></div></>
                  )}
                </>
              ) : ( <div style={{display:"flex", alignItems:"center", justifyContent:"center", height:"100%", color:"#57606a"}}>Select a team to manage or create a new one.</div> )}
            </div>
          </div>
        )}

        {/* --- VIEW: MESSAGES --- */}
        {currentView === "chat" && (
          <div style={styles.splitViewContainer}>
            <div style={styles.sidebar}>
              <div style={{padding:"16px", fontWeight:"600", fontSize:"13px", color:"#57606a", borderBottom:"1px solid #d0d7de"}}>Conversations</div>
              <div style={{overflowY:"auto", flex:1}}>{users.map(u => (<div key={u._id} style={styles.sidebarItem(chatRecipient && chatRecipient._id === u._id)} onClick={() => setChatRecipient(u)}><img src={`${API}/users/${u._id}/photo?t=${Date.now()}`} style={{width:"32px", height:"32px", borderRadius:"50%", border: "1px solid #d0d7de"}} onError={(e)=>e.target.style.display='none'} /><div><div style={{fontSize:"13px", fontWeight:"600"}}>{u.name}</div><div style={{fontSize:"11px", color:"#57606a"}}>{u.designation}</div></div></div>))}</div>
            </div>
            <div style={styles.mainContent}>
              {chatRecipient ? (<><div style={styles.chatHeader}><img src={`${API}/users/${chatRecipient._id}/photo?t=${Date.now()}`} style={{width:"24px", height:"24px", borderRadius:"50%"}} onError={(e)=>e.target.style.display='none'} />{chatRecipient.name}</div><div style={styles.chatMessages}>{currentChatHistory.length === 0 && <div style={{textAlign:"center", color:"#8c959f", fontSize:"13px", marginTop:"40px"}}>Start a conversation with {chatRecipient.name}</div>}{currentChatHistory.map((msg, idx) => (<div key={idx} style={styles.bubble(msg.sender === "Manager")}>{msg.file && (<div style={{marginBottom: "5px"}}>{msg.file.type.startsWith("image/") ? <img src={msg.file.data} alt="attachment" style={{maxWidth: "100%", borderRadius: "8px", maxHeight: "200px"}} /> : <div style={{background:"rgba(0,0,0,0.1)", padding:"8px", borderRadius:"4px", fontSize:"12px"}}>📎 {msg.file.name}</div>}</div>)}{msg.text}<div style={{fontSize:"10px", opacity:0.7, marginTop:"4px", textAlign:"right"}}>{msg.time}</div></div>))}<div ref={chatEndRef}></div></div><div style={styles.inputArea}>{attachment && <div style={styles.filePreview}><span>📎 {attachment.name}</span><button onClick={() => setAttachment(null)} style={{background:"none", border:"none", cursor:"pointer", color:"#ef4444", fontWeight:"bold"}}>✕</button></div>}<label style={{cursor:"pointer", padding:"8px", color:"#6b7280", fontSize:"20px"}}>📎 <input type="file" style={{display:"none"}} onChange={handleFileSelect} /></label><form onSubmit={handleSendMessage} style={{display:"flex", flex:1, gap:"10px"}}><input style={{...styles.formInput, marginTop:0, background: "white"}} placeholder="Type a message..." value={messageInput} onChange={(e) => setMessageInput(e.target.value)} /><button type="submit" style={styles.primaryBtn}>Send</button></form></div></>) : (<div style={{display:"flex", alignItems:"center", justifyContent:"center", height:"100%", color:"#57606a"}}>Select an employee to start chatting</div>)}
            </div>
          </div>
        )}

        {/* --- VIEW: PROFILE --- */}
        {currentView === "profile" && selectedUser && (
          <div>
            <button onClick={() => setCurrentView("employees")} style={{...styles.defaultBtn, marginBottom:"16px"}}>← Back</button>
            <div style={{display:"grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px"}}>
                {/* MAIN PROFILE CARD */}
                <div style={{backgroundColor:"white", border:"1px solid #d0d7de", borderRadius:"6px", padding:"24px", textAlign:"center"}}>
                    <img src={`${API}/users/${selectedUser._id}/photo?t=${Date.now()}`} style={{width:"120px", height:"120px", borderRadius:"50%", border:"1px solid #d0d7de", marginBottom:"16px"}} onError={(e)=>e.target.style.display='none'} />
                    <h2 style={{margin:"0 0 4px 0", fontSize:"22px", fontWeight:"600"}}>{selectedUser.name}</h2>
                    <p style={{color:"#57606a", fontSize:"14px", margin:"0 0 8px 0"}}>{selectedUser.designation}</p>
                    <p style={{color:"#8c959f", fontSize:"12px", margin:"0 0 24px 0"}}>📍 {selectedUser.department || "Not Assigned"}</p>
                    <button onClick={() => openEditModal(selectedUser)} style={{...styles.primaryBtn, width:"100%"}}>Edit Employee</button>
                </div>

                {/* DETAILED INFO CARDS */}
                <div style={{display:"flex", flexDirection:"column", gap:"16px"}}>
                    {/* Contact Information */}
                    <div style={{backgroundColor:"white", border:"1px solid #d0d7de", borderRadius:"6px", padding:"16px"}}>
                        <h4 style={{margin:"0 0 12px 0", fontSize:"14px", fontWeight:"600", color:"#24292f"}}>📞 Contact Information</h4>
                        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", fontSize:"13px"}}>
                            <div>
                                <p style={{color:"#57606a", margin:"0 0 4px 0", fontWeight:"500"}}>Mobile</p>
                                <p style={{margin:0, color:"#24292f", fontFamily:"monospace"}}>{selectedUser.mobile || "Not Added"}</p>
                            </div>
                            <div>
                                <p style={{color:"#57606a", margin:"0 0 4px 0", fontWeight:"500"}}>Email</p>
                                <p style={{margin:0, color:"#0969da", wordBreak:"break-all"}}>{selectedUser.email}</p>
                            </div>
                            <div style={{gridColumn:"1 / -1"}}>
                                <p style={{color:"#57606a", margin:"0 0 4px 0", fontWeight:"500"}}>Personal Email</p>
                                <p style={{margin:0, color:"#0969da", wordBreak:"break-all"}}>{selectedUser.personalEmail || "Not Added"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Personal Information */}
                    <div style={{backgroundColor:"white", border:"1px solid #d0d7de", borderRadius:"6px", padding:"16px"}}>
                        <h4 style={{margin:"0 0 12px 0", fontSize:"14px", fontWeight:"600", color:"#24292f"}}>👤 Personal Information</h4>
                        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", fontSize:"13px"}}>
                            <div>
                                <p style={{color:"#57606a", margin:"0 0 4px 0", fontWeight:"500"}}>Gender</p>
                                <p style={{margin:0, color:"#24292f"}}>{selectedUser.gender || "Not Specified"}</p>
                            </div>
                            <div>
                                <p style={{color:"#57606a", margin:"0 0 4px 0", fontWeight:"500"}}>Employee ID</p>
                                <p style={{margin:0, color:"#24292f", fontFamily:"monospace", fontWeight:"500"}}>{selectedUser.customId}</p>
                            </div>
                            <div style={{gridColumn:"1 / -1"}}>
                                <p style={{color:"#57606a", margin:"0 0 4px 0", fontWeight:"500"}}>Address</p>
                                <p style={{margin:0, color:"#24292f", whiteSpace:"pre-wrap"}}>{selectedUser.address || "Not Added"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Employment Information */}
                    <div style={{backgroundColor:"white", border:"1px solid #d0d7de", borderRadius:"6px", padding:"16px"}}>
                        <h4 style={{margin:"0 0 12px 0", fontSize:"14px", fontWeight:"600", color:"#24292f"}}>💼 Employment Information</h4>
                        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", fontSize:"13px"}}>
                            <div>
                                <p style={{color:"#57606a", margin:"0 0 4px 0", fontWeight:"500"}}>Employment Type</p>
                                <p style={{margin:0, color:"#24292f"}}>{selectedUser.employeeType || "Not Specified"}</p>
                            </div>
                            <div>
                                <p style={{color:"#57606a", margin:"0 0 4px 0", fontWeight:"500"}}>Status</p>
                                <p style={{margin:0, padding:"2px 8px", borderRadius:"12px", display:"inline-block", backgroundColor: selectedUser.employmentStatus === "Active" ? "#dafbe1" : "#ffebe9", color: selectedUser.employmentStatus === "Active" ? "#1a7f37" : "#cf222e", fontWeight:"600", fontSize:"12px"}}>{selectedUser.employmentStatus || "Active"}</p>
                            </div>
                            <div>
                                <p style={{color:"#57606a", margin:"0 0 4px 0", fontWeight:"500"}}>Shift Type</p>
                                <p style={{margin:0, color:"#24292f"}}>{selectedUser.shiftType || "Day"}</p>
                            </div>
                            <div>
                                <p style={{color:"#57606a", margin:"0 0 4px 0", fontWeight:"500"}}>Work Location</p>
                                <p style={{margin:0, color:"#24292f"}}>{selectedUser.workLocation || "Office"}</p>
                            </div>
                            <div>
                                <p style={{color:"#57606a", margin:"0 0 4px 0", fontWeight:"500"}}>Joining Date</p>
                                <p style={{margin:0, color:"#24292f"}}>{selectedUser.joiningDate ? new Date(selectedUser.joiningDate).toLocaleDateString() : "Not Set"}</p>
                            </div>
                            <div>
                                <p style={{color:"#57606a", margin:"0 0 4px 0", fontWeight:"500"}}>Salary</p>
                                <p style={{margin:0, color:"#24292f", fontFamily:"monospace"}}>${selectedUser.salary ? parseFloat(selectedUser.salary).toLocaleString() : "Not Set"}</p>
                            </div>
                            {selectedUser.workingHours && (
                                <div style={{gridColumn:"1 / -1"}}>
                                    <p style={{color:"#57606a", margin:"0 0 4px 0", fontWeight:"500"}}>Working Hours</p>
                                    <p style={{margin:0, color:"#24292f"}}>{selectedUser.workingHours}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Leave Information */}
                    <div style={{backgroundColor:"white", border:"1px solid #d0d7de", borderRadius:"6px", padding:"16px"}}>
                        <h4 style={{margin:"0 0 12px 0", fontSize:"14px", fontWeight:"600", color:"#24292f"}}>🏖️ Leave Information</h4>
                        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", fontSize:"13px"}}>
                            <div>
                                <p style={{color:"#57606a", margin:"0 0 4px 0", fontWeight:"500"}}>Total Leaves</p>
                                <p style={{margin:0, color:"#24292f", fontSize:"16px", fontWeight:"600"}}>{selectedUser.leaves?.total || 24}</p>
                            </div>
                            <div>
                                <p style={{color:"#57606a", margin:"0 0 4px 0", fontWeight:"500"}}>Remaining </p>
                                <p style={{margin:0, color:"#2da44e", fontSize:"16px", fontWeight:"600"}}>{selectedUser.leaves?.remaining || 24}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ASSIGNED TASKS */}
                <div style={{backgroundColor: "white", border: "1px solid #d0d7de", borderRadius: "6px", padding: "16px", gridColumn:"1 / -1"}}>
                    <div style={{fontWeight:"600", marginBottom:"15px", borderBottom:"1px solid #f0f0f0", paddingBottom:"10px", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                        <span>📋 Assigned Tasks</span>
                        <button onClick={() => openAssignTaskModal(selectedUser)} style={{...styles.miniBtn, background:"#2da44e", color:"white", border:"none"}}>+ Assign Task</button>
                    </div>
                    {userTasks.length === 0 && <div style={{color:"#9ca3af", fontSize:"13px", fontStyle:"italic", padding:"10px", textAlign:"center"}}>No tasks assigned yet</div>}
                    <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(250px, 1fr))", gap:"12px"}}>
                        {userTasks.map(task => (
                            <div key={task.id} style={{display:"flex", flexDirection:"column", padding:"12px", border:"1px solid #d0d7de", borderRadius:"6px", backgroundColor:"#f6f8fa", fontSize:"13px"}}>
                                <div style={{fontWeight:"600", marginBottom:"8px", color:"#24292f"}}>{task.description}</div>
                                <div style={{fontSize:"12px", color:"#57606a", marginBottom:"8px"}}>📅 Due: {task.deadline || "No Date"}</div>
                                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                                    <span style={{padding:"2px 8px", borderRadius:"12px", background: task.status === "Pending" ? "#fff8c5" : "#dafbe1", color: task.status === "Pending" ? "#9a6700" : "#1a7f37", fontSize:"11px", fontWeight:"600"}}>{task.status}</span>
                                    <button onClick={() => handleDeleteUserTask(task.id)} style={{color:"#cf222e", background:"none", border:"none", cursor:"pointer", fontWeight:"bold", fontSize:"16px"}}>✕</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Attendance Calendar */}
                <div style={{backgroundColor: "white", border: "1px solid #d0d7de", borderRadius: "6px", padding: "16px", gridColumn:"1 / -1"}}>
                    <h4 style={{margin:"0 0 16px 0", fontSize:"14px", fontWeight:"600"}}>📅 Attendance Calendar</h4>
                    <div style={styles.calNav}><button onClick={() => changeMonth(-1)} style={styles.calBtn}>←</button><span style={styles.calTitle}>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span><button onClick={() => changeMonth(1)} style={styles.calBtn}>→</button></div>
                    <div style={styles.calendarHeader}>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}</div>
                    <div style={styles.calendarGrid}>
                        {Array.from({ length: getFirstDayOfMonth(currentDate) }).map((_, i) => (<div key={`empty-${i}`} style={styles.emptyCell}></div>))}
                        {Array.from({ length: getDaysInMonth(currentDate) }).map((_, i) => { 
                            const day = i + 1; const record = getAttendanceForDate(day); 
                            return (<div key={day} style={styles.dayCell(record ? record.status : null)}><span>{day}</span>{record && <span style={{fontSize:"10px", textAlign:"center", opacity:0.8}}>{record.status === "Present" ? `${record.loginTime} - ${record.logoutTime}` : record.status}</span>}</div>); 
                        })}
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* --- NEW FEATURE VIEWS --- */}
        {(currentView === "announcements" || currentView === "departments" || currentView === "goals" || currentView === "analytics") && (
          <FeaturesPanel 
            API={API} 
            currentView={currentView} 
            setCurrentView={setCurrentView}
            userId={JSON.parse(localStorage.getItem("user"))?.id}
            managerRole={true}
          />
        )}
      </div>

      {isTeamModalOpen && (
        <div style={styles.modalOverlay}><div style={{...styles.modalContent, width: "400px"}}><div style={{padding:"16px", borderBottom:"1px solid #d0d7de", display:"flex", justifyContent:"space-between", alignItems:"center", backgroundColor:"#f6f8fa"}}><h3 style={{margin:0, fontSize:"14px"}}>Create New Team</h3><button onClick={() => setIsTeamModalOpen(false)} style={{background:"none", border:"none", fontSize:"18px", cursor:"pointer", color:"#57606a"}}>✕</button></div><div style={{padding:"24px"}}><form onSubmit={handleCreateTeam} style={{display:"flex", flexDirection:"column", gap:"16px"}}><input placeholder="Team Name" value={teamForm.name} onChange={(e) => setTeamForm({...teamForm, name: e.target.value})} style={styles.formInput} required /><input placeholder="Description (Optional)" value={teamForm.description} onChange={(e) => setTeamForm({...teamForm, description: e.target.value})} style={styles.formInput} /><button type="submit" style={styles.primaryBtn}>Create Team</button></form></div></div></div>
      )}
      
      {/* TASK ASSIGNMENT MODAL */}
      {isTaskModalOpen && (
        <div style={styles.modalOverlay}>
            <div style={{...styles.modalContent, width: "400px"}}>
                <div style={{padding:"16px", borderBottom:"1px solid #d0d7de", display:"flex", justifyContent:"space-between", alignItems:"center", backgroundColor:"#f6f8fa"}}>
                    <h3 style={{margin:0, fontSize:"14px"}}>Assign Task to {taskTargetUser?.name}</h3>
                    <button onClick={() => setIsTaskModalOpen(false)} style={{background:"none", border:"none", fontSize:"18px", cursor:"pointer", color:"#57606a"}}>✕</button>
                </div>
                <div style={{padding:"24px"}}>
                    <form onSubmit={handleAssignTaskSubmit} style={{display:"flex", flexDirection:"column", gap:"16px"}}>
                        <input placeholder="Task Description" value={individualTaskForm.description} onChange={(e) => setIndividualTaskForm({...individualTaskForm, description: e.target.value})} style={styles.formInput} required />
                        <label style={{fontSize:"12px", color:"#57606a", marginBottom:"-10px"}}>Due Date:</label>
                        <input type="date" value={individualTaskForm.deadline} onChange={(e) => setIndividualTaskForm({...individualTaskForm, deadline: e.target.value})} style={styles.formInput} required />
                        <button type="submit" style={styles.primaryBtn}>Assign Task</button>
                    </form>
                </div>
            </div>
        </div>
      )}

      {/* NEW/EDIT EMPLOYEE MODAL */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <div style={{padding:"16px", borderBottom:"1px solid #d0d7de", display:"flex", justifyContent:"space-between", alignItems:"center", backgroundColor:"#f6f8fa"}}>
                    <h3 style={{margin:0, fontSize:"14px"}}>{editingId ? "Edit Employee" : "New Employee"}</h3>
                    <button onClick={() => setIsModalOpen(false)} style={{background:"none", border:"none", fontSize:"18px", cursor:"pointer", color:"#57606a"}}>✕</button>
                </div>
                <div style={{display:"flex", borderBottom:"1px solid #d0d7de", padding:"0 16px"}}>
                    {["identity", "personal", "work", "leaves"].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} style={{padding:"12px", border:"none", borderBottom: activeTab===tab ? "2px solid #fd8c73" : "none", background:"none", cursor:"pointer", fontWeight: activeTab===tab?"600":"400", textTransform:"capitalize", fontSize:"13px"}}>{tab}</button>
                    ))}
                </div>
                <div style={{padding:"24px", overflowY:"auto"}}>
                    <form onSubmit={handleSubmit} style={{display:"flex", flexDirection:"column", gap:"16px"}}>
                        {activeTab === "identity" && <><input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} style={styles.formInput} required /><input name="email" placeholder="Email" value={form.email} onChange={handleChange} style={styles.formInput} required /><input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} style={styles.formInput} /><input type="file" onChange={handleFileChange} /></>}
                        {activeTab === "personal" && <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px"}}>
                            <input name="mobile" placeholder="Mobile Number" value={form.mobile} onChange={handleChange} style={styles.formInput} />
                            <input name="personalEmail" placeholder="Personal Email" value={form.personalEmail} onChange={handleChange} style={styles.formInput} />
                            <select name="gender" value={form.gender || ""} onChange={handleChange} style={styles.formInput}><option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option><option value="Prefer not to say">Prefer not to say</option></select>
                            <input name="employeeType" placeholder="Employment Type" value={form.employeeType} onChange={handleChange} style={styles.formInput} />
                            <input name="workLocation" placeholder="Work Location" value={form.workLocation} onChange={handleChange} style={styles.formInput} />
                            <input name="shiftType" placeholder="Shift Type" value={form.shiftType} onChange={handleChange} style={styles.formInput} />
                            <textarea name="address" placeholder="Address" value={form.address} onChange={handleChange} style={{...styles.formInput, minHeight:"60px", gridColumn:"1 / -1"}} />
                            <input name="workingHours" placeholder="Working Hours (e.g., 09:00 AM - 06:00 PM)" value={form.workingHours} onChange={handleChange} style={{...styles.formInput, gridColumn:"1 / -1"}} />
                        </div>}
                        {activeTab === "work" && <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px"}}>
                            <input name="department" placeholder="Department" value={form.department} onChange={handleChange} style={styles.formInput} />
                            <input name="designation" placeholder="Job Title" value={form.designation} onChange={handleChange} style={styles.formInput} />
                            <input name="salary" placeholder="Salary" type="number" value={form.salary} onChange={handleChange} style={styles.formInput} />
                            <input name="joiningDate" placeholder="Joining Date" type="date" value={form.joiningDate} onChange={handleChange} style={styles.formInput} />
                            <select name="employmentStatus" value={form.employmentStatus || "Active"} onChange={handleChange} style={styles.formInput}><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Terminated">Terminated</option></select>
                        </div>}
                        {activeTab === "leaves" && <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px"}}><input name="totalLeaves" type="number" placeholder="Total Leaves" value={form.totalLeaves} onChange={handleChange} style={styles.formInput} /><input name="remainingLeaves" type="number" placeholder="Remaining" value={form.remainingLeaves} onChange={handleChange} style={styles.formInput} /></div>}
                        <div style={{display:"flex", justifyContent:"flex-end", marginTop:"10px"}}>
                            <button type="submit" style={styles.primaryBtn} disabled={isSaving}>{isSaving ? "Saving..." : "Save Changes"}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;