// routes/cart.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Route mặc định cho GET /api/cart (không có user_id)
router.get('/', (req, res) => {
    return res.status(400).json({ message: 'Vui lòng cung cấp user_id. Ví dụ: /api/cart/9' });
});

// API thêm sản phẩm vào giỏ hàng
router.post('/', async (req, res) => {
    const { user_id, product_id, quantity } = req.body;

    console.log('Add to cart attempt:', { user_id, product_id, quantity });

    if (!user_id || !product_id || !quantity) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin.' });
    }

    try {
        // Kiểm tra xem sản phẩm đã có trong giỏ hàng của user chưa
        const [results] = await db.query('SELECT * FROM cart WHERE user_id = ? AND product_id = ?', [user_id, product_id]);

        if (results.length > 0) {
            // Nếu sản phẩm đã có, cập nhật số lượng
            await db.query('UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?', [quantity, user_id, product_id]);
            res.status(200).json({ message: 'Cập nhật giỏ hàng thành công!' });
        } else {
            // Nếu sản phẩm chưa có, thêm mới
            await db.query('INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)', [user_id, product_id, quantity]);
            res.status(201).json({ message: 'Thêm vào giỏ hàng thành công!' });
        }
    } catch (err) {
        console.error('Error adding to cart:', err);
        res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
    }
});

// API lấy giỏ hàng của user
router.get('/:user_id', async (req, res) => {
    const { user_id } = req.params;
    const query = `
        SELECT c.*, p.name, p.price, p.image_url 
        FROM cart c 
        JOIN Products p ON c.product_id = p.id 
        WHERE c.user_id = ?
    `;
    try {
        const [results] = await db.query(query, [user_id]);
        res.status(200).json(results);
    } catch (err) {
        console.error('Error fetching cart:', err);
        res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
    }
});

// API chỉnh sửa số lượng sản phẩm trong giỏ hàng
router.put('/:user_id/:product_id', async (req, res) => {
    const { user_id, product_id } = req.params;
    const { quantity } = req.body;

    console.log('Update cart quantity attempt:', { user_id, product_id, quantity });

    if (!quantity || quantity < 1) {
        return res.status(400).json({ message: 'Số lượng phải lớn hơn 0.' });
    }

    try {
        const [result] = await db.query('UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?', [quantity, user_id, product_id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Sản phẩm không có trong giỏ hàng.' });
        }
        console.log(`Updated cart quantity: user_id=${user_id}, product_id=${product_id}, quantity=${quantity}`);
        res.status(200).json({ message: 'Đã cập nhật số lượng sản phẩm!' });
    } catch (err) {
        console.error('Error updating cart quantity:', err);
        res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
    }
});

// API xóa sản phẩm khỏi giỏ hàng
router.delete('/:user_id/:product_id', async (req, res) => {
    const { user_id, product_id } = req.params;

    console.log('Delete from cart attempt:', { user_id, product_id });

    try {
        const [result] = await db.query('DELETE FROM cart WHERE user_id = ? AND product_id = ?', [user_id, product_id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Sản phẩm không có trong giỏ hàng.' });
        }
        console.log(`Deleted from cart: user_id=${user_id}, product_id=${product_id}`);
        res.status(200).json({ message: 'Đã xóa sản phẩm khỏi giỏ hàng!' });
    } catch (err) {
        console.error('Error deleting from cart:', err);
        res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
    }
});

// API xóa toàn bộ giỏ hàng (sau khi thanh toán)
router.delete('/:user_id', async (req, res) => {
    const { user_id } = req.params;
    try {
        await db.query('DELETE FROM cart WHERE user_id = ?', [user_id]);
        res.status(200).json({ message: 'Xóa giỏ hàng thành công!' });
    } catch (err) {
        console.error('Error clearing cart:', err);
        res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
    }
});

module.exports = router;