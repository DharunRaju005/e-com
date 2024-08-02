const mongoose=require("mongoose");

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true },
    }],
    totalPrice: { type: Number, required: true },
    shippingAddress: { 
        type: Map,
        of: String,
        required: true 
      },
    status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
    orderDate: { type: Date, default: Date.now },
    deliveryDate: { type: Date},
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
