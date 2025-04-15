// routes/cart.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// API thêm sản phẩm vào giỏ hàng
router.post('/', (req, res) => {
    const { user_id, product_id, quantity } = req.body;

    console.log('Add to cart attempt:', { user_id, product_id, quantity });

    if (!user_id || !product_id || !quantity) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin.' });
    }

    // Kiểm tra xem sản phẩm đã có trong giỏ hàng của user chưa
    const checkQuery = 'SELECT * FROM cart WHERE user_id = ? AND product_id = ?';
    db.query(checkQuery, [user_id, product_id], (err, results) => {
        if (err) {
            console.error('Error checking cart:', err);
            return res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
        }

        if (results.length > 0) {
            // Nếu sản phẩm đã có, cập nhật số lượng
            const updateQuery = 'UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?';
            db.query(updateQuery, [quantity, user_id, product_id], (err, result) => {
                if (err) {
                    console.error('Error updating cart:', err);
                    return res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
                }
                res.status(200).json({ message: 'Cập nhật giỏ hàng thành công!' });
            });
        } else {
            // Nếu sản phẩm chưa có, thêm mới
            const insertQuery = 'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)';
            db.query(insertQuery, [user_id, product_id, quantity], (err, result) => {
                if (err) {
                    console.error('Error adding to cart:', err);
                    return res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
                }
                res.status(201).json({ message: 'Thêm vào giỏ hàng thành công!' });
            });
        }
    });
});

// API lấy giỏ hàng của user
router.get('/:user_id', (req, res) => {
    const { user_id } = req.params;
    const query = `
        SELECT c.*, p.name, p.price, p.image_url 
        FROM cart c 
        JOIN products p ON c.product_id = p.id 
        WHERE c.user_id = ?
    `;
    db.query(query, [user_id], (err, results) => {
        if (err) {
            console.error('Error fetching cart:', err);
            return res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
        }
        res.status(200).json(results);
    });
});

// API chỉnh sửa số lượng sản phẩm trong giỏ hàng
router.put('/:user_id/:product_id', (req, res) => {
    const { user_id, product_id } = req.params;
    const { quantity } = req.body;

    console.log('Update cart quantity attempt:', { user_id, product_id, quantity });

    if (!quantity || quantity < 1) {
        return res.status(400).json({ message: 'Số lượng phải lớn hơn 0.' });
    }

    const query = 'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?';
    db.query(query, [quantity, user_id, product_id], (err, result) => {
        if (err) {
            console.error('Error updating cart quantity:', err);
            return res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Sản phẩm không có trong giỏ hàng.' });
        }
        console.log(`Updated cart quantity: user_id=${user_id}, product_id=${product_id}, quantity=${quantity}`);
        res.status(200).json({ message: 'Đã cập nhật số lượng sản phẩm!' });
    });
});

// API xóa sản phẩm khỏi giỏ hàng
router.delete('/:user_id/:product_id', (req, res) => {
    const { user_id, product_id } = req.params;

    console.log('Delete from cart attempt:', { user_id, product_id });

    const query = 'DELETE FROM cart WHERE user_id = ? AND product_id = ?';
    db.query(query, [user_id, product_id], (err, result) => {
        if (err) {
            console.error('Error deleting from cart:', err);
            return res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Sản phẩm không có trong giỏ hàng.' });
        }
        console.log(`Deleted from cart: user_id=${user_id}, product_id=${product_id}`);
        res.status(200).json({ message: 'Đã xóa sản phẩm khỏi giỏ hàng!' });
    });
});

// API xóa toàn bộ giỏ hàng (sau khi thanh toán)
router.delete('/:user_id', (req, res) => {
    const { user_id } = req.params;
    const query = 'DELETE FROM cart WHERE user_id = ?';
    db.query(query, [user_id], (err, result) => {
        if (err) {
            console.error('Error clearing cart:', err);
            return res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
        }
        res.status(200).json({ message: 'Xóa giỏ hàng thành công!' });
    });
});

module.exports = router;