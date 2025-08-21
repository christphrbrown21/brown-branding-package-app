import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe.js on the client. The publishable key is defined
// in your environment variables. Never expose your secret key in client code.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Pricing definitions for both full‑service and editing‑only packages.
// Prices are stored in USD and correspond to the package descriptions
// discussed with the user.
const PACKAGES = [
  // Full Service (filming + editing)
  { name: '1 reel', price: 250, group: 'Full Service' },
  { name: '2 reels', price: 400, group: 'Full Service' },
  { name: '4 reels', price: 600, group: 'Full Service' },
  { name: '8 reels', price: 1000, group: 'Full Service' },
  { name: '12 reels', price: 1500, group: 'Full Service' },
  // Editing Only (minimum purchase covers 1–4 reels)
  { name: '1–4 reels', price: 250, group: 'Editing Only' },
  { name: '8 reels', price: 300, group: 'Editing Only' },
  { name: '12 reels', price: 450, group: 'Editing Only' }
];

export default function Home() {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  // Trigger a checkout session using our API route. The API route
  // accepts a POST payload with the selected package and returns a
  // Checkout Session ID. We then redirect the user to Stripe Checkout.
  const checkout = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pkg: selected })
      });
      if (!response.ok) throw new Error('Checkout API failed');
      const data = await response.json();
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');
      await stripe.redirectToCheckout({ sessionId: data.id });
    } catch (err) {
      alert(err.message || 'Error during checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <img src="/logo.png" alt="Brown Branding" style={styles.logo} />
        <h1 style={styles.title}>Choose your package</h1>
        <div style={styles.columns}>
          {['Full Service', 'Editing Only'].map((group) => (
            <div key={group} style={styles.column}>
              <h2 style={styles.h2}>{group}</h2>
              {PACKAGES.filter((p) => p.group === group).map((p) => {
                const active =
                  selected && selected.name === p.name && selected.group === p.group;
                return (
                  <button
                    key={p.name}
                    onClick={() => setSelected(p)}
                    style={{
                      ...styles.option,
                      ...(active ? styles.optionActive : {})
                    }}
                  >
                    <span>{p.name}</span>
                    <span>${p.price}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <button
          onClick={checkout}
          disabled={!selected || loading}
          style={{
            ...styles.checkout,
            ...(!selected || loading ? styles.checkoutDisabled : {})
          }}
        >
          {loading ? 'Preparing checkout…' : 'Checkout with Stripe'}
        </button>
        <p style={styles.note}>
          * Editing‑only packages require a minimum block of 1–4 reels.
        </p>
      </div>
    </div>
  );
}

// Inline style object for minimalistic, macOS‑inspired UI. These styles
// ensure a clean layout with subtle shadows and generous spacing. Using
// a common font stack provides a native look across platforms.
const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fff',
    color: '#000',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
    padding: 24
  },
  card: {
    width: '100%',
    maxWidth: 960,
    border: '1px solid #e5e5e5',
    borderRadius: 20,
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
    padding: 28
  },
  logo: {
    width: 120,
    height: 'auto',
    marginBottom: 12
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    margin: '8px 0 20px'
  },
  columns: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16
  },
  column: {
    background: '#fafafa',
    borderRadius: 16,
    padding: 16,
    border: '1px solid #eee'
  },
  h2: {
    fontSize: 18,
    fontWeight: 700,
    margin: '0 0 10px'
  },
  option: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    borderRadius: 12,
    border: '1px solid #e5e5e5',
    background: '#fff',
    cursor: 'pointer',
    marginBottom: 10,
    transition: 'all .15s ease'
  },
  optionActive: {
    borderColor: '#0070f3',
    boxShadow: '0 0 0 3px rgba(0,112,243,.12)'
  },
  checkout: {
    marginTop: 24,
    width: '100%',
    padding: '16px 18px',
    borderRadius: 14,
    border: '1px solid #000',
    background: '#000',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer'
  },
  checkoutDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  note: {
    marginTop: 10,
    fontSize: 12,
    color: '#666'
  }
};
