const adminModel = require('../models/adminModel');
const sellerModel = require('../models/sellerModel');
const sellerCustomerModel = require('../models/chat/sellerCustomerModel');
const { responseReturn } = require('../utils/response');
const bcrypt = require('bcrypt');
const { createToken } = require('../utils/tokenCreate');
const formidable = require("formidable");
const {v2: cloudinary} = require("cloudinary");

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

    profile_image_upload = async (req, res) => {
        const { id } = req;
        const form = formidable({ multiples: true });
        form.parse(req, async (err, fields, files) => {
            cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET,
                secure: true
            })

            const { image } = files

            try {
                const result = await cloudinary.uploader.upload(image.filepath, { folder: 'profiles' })
                if (result) {
                    const seller = await sellerModel.findByIdAndUpdate(id,{
                        image: result?.url
                    })
                    responseReturn(res, 201, { seller, message: 'Perfil atualizado com sucesso!' });
                } else {
                    responseReturn(res, 404, { error: 'Image upload file' });
                }
            } catch (error) {
                responseReturn(res, 500, 'Internal Server Error' );
            }
        })
    }

    profile_info_add = async (req, res) => {
        const { id } = req;
        const { division, district, shopName, sub_district } = req.body;

        try {
            await sellerModel.findByIdAndUpdate(id, {
                shopInfo: {
                    shopName,
                    division,
                    district,
                    sub_district,
                }
            })
            const userInfo = await sellerModel.findById(id)
            responseReturn(res, 201, { message: 'Perfil atualizado com sucesso', userInfo})
        } catch (error) {
            responseReturn(res, 500, 'Internal Server Error' );
        }
    }
}

module.exports = new AuthController
