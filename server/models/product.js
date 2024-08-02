const mongoose=require("mongoose");

const commentSchema=new mongoose.Schema({
    
    comment:{
        type:String,
        required:true
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        unique:true,
        required:true
    },
    rating:{
        type:Number,
        required:true,
        min:0,
        max:5
    }
})

const productSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    category:{
        type:String,
        enum:['Electronic','Clothing','Books','Sports'],
        required:true
    },
    price:{
        type:Number,
        required:true,
        min:0
    },
    stock:{
        type:Number,
        required:true,
        min:0
    },
    imageURLs:{
        type:[String],
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    merchant:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required: true
    },
    brandName:{
        type:String,
        required:true,
    },
    comments:[commentSchema],
    avgRating:{
        type:Number,
        required:true,
        default:0
    }

});

const Product =mongoose.model('Product',productSchema);

module.exports=Product;