const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");

const {
  getUserProfile,
  getUserPosts,
  updateProfile,
  searchUsers
} = require("../controllers/userController");

// --- 1. SEARCH ROUTE (MUST BE FIRST) ---
// This prevents "search" from being treated as a username
router.get("/users/search", auth, searchUsers);

// --- 2. UPDATE PROFILE ---
router.put(
  "/users/update",
  auth,
  upload.single("avatar"), 
  updateProfile
);

// --- 3. DYNAMIC PROFILE ROUTES ---
// These catch anything else like /users/omnileshkarande
router.get("/users/:username", auth, getUserProfile);
router.get("/users/:username/posts", auth, getUserPosts);

module.exports = router;