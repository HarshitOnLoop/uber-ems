const express = require("express");
const { Department, PerformanceReview, Payroll, Announcement, Goal, Document } = require("./Models");

const router = express.Router();

// ==================== DEPARTMENTS ====================
router.post("/departments", async (req, res) => {
  try {
    const dept = new Department(req.body);
    await dept.save();
    res.status(201).json({ message: "Department created", department: dept });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/departments", async (req, res) => {
  try {
    const departments = await Department.find().populate("head", "name email");
    res.json(departments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/departments/:deptId", async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.deptId, req.body, { new: true })
      .populate("head", "name email");
    res.json({ message: "Department updated", department });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/departments/:deptId", async (req, res) => {
  try {
    await Department.findByIdAndDelete(req.params.deptId);
    res.json({ message: "Department deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================== PERFORMANCE REVIEWS ====================
router.post("/performance-reviews", async (req, res) => {
  try {
    const review = new PerformanceReview(req.body);
    await review.save();
    res.status(201).json({ message: "Review submitted", review });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/performance-reviews/:employeeId", async (req, res) => {
  try {
    const reviews = await PerformanceReview.find({ employee: req.params.employeeId })
      .populate("reviewer", "name email");
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================== PAYROLL ====================
router.post("/payroll", async (req, res) => {
  try {
    const payroll = new Payroll(req.body);
    await payroll.save();
    res.status(201).json({ message: "Payroll entry created", payroll });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/payroll/:employeeId", async (req, res) => {
  try {
    const payrollRecords = await Payroll.find({ employee: req.params.employeeId })
      .sort({ month: -1 });
    res.json(payrollRecords);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================== ANNOUNCEMENTS ====================
router.post("/announcements", async (req, res) => {
  try {
    const announcement = new Announcement(req.body);
    await announcement.save();
    res.status(201).json({ message: "Announcement posted", announcement });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/announcements", async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate("author", "name email")
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/announcements/:id", async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: "Announcement deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/announcements/:id", async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("author", "name email");
    res.json({ message: "Announcement updated", announcement });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================== EMPLOYEE GOALS ====================
router.post("/goals", async (req, res) => {
  try {
    const goal = new Goal(req.body);
    await goal.save();
    res.status(201).json({ message: "Goal created", goal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/goals/:employeeId", async (req, res) => {
  try {
    const goals = await Goal.find({ employee: req.params.employeeId });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/goals/:goalId", async (req, res) => {
  try {
    const goal = await Goal.findByIdAndUpdate(req.params.goalId, req.body, { new: true });
    res.json({ message: "Goal updated", goal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/goals/:goalId", async (req, res) => {
  try {
    await Goal.findByIdAndDelete(req.params.goalId);
    res.json({ message: "Goal deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================== DOCUMENTS ====================
router.post("/documents", async (req, res) => {
  try {
    const document = new Document(req.body);
    await document.save();
    res.status(201).json({ message: "Document uploaded", document });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/documents/:employeeId", async (req, res) => {
  try {
    const documents = await Document.find({ employee: req.params.employeeId });
    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/documents/:docId", async (req, res) => {
  try {
    await Document.findByIdAndDelete(req.params.docId);
    res.json({ message: "Document deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================== ANALYTICS ====================
router.get("/analytics/overview", async (req, res) => {
  try {
    const User = require("./User");
    const totalEmployees = await User.countDocuments();
    const departments = await Department.countDocuments();
    const pendingLeaves = await User.aggregate([
      { $unwind: "$leaveRequests" },
      { $match: { "leaveRequests.status": "Pending" } },
      { $count: "count" }
    ]);
    const pendingCount = pendingLeaves.length > 0 ? pendingLeaves[0].count : 0;

    res.json({
      totalEmployees,
      departments,
      pendingLeaves: pendingCount,
      announcements: await Announcement.countDocuments()
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
