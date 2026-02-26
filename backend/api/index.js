require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const User = require("../User");
const { Department, PerformanceReview, Payroll, Announcement, Goal, Document } = require("../Models");
const routes = require("../routes");

const connectDB = require("../lib/db");
connectDB()
  .then(() => console.log("🚀 Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ DB Error:", err));

const app = express();

app.use(cors());
app.use(express.json());
app.use("/", routes);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.get("/", (req, res) => {
  res.json({ message: "✅ Server is running", status: "active" });
});

app.post("/signup", upload.single("image"), async (req, res) => {
  try {
    const { 
      name, email, password, role, 
      gender, personalEmail, mobile, address,
      employeeType, department, designation, joiningDate, employmentStatus, 
      workLocation, shiftType, workingHours, salary
    } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, Email, and Password are required" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const prefix = (role === "manager") ? "mid" : "uid";
    let uniqueId = "";
    let isUnique = false;
    while (!isUnique) {
      const randomNum = Math.floor(Math.random() * 90 + 10);
      uniqueId = `${prefix}${randomNum}`;
      const checkId = await User.findOne({ customId: uniqueId });
      if (!checkId) isUnique = true;
    }

    const hashed = await bcrypt.hash(password, 10);

    const newUser = new User({
      name, email, password: hashed, role: role || "employee", customId: uniqueId,
      gender, personalEmail, mobile, address,
      employeeType, department, designation, joiningDate, employmentStatus, 
      workLocation, shiftType, workingHours, salary
    });

    if (req.body.leaves) {
      try {
        const parsedLeaves = JSON.parse(req.body.leaves);
        newUser.leaves = { ...newUser.leaves, ...parsedLeaves };
      } catch (e) { console.error("Error parsing leaves JSON", e); }
    }

    if (req.file) {
      newUser.image.data = req.file.buffer;
      newUser.image.contentType = req.file.mimetype;
    }

    await newUser.save();
    res.status(201).json({ message: "User created successfully", customId: uniqueId });

  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: err.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid email or password" });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      customId: user.customId
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password -image");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -image");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/users/:id/photo", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.image || !user.image.data) {
      return res.status(404).send("No image");
    }
    res.set("Content-Type", user.image.contentType);
    res.send(user.image.data);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.put("/users/:id", upload.single("image"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const fieldsToUpdate = [
      "name", "email", "role", "gender", "personalEmail", "mobile", "address",
      "employeeType", "department", "designation", "joiningDate", 
      "employmentStatus", "workLocation", "shiftType", "workingHours", "salary"
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });

    if (req.body.password && req.body.password.trim() !== "") {
      user.password = await bcrypt.hash(req.body.password, 10);
    }

    if (req.body.leaves) {
      try {
        const parsedLeaves = JSON.parse(req.body.leaves);
        user.leaves = { ...user.leaves, ...parsedLeaves };
      } catch (e) { console.error("Error parsing leaves:", e); }
    }

    if (req.file) {
      user.image.data = req.file.buffer;
      user.image.contentType = req.file.mimetype;
    }

    await user.save();
    res.json({ message: "User updated successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/attendance", async (req, res) => {
  try {
    const { userId, type } = req.body; 
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const today = new Date().toISOString().split('T')[0]; 
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (!user.attendance) user.attendance = [];

    let todayRecord = user.attendance.find(r => r.date === today);

    if (type === "clock-in") {
      if (todayRecord) return res.status(400).json({ message: "Already clocked in today" });
      
      user.attendance.push({
        date: today,
        status: "Present",
        loginTime: timeNow,
        logoutTime: null
      });
    } 
    else if (type === "clock-out") {
      if (!todayRecord) return res.status(400).json({ message: "You must clock in first" });
      todayRecord.logoutTime = timeNow;
    }

    await user.save();
    res.json({ message: "Attendance marked", attendance: user.attendance });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/leave/apply", async (req, res) => {
  try {
    const { userId, leaveType, startDate, endDate, reason } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.leaveRequests) user.leaveRequests = [];

    user.leaveRequests.push({
      leaveType,
      startDate,
      endDate,
      reason,
      status: "Pending"
    });

    await user.save();
    res.json({ message: "Leave request submitted" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/leave/respond", async (req, res) => {
  try {
    const { userId, leaveId, status } = req.body; 
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const leave = user.leaveRequests.id(leaveId);
    if (!leave) return res.status(404).json({ message: "Leave request not found" });

    if (status === "Approved" && leave.status !== "Approved") {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 

      if (user.leaves.remaining < diffDays) {
        return res.status(400).json({ message: "Insufficient leave balance" });
      }

      user.leaves.used += diffDays;
      user.leaves.remaining -= diffDays;
    }

    leave.status = status;
    await user.save();
    res.json({ message: `Leave ${status} successfully` });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete("/users/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = app;