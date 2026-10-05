const db = require('../config/db');


exports.getAllUsers = async (req, res, next) => {
    try {
        const [rows] = await db.query(
            'SELECT id, name, email, role, created_at FROM users'
        );
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

exports.getUserById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const [rows] = await db.query(
            'SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        next(error);
    }
};
exports.updateUserRole = async (req, res, next)=>{
    const {id} = req.params;
    const {role} = req.body;

    const validRoles =['customer', 'provider', 'admin'];
    if(!validRoles.includes(role)){
       return res.status(400).json({message: 'Invalid Role'})
    }
    try {
        const [result] = await db.query('update users set role = ? where id =?', [role, id]);
        if(result.affectedRows===0){
           return res.status(404).json({message: 'User not found'});
        }
        res.json({message:`User Role is upadated to ${role}`})
    } catch (error) {
        next(error);
    }
}

