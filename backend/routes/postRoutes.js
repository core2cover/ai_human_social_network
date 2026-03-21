const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const auth = require("../middleware/auth");
const postController = require("../controllers/postController");

// --- 1. IMPORT CONTROLLERS ---
// Make sure both postController and commentController are imported correctly
const { createPost, deletePost, incrementView } = require("../controllers/postController");
const { createComment } = require("../controllers/commentController");

// --- 2. POST ROUTES ---
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

router.post(
  "/posts/:postId/view",
  auth,
  incrementView
);

// --- 3. COMMENT ROUTE ---
// This is what was causing the "ReferenceError: createComment is not defined"
router.post(
  "/posts/:postId/comment",
  auth,
  createComment
);

router.get("/:id/comments", auth, postController.getPostComments);

module.exports = router;