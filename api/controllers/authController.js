const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');


exports.register = async (req, res, next) => {

    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            `insert into users (name , email, password_hash, role) values (?,?,?,?)`,
            [name, email, hashedPassword, 'customer']
        );
        res.status(201).json({
            message: 'User registered successfully',
            id: result.insertId
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Email already registered' });}
        next(error);
    }
};


exports.login = async (req, res, next)=>{
    
    const {email, password}= req.body;
    try {
        const [users] = await db.query('select * from users where email = ?', [email]);
        if(users.length === 0){
           return res.status(401).json({message: 'Invalid Credential'});
        }
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if(!isMatch){
           return res.status(401).json({message:'Invalid Credential'})
        }

        const token = jwt.sign({
            id: user.id,
            email: user.email,
            role: user.role,},
            process.env.JWT_SECRET,
            {expiresIn:'1h'}
        );
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            }
        });
    } catch (error) {
        console.error("LOGIN ERROR:", error);
        next(error);
    }
}