import { OrderWithDetails } from './server/types'

// The order as printed: what the local server returns after creating an order
export type ReceiptOrder = Pick<
  OrderWithDetails,
  'id' | 'createdAt' | 'total' | 'subTotal' | 'serviceFee' | 'specialOrder' | 'payments' | 'groups'
>

export function generateReceiptHTML(order: ReceiptOrder): string {
  const date = new Date(order.createdAt).toLocaleString()

  const paymentMethodsSection = `
  <div class="payment-methods">
  <div class="group-header">Payment Details</div>
  ${order.payments
    .map(
      (payment) => `
    <div class="item">
    <span class="item-name">${payment.paymentMethod}</span>
    <span class="item-amount">₦${payment.amount.toLocaleString()}</span>
    </div>
    `
    )
    .join('')}
  <div class="divider"></div>
  </div>
`

  // Calculate subtotal if not directly provided
  const subtotal = order.subTotal || order.groups.reduce((sum, group) => sum + group.total, 0)
  const hasserviceFee = order.serviceFee && order.serviceFee > 0

  // Create the summary section with conditional service charge
  const summarySection = `
  <div class="summary">
    <div class="item">
      <span class="item-name">Subtotal</span>
      <span class="item-amount">₦${subtotal.toLocaleString()}</span>
    </div>
    ${
      hasserviceFee
        ? `
    <div class="item">
      <span class="item-name">Service Charge</span>
      <span class="item-amount">₦${order.serviceFee.toLocaleString()}</span>
    </div>
    `
        : ''
    }
    <div class="divider"></div>
  </div>
  `

  // Add special order note if applicable
  const specialOrderNote = order.specialOrder
    ? `
  <div class="special-order">
    <div class="special-order-text">*** SPECIAL ORDER ***</div>
  </div>
  `
    : ''

  const receiptHTML = `
    <!DOCTYPE html>
    <html>
     <head>
      <title>Receipt</title>
      <style>
        @page {
          margin: 0;
          size: 80mm auto;
        }
        body {
          font-family: 'Courier New', monospace;
          width: 70mm;
          margin: 0;
          padding: 2mm;
        }
        .header {
          text-align: center;
          margin-bottom: 10px;
        }
        .address {
          font-size: 10px;
          margin-top: 4px;
          white-space: pre-wrap;
        }
        .header h2 {
          margin: 5px 0;
          font-size: 14px;
        }
        .divider {
          border-top: 1px dashed #000;
          margin: 5px 0;
        }
        .group {
          margin-bottom: 10px;
        }
        .group-header {
          font-weight: bold;
          margin-bottom: 3px;
          font-size: 12px;
        }
        .item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
          font-size: 12px;
        }
        .item-name {
          flex: 1;
        }
        .item-quantity {
          width: 25px;
          text-align: center;
        }
        .item-amount {
          width: 60px;
          text-align: right;
        }
        .total {
          text-align: right;
          font-weight: bold;
          font-size: 12px;
        }
        .footer {
          text-align: center;
          margin-top: 10px;
          font-size: 11px;
        }
        .summary {
          margin-top: 5px;
        }
        .special-order {
          text-align: center;
          margin: 5px 0;
        }
        .special-order-text {
          font-weight: bold;
          font-size: 12px;
          padding: 3px;
          border: 1px solid #000;
          display: inline-block;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>Amala Oluyole</h2>
        <div class="address">Plot 4 Block 1, Opposite SUmal Industry,<br>oluyole-Town Planning Area,<br>ring Road, Ibadan</div>
        <div>Order #${order.id}</div>
        <div>${date}</div>
        ${specialOrderNote}
      </div>

      <div class="divider"></div>

      ${order.groups
        .map(
          (group, index) => `
        <div class="group">
          <div class="group-header">Group ${index + 1}</div>
          ${group.items
            .map(
              (item) => `
            <div class="item">
              <span class="item-name">${item.foodName}</span>
              <span class="item-quantity">x${item.quantity}</span>
              <span class="item-amount">₦${item.amount.toLocaleString()}</span>
            </div>
          `
            )
            .join('')}
          <div class="total">Group Total: ₦${group.total.toLocaleString()}</div>
        </div>
        <div class="divider"></div>
      `
        )
        .join('')}

      ${paymentMethodsSection}
      
      ${summarySection}

      <div class="total">
        Grand Total: ₦${order.total.toLocaleString()}
      </div>

      <div class="footer">
        Thank you for your patronage!
      </div>
    </body>
    </html>
  `
  return receiptHTML
}
