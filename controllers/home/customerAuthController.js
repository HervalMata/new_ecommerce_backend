const customerModel = require("../../models/customerModel");
const sellerCustomerModel = require("../../models/customerModel");
const {responseReturn} = require("../../utils/response");
const bcrypt = require("bcrypt");
const {createToken} = require("../../utils/tokenCreate");

class CustomerAuthController {
    customer_register = async function (req, res) {
        const { name, email, password } = req.body;

        try {
            const customer = await customerModel.findOne({email})
            if (customer) {
                responseReturn(res, 404, { error: 'Email already exists' });
            } else {
                const createCustomer = await customerModel.create({
                    name: name.trim(),
                    email: email.trim(),
                    password: await bcrypt.hash(password, 10),
                    method: 'manualy'
                })
                await sellerCustomerModel.create({
                    myId: createCustomer.id
                })
                const token = await createToken({
                    id: createCustomer.id,
                    name: createCustomer.name,
                    email: createCustomer.email,
                    method: createCustomer.method
                })
                res.cookie('customerToken', token, {
                    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                })
                responseReturn(res, 201, { message: 'Successfully signed up', token });
            }
        } catch (error) {
            responseReturn(res, 500, { error: 'Internal Server Error' });
        }
    }

    customer_login = async function (req, res) {
        const { email, password } = req.body;

        try {
            const customer = await customerModel.findOne({email})
                .select('+password')
            if (customer) {
                const match = await bcrypt.compare(password, customer.password)
                if (match) {
                    const token = await createToken({
                        id: createCustomer.id,
                        name: createCustomer.name,
                        email: createCustomer.email,
                        method: createCustomer.method
                    })
                    res.cookie('customerToken', token, {
                        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    })
                    responseReturn(res, 201, { message: 'Successfully logged', token });
                } else {
                    responseReturn(res, 404, {error: 'Passwords do not match'});
                }
            } else {
                responseReturn(res, 404, {error: 'Email not found'});
            }
        } catch (error) {
            responseReturn(res, 500, { error: 'Internal Server Error' });
        }
    }
}

module.exports = new CustomerAuthController()
