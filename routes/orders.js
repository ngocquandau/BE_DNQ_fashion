// routes/orders.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware kiểm tra vai trò admin
const isAdmin = (req, res, next) => {
    let user_id;
    // Lấy user_id từ query params (cho GET) hoặc body (cho POST, PUT, DELETE)
    if (req.method === 'GET') {
        user_id = req.query.user_id;
        console.log('GET request - user_id from query:', user_id); // Log để kiểm tra
    } else {
        user_id = req.body.user_id;
        console.log('Non-GET request - user_id from body:', user_id); // Log để kiểm tra
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

// API tạo đơn hàng (giữ nguyên)
router.post('/', (req, res) => {
    const { user_id, receiver_name, address, phone_number, total_amount, items } = req.body;

    console.log('Create order attempt:', { user_id, receiver_name, address, phone_number, total_amount });

    if (!user_id || !receiver_name || !address || !phone_number || !total_amount || !items || items.length === 0) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin.' });
    }

    db.beginTransaction((err) => {
        if (err) {
            console.error('Error starting transaction:', err);
            return res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
        }

        const insertOrderQuery = `
            INSERT INTO Orders (user_id, receiver_name, address, phone_number, total_amount, status)
            VALUES (?, ?, ?, ?, ?, 'Đang giao hàng')
        `;
        db.query(insertOrderQuery, [user_id, receiver_name, address, phone_number, total_amount], (err, result) => {
            if (err) {
                return db.rollback(() => {
                    console.error('Error creating order:', err);
                    res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
                });
            }

            const orderId = result.insertId;

            const insertItemsQuery = `
                INSERT INTO Order_Items (order_id, product_id, quantity, price)
                VALUES ?
            `;
            const itemsData = items.map(item => [orderId, item.product_id, item.quantity, item.price]);
            db.query(insertItemsQuery, [itemsData], (err) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error adding order items:', err);
                        res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
                    });
                }

                const deleteCartQuery = 'DELETE FROM cart WHERE user_id = ?';
                db.query(deleteCartQuery, [user_id], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error clearing cart:', err);
                            res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
                        });
                    }

                    db.commit((err) => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('Error committing transaction:', err);
                                res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
                            });
                        }
                        console.log(`Order created successfully: order_id=${orderId}, user_id=${user_id}`);
                        res.status(201).json({ message: 'Đặt hàng thành công!', orderId });
                    });
                });
            });
        });
    });
});

// API lấy danh sách đơn hàng của người dùng (giữ nguyên)
router.get('/:user_id', (req, res) => {
    const { user_id } = req.params;
    const query = `
        SELECT o.*, oi.product_id, oi.quantity, oi.price, p.name, p.image_url
        FROM Orders o
        LEFT JOIN Order_Items oi ON o.id = oi.order_id
        LEFT JOIN Products p ON oi.product_id = p.id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
    `;
    db.query(query, [user_id], (err, results) => {
        if (err) {
            console.error('Error fetching orders:', err);
            return res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
        }

        const orders = [];
        const orderMap = new Map();

        results.forEach(row => {
            if (!orderMap.has(row.id)) {
                orderMap.set(row.id, {
                    id: row.id,
                    user_id: row.user_id,
                    receiver_name: row.receiver_name,
                    address: row.address,
                    phone_number: row.phone_number,
                    total_amount: row.total_amount,
                    status: row.status,
                    created_at: row.created_at,
                    items: [],
                });
            }
            if (row.product_id) {
                orderMap.get(row.id).items.push({
                    product_id: row.product_id,
                    name: row.name,
                    quantity: row.quantity,
                    price: row.price,
                    image_url: row.image_url,
                });
            }
        });

        orders.push(...orderMap.values());
        res.status(200).json(orders);
    });
});

// API lấy danh sách tất cả đơn hàng (cho admin)
router.get('/', isAdmin, (req, res) => {
    const query = `
        SELECT o.*, oi.product_id, oi.quantity, oi.price, p.name, p.image_url, u.username
        FROM Orders o
        LEFT JOIN Order_Items oi ON o.id = oi.order_id
        LEFT JOIN Products p ON oi.product_id = p.id
        LEFT JOIN Users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching all orders:', err);
            return res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
        }

        const orders = [];
        const orderMap = new Map();

        results.forEach(row => {
            if (!orderMap.has(row.id)) {
                orderMap.set(row.id, {
                    id: row.id,
                    user_id: row.user_id,
                    username: row.username,
                    receiver_name: row.receiver_name,
                    address: row.address,
                    phone_number: row.phone_number,
                    total_amount: row.total_amount,
                    status: row.status,
                    created_at: row.created_at,
                    items: [],
                });
            }
            if (row.product_id) {
                orderMap.get(row.id).items.push({
                    product_id: row.product_id,
                    name: row.name,
                    quantity: row.quantity,
                    price: row.price,
                    image_url: row.image_url,
                });
            }
        });

        orders.push(...orderMap.values());
        res.status(200).json(orders);
    });
});

// API cập nhật trạng thái đơn hàng (giữ nguyên)
router.put('/:order_id/status', (req, res) => {
    const { order_id } = req.params;
    const { status } = req.body;

    if (!status || status !== 'Đã nhận hàng') {
        return res.status(400).json({ message: 'Trạng thái không hợp lệ.' });
    }

    const query = 'UPDATE Orders SET status = ? WHERE id = ?';
    db.query(query, [status, order_id], (err, result) => {
        if (err) {
            console.error('Error updating order status:', err);
            return res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Đơn hàng không tồn tại.' });
        }
        console.log(`Order status updated: order_id=${order_id}, status=${status}`);
        res.status(200).json({ message: 'Cập nhật trạng thái thành công!' });
    });
});

module.exports = router;