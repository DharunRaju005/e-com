const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  stripePaymentIntentId: { 
    type: String, 
    required: true 
  },
  stripeCheckoutSessionId: { 
    type: String, 
    required: true 
  },
  paymentMethod: { 
    type: String, 
    required: true 
  },
  paymentDate: { 
    type: Date, 
    default: Date.now 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ["pending", "completed", "failed"], 
    default: "pending" 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true 
  },
  address: { 
    type: Map,
    of: String,
    required: true 
  },
  order: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Order" 
  }
});


paymentSchema.methods.completePayment = async (orderId)=> {
  if (this.status === "completed") {
    this.order = orderId;
    await this.save();
  }
};

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
