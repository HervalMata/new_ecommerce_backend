const { responseReturn } = require('../../utils/response');
const sellerModel = require("../../models/sellerModel");

class SellerController {
    request_seller_get = async (req, res) => {
        const { page, searchValue, perPage } = req.query;

        try {
            let skipPage = 0
            if (perPage && page) {
                skipPage = parseInt(perPage, 10) * (parseInt(page, 10) - 1);
            }
            if (searchValue && page && perPage) {
                const sellers = await sellerModel.find({
                    $text: { $search: searchValue }
                }).skip(skipPage).limit(perPage).sort({ createdAt: -1 })
                const totalSeller = await sellerModel.find({
                    $text: { $search: searchValue }
                }).countDocuments()
                responseReturn(res, 200, {sellers: sellers, totalSeller: totalSeller})
            } else if (searchValue === '' && page && perPage) {
                const sellers = await sellerModel.find({})
                    .skip(skipPage).limit(perPage).sort({ createdAt: -1 })
                const totalSeller = await sellerModel.find({})
                    .countDocuments()
                responseReturn(res, 200, {sellers: sellers, totalSeller: totalSeller})
            } else {
                const sellers = await sellerModel.find({}).sort({ createdAt: -1 })
                const totalSeller = await sellerModel.find({})
                    .countDocuments()
                responseReturn(res, 200, {sellers: sellers, totalSeller: totalSeller})
            }
        } catch (error) {
            console.log(error)
            return responseReturn(res, 500, 'Internal Server Error' );
        }
    }

    get_seller = async (req, res) => {
        const { sellerId } = req.params;

        try {
            const seller = await sellerModel.findById(sellerId)
            responseReturn(res, 200, { seller })
        } catch (error) {
            console.log(error)
            return responseReturn(res, 500, 'Internal Server Error' );
        }
    }

    seller_status_update = async (req, res) => {
        const { sellerId, status } = req.body;

        try {
            await sellerModel.findByIdAndUpdate(id,{
                status
            })
            const seller = await sellerModel.findById(sellerId)
            responseReturn(res, 200, { seller, message: 'Stataus do Vendedor atualizado com sucesso!' });
        } catch (error) {
            console.log(error)
            return responseReturn(res, 500, 'Internal Server Error' );
        }
    }
}

module.exports = new SellerController();
