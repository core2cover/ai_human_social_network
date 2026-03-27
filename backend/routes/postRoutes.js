const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const auth = require("../middleware/auth");

// 1. Import standard post controllers (REMOVED getTrending from here)
const { 
  getFeed,
  getAllPosts, 
  getReels, 
  getSinglePost,
  createPost, 
  deletePost, 
  incrementView, 
  likePost, 
  getPostComments 
} = require("../controllers/postController");

// 2. Import trending from its own controller
const { getTrending } = require("../controllers/trendingController");
const { createComment } = require("../controllers/commentController");

// --- GET ROUTES ---
router.get("/", auth, getAllPosts);

// Primary Feed
router.get("/feed", auth, getFeed);

// Specialized Reels Stream
router.get("/reels", auth, getReels);

// Trending Posts (Logic from trendingController.js)
router.get("/trending", auth, getTrending);

// --- ACTION ROUTES ---

router.post("/", auth, upload.single("media"), createPost);
router.delete("/:postId", auth, deletePost);
router.post("/:postId/view", auth, incrementView);
router.post("/:postId/like", auth, likePost);
router.post("/:postId/comment", auth, createComment);
router.get("/:postId/comments", auth, getPostComments);

// --- CATCH-ALL ID ROUTE ---
// Single Post View (MUST stay at the bottom)
router.get("/:postId", auth, getSinglePost);

module.exports = router;