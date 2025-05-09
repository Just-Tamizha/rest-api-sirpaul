const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const cors = require("cors");
const rateLimiter = require("./middleware/rateLimiter");
const bodyParser = require('body-parser')
const { Server } = require("socket.io");
const handleConnection = require("./controllers/messageController.js");
const { verifyToken, verifyTokenWithHeaders } = require("./middleware/authMiddleware.js");
const WebSocket = require('ws');
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
// app.use(rateLimiter);
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/docs/", require("./routes/swaggerDocs"));

app.use("/api/messages", require("./routes/messageRoutes"));


const wss = new WebSocket.Server({ server });
const groups = new Map();
wss.on('connection', (ws, req) => {
    const token = req.headers.token;
    if (!token) {
        ws.close(4001, 'Token not provided');
        return;
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return ws.close(4001, 'Token invalid');
        ws.userId = decoded.userId;
    });
    console.log(`User connected: ${ws.userId}`);
    ws.on('message', (message) => {
        let data;
        try {
            data = JSON.parse(message);
        } catch (error) {
            return;
        }

        if (data.type === 'message') {
            console.log(`Message received from ${ws.userId} to ${data.targetId}: ${data.message}`);
            // Send message to a specific user
            wss.clients.forEach((client) => {
                if (client.userId === data.targetId && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data));
                }
            });
        } else if (data.type === 'joinGroup') {
            console.log(`User ${ws.userId} joined group ${data.groupId}`);
            if (!groups.has(data.groupId)) {
                groups.set(data.groupId, new Set());
            }
            groups.get(data.groupId).add(ws);
        } else if (data.type === 'groupMessage') {
            console.log(`Message from ${data.userId} to group ${data.groupId}: ${data.message}`);
            // Send message to all users in a specific group
            const group = groups.get(data.groupId);
            if (group) {
                group.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(data));
                    }
                });
            }
        } else if (data.type === 'broadcast') {
            console.log(`Broadcast message from ${ws.userId}: ${data.message}`);
            // Send message to all connected users
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data));
                }
            });
        } else if (data.type === 'leaveGroup') {
            console.log(`User ${data.userId} left group ${data.groupId}`);
            const group = groups.get(data.groupId);
            if (group) {
                group.delete(ws);
                if (group.size === 0) {
                    groups.delete(data.groupId);
                }
            }
        }
    });

    ws.on('close', () => {
        console.log('User disconnected');
        // Remove the user from all groups they were part of
        groups.forEach((group, groupId) => {
            group.delete(ws);
            if (group.size === 0) {
                groups.delete(groupId);
            }
        });
    });
});

