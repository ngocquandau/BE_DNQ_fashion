// routes/users.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// API đăng ký
router.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    const role = 'user'; // Mặc định là user khi đăng ký

    console.log('Register attempt:', { username, email, password, role });

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin.' });
    }

    const query = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
    db.query(query, [username, email, password, role], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                // Kiểm tra xem lỗi trùng lặp là do username hay email
                if (err.sqlMessage.includes('username')) {
                    return res.status(400).json({ message: 'Username đã tồn tại.' });
                }
                if (err.sqlMessage.includes('email')) {
                    return res.status(400).json({ message: 'Email đã tồn tại.' });
                }
            }
            console.error('Error registering user:', err);
            return res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
        }
        console.log(`User registered: ${username}, ${email}, ${role}, password: ${password}`);
        res.status(201).json({ message: 'Đăng ký thành công!' });
    });
});

// API đăng nhập
router.post('/login', (req, res) => {
    const { username, password, role } = req.body;

    console.log('Login attempt:', { username, password, role });

    if (!username || !password || !role) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin.' });
    }

    const query = 'SELECT * FROM users WHERE username = ?';
    db.query(query, [username], (err, results) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
        }

        if (results.length === 0) {
            console.log(`User not found: ${username}`);
            return res.status(401).json({ message: 'Tên đăng nhập không tồn tại.' });
        }

        const user = results[0];
        console.log('User found:', user);

        // So sánh mật khẩu (plain text)
        if (password !== user.password) {
            console.log(`Password does not match. Input: ${password}, Stored: ${user.password}`);
            return res.status(401).json({ message: 'Mật khẩu không đúng.' });
        }

        // Kiểm tra role
        if (user.role !== role) {
            console.log(`Role mismatch: expected ${role}, got ${user.role}`);
            return res.status(403).json({ message: 'Vai trò không hợp lệ.' });
        }

        // Đăng nhập thành công
        console.log(`Login successful: ${username}, role: ${role}`);
        res.status(200).json({
            id: user.id, // Thêm id vào phản hồi
            username: user.username,
            role: user.role,
        });
    });
});

module.exports = router;