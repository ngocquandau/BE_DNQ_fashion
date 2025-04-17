// routes/products.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware kiểm tra vai trò admin
const isAdmin = async (req, res, next) => {
    let user_id;
    if (req.method === 'GET') {
        user_id = req.query.user_id;
    } else {
        user_id = req.body.user_id;
    }

    if (!user_id) {
        return res.status(400).json({ message: 'Thiếu user_id.' });
    }

    try {
        const [results] = await db.query('SELECT role FROM Users WHERE id = ?', [user_id]);
        if (results.length === 0 || results[0].role !== 'admin') {
            return res.status(403).json({ message: 'Chỉ admin mới có quyền truy cập.' });
        }
        next();
    } catch (err) {
        console.error('Error checking user role:', err);
        res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
    }
};

// API lấy danh sách sản phẩm
router.get('/', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM Products');
        res.status(200).json(results);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
    }
});

// API lấy chi tiết sản phẩm theo id
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`Fetching product with id: ${id}`); // Log để kiểm tra id
    try {
        const [results] = await db.query('SELECT * FROM Products WHERE id = ?', [id]);
        if (results.length === 0) {
            console.log(`Product with id ${id} not found`); // Log nếu không tìm thấy
            return res.status(404).json({ message: 'Sản phẩm không tồn tại.' });
        }
        console.log('Product found:', results[0]); // Log sản phẩm tìm thấy
        res.status(200).json(results[0]);
    } catch (err) {
        console.error('Error fetching product:', err);
        res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
    }
});

// API thêm sản phẩm mới (cho admin)
router.post('/', isAdmin, async (req, res) => {
    const { name, price, image_url, user_id } = req.body;

    if (!name || !price || !image_url) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin sản phẩm.' });
    }

    try {
        const [result] = await db.query('INSERT INTO Products (name, price, image_url) VALUES (?, ?, ?)', [name, price, image_url]);
        res.status(201).json({ message: 'Thêm sản phẩm thành công!', productId: result.insertId });
    } catch (err) {
        console.error('Error adding product:', err);
        res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
    }
});

// API sửa sản phẩm (cho admin)
router.put('/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, price, image_url, user_id } = req.body;

    if (!name || !price || !image_url) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin sản phẩm.' });
    }

    try {
        const [result] = await db.query('UPDATE Products SET name = ?, price = ?, image_url = ? WHERE id = ?', [name, price, image_url, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại.' });
        }
        res.status(200).json({ message: 'Cập nhật sản phẩm thành công!' });
    } catch (err) {
        console.error('Error updating product:', err);
        res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
    }
});

// API xóa sản phẩm (cho admin)
router.delete('/:id', isAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.query('DELETE FROM Products WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại.' });
        }
        res.status(200).json({ message: 'Xóa sản phẩm thành công!' });
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
    }
});

module.exports = router;