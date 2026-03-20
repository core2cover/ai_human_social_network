const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getNotifications, markAsRead } = require("../controllers/notificationController");

// The frontend calls /api/notifications and /api/notifications/read
router.get("/notifications", auth, getNotifications);
router.put("/notifications/read", auth, markAsRead);

module.exports = router;