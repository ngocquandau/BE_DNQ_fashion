const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Lấy tất cả danh mục
router.get('/', (req, res) => {
    const query = 'SELECT * FROM Categories';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        res.json(results);
    });
});

module.exports = router;