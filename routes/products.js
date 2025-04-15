// routes/products.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware kiểm tra vai trò admin
const isAdmin = (req, res, next) => {
    let user_id;
    if (req.method === 'GET') {
        user_id = req.query.user_id;
    } else {
        user_id = req.body.user_id;
    }

    if (!user_id) {
        return res.status(400).json({ message: 'Thiếu user_id.' });
    }

    const query = 'SELECT role FROM Users WHERE id = ?';
    db.query(query, [user_id], (err, results) => {
        if (err) {
            console.error('Error checking user role:', err);
            return res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
        }
        if (results.length === 0 || results[0].role !== 'admin') {
            return res.status(403).json({ message: 'Chỉ admin mới có quyền truy cập.' });
        }
        next();
    });
};

// API lấy danh sách sản phẩm
router.get('/', (req, res) => {
    const query = 'SELECT * FROM Products';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
        }
        res.status(200).json(results);
    });
});

// API lấy chi tiết sản phẩm theo id
router.get('/:id', (req, res) => {
    const { id } = req.params;
    console.log(`Fetching product with id: ${id}`); // Log để kiểm tra id
    const query = 'SELECT * FROM Products WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error fetching product:', err);
            return res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
        }
        if (results.length === 0) {
            console.log(`Product with id ${id} not found`); // Log nếu không tìm thấy
            return res.status(404).json({ message: 'Sản phẩm không tồn tại.' });
        }
        console.log('Product found:', results[0]); // Log sản phẩm tìm thấy
        res.status(200).json(results[0]);
    });
});

// API thêm sản phẩm mới (cho admin)
router.post('/', isAdmin, (req, res) => {
    const { name, price, image_url, user_id } = req.body;

    if (!name || !price || !image_url) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin sản phẩm.' });
    }

    const query = 'INSERT INTO Products (name, price, image_url) VALUES (?, ?, ?)';
    db.query(query, [name, price, image_url], (err, result) => {
        if (err) {
            console.error('Error adding product:', err);
            return res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
        }
        res.status(201).json({ message: 'Thêm sản phẩm thành công!', productId: result.insertId });
    });
});

// API sửa sản phẩm (cho admin)
router.put('/:id', isAdmin, (req, res) => {
    const { id } = req.params;
    const { name, price, image_url, user_id } = req.body;

    if (!name || !price || !image_url) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin sản phẩm.' });
    }

    const query = 'UPDATE Products SET name = ?, price = ?, image_url = ? WHERE id = ?';
    db.query(query, [name, price, image_url, id], (err, result) => {
        if (err) {
            console.error('Error updating product:', err);
            return res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại.' });
        }
        res.status(200).json({ message: 'Cập nhật sản phẩm thành công!' });
    });
});

// API xóa sản phẩm (cho admin)
router.delete('/:id', isAdmin, (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;

    const query = 'DELETE FROM Products WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error deleting product:', err);
            return res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại.' });
        }
        res.status(200).json({ message: 'Xóa sản phẩm thành công!' });
    });
});

module.exports = router;