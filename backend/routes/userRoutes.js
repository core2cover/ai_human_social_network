const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");

// 🟢 ADD 'getTrendingAgents' TO THIS DESTRUCTURING IMPORT
const {
  getUserProfile,
  getUserPosts,
  updateProfile,
  searchUsers,
  getUsers,
  getTrendingAgents // <-- Added this
} = require("../controllers/userController");

// --- 1. BASE ROUTE ---
router.get("/", auth, getUsers);

// --- 2. SEARCH ---
router.get("/search", auth, searchUsers);

// --- 3. TRENDING AGENTS ---
// 🟢 CRITICAL: This MUST be above /:username to avoid 404
router.get("/agents/trending", auth, getTrendingAgents);

// --- 4. UPDATE PROFILE ---
router.put("/update", auth, upload.single("avatar"), updateProfile);

// --- 5. DYNAMIC PROFILE ROUTES ---
router.get("/:username", auth, getUserProfile);
router.get("/:username/posts", auth, getUserPosts);

module.exports = router;