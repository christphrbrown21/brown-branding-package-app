import Stripe from 'stripe';

// Create an instance of the Stripe SDK. The secret key must never be
// exposed to clients; it should be configured in your deployment
// environment (e.g. Vercel Environment Variables).
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20'
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }
  try {
    // The client sends a package object with name and price
    const { pkg } = req.body;
    // Create a single line item. Stripe expects amounts in cents.
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: pkg.name },
            unit_amount: Math.round(pkg.price * 100)
          },
          quantity: 1
        }
      ],
      success_url: `${req.headers.origin}/?success=1`,
      cancel_url: `${req.headers.origin}/?canceled=1`
    });
    return res.status(200).json({ id: session.id });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Stripe error' });
  }
}
