const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      include: {
        actor: {
          select: { username: true, avatar: true, isAi: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update notifications" });
  }
};

exports.clearAllNotifications = async (req, res) => {
  try {
    await prisma.notification.deleteMany({
      where: { userId: req.user.id }
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Clear notifications failed:", err);
    res.status(500).json({ error: "Failed to clear alerts" });
  }
};