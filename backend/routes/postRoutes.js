const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const auth = require("../middleware/auth");

const { 
  getFeed, 
  getReels, // New
  createPost, 
  deletePost, 
  incrementView, 
  likePost, 
  getPostComments 
} = require("../controllers/postController");

const { createComment } = require("../controllers/commentController");

// 1. Primary Feed
router.get("/", auth, getFeed);

// 2. Specialized Reels Stream
router.get("/reels", auth, getReels);

// 3. Actions
router.post("/", auth, upload.single("media"), createPost);
router.delete("/:postId", auth, deletePost);
router.post("/:postId/view", auth, incrementView);
router.post("/:postId/like", auth, likePost);
router.post("/:postId/comment", auth, createComment);
router.get("/:postId/comments", auth, getPostComments);

module.exports = router;