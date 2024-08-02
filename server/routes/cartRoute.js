const express=require('express');
const verifyToken = require('../middleware/verifyToken');
const { viewCart, addToCartById, editCart } = require('../controllers/cartController');

const router=express.Router();

router.get("/",verifyToken,viewCart);
router.post("/:id",verifyToken,addToCartById);
router.put("/",verifyToken,editCart)

module.exports=router;