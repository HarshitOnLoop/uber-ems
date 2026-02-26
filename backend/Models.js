const mongoose = require("mongoose");

// Department Schema
const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  head: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  budget: { type: Number },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Performance Review Schema
const PerformanceReviewSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  category: { type: String }, // Technical, Communication, Leadership, etc.
  comments: { type: String },
  reviewDate: { type: Date, default: Date.now }
}, { timestamps: true });

// Payroll Schema
const PayrollSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  month: { type: String, required: true }, // "2026-02"
  baseSalary: { type: Number, required: true },
  bonus: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  netSalary: { type: Number, required: true },
  status: { type: String, default: "Pending" }, // Pending, Processed
  paymentDate: { type: Date },
  paymentMethod: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Announcement Schema
const AnnouncementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  priority: { type: String, default: "Normal" }, // High, Normal, Low
  targetDepartment: { type: String },
  attachments: [{ name: String, url: String }],
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }
}, { timestamps: true });

// Employee Goals Schema
const GoalSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: { type: String },
  targetDate: { type: Date },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  status: { type: String, default: "In Progress" }, // In Progress, Completed, On Hold
  priority: { type: String, default: "Medium" }, // High, Medium, Low
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Document Schema
const DocumentSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  documentType: { type: String, required: true }, // Resume, Certificate, License, etc.
  fileName: { type: String, required: true },
  fileUrl: { type: String },
  expiryDate: { type: Date },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = {
  Department: mongoose.model("Department", DepartmentSchema),
  PerformanceReview: mongoose.model("PerformanceReview", PerformanceReviewSchema),
  Payroll: mongoose.model("Payroll", PayrollSchema),
  Announcement: mongoose.model("Announcement", AnnouncementSchema),
  Goal: mongoose.model("Goal", GoalSchema),
  Document: mongoose.model("Document", DocumentSchema)
};
