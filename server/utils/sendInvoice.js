const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const CUSTOMERS = [];  // Use a real database in production
const PRICES = {
    basic: 'price_123456789',  // Replace with your actual price IDs
    professional: 'price_987654321'
};

const sendInvoice = async function (email, items) {
    let customer = CUSTOMERS.find(c => c.email === email);
    let customerId;
    
    if (!customer) {
        customer = await stripe.customers.create({
            email,
            description: 'Customer to invoice',
        });
        CUSTOMERS.push({ stripeId: customer.id, email: email });
        customerId = customer.id;
    } else {
        customerId = customer.stripeId;
    }

    // Create invoice
    const invoice = await stripe.invoices.create({
        customer: customerId,
        collection_method: 'send_invoice',
        days_until_due: 30,
    });

    // Create invoice items
    for (const item of items) {
        await stripe.invoiceItems.create({
            customer: customerId,
            amount: item.amount * 100,  // Amount in cents
            currency: 'usd',
            description: item.description,
            invoice: invoice.id
        });
    }

    // Finalize and send invoice
    await stripe.invoices.finalizeInvoice(invoice.id);
    await stripe.invoices.sendInvoice(invoice.id);

    return invoice.hosted_invoice_url;
};

module.exports={sendInvoice}