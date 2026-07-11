import { ReceiptOrder } from './receipt-formatting'

/**
 * Kitchen slip: what the cook needs and nothing else — big ticket number,
 * items and quantities in a large font, no prices. Printed automatically to
 * the kitchen printer the moment an order is paid.
 */
export function generateKitchenTicketHTML(order: ReceiptOrder): string {
  const time = new Date(order.createdAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })

  const ticketNumber = order.orderNumber
    ? `#${String(order.orderNumber).padStart(3, '0')}`
    : `#${order.id}`

  const groupsSection = order.groups
    .map(
      (group, index) => `
      <div class="group">
        ${order.groups.length > 1 ? `<div class="group-header">— Group ${index + 1} —</div>` : ''}
        ${group.items
          .map(
            (item) => `
          <div class="item">
            <span class="qty">${item.quantity}×</span>
            <span class="name">${item.foodName}</span>
          </div>
        `
          )
          .join('')}
      </div>
    `
    )
    .join('<div class="divider"></div>')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Kitchen Ticket</title>
      <style>
        @page { margin: 0; size: 80mm auto; }
        body {
          font-family: 'Courier New', monospace;
          width: 70mm;
          margin: 0;
          padding: 2mm;
        }
        .header { text-align: center; margin-bottom: 6px; }
        .ticket-number { font-size: 34px; font-weight: bold; }
        .meta { font-size: 12px; margin-top: 2px; }
        .divider { border-top: 2px dashed #000; margin: 6px 0; }
        .group-header { text-align: center; font-size: 13px; font-weight: bold; margin: 4px 0; }
        .item { display: flex; margin: 5px 0; font-size: 17px; font-weight: bold; }
        .qty { width: 38px; }
        .name { flex: 1; }
        .footer { text-align: center; font-size: 12px; margin-top: 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="ticket-number">${ticketNumber}</div>
        <div class="meta">${time}${order.cashierName ? ` · ${order.cashierName}` : ''}</div>
        ${order.specialOrder ? '<div class="meta"><b>*** SPECIAL ORDER ***</b></div>' : ''}
      </div>
      <div class="divider"></div>
      ${groupsSection}
      <div class="divider"></div>
      <div class="footer">KITCHEN COPY</div>
    </body>
    </html>
  `
}
