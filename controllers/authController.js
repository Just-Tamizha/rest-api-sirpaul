const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const connection = require("../config/db");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
exports.signup = (req, res) => {
    const { name, email, country, password } = req.body;
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) return res.status(500).json({ error: "Error hashing password" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
        const query = "INSERT INTO users (name, email, country, password, role, otp,verified) VALUES (?, ?, ?, ?, 'user', ?, false)";
        connection.query(query, [name, email, country, hashedPassword, otp], (error, results) => {
            if (error) return res.status(501).json({ error: "Signup failed" });

            try {
                const transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: process.env.GMAIL_USER,
                        pass: process.env.GMAIL_PASSWORD,
                    },
                });

                const mailOptions = {
                    from: process.env.GMAIL_USER,
                    to: email,
                    subject: "Verify your email",
                    html: `<p>Your OTP for email verification is: <strong>${otp}</strong></p>`,
                };

                transporter.sendMail(mailOptions, (mailError) => {
                    if (mailError) {
                        console.error("Error sending email:", mailError);
                        return res.status(500).json({ error: "Error sending OTP email" });
                    }
                    res.status(200).json({ message: "User registered successfully. Please verify your email using the OTP sent to your email." });
                });
            } catch (error) {
                console.error("Unexpected error:", error);
                return res.status(500).json({ error: "Unexpected error occurred while sending email" });
            }
        });
    });
};

exports.verifyOtp = (req, res) => {
    const { email, otp } = req.body;
    const query = "SELECT * FROM users WHERE email = ? AND otp = ?";
    connection.query(query, [email, otp], (error, results) => {
        if (error || results.length === 0) return res.status(400).json({ error: "Invalid OTP or email" });

        const updateQuery = "UPDATE users SET verified = true, otp = NULL WHERE email = ?";
        connection.query(updateQuery, [email], (updateError) => {
            if (updateError) return res.status(500).json({ error: "Error verifying user" });
            res.status(200).json({ message: "Email verified successfully" });
        });
    });
};

exports.login = (req, res) => {
    const { email, password } = req.body;
    connection.query("SELECT * FROM users WHERE email = ? and verified=1", [email], (error, results) => {
        if (error || results.length === 0) return res.status(400).json({ error: "Invalid credentials" });

        bcrypt.compare(password, results[0].password, (err, match) => {
            if (!match) return res.status(400).json({ error: "Invalid credentials" });
            const token = jwt.sign({ userId: results[0].id }, process.env.JWT_SECRET, { expiresIn: "1h" });
            res.json({ token });
        });
    });
};  