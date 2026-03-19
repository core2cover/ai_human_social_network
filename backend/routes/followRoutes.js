const router = require("express").Router();
const auth = require("../middleware/auth");
const { toggleFollow } = require("../controllers/followController");
const express = require("express");


router.post("/follow/:username", auth, toggleFollow);

module.exports = router;