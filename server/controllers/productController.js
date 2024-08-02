const { uploadImgToFirebase } = require("../config/firebaseAdmin");
const Product=require("../models/product");

const getAllProducts=async(req,res)=>{
    try{
        const products=await Product.find();
        if(products.length!=0){
            return res.status(200).json(products)
        }
        return res.status(404).json({message:"No productS fount"})
    }
    catch(err){
        return res.status(500).json({message:"Internal Server Error",err});
    }
}

const getProductById=async(req,res)=>{
    const {id}=req.params;
    console.log(id);

    try{
        const product=await Product.findOne({_id:id});
        console.log(product);
        if(product){
            return res.status(200).json(product);
        }
        return res.status(404).json({message:"No such product found"})
    }
    catch(err){
        return res.status(500).json({message:"Internal Server Error",error:err.message});
    }
}

const createProduct=async(req,res)=>{
    try{
        const userId=req.user.id;
        const{name,description,category,price,stock,brandName}=req.body;
        const imageURLs=[];
        for(const file of req.files){
            console.log(file);
            const imageURL=await uploadImgToFirebase(file,file.originalname);
            imageURLs.push(imageURL);
        }

        const newProduct=await Product.create({
            name,
            description,
            category,
            price,
            stock,
            imageURLs,
            merchant:userId,
            brandName
        })
        if(newProduct){
            return res.status(201).json({message:"Product Created Successfully",product:newProduct});
        }
        return res.status(400).json({message:"Product can't be created"})
    }
    catch(err){
        return res.status(500).json({message:"Internal Server error",error:err.message})
    }
}

const getCategory=async(req,res)=>{
    try{ 
        const {category}=req.params;
        const products=await Product.find({category:category})
        if(products.length>0){
            return res.status(200).json(products);
        }
        return res.status(404).json({message:`No such category found or no products in that {category}`});
    }
    catch(err){
        return res.status(500).json({message:err.message});
    }

}

const getByName=async(req,res)=>{
    const {name}=req.params;
    console.log(name);
    try{
        const products=await Product.find({
            $or: [
            { name: name },
            { brandName: name }
        ]});
        //console.log(products);
        if(products.length>0){
            return res.status(200).json(products);
        }
        return res.status(404).json({message:"No such product found"})
    }
    catch(err){
        return res.status(500).json({message:err});
    }
}

const updateProductById=async(req,res)=>{
    const {id}=req.params;
    const userId=req.user.id;
    const{name,description,category,price,stock,merchant,brandName,imageURLs}=req.body;
    try{
        const product=await Product.findOne({_id:id});
        if(product){
            if(!(product.merchant==userId)){
                return res.status(401).json({message:"You don't have any acesss to update this product"})
            }
            product.name=name||product.name;
            product.description=description||product.description;
            product.category=category||product.category;
            product.price=price||product.price;
            product.stock=stock||product.stock;
            product.name=name||product.name;
            product.merchant=merchant||product.merchant;
            product.brandName=brandName||product.brandName;
              // Append new imageURLs to existing ones
            if (Array.isArray(imageURLs)) {
                product.imageURLs = [...product.imageURLs, ...imageURLs];
            }
            const updated=await product.save();
            return res.status(200).json(updated);
        }

        return res.status(204).json({message:"No such product found"});       
    }
    catch(err){
        console.log(err);
        return res.status(500).json({error:err});
    }
}

const deleteProductById=async(req,res)=>{
    const {id}=req.params;
    const userId=req.user.id;
    try{

        const product=await Product.findOne({_id:id});
        if(product){
             if(product.merchant==userId){
                await Product.deleteOne({_id:id});
                console.log(product);
                return res.status(200).json({message:"Product successfully Deleted",deletedProduct:product});
            }
            return res.status(401).json({message:"You can't delete this product, unautherised request"});
        }
        return res.status(404).json({message:"No such product found"});
    }
    catch(err){
        return res.status(500).json({error:err});
    }
}

const calAvg=(comments)=>{
    const totalRatings = comments.length;
    if (totalRatings === 0) return 0;
    const sumRatings = comments.reduce((sum, comment) => sum + comment.rating, 0);
    return sumRatings / totalRatings;
}

const addProductCommentById=async(req,res)=>{
    const{id}=req.params;
    const{commentData,rating}=req.body;
    console.log(rating);
    console.log(req.user);
    const userId=req.user.id;
    try{
        const product=await Product.findOne({_id:id});
        if(!product){
            return res.status(204).json({message:"No such product Found"});
        }
        const existing=product.comments.find(item => item.user == userId);
        // console.log(existing);
        if(existing){
            return res.status(401).json({message:"You already commented for this product"})
        }
        product.comments.push({
            comment: commentData,
            user: userId,
            rating:rating
        });
        console.log(product.comments);
        product.avgRating=calAvg(product.comments);
        const added=await product.save();
       
        return res.status(201).json({message:"Comment added successfully",product:added})
    }
    catch(err){
        return res.status(500).json({message:err.message});
    }
}

const deleteProductCommentById=async(req,res)=>{
    const {id}=req.params;
    const userId=req.user.id;
    try{
        const product=await Product.findOne({_id:id});
        if(!product){
            return res.status(204).json("No such product found");
        }
        const commentIndex=product.comments.findIndex(item=> item.user==userId);
        if(commentIndex==-1){
            return res.status(401).json({message:"You don't have any comment"})
        }
        product.comments.splice(commentIndex, 1);
        await product.save();
        return res.status(200).json({message:"Comment deleted successfully"});
    }
    catch(err){
        return res.status(500).json({message:err.message});
    }
}

const updateProductCommentById=async(req,res)=>{
    const{id}=req.params;
    const userId=req.user.id;
    const {commentData}=req.body;
    try{
        const product=await Product.findOne({_id:id});
        if(!product){
            return res.status(204).json({message:"No such product found"});
        }
        const commentIndex=product.comments.findIndex(item=> item.user==userId);
        if(commentIndex==-1){
            return res.status(401).json({message:"You don't have any comment"})
        }
        product.comments[commentIndex].comment=commentData;
        await product.save();
        return res.status(200).json({updatedProduct:product});

    }
    catch(err){
        return res.status(500).json({message:err.code})
    }
}

const filterProduct = async (req, res) => {
    const { start, end, brandName, increasing } = req.body;
    let query = {};
    console.log(increasing);
    if (brandName) {
        query.brandName = brandName;
    }
    if (start !== undefined && end !== undefined) {
        query.price = { $gte: start, $lte: end };
    }

    try {
        const products = await Product.find(query).sort({price:(increasing=="true")?1:-1});
        if (products.length === 0) {
            return res.status(204).json({ message: "No products found" });
        }
        return res.status(200).json(products);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};


module.exports={getAllProducts,getProductById,createProduct,getCategory,getByName,updateProductById,deleteProductById,addProductCommentById,deleteProductCommentById,updateProductCommentById,filterProduct};