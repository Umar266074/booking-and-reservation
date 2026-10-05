const db = require('../config/db');


exports.getAllBookings = async (req, res, next) => {
    try {
        const role = req.user.role;
        const user_id = req.user.id;

        let query = 'SELECT * FROM bookings b';
        let params = [];

        if (role === 'customer') {
            query += ' WHERE user_id = ?';
            params.push(user_id);
        }
        else if (role === 'provider') {
            query += ' JOIN resources r ON b.resource_id = r.id WHERE r.owner_id = ? or b.user_id = ?';
            params.push(user_id, user_id);
        }
        const [rows] = await db.query(query, params);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

exports.getByIdBookings = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const [rows] = await db.query(
            'SELECT * FROM bookings WHERE id = ?',
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({message: 'Booking not found'});
        }
        res.status(200).json(rows[0]);

    } catch (error) {
        next(error);
    }
};
exports.postBookings = async (req, res, next) => {
    const connection = await db.getConnection();

    try {
        const { resource_id, specific_date, start_time, end_time } = req.body;
        const user_id = (req.user.role === 'admin' && req.body.user_id) 
            ? parseInt(req.body.user_id, 10) 
            : req.user.id;
        const finalStatus = 'confirmed';

        await connection.beginTransaction();

//Lockig resources
        const [resourceRows] = await connection.query(
            'SELECT id FROM resources WHERE id = ? FOR UPDATE',
            [resource_id]
        );

        if (resourceRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Resource not found' });
        }
//Checkiing Available time
        const [availableTime] = await connection.query(
            `SELECT id FROM availability WHERE resource_id = ?  AND specific_date = ? OR (specific_date is null day_of_week = DAYOFWEEK(?) - 1) AND start_time <= ?  AND end_time >= ?`,
            [resource_id, specific_date ,specific_date, start_time, end_time]
        );

        if (availableTime.length === 0) {
            await connection.rollback();
            return res.status(409).json({ message: 'This time slot is not available' });
        }
//OverLap condition
        const [existingBookings] = await connection.query(
            `SELECT id FROM bookings WHERE resource_id = ?  AND specific_date = ?  AND start_time < ?  AND end_time > ?  AND status != 'cancelled'`,
            [resource_id, specific_date, end_time, start_time] 
        );

        if (existingBookings.length > 0) {
            await connection.rollback();
            return res.status(409).json({ message: 'This time slot is already booked' });
        }
//posting
        const [result] = await connection.query(
            `INSERT INTO bookings (resource_id, user_id, specific_date, start_time, end_time, status) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [resource_id, user_id, specific_date, start_time, end_time, finalStatus]
        );

        await connection.commit();

        return res.status(201).json({
            id: result.insertId,
            resource_id,
            user_id,
            specific_date,
            start_time,
            end_time,
            status: finalStatus
        });

    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

exports.putBookingsById = async (req, res, next) => {
    const connection = await db.getConnection();
    try {
        const id = parseInt(req.params.id, 10);
        const { resource_id, specific_date, start_time, end_time, status } = req.body;
        await connection.beginTransaction();
        const [rows] = await connection.query(
            'SELECT * FROM bookings WHERE id = ? FOR UPDATE', [id]
        );
        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Booking not found' });
        }
        const booking = rows[0];
        if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
            await connection.rollback();
            return res.status(403).json({ message: 'You can only edit your own booking' });
        }
        const [resourceRows] = await connection.query(
            'SELECT id FROM resources WHERE id = ? FOR UPDATE', [resource_id]
        );
        if (resourceRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Resource not found' });
        }
        const finalStatus = status || booking.status;
        if (finalStatus !== 'cancelled') {
            const [availableTime] = await connection.query(
                `SELECT id FROM availability WHERE resource_id = ? AND specific_date = ? AND start_time <= ? AND end_time >= ?`,
                [resource_id, specific_date, start_time, end_time]
            );
            if (availableTime.length === 0) {
                await connection.rollback();
                return res.status(409).json({ message: 'This time slot is not available' });
            }
            const [existing] = await connection.query(
                `SELECT id FROM bookings WHERE resource_id = ? AND specific_date = ? AND start_time < ? AND end_time > ? AND status != 'cancelled' AND id != ?`,
                [resource_id, specific_date, end_time, start_time, id]
            );
            if (existing.length > 0) {
                await connection.rollback();
                return res.status(409).json({ message: 'This time slot is already booked' });
            }
        }
        await connection.query(
            `UPDATE bookings SET resource_id = ?, specific_date = ?, start_time = ?, end_time = ?, status = ? WHERE id = ?`,
            [resource_id, specific_date, start_time, end_time, finalStatus, id]
        );
        await connection.commit();
        return res.status(200).json({ message: 'Booking updated successfully' });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

exports.cancelBooking = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);

        const [rows] = await db.query(
            `SELECT b.*, r.owner_id FROM bookings b JOIN resources r ON b.resource_id = r.id WHERE b.id = ?`,
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({
                message: 'Booking not found'
            });
        }
        const booking = rows[0];
        const isOwner = booking.user_id === req.user.id;
        const isProvider =
            req.user.role === 'provider' &&
            booking.owner_id === req.user.id;
        const isAdmin = req.user.role === 'admin';
        if (!isOwner && !isProvider && !isAdmin) {
            return res.status(403).json({
                message: 'Forbidden'
            });
        }
        await db.query(
            `UPDATE bookings SET status = 'cancelled' WHERE id = ?`,[id]);
        res.status(200).json({message: 'Booking cancelled successfully'});
    } catch (error) {
        next(error);
    }
};