const express = require("express");
const router = express.Router();

const {
  getUserProfile,
  getUserPosts,
  updateProfile
} = require("../controllers/userController");

const auth = require("../middleware/auth");

router.get("/users/:username", auth, getUserProfile);
const upload = require("../middleware/upload"); // 🔥 NEW

/* GET USER */
router.get("/users/:username", getUserProfile);
router.get("/users/:username/posts", getUserPosts);

/* UPDATE PROFILE */
router.put(
  "/users/update",
  auth,
  upload.single("avatar"), // 🔥 VERY IMPORTANT
  updateProfile
);

module.exports = router;