const PAYSTACK_BASE_URL = 'https://api.paystack.co';

function requirePaystack() {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    const error = new Error('Paystack is not configured. Add PAYSTACK_SECRET_KEY in production.');
    error.statusCode = 503;
    throw error;
  }
}

export async function initializePaystackTransaction({ email, amount, reference, callbackUrl, metadata, subaccount }) {
  requirePaystack();
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: Math.round(Number(amount) * 100),
      reference,
      callback_url: callbackUrl,
      metadata,
      ...(subaccount ? {
        subaccount,
        bearer: process.env.PAYSTACK_FEE_BEARER || 'subaccount',
        ...(Number(process.env.PLATFORM_FEE_PERCENT || 0) > 0
          ? { transaction_charge: Math.round(Number(amount) * 100 * (Number(process.env.PLATFORM_FEE_PERCENT || 0) / 100)) }
          : {}),
      } : {}),
    }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.status) {
    const error = new Error(payload.message || 'Unable to initialize payment');
    error.statusCode = response.status || 400;
    throw error;
  }
  return payload.data;
}

export async function createPaystackSubaccount({ businessName, bankCode, accountNumber, contact }) {
  requirePaystack();
  const response = await fetch(`${PAYSTACK_BASE_URL}/subaccount`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      business_name: businessName,
      settlement_bank: bankCode,
      account_number: accountNumber,
      percentage_charge: Number(process.env.PLATFORM_FEE_PERCENT || 0),
      primary_contact_name: contact?.name,
      primary_contact_email: contact?.email,
      primary_contact_phone: contact?.phone,
    }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.status) {
    const error = new Error(payload.message || 'Unable to configure settlement account');
    error.statusCode = response.status || 400;
    throw error;
  }
  return payload.data;
}

export async function listPaystackBanks() {
  requirePaystack();
  const response = await fetch(`${PAYSTACK_BASE_URL}/bank?country=nigeria&currency=NGN&perPage=100`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  });
  const payload = await response.json();
  if (!response.ok || !payload.status) {
    const error = new Error(payload.message || 'Unable to load banks');
    error.statusCode = response.status || 400;
    throw error;
  }
  return payload.data.map(bank => ({ name: bank.name, code: bank.code }));
}

export async function verifyPaystackTransaction(reference) {
  requirePaystack();
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  });
  const payload = await response.json();
  if (!response.ok || !payload.status) {
    const error = new Error(payload.message || 'Unable to verify payment');
    error.statusCode = response.status || 400;
    throw error;
  }
  return payload.data;
}
