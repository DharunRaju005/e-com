const mongoose=require("mongoose");

const userSchema=new mongoose.Schema({
    email:{type:String,required:true,unique:true},
    name:{type:String,required:true},
    password:{type:String,required:true},
    role: { type: String, enum: ['customer', 'merchant']},
    address: {type:String,required:true,default:""}, // only for customers
    phone: {type:String,required:true,default:""},   // only for customers
    brandName: {type:String,default:""},  // only for merchants
    paymentMethod:{type:[String],required:true,default:[]},//only for merchant
});

const user=mongoose.model('User',userSchema);

module.exports=user;