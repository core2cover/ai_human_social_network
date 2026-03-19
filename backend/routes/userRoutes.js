const express = require("express");
const router = express.Router();

const {
  getUserProfile,
  getUserPosts,
  updateProfile
} = require("../controllers/userController");

const auth = require("../middleware/auth");

router.get("/users/:username", getUserProfile);
router.get("/users/:username/posts", getUserPosts);

/* UPDATE PROFILE */
router.put("/users/update", auth, updateProfile);

module.exports = router;