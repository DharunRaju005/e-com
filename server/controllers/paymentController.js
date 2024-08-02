const Cart = require('../models/cart');
const Payment = require('../models/payment');
const Order = require('../models/order');
const Product = require('../models/product');
const { sendEmail } = require('../utils/emailService');
const {sendInvoice}=require('../utils/sendInvoice')
const dotenv = require('dotenv');

dotenv.config();
// stripe listen --forward-to localhost:5000/payment/webhook

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const makePayment = async (req, res) => {
    const userId = req.user.id;
    const { shippingAddress } = req.body;
    try {
        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!cart) return res.status(400).json({ message: "No products are in the cart" });

        const lineItems = cart.items.map(item => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.product.name,
                    description: item.product.description || ''
                },
                unit_amount: item.product.price * 100,
            },
            quantity: item.quantity
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: "http://localhost:5000/success",
            cancel_url: "http://localhost:5000/cancel",
            shipping_address_collection: {
                allowed_countries: ['IN', 'US']
            },
            metadata: {
                userId: userId,
                shippingAddress: JSON.stringify(shippingAddress)
            }
        });
        console.log(session);
        return res.status(200).json({ id: session.id });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const webHook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;

            console.log(session);

            // Get the cart
            const cart = await Cart.findOne({ user: session.metadata.userId }).populate('items.product');
            if (!cart) return res.status(204).json({ message: "Your Cart is empty" });

            let customerId = session.customer; // Use customer ID from Stripe session
            if (!customerId) {
                // Create a new customer if none exists
                const customer = await stripe.customers.create({
                    email: session.customer_details.email,
                    name: session.customer_details.name,
                    address: session.customer_details.address,
                });
                customerId = customer.id;
            }

            const deliveryDate = new Date();
            deliveryDate.setDate(deliveryDate.getDate() + 7);

            // Create the order
            const order = await Order.create({
                user: session.metadata.userId,
                items: cart.items.map(item => ({
                    product: item.product._id,
                    quantity: item.quantity
                })),
                totalPrice: session.amount_total / 100,
                shippingAddress: session.shipping_details.address || '',
                deliveryDate: deliveryDate,
            });

            // Create a payment record
            await Payment.create({
                user: session.metadata.userId,
                paymentId: session.id,
                order: order._id,
                paymentMethod: session.payment_method_types[0],
                amount: session.amount_total / 100,
                status: 'completed',
                address: session.shipping_details.address || '',
                stripeCheckoutSessionId: session.id,
                stripePaymentIntentId: session.payment_intent
            });

            // Clear the cart
            await Cart.deleteOne({ user: session.metadata.userId });

            // Update product stock
            await Promise.all(
                cart.items.map(async item => {
                    await Product.findByIdAndUpdate(
                        item.product._id,
                        { $inc: { stock: -item.quantity } }
                    );
                })
            );

            // Finalize the order
            await Order.findByIdAndUpdate(order._id, { status: 'completed' });

            // Create invoice items
            for (const item of cart.items) {
                await stripe.invoiceItems.create({
                    customer: customerId,
                    amount: item.quantity * item.product.price * 100,
                    currency: 'usd',
                    description: item.product.name,
                });
            }

            const invoiceItems = cart.items.map(item => ({
                description: item.product.name,
                amount: item.product.price * item.quantity
            }));
            const invoiceUrl = await sendInvoice(session.customer_details.email, invoiceItems);
            const emailText = `
                Dear ${session.customer_details.name},

                Thank you for your purchase! Your order has been successfully placed.

                Order Details:
                Order ID: ${session.id}
                Total Price: ${session.amount_total / 100} USD
                Delivery Date: ${deliveryDate.toDateString()}

                Products:
                ${cart.items.map(item => `- ${item.product.name} x ${item.quantity}`).join('\n')}

                Shipping Address:
                ${session.shipping_details.address.line1}
                ${session.shipping_details.address.line2}
                ${session.shipping_details.address.city}, ${session.shipping_details.address.state} ${session.shipping_details.address.postal_code}
                ${session.shipping_details.address.country}

                An invoice has been generated for your purchase. You can view it [here](${invoiceUrl}).

                Thank you for shopping with us!

                Best regards,
                Your Company Name
            `;

            await sendEmail(session.customer_details.email, 'Order Confirmation and Invoice', emailText);

            return res.status(200).json({ message: "Payment successful and order placed" });
        } else {
            return res.status(400).json({ message: "Unhandled event type" });
        }
    } catch (err) {
        console.error('Error handling webhook event:', err.message);
        return res.status(500).json({ message: err.message });
    }
};

const getPayment=async(req,res)=>{
    const userId=req.user.userId;
    try{
        const payment=await Payment.find({user:userId});
        if(!payment) return res.status(401).json({message:"No Didn't purchased anything!!!"})
            console.log(payment);
        return res.status(200).json(payment);
    }
    catch(err){
        return res.status(500).json({message:err.message});
    }
}

module.exports = { makePayment, webHook,getPayment };
