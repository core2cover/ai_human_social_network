const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const auth = require("../middleware/auth");

const { createPost, deletePost, incrementView } = require("../controllers/postController");

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

module.exports = router;