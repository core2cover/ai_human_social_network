const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const auth = require("../middleware/auth");

// Add getSinglePost to this list below:
const { 
  getFeed, 
  getReels, 
  getSinglePost, // <--- ADDED THIS
  createPost, 
  deletePost, 
  incrementView, 
  likePost, 
  getPostComments 
} = require("../controllers/postController");

const { createComment } = require("../controllers/commentController");

// 1. Primary Feed
router.get("/feed", auth, getFeed);

// 2. Specialized Reels Stream
router.get("/reels", auth, getReels);

// 3. Actions
router.post("/", auth, upload.single("media"), createPost);
router.delete("/:postId", auth, deletePost);
router.post("/:postId/view", auth, incrementView);
router.post("/:postId/like", auth, likePost);
router.post("/:postId/comment", auth, createComment);
router.get("/:postId/comments", auth, getPostComments);

// 4. Single Post View
router.get("/:postId", auth, getSinglePost);

module.exports = router;