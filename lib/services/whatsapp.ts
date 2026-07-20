export interface WhatsAppSendResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  apiVersion: string;
}

interface TemplateParameter {
  type: 'text';
  text: string;
}

interface SendTemplateOptions {
  to: string;
  templateName: string;
  languageCode: string;
  bodyParameters: string[];
}

interface SendTextOptions {
  to: string;
  body: string;
}

interface WhatsAppApiResponse {
  messages?: Array<{ id?: string }>;
  error?: {
    message?: string;
    type?: string;
    code?: number;
  };
}

function getWhatsAppConfig(): WhatsAppConfig | null {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';

  if (!accessToken || !phoneNumberId) {
    return null;
  }

  return {
    accessToken,
    phoneNumberId,
    apiVersion
  };
}

function getMessagesUrl(config: WhatsAppConfig): string {
  return `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;
}

async function postWhatsAppPayload(payload: Record<string, unknown>): Promise<WhatsAppSendResult> {
  const config = getWhatsAppConfig();

  if (!config) {
    return {
      success: false,
      error: 'WhatsApp API is not configured on the server.'
    };
  }

  try {
    const response = await fetch(getMessagesUrl(config), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = (await response.json()) as WhatsAppApiResponse;

    if (!response.ok) {
      console.error('[whatsapp] provider error', {
        status: response.status,
        error: data?.error?.message || 'Unknown WhatsApp API error',
        type: data?.error?.type,
        code: data?.error?.code
      });

      return {
        success: false,
        error: data?.error?.message || 'WhatsApp API request failed.'
      };
    }

    return {
      success: true,
      providerMessageId: data.messages?.[0]?.id
    };
  } catch (error) {
    console.error('[whatsapp] request failed', {
      message: error instanceof Error ? error.message : 'Unknown error'
    });

    return {
      success: false,
      error: 'WhatsApp API request failed.'
    };
  }
}

export async function sendWhatsAppTemplateMessage(
  options: SendTemplateOptions
): Promise<WhatsAppSendResult> {
  const parameters: TemplateParameter[] = options.bodyParameters.map(function (value) {
    return {
      type: 'text',
      text: value.slice(0, 1024)
    };
  });

  return postWhatsAppPayload({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: options.to,
    type: 'template',
    template: {
      name: options.templateName,
      language: {
        code: options.languageCode
      },
      components: [
        {
          type: 'body',
          parameters
        }
      ]
    }
  });
}

export async function sendWhatsAppTextMessage(options: SendTextOptions): Promise<WhatsAppSendResult> {
  return postWhatsAppPayload({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: options.to,
    type: 'text',
    text: {
      preview_url: false,
      body: options.body.slice(0, 4096)
    }
  });
}

export function getBusinessWhatsAppNumber(): string | null {
  const rawNumber = process.env.BUSINESS_WHATSAPP_NUMBER;
  if (!rawNumber) {
    return null;
  }

  const digits = rawNumber.replace(/\D/g, '');
  return digits || null;
}

export function getCustomerTemplateConfig(): { name: string; language: string } | null {
  const name = process.env.WHATSAPP_CUSTOMER_TEMPLATE_NAME;
  if (!name) {
    return null;
  }

  return {
    name,
    language: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US'
  };
}

export function isWhatsAppConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN &&
      process.env.WHATSAPP_PHONE_NUMBER_ID &&
      process.env.BUSINESS_WHATSAPP_NUMBER
  );
}
