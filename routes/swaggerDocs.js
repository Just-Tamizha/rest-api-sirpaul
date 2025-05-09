const swaggerUi = require("swagger-ui-express");
const userSwag = require("../swagger/userSwag.json");
const adminSwag = require("../swagger/adminSwag.json");
const express = require("express");
const router = express.Router();

router.use("/user", swaggerUi.serveFiles(userSwag, {}), swaggerUi.setup(userSwag));
router.use("/admin", swaggerUi.serveFiles(adminSwag, {}), swaggerUi.setup(adminSwag));

module.exports = router;
