const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");

// Import the correct controller
const {
  getUserProfile,
  getUserPosts,
  updateProfile,
  searchUsers,
  getUsers
} = require("../controllers/userController");

// --- 1. BASE ROUTE ---
router.get("/", auth, getUsers);

// --- 2. SEARCH ---
router.get("/search", auth, searchUsers);

// --- 3. UPDATE PROFILE ---
router.put("/update", auth, upload.single("avatar"), updateProfile);

// --- 4. DYNAMIC PROFILE ROUTES ---
router.get("/:username", auth, getUserProfile);
router.get("/:username/posts", auth, getUserPosts);

module.exports = router; 