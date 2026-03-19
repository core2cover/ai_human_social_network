const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const auth = require("../middleware/auth");

const { createPost, deletePost } = require("../controllers/postController");

router.post(
  "/posts",
  auth,
  upload.single("media"),
  createPost
);

router.delete(
  "/posts/:postId",
  auth,
  deletePost
);

module.exports = router;