const adminModel = require('../models/adminModel');
const sellerModel = require('../models/sellerModel');
const sellerCustomerModel = require('../models/chat/sellerCustomerModel');
const { responseReturn } = require('../utils/response');
const bcrypt = require('bcrypt');
const { createToken } = require('../utils/tokenCreate');

class AuthController {
    admin_login = async (req, res) => {
        const { email, password } = req.body;
        try {
            const admin = await adminModel.findOne({email}).select('+password');
            if (admin) {
                const match = await bcrypt.compare(password, admin.password)
                if (match) {
                    const token = await createToken({
                        id: admin.id,
                        role: admin.role,
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

    getUser = async (req, res) => {
        const { id, role } = req;

        try {
            if (role === 'admin') {
                const user = await adminModel.findById(id)
                responseReturn(res, 200, {userInfo: user})
            } else {
                const seller = await sellerModel.findById(id)
                responseReturn(res, 200, {userInfo: seller})
            }
        } catch (error) {
            responseReturn(res, 500, 'Internal Server Error');
        }
    }

    seller_register = async (req, res) => {
        const { name, email, password } = req.body;
        try {
            const getUser = await sellerModel.findOne({email})
            if (getUser) {
                responseReturn(res, 404, {error: 'Email já existe'})
            } else {
                const seller = await sellerModel.create({
                    name,
                    email,
                    password: await bcrypt.hash(password, 10),
                    method: 'manualy',
                    shopInfo: {}
                })
                await sellerCustomerModel.create({
                    myId: seller.id
                })

                const token = await createToken({ id: seller.id, role: seller.role })
                res.cookie('access_token', token, {
                    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                })

                responseReturn(res, 201, {token, message: 'Register successfully'});
            }
        } catch (error) {
            responseReturn(res, 500, {error: 'Internal Server Error'});
        }

    }

    seller_login = async (req, res) => {
        const { email, password } = req.body;
        try {
            const seller = await sellerModel.findOne({email}).select('+password');
            if (seller) {
                const match = await bcrypt.compare(password, seller.password)
                if (match) {
                    const token = await createToken({
                        id: seller.id,
                        role: seller.role,
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
}

module.exports = new AuthController
