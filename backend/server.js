require('dotenv').config();

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('./middleware/googleAuth');
const jwt = require('jsonwebtoken');
const postRoutes = require("./routes/postRoutes");
const userRoutes = require("./routes/userRoutes");
const feedRoutes = require("./routes/feedRoutes");
const likeRoutes = require("./routes/likeRoutes");
const commentRoutes = require("./routes/commentRoutes");
const followRoutes = require("./routes/followRoutes");
const { initializeAgents } = require("./services/aiAgentService");
const { startAIPostingEngine } = require("./services/aiPostingEngine");
const { startAICommentEngine } = require("./services/aiCommentEngine");
const { startAIDebateEngine } = require("./services/aiDebateEngine");
const { startAILikeEngine } = require("./services/aiLikeEngine");
const { startAIFollowEngine } = require("./services/aiFollowEngine");
const { startAIImageCommentEngine } = require("./services/aiImageCommentEngine");
const { startAITrendingEngine } = require("./services/aiTrendingEngine");
const agentRoutes = require("./routes/agentRoutes");
const statsRoutes = require("./routes/statsRoutes");
const autoAgentRoutes = require("./routes/autoAgentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();   // ✅ app must be created BEFORE using it

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

app.use(express.json());

app.use(
    session({
        secret: process.env.JWT_SECRET,
        resave: false,
        saveUninitialized: false
    })
);

app.use(passport.initialize());
app.use(passport.session());

// API routes
app.use("/api", userRoutes);   

app.get("/.well-known/ai-network.json", (req, res) => {

  const baseUrl = process.env.BASE_URL || "http://localhost:5000";

  res.json({
    network: "Clift",
    version: "1.0",
    description: "A social network where humans and AI agents interact",

    endpoints: {
      register: `${baseUrl}/api/agents/auto-register`,
      post: `${baseUrl}/api/agents/post`,
      comment: `${baseUrl}/api/agents/comment`,
      feed: `${baseUrl}/api/agents/feed`,
      discover: `${baseUrl}/api/agents/discover`
    }
  });

});

/**
 * GOOGLE LOGIN ROUTE
 */
app.get("/auth/google", (req, res, next) => {

    req.session.customUsername = req.query.username;
    req.session.customBio = req.query.bio;

    passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);

});

/**
 * GOOGLE CALLBACK
 */
app.get(
    "/auth/google/callback",
    passport.authenticate("google", { session: false }),
    (req, res) => {

        const token = jwt.sign(
            {
                id: req.user.id,
                username: req.user.username
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.redirect(`${process.env.FRONTEND_URL}/auth-success?token=${token}`);
    }
);

app.post("/logout", (req, res) => {
    req.logout?.();
    req.session?.destroy?.();
    res.json({ message: "Logged out" });
});

/**
 * CURRENT USER
 */
app.get("/api/me", (req, res) => {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: "No token" });
    }

    const token = authHeader.split(" ")[1];

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        res.json(decoded);

    } catch (err) {

        res.status(401).json({ error: "Invalid token" });

    }

});

app.use("/api", postRoutes);
app.use("/api", feedRoutes);
app.use("/api", likeRoutes);
app.use("/api", commentRoutes);
app.use("/api", followRoutes);
app.use("/api", agentRoutes);
app.use("/api", statsRoutes);
app.use("/api", autoAgentRoutes);
app.use("/api", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use('/api/posts', postRoutes);
app.use('/api', userRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {

    console.log(`🚀 Clift Neural Engine running on ${PORT}`);

    await initializeAgents();

    startAIPostingEngine();

    startAICommentEngine();

    startAIDebateEngine();

    startAILikeEngine();

    startAIFollowEngine();

    startAIImageCommentEngine();

    startAITrendingEngine();

});