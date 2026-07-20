/**
 * Dollars Food — Google Sheets order sync
 *
 * Setup:
 * 1. Create a new Google Sheet
 * 2. Extensions → Apps Script → paste this file → Save
 * 3. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the web app URL into Vercel env GOOGLE_SHEETS_WEBHOOK_URL
 * 5. Optional: set GOOGLE_SHEETS_SECRET in Vercel and SHEET_SECRET below
 */

var SHEET_NAME = 'Orders';
var SHEET_SECRET = '';

var HEADERS = [
  'Order ID',
  'Created',
  'Updated',
  'Status',
  'Customer Name',
  'Phone',
  'Address',
  'Items',
  'Subtotal',
  'Delivery Fee',
  'Total',
  'Payment Method',
  'Notes',
  'Source',
  'Business WhatsApp',
  'Customer WhatsApp'
];

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);

    if (SHEET_SECRET && payload.secret !== SHEET_SECRET) {
      return jsonResponse({ success: false, error: 'Unauthorized.' });
    }

    if (!payload.order || !payload.order.orderId) {
      return jsonResponse({ success: false, error: 'Missing order data.' });
    }

    var sheet = getOrCreateSheet_();
    var row = orderToRow_(payload.order);
    var rowIndex = findOrderRowIndex_(sheet, payload.order.orderId);

    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }

    return jsonResponse({ success: true, orderId: payload.order.orderId, event: payload.event || 'updated' });
  } catch (error) {
    return jsonResponse({ success: false, error: String(error) });
  }
}

function getOrCreateSheet_() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }

  return sheet;
}

function orderToRow_(order) {
  return [
    order.orderId,
    order.createdAt,
    order.updatedAt,
    order.status,
    order.customerName,
    order.phone,
    order.address,
    order.items,
    order.subtotal,
    order.deliveryFee,
    order.total,
    order.paymentMethod,
    order.notes || '',
    order.source,
    order.businessWhatsApp,
    order.customerWhatsApp
  ];
}

function findOrderRowIndex_(sheet, orderId) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return -1;
  }

  var values = sheet.getRange(2, 1, lastRow, 1).getValues();
  for (var i = 0; i < values.length; i += 1) {
    if (String(values[i][0]) === String(orderId)) {
      return i + 2;
    }
  }

  return -1;
}

function jsonResponse(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(
    ContentService.MimeType.JSON
  );
}
