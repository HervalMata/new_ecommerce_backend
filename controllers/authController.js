class AuthController {
    admin_login = async (req, res, next) => {
        console.log(req.body)
    }
}

module.exports = new AuthController
