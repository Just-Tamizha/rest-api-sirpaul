const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/send", verifyToken, (req, res) => {
    // Logic to send message via WebSockets
    res.json({ message: "Message sent" });
});

module.exports = router;