const express=require('express');
const { getAllProducts,createProduct, getCategory, getProductById, getByName, updateProductById, deleteProductById, addProductCommentById,deleteProductCommentById, updateProductCommentById, filterProduct } = require('../controllers/productController');
const multer=require('multer');
const verifyToken=require("../middleware/verifyToken")

const storage=multer.memoryStorage();
const upload=multer({storage:storage});
const router=express.Router();



//image below is the field name in the form(client side)
router.post("/",upload.array('images',7),verifyToken,createProduct);
router.get("/",getAllProducts);
router.get("/id/:id",getProductById);
router.post("/:id/comment",verifyToken,addProductCommentById);
router.put("/:id/comment",verifyToken,updateProductCommentById);
router.delete("/:id/comment",verifyToken,deleteProductCommentById);
router.get("/category/:category",getCategory);
router.get("/:name",getByName);
router.put("/:id",upload.array('images',7),verifyToken,updateProductById);
router.delete("/:id",verifyToken,deleteProductById);
router.post("/filter",filterProduct);


module.exports=router;