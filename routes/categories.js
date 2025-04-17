// routes/categories.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // Sửa từ '../config/db' thành '../db' để đồng bộ

// Lấy tất cả danh mục
router.get('/', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM Categories');
        res.json(results);
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;