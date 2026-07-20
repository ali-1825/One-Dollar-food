import { formatBusinessOrderMessage } from './formatBusinessMessage';
import type { ValidatedOrder } from '../types/order';
import type { StoredOrder } from '../types/stored-order';
import {
  createFailedNotification,
  createNotConfiguredNotification,
  createSentNotification
} from '../types/stored-order';
import {
  getBusinessWhatsAppNumber,
  getCustomerTemplateConfig,
  isWhatsAppConfigured,
  sendWhatsAppTemplateMessage,
  sendWhatsAppTextMessage
} from '../services/whatsapp';

export async function processOrderNotifications(
  storedOrder: StoredOrder,
  validated: ValidatedOrder
): Promise<StoredOrder> {
  if (!isWhatsAppConfigured()) {
    console.info('[order] WhatsApp integration is not configured; skipping notifications.', {
      orderId: storedOrder.id
    });

    storedOrder.notifications.business = createNotConfiguredNotification();
    storedOrder.notifications.customer = createNotConfiguredNotification();
    return storedOrder;
  }

  const businessNumber = getBusinessWhatsAppNumber();
  if (businessNumber) {
    const businessResult = await sendWhatsAppTextMessage({
      to: businessNumber,
      body: formatBusinessOrderMessage(validated)
    });

    storedOrder.notifications.business = businessResult.success
      ? createSentNotification(businessResult.providerMessageId)
      : createFailedNotification(businessResult.error);
  } else {
    storedOrder.notifications.business = createFailedNotification(
      'Business WhatsApp number is not configured.'
    );
  }

  const customerTemplate = getCustomerTemplateConfig();
  if (customerTemplate) {
    const customerResult = await sendWhatsAppTemplateMessage({
      to: validated.normalizedPhone,
      templateName: customerTemplate.name,
      languageCode: customerTemplate.language,
      bodyParameters: [
        validated.orderId,
        validated.customerName,
        validated.totalPkr.toFixed(2),
        validated.paymentMethod
      ]
    });

    storedOrder.notifications.customer = customerResult.success
      ? createSentNotification(customerResult.providerMessageId)
      : createFailedNotification(customerResult.error);
  } else {
    storedOrder.notifications.customer = createFailedNotification(
      'Customer WhatsApp template is not configured.'
    );
  }

  return storedOrder;
}
