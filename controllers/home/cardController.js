const cardModel = require("../../models/cardModel");
const {responseReturn} = require("../../utils/response");
const { mongo: {ObjectId} } = require("mongoose");

class cardController {
    add_to_card = async (req, res) => {
        const { userId, productId, quantity } = req.body;

        try {
            const product = await cardModel.findOne({
                $and: [{
                    productId: {
                        $eq: productId
                    }
                },
                    {
                        userId: {
                            $eq: userId
                        },
                    }
                ]
            });

            if (product) {
                responseReturn(res, 404, { error: "Product Already Added To Card" });
            } else {
                const product = await cardModel.create({
                    userId,
                    productId,
                    quantity
                })
                responseReturn(res, 200, { message: "Added To Card Successfully" , product});
            }
        } catch (error) {
            responseReturn(res, 500, { error: error });
        }
    }

    get_card_products = async (req, res) => {
        const co = 5
        const { userId } = req.params;

        try {
            const card_products = await cardModel.aggregate([{
                $match: {
                    userId: {
                        $eq: new ObjectId(userId)
                    }
                }
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "productId",
                        foreignField: "_id",
                        as: "products",
                    }
                }
            ])
            let buy_product_item = 0
            let calculatePrice = 0
            let card_product_count = 0

            const outOfStockProduct = card_products.filter(p => p.products[0].stock < p.quantity)

            for (let i = 0; i < outOfStockProduct.length; i++) {
                card_product_count = card_product_count + outOfStockProduct[i].quantity
            }

            const stockProduct = card_products.filter(p => p.products[0].stock >= p.quantity)

            for (let i = 0; i < stockProduct.length; i++) {
                const { quantity } = stockProduct[i]
                card_product_count = buy_product_item + quantity
                buy_product_item = buy_product_item + quantity
                const { price, discount } = stockProduct[i].products[0]
                if (discount !== 0) {
                    calculatePrice = calculatePrice + quantity * (price - Math.floor((price * discount) / 100))
                } else {
                    calculatePrice = calculatePrice + quantity * price
                }
            }
            let p = []
            let unique = [
                ...new Set(stockProduct.map((p) => p.products[0].sellerId.toString()))
            ]

            for (let j = 0; j < unique.length; j++) {
                let price = 0
                for (let i = 0; i < stockProduct.length; i++) {
                    const tempProduct = stockProduct[i].products[0]
                    if (unique[j] === tempProduct.sellerId.toString()) {
                        let pri = 0
                        if (tempProduct.discount !== 0) {
                            pri = tempProduct.price - Math.floor((tempProduct.price * tempProduct.discount) / 100)
                        } else {
                            pri = tempProduct.price
                        }
                        pri = pri - Math.floor((pri * co) / 100)
                        price = price + pri * stockProduct[i].quantity
                        p[j] = {
                            sellerId: unique[j],
                            shopName: tempProduct.shopName,
                            price,
                            products: p[j] ? [
                                ...p[j].products,
                                {
                                    _id: stockProduct[i]._id,
                                    quantity: stockProduct[i].quantity,
                                    productInfo: tempProduct
                                }
                            ] : [{
                                _id: stockProduct[i]._id,
                                quantity: stockProduct[i].quantity,
                                productInfo: tempProduct
                            }
                            ]
                        }
                    }
                }
            }
            responseReturn(res, 200, {
                card_products: p,
                price: calculatePrice,
                card_product_count,
                shipping_fee: 20 * p.length,
                outOfStockProduct,
                buy_product_item,
            });
        } catch (error) {
            responseReturn(res, 500, { error: error });
        }
    }

    delete_card_product = async (req, res) => {
        const { card_id } = req.params;

        try {
            await cardModel.findByIdAndDelete(card_id)
            responseReturn(res, 200, { error: "Product Deleted Successfully" });
        } catch (error) {
            responseReturn(res, 500, { error: error });
        }
    }

    quantity_inc = async (req, res) => {
        const { card_id } = req.params;

        try {
            const product = await cardModel.findById(card_id)
            const { quantity } = product
            await cardModel.findByIdAndUpdate(card_id, { quantity: quantity + 1 })
            responseReturn(res, 200, { error: "Product Quantity Updated Successfully" });
        } catch (error) {
            responseReturn(res, 500, { error: error });
        }
    }

    quantity_dec = async (req, res) => {
        const { card_id } = req.params;

        try {
            const product = await cardModel.findById(card_id)
            const { quantity } = product
            await cardModel.findByIdAndUpdate(card_id, { quantity: quantity - 1 })
            responseReturn(res, 200, { error: "Product Quantity Updated Successfully" });
        } catch (error) {
            responseReturn(res, 500, { error: error });
        }
    }
}

module.exports = new cardController()
