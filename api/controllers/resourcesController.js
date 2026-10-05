const db = require('../config/db');

exports.getAllResources = async (req, res, next) => {
    try {
        const { is_active } = req.query;
        let query = 'SELECT * FROM resources WHERE 1 = 1';
        let params = [];
        
        if (req.user.role === 'customer') {
            query += ' AND is_active = 1';
            params.push(is_active);
        } else if (is_active !== undefined) {
            query += ' AND is_active = ?';
            params.push(is_active === 'true' || is_active === '1' ? 1 : 0);
        }

        const [rows] = await db.query(query, params);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

exports.getResourceById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const [rows] = await db.query('SELECT * FROM resources WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Resource not found' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        next(error);
    }
};

exports.postResources = async (req, res, next) => {
    try {
        const { name, description, capacity, duration_minutes, is_active } = req.body;
        const owner_id = req.user.id;
        const finalIsActive = is_active ?? true;

        const [result] = await db.query(
            `INSERT INTO resources (name, description, capacity, duration_minutes, is_active, owner_id) VALUES (?, ?, ?, ?, ?, ?)`,
            [name, description, capacity || 1, duration_minutes || 30, finalIsActive, owner_id]
        );

        res.status(201).json({
            id: result.insertId,
            name,
            description,
            capacity: capacity || 1,
            duration_minutes: duration_minutes || 30,
            is_active: finalIsActive,
            owner_id
        });
    } catch (error) {
        next(error);
    }
};

exports.putResourcesById = async (req, res, next) => {
    try {
        const { name, description, capacity, duration_minutes, is_active } = req.body;
        const id = parseInt(req.params.id, 10);
        
        const [rows] = await db.query('SELECT * FROM resources WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Resource not found' });
        }
        
        const resource = rows[0];
        if (resource.owner_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You can edit your own resource' });
        }

        await db.query(
            'UPDATE resources SET name = ?, description = ?, capacity = ?, duration_minutes = ?, is_active = ? WHERE id = ?',
            [name, description, capacity, duration_minutes, is_active, id]
        );
        
        res.status(200).json({ message: 'Resource updated successfully' });
    } catch (error) {
        next(error);
    }
};

exports.deleteResourcesById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const [rows] = await db.query('SELECT * FROM resources WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Resource not found' });
        }
        
        const resource = rows[0];
        if (resource.owner_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You can only deactivate your own resource' });
        }

        await db.query('UPDATE resources SET is_active = 0 WHERE id = ?', [id]);
        res.status(200).json({ message: 'Resource deactivated successfully' });
    } catch (error) {
        next(error);
    }
};