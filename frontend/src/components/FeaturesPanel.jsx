import { useState, useEffect } from "react";
import axios from "axios";

const FeaturesPanel = ({ API, currentView, setCurrentView, userId, managerRole }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [goals, setGoals] = useState([]);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal States
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);
  const [editingDepartment, setEditingDepartment] = useState(null);
  
  // New Announcement Form
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    priority: "Normal",
    targetDepartment: ""
  });
  
  // New Goal Form
  const [goalForm, setGoalForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    progress: 0
  });

  // Fetch Announcements
  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get(`${API}/announcements`);
      setAnnouncements(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching announcements:", err);
    }
  };

  // Fetch Departments
  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${API}/departments`);
      setDepartments(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  // Fetch Goals
  const fetchGoals = async () => {
    try {
      if (userId) {
        const response = await axios.get(`${API}/goals/${userId}`);
        setGoals(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      console.error("Error fetching goals:", err);
    }
  };

  useEffect(() => {
    if (currentView === "announcements") fetchAnnouncements();
    if (currentView === "departments") fetchDepartments();
    if (currentView === "goals") fetchGoals();
  }, [currentView, userId]);

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      await axios.post(`${API}/announcements`, {
        ...announcementForm,
        author: storedUser.id
      });
      setAnnouncementForm({ title: "", content: "", priority: "Normal", targetDepartment: "" });
      fetchAnnouncements();
      alert("Announcement posted successfully!");
    } catch (err) {
      alert("Failed to post announcement");
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/goals`, {
        ...goalForm,
        employee: userId
      });
      setGoalForm({ title: "", description: "", priority: "Medium", progress: 0 });
      fetchGoals();
      alert("Goal created successfully!");
    } catch (err) {
      alert("Failed to create goal");
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (window.confirm("Delete this announcement?")) {
      try {
        await axios.delete(`${API}/announcements/${id}`);
        fetchAnnouncements();
      } catch (err) {
        alert("Failed to delete announcement");
      }
    }
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setAnnouncementForm({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      targetDepartment: announcement.targetDepartment || ""
    });
  };

  const handleUpdateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/announcements/${editingAnnouncement._id}`, announcementForm);
      setAnnouncementForm({ title: "", content: "", priority: "Normal", targetDepartment: "" });
      setEditingAnnouncement(null);
      fetchAnnouncements();
      alert("Announcement updated successfully!");
    } catch (err) {
      alert("Failed to update announcement");
    }
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setGoalForm({
      title: goal.title,
      description: goal.description,
      priority: goal.priority,
      progress: goal.progress
    });
  };

  const handleUpdateGoal = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/goals/${editingGoal._id}`, goalForm);
      setGoalForm({ title: "", description: "", priority: "Medium", progress: 0 });
      setEditingGoal(null);
      fetchGoals();
      alert("Goal updated successfully!");
    } catch (err) {
      alert("Failed to update goal");
    }
  };

  const handleDeleteGoal = async (id) => {
    if (window.confirm("Delete this goal?")) {
      try {
        await axios.delete(`${API}/goals/${id}`);
        fetchGoals();
      } catch (err) {
        alert("Failed to delete goal");
      }
    }
  };

  const handleEditDepartment = (department) => {
    setEditingDepartment(department);
  };

  const handleUpdateDepartment = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/departments/${editingDepartment._id}`, editingDepartment);
      setEditingDepartment(null);
      fetchDepartments();
      alert("Department updated successfully!");
    } catch (err) {
      alert("Failed to update department");
    }
  };

  const handleDeleteDepartment = async (id) => {
    if (window.confirm("Delete this department?")) {
      try {
        await axios.delete(`${API}/departments/${id}`);
        fetchDepartments();
      } catch (err) {
        alert("Failed to delete department");
      }
    }
  };

  const styles = {
    container: { padding: "24px", maxWidth: "1200px", margin: "0 auto" },
    card: { 
      backgroundColor: "#ffffff", 
      border: "1px solid #d0d7de", 
      borderRadius: "6px", 
      padding: "16px",
      marginBottom: "16px"
    },
    btn: {
      primary: { backgroundColor: "#2da44e", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "500" },
      danger: { backgroundColor: "#f6f8fa", color: "#cf222e", border: "1px solid #cf222e", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
      default: { backgroundColor: "#f6f8fa", color: "#24292f", border: "1px solid #d0d7de", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }
    },
    input: { 
      width: "100%", 
      padding: "8px", 
      borderRadius: "6px", 
      border: "1px solid #d0d7de",
      marginTop: "4px",
      marginBottom: "12px",
      boxSizing: "border-box"
    },
    title: { fontSize: "18px", fontWeight: "600", marginBottom: "16px" },
    label: { fontSize: "12px", fontWeight: "600", color: "#57606a", display: "block" }
  };

  return (
    <div style={styles.container}>
      {/* ANNOUNCEMENTS VIEW */}
      {currentView === "announcements" && (
        <div>
          <h2 style={styles.title}>📢 Company Announcements</h2>
          
          {!editingAnnouncement ? (
            <div style={styles.card}>
              <h3>📝 Post New Announcement</h3>
              <form onSubmit={handlePostAnnouncement}>
                <label style={styles.label}>Title:</label>
                <input 
                  style={styles.input}
                  type="text" 
                  placeholder="Announcement Title"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                  required
                />
                
                <label style={styles.label}>Content:</label>
                <textarea 
                  style={{...styles.input, minHeight: "100px"}}
                  placeholder="Announcement Content"
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({...announcementForm, content: e.target.value})}
                  required
                />
                
                <label style={styles.label}>Priority:</label>
                <select 
                  style={styles.input}
                  value={announcementForm.priority}
                  onChange={(e) => setAnnouncementForm({...announcementForm, priority: e.target.value})}
                >
                  <option>Low</option>
                  <option>Normal</option>
                  <option>High</option>
                </select>
                
                <label style={styles.label}>Target Department:</label>
                <input 
                  style={styles.input}
                  type="text"
                  placeholder="e.g., IT, HR, Sales"
                  value={announcementForm.targetDepartment}
                  onChange={(e) => setAnnouncementForm({...announcementForm, targetDepartment: e.target.value})}
                />
                
                <button type="submit" style={styles.btn.primary}>Post Announcement</button>
              </form>
            </div>
          ) : (
            <div style={styles.card}>
              <h3>✏️ Edit Announcement</h3>
              <form onSubmit={handleUpdateAnnouncement}>
                <label style={styles.label}>Title:</label>
                <input 
                  style={styles.input}
                  type="text" 
                  placeholder="Announcement Title"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                  required
                />
                
                <label style={styles.label}>Content:</label>
                <textarea 
                  style={{...styles.input, minHeight: "100px"}}
                  placeholder="Announcement Content"
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({...announcementForm, content: e.target.value})}
                  required
                />
                
                <label style={styles.label}>Priority:</label>
                <select 
                  style={styles.input}
                  value={announcementForm.priority}
                  onChange={(e) => setAnnouncementForm({...announcementForm, priority: e.target.value})}
                >
                  <option>Low</option>
                  <option>Normal</option>
                  <option>High</option>
                </select>
                
                <label style={styles.label}>Target Department:</label>
                <input 
                  style={styles.input}
                  type="text"
                  placeholder="e.g., IT, HR, Sales"
                  value={announcementForm.targetDepartment}
                  onChange={(e) => setAnnouncementForm({...announcementForm, targetDepartment: e.target.value})}
                />
                
                <div style={{display: "flex", gap: "8px"}}>
                  <button type="submit" style={styles.btn.primary}>Save Changes</button>
                  <button type="button" style={styles.btn.default} onClick={() => {setEditingAnnouncement(null); setAnnouncementForm({title: "", content: "", priority: "Normal", targetDepartment: ""});}}>Cancel</button>
                </div>
              </form>
            </div>
          )}
          
          <div>
            <h3>Recent Announcements</h3>
            {announcements.length === 0 ? (
              <p style={{color: "#57606a"}}>No announcements yet</p>
            ) : (
              announcements.map((ann) => (
                <div key={ann._id} style={styles.card}>
                  <div style={{display: "flex", justifyContent: "space-between", alignItems: "start"}}>
                    <div style={{flex: 1}}>
                      <h4 style={{margin: "0 0 8px 0"}}>{ann.title}</h4>
                      <p style={{margin: "0 0 8px 0", color: "#57606a"}}>{ann.content}</p>
                      <div style={{fontSize: "12px", color: "#8c959f"}}>
                        <span style={{
                          backgroundColor: ann.priority === "High" ? "#ffebe9" : "#f6f8fa",
                          color: ann.priority === "High" ? "#cf222e" : "#24292f",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          marginRight: "8px"
                        }}>
                          {ann.priority}
                        </span>
                        <span>Posted by {ann.author?.name || "Unknown"}</span>
                      </div>
                    </div>
                    {managerRole && (
                      <div style={{display: "flex", gap: "8px"}}>
                        <button 
                          style={styles.btn.default}
                          onClick={() => handleEditAnnouncement(ann)}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          style={styles.btn.danger}
                          onClick={() => handleDeleteAnnouncement(ann._id)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* DEPARTMENTS VIEW */}
      {currentView === "departments" && (
        <div>
          <h2 style={styles.title}>🏢 Departments</h2>
          
          {editingDepartment && managerRole && (
            <div style={styles.card}>
              <h3>✏️ Edit Department</h3>
              <form onSubmit={handleUpdateDepartment}>
                <label style={styles.label}>Department Name:</label>
                <input 
                  style={styles.input}
                  type="text"
                  placeholder="Department Name"
                  value={editingDepartment.name || ""}
                  onChange={(e) => setEditingDepartment({...editingDepartment, name: e.target.value})}
                  required
                />
                
                <label style={styles.label}>Description:</label>
                <textarea 
                  style={{...styles.input, minHeight: "80px"}}
                  placeholder="Department Description"
                  value={editingDepartment.description || ""}
                  onChange={(e) => setEditingDepartment({...editingDepartment, description: e.target.value})}
                />
                
                <label style={styles.label}>Budget:</label>
                <input 
                  style={styles.input}
                  type="number"
                  placeholder="Budget Amount"
                  value={editingDepartment.budget || ""}
                  onChange={(e) => setEditingDepartment({...editingDepartment, budget: parseFloat(e.target.value)})}
                />
                
                <div style={{display: "flex", gap: "8px"}}>
                  <button type="submit" style={styles.btn.primary}>Save Changes</button>
                  <button type="button" style={styles.btn.default} onClick={() => setEditingDepartment(null)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px"}}>
            {departments.length === 0 ? (
              <p style={{color: "#57606a"}}>No departments found</p>
            ) : (
              departments.map((dept) => (
                <div key={dept._id} style={styles.card}>
                  <h4 style={{margin: "0 0 8px 0"}}>{dept.name}</h4>
                  <p style={{margin: "0 0 8px 0", color: "#57606a", fontSize: "14px"}}>{dept.description}</p>
                  <div style={{fontSize: "12px", color: "#8c959f", marginBottom: "12px"}}>
                    <p style={{margin: "4px 0"}}>👤 Head: {dept.head?.name || "Unassigned"}</p>
                    <p style={{margin: "4px 0"}}>💰 Budget: ${dept.budget?.toLocaleString() || "N/A"}</p>
                  </div>
                  {managerRole && (
                    <div style={{display: "flex", gap: "8px"}}>
                      <button 
                        style={styles.btn.default}
                        onClick={() => handleEditDepartment(dept)}
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        style={styles.btn.danger}
                        onClick={() => handleDeleteDepartment(dept._id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* GOALS VIEW */}
      {currentView === "goals" && (
        <div>
          <h2 style={styles.title}>🎯 Employee Goals</h2>
          
          {!editingGoal ? (
            <div style={styles.card}>
              <h3>➕ Create New Goal</h3>
              <form onSubmit={handleCreateGoal}>
                <label style={styles.label}>Goal Title:</label>
                <input 
                  style={styles.input}
                  type="text"
                  placeholder="e.g., Complete Project X"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({...goalForm, title: e.target.value})}
                  required
                />
                
                <label style={styles.label}>Description:</label>
                <textarea 
                  style={{...styles.input, minHeight: "80px"}}
                  placeholder="Goal description"
                  value={goalForm.description}
                  onChange={(e) => setGoalForm({...goalForm, description: e.target.value})}
                />
                
                <label style={styles.label}>Priority:</label>
                <select 
                  style={styles.input}
                  value={goalForm.priority}
                  onChange={(e) => setGoalForm({...goalForm, priority: e.target.value})}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
                
                <button type="submit" style={styles.btn.primary}>Create Goal</button>
              </form>
            </div>
          ) : (
            <div style={styles.card}>
              <h3>✏️ Edit Goal</h3>
              <form onSubmit={handleUpdateGoal}>
                <label style={styles.label}>Goal Title:</label>
                <input 
                  style={styles.input}
                  type="text"
                  placeholder="e.g., Complete Project X"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({...goalForm, title: e.target.value})}
                  required
                />
                
                <label style={styles.label}>Description:</label>
                <textarea 
                  style={{...styles.input, minHeight: "80px"}}
                  placeholder="Goal description"
                  value={goalForm.description}
                  onChange={(e) => setGoalForm({...goalForm, description: e.target.value})}
                />
                
                <label style={styles.label}>Priority:</label>
                <select 
                  style={styles.input}
                  value={goalForm.priority}
                  onChange={(e) => setGoalForm({...goalForm, priority: e.target.value})}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>

                <label style={styles.label}>Progress: {goalForm.progress}%</label>
                <input 
                  style={styles.input}
                  type="range" 
                  min="0" 
                  max="100" 
                  value={goalForm.progress}
                  onChange={(e) => setGoalForm({...goalForm, progress: parseInt(e.target.value)})}
                />
                
                <div style={{display: "flex", gap: "8px"}}>
                  <button type="submit" style={styles.btn.primary}>Save Changes</button>
                  <button type="button" style={styles.btn.default} onClick={() => {setEditingGoal(null); setGoalForm({title: "", description: "", priority: "Medium", progress: 0});}}>Cancel</button>
                </div>
              </form>
            </div>
          )}
          
          <div>
            <h3>Your Goals</h3>
            {goals.length === 0 ? (
              <p style={{color: "#57606a"}}>No goals yet</p>
            ) : (
              goals.map((goal) => (
                <div key={goal._id} style={styles.card}>
                  <div style={{display: "flex", justifyContent: "space-between", alignItems: "start"}}>
                    <div style={{flex: 1}}>
                      <h4 style={{margin: "0 0 8px 0"}}>{goal.title}</h4>
                      <p style={{margin: "0 0 8px 0", color: "#57606a", fontSize: "14px"}}>{goal.description}</p>
                      <div style={{marginBottom: "12px"}}>
                        <label style={styles.label}>Progress: {goal.progress}%</label>
                        <div style={{
                          backgroundColor: "#f0f0f0",
                          borderRadius: "4px",
                          height: "8px",
                          overflow: "hidden"
                        }}>
                          <div style={{
                            backgroundColor: "#2da44e",
                            height: "100%",
                            width: `${goal.progress}%`
                          }}></div>
                        </div>
                      </div>
                      <div style={{fontSize: "12px", color: "#8c959f"}}>
                        <span style={{
                          backgroundColor: goal.status === "Completed" ? "#dafbe1" : "#fff8c5",
                          color: goal.status === "Completed" ? "#1a7f37" : "#9a6700",
                          padding: "2px 8px",
                          borderRadius: "12px"
                        }}>
                          {goal.status}
                        </span>
                        <span style={{marginLeft: "8px"}}>Priority: {goal.priority}</span>
                      </div>
                    </div>
                    <div style={{display: "flex", gap: "8px"}}>
                      <button 
                        style={styles.btn.default}
                        onClick={() => handleEditGoal(goal)}
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        style={styles.btn.danger}
                        onClick={() => handleDeleteGoal(goal._id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ANALYTICS VIEW */}
      {currentView === "analytics" && (
        <div>
          <h2 style={styles.title}>📊 Analytics Dashboard</h2>
          <AnalyticsDashboard API={API} />
        </div>
      )}
    </div>
  );
};

// Analytics Dashboard Component
const AnalyticsDashboard = ({ API }) => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    departments: 0,
    pendingLeaves: 0,
    announcements: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API}/analytics/overview`);
        setStats(response.data);
      } catch (err) {
        console.error("Error fetching analytics:", err);
      }
    };
    fetchStats();
  }, [API]);

  const statStyle = {
    card: {
      backgroundColor: "#ffffff",
      border: "1px solid #d0d7de",
      borderRadius: "6px",
      padding: "20px",
      textAlign: "center"
    },
    value: { fontSize: "36px", fontWeight: "600", margin: "8px 0" },
    label: { fontSize: "14px", color: "#57606a" }
  };

  return (
    <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px"}}>
      <div style={statStyle.card}>
        <div style={statStyle.label}>Total Employees</div>
        <div style={statStyle.value}>{stats.totalEmployees}</div>
      </div>
      <div style={statStyle.card}>
        <div style={statStyle.label}>Departments</div>
        <div style={statStyle.value}>{stats.departments}</div>
      </div>
      <div style={statStyle.card}>
        <div style={statStyle.label}>Pending Leaves</div>
        <div style={{...statStyle.value, color: "#cf222e"}}>{stats.pendingLeaves}</div>
      </div>
      <div style={statStyle.card}>
        <div style={statStyle.label}>Announcements</div>
        <div style={statStyle.value}>{stats.announcements}</div>
      </div>
    </div>
  );
};

export default FeaturesPanel;
