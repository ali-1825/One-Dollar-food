import { google } from 'googleapis';

export const GOOGLE_SHEETS_HEADERS = [
  'Order ID',
  'Customer Name',
  'Phone Number',
  'Address',
  'City',
  'Ordered Items',
  'Quantity',
  'Total Amount',
  'Payment Method',
  'Order Status',
  'Date',
  'Time'
] as const;

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function normalizePrivateKey(rawKey: string): string {
  return rawKey.replace(/\\n/g, '\n').trim();
}

export function isGoogleSheetsServiceConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim() &&
      process.env.GOOGLE_SHEETS_CLIENT_EMAIL?.trim() &&
      process.env.GOOGLE_SHEETS_PRIVATE_KEY?.trim()
  );
}

function getSheetName(): string {
  return process.env.GOOGLE_SHEETS_SHEET_NAME?.trim() || 'Sheet1';
}

function getSheetsClient() {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL?.trim();
  const privateKey = normalizePrivateKey(process.env.GOOGLE_SHEETS_PRIVATE_KEY || '');

  if (!clientEmail || !privateKey) {
    throw new Error('Google Sheets service account credentials are missing.');
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES
  });

  return google.sheets({ version: 'v4', auth });
}

async function ensureHeaderRow(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  sheetName: string
): Promise<void> {
  const headerRange = `'${sheetName}'!A1:L1`;
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: headerRange
  });

  const firstCell = existing.data.values?.[0]?.[0];
  if (firstCell === GOOGLE_SHEETS_HEADERS[0]) {
    return;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: headerRange,
    valueInputOption: 'RAW',
    requestBody: {
      values: [Array.from(GOOGLE_SHEETS_HEADERS)]
    }
  });
}

export async function appendRowToGoogleSheet(row: Array<string | number>): Promise<void> {
  if (!isGoogleSheetsServiceConfigured()) {
    return;
  }

  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim();
  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID is not configured.');
  }

  const sheetName = getSheetName();
  const sheets = getSheetsClient();

  await ensureHeaderRow(sheets, spreadsheetId, sheetName);

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${sheetName}'!A:L`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [row]
    }
  });
}
