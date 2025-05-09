const users = new Map();

// exports.handleConnection = (socket) => {
//     console.log("User connected:", socket.id);

//     socket.on("register", (userId) => {
//         users.set(userId, socket.id);
//     });

//     socket.on("send_message", (data) => {
//         const receiverSocketId = users.get(data.receiverId);
//         if (receiverSocketId) {
//             socket.to(receiverSocketId).emit("receive_message", data);
//         }
//     });

//     socket.on("disconnect", () => {
//         users.forEach((value, key) => {
//             if (value === socket.id) users.delete(key);
//         });
//     });
// };

module.exports = (socket) => {
    console.log("User connected:", socket.id);

    socket.on("register", (userId) => {
        console.log(`User registered: ${userId}`);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
};