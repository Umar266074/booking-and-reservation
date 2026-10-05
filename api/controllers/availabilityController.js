const db = require('../config/db');

exports.getAllAvailability = async (req, res, next) => {
    try {
        const { resource_id } = req.query;
        let query = 'SELECT * FROM availability';
        const params = [];
        if (resource_id !== undefined) {
            query += ' WHERE resource_id = ?';
            params.push(resource_id);
        }
        const [rows] = await db.query(query, params);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};
exports.getByIdAvailability = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const [rows] = await db.query('SELECT * FROM availability WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Availability not Found' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        next(error);
    }
};

exports.postAvailability = async (req, res, next) => {
    try {
        const { resource_id, day_of_week, specific_date, start_time, end_time } = req.body;
        const [resourceRows] = await db.query('SELECT * FROM resources WHERE id = ?', [resource_id]);
        if (resourceRows.length === 0) {
            return res.status(404).json({ message: 'Resource not found' });
        }
        const resource = resourceRows[0];
        if (req.user.role !== 'admin' && resource.owner_id !== req.user.id) {
            return res.status(403).json({
                message: 'You can only add availability for your own resource'
            });
        }
        const [result] = await db.query(
            'INSERT INTO availability (resource_id, day_of_week, specific_date, start_time, end_time) VALUES (?, ?, ?, ?, ?)',
            [resource_id, day_of_week || null, specific_date || null, start_time, end_time]
        );
        return res.status(201).json({
            id: result.insertId,
            resource_id,
            day_of_week,
            specific_date,
            start_time,
            end_time
        });
    } catch (error) {
        next(error);
    }
};

exports.putAvailabilityById = async (req, res, next) => {
    try {
        const { resource_id, day_of_week, specific_date, start_time, end_time } = req.body;
        const id = parseInt(req.params.id, 10);
        const [rows] = await db.query(
            `SELECT a.*, r.owner_id FROM availability a JOIN resources r ON a.resource_id = r.id WHERE a.id = ?`,
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Availability not found' });
        }
        const availability = rows[0];
        if (availability.owner_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You can only update your own availability' });
        }
        await db.query(
            'UPDATE availability SET resource_id=?, day_of_week=?, specific_date=?, start_time=?, end_time=? WHERE id = ?',
            [availability.resource_id, day_of_week, specific_date, start_time, end_time, id]
        );
        return res.status(200).json({ message: 'Availability updated successfully' });
    } catch (error) {
        next(error);
    }
};

exports.deleteAvailability = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const [rows] = await db.query(
            `SELECT a.*, r.owner_id FROM availability a JOIN resources r ON a.resource_id = r.id WHERE a.id = ?`,
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Availability not found' });
        }
        const availability = rows[0];
        if (availability.owner_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You can only delete your own availability' });
        }
        await db.query('DELETE FROM availability WHERE id = ?', [id]);
        return res.status(200).json({ message: 'Availability deleted successfully' });
    } catch (error) {
        next(error);
    }
};