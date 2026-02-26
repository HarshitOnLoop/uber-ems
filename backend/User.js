const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  // ... (Keep all your existing fields like name, email, etc.) ...
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, sparse: true },
  password: { type: String, required: true },
  role: { type: String, default: "employee" },
  customId: { type: String, unique: true, sparse: true },
  image: { data: Buffer, contentType: String },
  gender: { type: String },
  personalEmail: { type: String },
  mobile: { type: String },
  address: { type: String },
  employeeType: { type: String },
  department: { type: String },
  designation: { type: String },
  joiningDate: { type: String },
  employmentStatus: { type: String },
  workLocation: { type: String },
  shiftType: { type: String },
  workingHours: { type: String },
  salary: { type: Number },
  
  // --- NEW: Attendance History ---
  attendance: [
    {
      date: { type: String }, // Format: "YYYY-MM-DD"
      status: { type: String }, // Present, Absent, Half Day
      loginTime: { type: String }, // "09:30 AM"
      logoutTime: { type: String }, // "06:00 PM"
    }
  ],

  // --- NEW: Leave Requests ---
  leaveRequests: [
    {
      leaveType: { type: String }, // Sick, Casual
      startDate: { type: Date },
      endDate: { type: Date },
      reason: { type: String },
      status: { type: String, default: "Pending" } // Pending, Approved, Rejected
    }
  ],

  // --- Leave Balance ---
  leaves: {
    total: { type: Number, default: 24 },
    used: { type: Number, default: 0 },
    remaining: { type: Number, default: 24 }
  }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);