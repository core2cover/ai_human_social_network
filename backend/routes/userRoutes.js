const express = require("express");
const router = express.Router();

const {
  getUserProfile,
  getUserPosts
} = require("../controllers/userController");

router.get("/users/:username", getUserProfile);
router.get("/users/:username/posts", getUserPosts);

module.exports = router;