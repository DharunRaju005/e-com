const Product=require("../models/product");
const Cart=require("../models/cart");
const mongoose=require('mongoose');
const {objectId}=mongoose.Types;

const viewCart=async(req,res)=>{
    const userId=req.user.id;
    try{
        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        if(!cart){
            return res.status(204).json({message:"Opps! You don't have anything in the cart"});
        }
        // console.log(cart.items);  
        const cartItems = cart.items.map(item => ({
            productName: item.product.name,
            description: item.product.description,
            price: item.product.price,
            quantity: item.quantity,
            totalItemPrice: item.quantity * item.product.price
        }));

        return res.status(200).json({items:cartItems,total:cart.totalPrice});
    }
    catch(err){
        return res.status(500).json({message:err.message})
    }

}

const addToCartById=async(req,res)=>{
    const {id}=req.params;
    const userId=req.user.id;
    //console.log(user.id);
    //console.log(id);
    try{
        const product=await Product.findOne({_id:id});
        const stock=product.stock;
        // console.log('Product found:', product);
        if(product){
            console.log(product._id);
            // console.log(user.id);
            console.log("hello");
            const cart = await Cart.findOne({ user: userId });
            console.log(cart);
            if(cart){
                const existing=cart.items.find(item => item.product == id);
                // console.log("hello");

                if(existing){
                    if(stock>=existing.quantity+1){
                        existing.quantity+=1;
                    }else{
                        return res.status(400).json({message:`No Stocks Left for the product ${product.name}`});
                    }
                }else{
                    cart.items.push({product:id,quantity:1});
                }
                cart.totalPrice+=product.price;
                await cart.save();
                return res.status(200).json(cart);
            }
            else{
                console.log("hello");

                const newProduct=await Cart.create({
                    user:userId,
                    items:[{product:id,quantity:1}],
                    totalPrice:product.price
                })
                return res.status(201).json(newProduct);
            }
        }
        // console.log("hello");
        return res.status(204).json({message:"No such Product found"});
        }
        catch(err){
            return res.status(500).json({message:err.message});
        }


}


const editCart=async(req,res)=>{
    const userId=req.user.id;
    const{productId,quantity,action}=req.body;
    // console.log(productId);
    try{
        const cart=await Cart.findOne({user:userId}).populate('items.product');
        // console.log(cart);
        if(!cart){
            return res.status(204).json({message:"Cart does't exist"});
        }
        const objPId=new mongoose.Types.ObjectId(productId+"");
        // console.log();
        const productIndex=cart.items.findIndex(item => (item.product._id.equals(objPId)));
        console.log("Index"+productIndex);
        if(action=='edit'){
            const parsedQuantity = parseInt(quantity, 10); 
            // Ensure quantity is parsed as a base-10 integer
            // if(parsedQuantity==0) return res.status(400).json({message:""})
            if(productIndex!=-1){
                cart.items[productIndex].quantity-=parsedQuantity;
            }
            else{
                return res.status(404).json({ message: "Product not found in cart" });
            }
        }
        else if(action=='remove'){
            if(productIndex!=-1){
                cart.items.splice(productIndex,1);
            }
            else{
                return res.status(404).json({message:"Product not found in the cart"});
            }
        }
        else{
            return res.status(400).json({message:"Invalid Action"});
        }
        // Recalculate total price
        cart.totalPrice = cart.items.reduce((total, item) => {
                return total + item.product.price * item.quantity;
        }, 0);
        await cart.save();
        return res.status(200).json(cart);
    }
    catch(err){
        return res.status(500).json({message:err.message});
    }
}


module.exports={addToCartById,viewCart,editCart};