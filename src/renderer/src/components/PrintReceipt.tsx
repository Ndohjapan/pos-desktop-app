const PrintReceipt = ({ order, paymentMethod, totalAmount }) => {
  return (
    <div className="print-only p-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Restaurant Name</h1>
        <p>123 Restaurant Street</p>
        <p>Phone: (123) 456-7890</p>
      </div>

      <div className="mb-4">
        <p>Date: {new Date().toLocaleString()}</p>
        <p>Order #: {Math.random().toString(36).substr(2, 9)}</p>
      </div>

      {order.map((group, groupIndex) => (
        <div key={groupIndex} className="mb-4">
          <h2 className="font-bold mb-2">Group {groupIndex + 1}</h2>
          {group.items.map((item, index) => (
            <div key={index} className="flex justify-between">
              <span>{item.quantity}x {item.foodName}</span>
              <span>₦{item.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      ))}

      <div className="border-t pt-4 mt-4">
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>₦{totalAmount.toLocaleString()}</span>
        </div>
        <p className="mt-2">Payment Method: {paymentMethod}</p>
      </div>

      <div className="text-center mt-8">
        <p>Thank you for your business!</p>
      </div>
    </div>
  );
};

export default PrintReceipt;