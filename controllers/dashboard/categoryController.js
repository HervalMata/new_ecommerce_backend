const formidable = require("formidable");
const {responseReturn} = require("../../utils/response");
const cloudinary = require("cloudinary").v2;
const categoryModel = require("../../models/categoryModel");

class CategoryController {
    add_category = async (req, res) => {
        const form = formidable()
        form.parse(req, async (err, fields, files) => {
            if (err) {
                responseReturn(res, 404, { error: 'Algo deu errado' });
            } else {
                let { name } = fields;
                let { image } = files
                if (typeof name !== "string" || !name.trim() || !image?.filepath) {
                    return responseReturn(res, 400, { error: 'Please fill all required fields' });
                }
                name = name.trim()
                const slug = name.split(' ').join('-')

                cloudinary.config({
                    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                    api_key: process.env.CLOUDINARY_API_KEY,
                    api_secret: process.env.CLOUDINARY_API_SECRET,
                    secure: true
                })

                try {
                    const result = await cloudinary.uploader.upload(image.filepath, { folder: 'categories' })
                    if (result) {
                        const category = await categoryModel.create({
                            name,
                            slug,
                            image: result?.url
                        })
                        responseReturn(res, 201, { category, message: 'Categoria criado com sucesso!' });
                    } else {
                        responseReturn(res, 404, { error: 'Image upload file' });
                    }
                } catch (error) {
                    responseReturn(res, 500, 'Internal Server Error' );
                }
            }
        })
    }

    get_category = async (req, res) => {
        const { page, searchValue, perPage } = req.query;

        try {
            let skipPage = 0
            if (perPage && page) {
                skipPage = parseInt(perPage, 10) * (parseInt(page, 10) - 1);
            }
            if (searchValue && page && perPage) {
                const categories = await categoryModel.find({
                    $text: { $search: searchValue }
                }).skip(skipPage).limit(perPage).sort({ createdAt: -1 })
                const totalCategory = await categoryModel.find({
                    $text: { $search: searchValue }
                }).countDocuments()
                responseReturn(res, 200, {categories: categories, totalCategory: totalCategory})
            } else if (searchValue === '' && page && perPage) {
                const categories = await categoryModel.find({})
                    .skip(skipPage).limit(perPage).sort({ createdAt: -1 })
                const totalCategory = await categoryModel.find({})
                    .countDocuments()
                responseReturn(res, 200, {categories: categories, totalCategory: totalCategory})
            } else {
                const categories = await categoryModel.find({}).sort({ createdAt: -1 })
                const totalCategory = await categoryModel.find({})
                    .countDocuments()
                responseReturn(res, 200, {categories: categories, totalCategory: totalCategory})
            }
        } catch (error) {
            console.log(error)
            return responseReturn(res, 500, 'Internal Server Error' );
        }
    }
}

module.exports = new CategoryController();
