const { signup, login, logout,editProfile } = require("../controllers/userController");
const express = require("express");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout",verifyToken,logout);
router.post("/profile",verifyToken,editProfile);

module.exports = router;
