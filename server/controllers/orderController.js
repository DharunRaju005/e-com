const express=require('express');
const Order=require('../models/order');

const getOrder=async(req,res)=>{
    const userId=await req.user.id;
    try{
        const orders=await Order.find({user:userId});
        if(!orders){
            return res.status(401).json({message:"No order are there"});
        }
        return res.status(200).json(orders);

    }
    catch(err){
        return res.status(500).json({message:"Internal server Error"});
    }
}


module.exports={getOrder};