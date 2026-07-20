function formatPrice(amount) {
  return '$' + Number(amount || 0).toFixed(2);
}

function buildOrderMessage(order) {
  const lines = [
    'NEW ORDER - Dollars Food',
    '------------------------',
    'Time: ' + new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })
  ];

  if (order.name) lines.push('Name: ' + order.name);
  if (order.phone) lines.push('Customer Phone: ' + order.phone);
  if (order.address) lines.push('Address: ' + order.address);
  lines.push('Payment: Cash on Delivery');

  if (Array.isArray(order.items) && order.items.length) {
    lines.push('', 'Items:');
    order.items.forEach(function (item) {
      const qty = item.quantity || 1;
      const price = Number(item.price || 0);
      lines.push('- ' + item.name + ' x' + qty + ' (' + formatPrice(price * qty) + ')');
    });
  }

  if (order.note) lines.push('', 'Note: ' + order.note);
  if (order.total !== undefined && order.total !== null) {
    lines.push('', 'Total: ' + formatPrice(order.total));
  }

  lines.push('', 'New order received. Please confirm.');
  return lines.join('\n');
}

function normalizePhoneNumber(value) {
  return String(value || '').replace(/\D/g, '');
}

function validateOrder(order) {
  if (!order || typeof order !== 'object') {
    return 'Invalid order payload.';
  }
  if (!order.name || !String(order.name).trim()) {
    return 'Customer name is required.';
  }
  if (!order.phone || !String(order.phone).trim()) {
    return 'Customer phone is required.';
  }
  if (!order.address || !String(order.address).trim()) {
    return 'Delivery address is required.';
  }
  if (!Array.isArray(order.items) || order.items.length === 0) {
    return 'At least one order item is required.';
  }
  return null;
}

async function sendWhatsAppMessage(token, phoneId, to, body) {
  const response = await fetch('https://graph.facebook.com/v21.0/' + phoneId + '/messages', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'text',
      text: {
        preview_url: false,
        body: body
      }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data?.error?.message || 'WhatsApp API request failed.';
    throw new Error(errorMessage);
  }

  return data;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const ownerNumber = normalizePhoneNumber(process.env.MY_WHATSAPP_NUMBER);

  if (!token || !phoneId || !ownerNumber) {
    return res.status(500).json({
      success: false,
      error: 'WhatsApp API is not configured. Set WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, and MY_WHATSAPP_NUMBER.'
    });
  }

  const order = req.body || {};
  const validationError = validateOrder(order);

  if (validationError) {
    return res.status(400).json({ success: false, error: validationError });
  }

  try {
    const message = buildOrderMessage(order);
    const result = await sendWhatsAppMessage(token, phoneId, ownerNumber, message);

    return res.status(200).json({
      success: true,
      messageId: result.messages?.[0]?.id || null
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      error: error.message || 'Failed to send WhatsApp notification.'
    });
  }
};
