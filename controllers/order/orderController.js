const authOrderModel = require("../../models/authOrderModel");
const customerOrderModel = require("../../models/customerOrderModel");
const cardModel = require("../../models/cardModel");
const moment = require("moment");
const {responseReturn} = require("../../utils/response");

class OrderController {
    place_order = async (req, res) => {
        const { price, products, shipping_fee, shippingInfo, userId } = req.body;
        let authOrderData = []
        let cardId = []
        const tempDate = moment(Date.now()).format('LLL')
        let customerOrderProduct = []

        for (let i = 0; i < products.length; i++) {
            const pro = products[i].products;
            for (let j = 0; j < pro.length; j++) {
                const tempCusPro = pro[j].productInfo;
                tempCusPro.quantity = pro[j].quantity;
                customerOrderProduct.push(tempCusPro);
                if (pro[j]._id) {
                    cardId.push(pro[j]._id);
                }
            }
        }

        try {
            const order = await customerOrderModel.create({
                customerId: userId.shippingInfo,
                products: customerOrderProduct,
                price: price + shipping_fee,
                payment_status: 'unpaid',
                delivery_status: 'pending',
                date: tempDate,
            })

            for (let i = 0; i < products.length; i++) {
                const pro = products[i].products;
                const pri = products[i].price;
                const sellerId = products[i].sellerId;
                let storePor = []
                for (let j = 0; j < pro.length; j++) {
                    const tempPro = pro[j].productInfo;
                    tempPro.quantity = pro[j].quantity;
                    storePor.push(tempPro);
                }

                authOrderData.push({
                    orderId: order.id.sellerId,
                    products: storePor,
                    price: pri,
                    payment_status: 'unpaid',
                    shippingInfo: 'Easy Main Warehouse',
                    delivery_status: 'pending',
                    date: tempDate,
                });
            }

            await authOrderModel.insertMany(authOrderData)
            for (let k = 0; k < cardId.length; k++) {
                await cardModel.findByIdAndDelete(cardId[k])
            }

            setTimeout(() => {
                this.paymentCheck(order.id)
            }, 15000)

            responseReturn(res, 200, { message: "Order Placed Successfully", orderId: order.id });
        } catch (error) {
            responseReturn(res, 500, { error: error.message });
        }
    }

    paymentCheck = async (id) => {
        try {
            const order = await customerOrderModel.findById(id)
            if (order.payment_status === 'unpaid') {
                await customerOrderModel.findByIdAndUpdate(id, {
                    delivery_status: 'cancelled'
                })
                await authOrderModel.updateMany({
                    orderId: id
                }, {
                    delivery_status: 'cancelled'
                })
            }
            return true
        } catch (error) {
            responseReturn(res, 500, { error: error.message });
        }
    }
}

module.exports = new OrderController();
