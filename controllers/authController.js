const adminModel = require('../models/adminModel');
const { responseReturn } = require('../utils/response');
const bcrypt = require('bcrypt');
const { createToken } = require('../utils/tokenCreate');

class AuthController {
    admin_login = async (req, res, next) => {
        const { email, password } = req.body;
        try {
            const admin = await adminModel.findOne({email}).select('+password');
            if (admin) {
                const match = await bcrypt.compare(password, admin.password)
                if (match) {
                    const token = await createToken({
                        id: admin.id,
                        role: match.role,
                    });
                    res.cookie('access_token', token, {
                        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    })
                    responseReturn(res, 200, {token, message: 'Login successfully'});
                } else {
                    responseReturn(res, 404, {error: "Senha incorreta"});
                }
            } else {
                responseReturn(res, 404, {error: "Email não encontrado"})
            }
        } catch (error) {
            responseReturn(res, 500, {error: error.message})
        }
    }

    getUser = async (req, res, next) => {
        const { id, role } = req;

        try {
            if (role === 'admin') {
                const user = await adminModel.findById(id)
                responseReturn(res, 200, {userInfo: user})
            } else {
                console.log("Seller info")
            }
        } catch (error) {
            console.log(error.message);
        }
    }
}

module.exports = new AuthController
