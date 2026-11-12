import {
  getImageUrl,
  type Order,
  type VariationAttributes,
} from "@/lib/api";

const money = (value: unknown) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const formatAttributeKey = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (character) => character.toUpperCase());

const formatAttributeValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(formatAttributeValue).filter(Boolean).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export const formatVariationAttributes = (
  attributes?: VariationAttributes | null,
): string => {
  if (!attributes || typeof attributes !== "object") return "";

  const type = formatAttributeValue(attributes.type);
  const value = formatAttributeValue(attributes.value);
  const legacyLabel = [type, value].filter(Boolean).join(": ");
  const additionalAttributes = Object.entries(attributes)
    .filter(([key]) => key !== "type" && key !== "value")
    .map(([key, attributeValue]) => {
      const formattedValue = formatAttributeValue(attributeValue);
      return formattedValue
        ? `${formatAttributeKey(key)}: ${formattedValue}`
        : "";
    })
    .filter(Boolean);

  return [legacyLabel, ...additionalAttributes].filter(Boolean).join(" · ");
};

const getShippingCharge = (notes?: string): number | null => {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes);
    const value = Number(parsed?.pricing?.shippingCharge);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
};

const formatPaymentMethod = (method?: string) => {
  if (!method) return "Not specified";
  if (method === "pending-online") return "Online payment (pending)";
  if (method.toLowerCase() === "cod") return "Cash on Delivery";
  if (method.toLowerCase() === "razorpay") return "Razorpay";
  return method.replace(/[_-]+/g, " ").toUpperCase();
};

interface OrderDetailsProps {
  order: Order;
  showCustomer?: boolean;
}

export default function OrderDetails({
  order,
  showCustomer = false,
}: OrderDetailsProps) {
  const shippingCharge = getShippingCharge(order.notes);
  const shippingLocation = [
    order.shippingCity,
    order.shippingCountry,
    order.shippingZip,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-lg bg-gray-50 p-4 text-sm sm:grid-cols-3">
        <div className="sm:col-span-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Full Order ID
          </p>
          <p className="mt-1 break-all font-mono text-xs text-[#232f3e]">{order.id}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Status
          </p>
          <p className="mt-1 font-semibold text-[#232f3e]">{order.status}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Placed On
          </p>
          <p className="mt-1 text-[#232f3e]">
            {new Date(order.createdAt).toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {showCustomer && (
        <section>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Customer
          </h4>
          <div className="rounded-lg border border-gray-200 p-4 text-sm">
            <p className="font-semibold text-[#232f3e]">
              {order.user?.name || order.shippingName || "Customer"}
            </p>
            <p className="mt-1 text-gray-600">
              {order.user?.email || order.shippingEmail || "No email"}
            </p>
            <p className="mt-1 text-gray-600">
              {order.user?.phone || order.shippingPhone || "No phone"}
            </p>
          </div>
        </section>
      )}

      <section>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Books & Selected Variants
        </h4>
        <div className="space-y-3">
          {order.items?.length ? (
            order.items.map((item) => {
              const variationLabel = formatVariationAttributes(
                item.variation?.attributes,
              );
              const image = item.variation?.image || item.book?.coverImage;

              return (
                <div
                  key={item.id}
                  className="flex items-start gap-4 rounded-lg border border-gray-200 p-4"
                >
                  {image ? (
                    <img
                      src={getImageUrl(image)}
                      alt={item.book?.title || "Book"}
                      className="h-16 w-12 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded bg-gray-100 text-xl">
                      📖
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#232f3e]">
                      {item.book?.title || "Book"}
                    </p>
                    {item.book?.author && (
                      <p className="mt-0.5 text-xs text-gray-500">by {item.book.author}</p>
                    )}
                    {variationLabel && (
                      <p className="mt-1 text-xs font-medium text-[#e47911]">
                        {variationLabel}
                      </p>
                    )}
                    {item.variation?.sku && (
                      <p className="mt-1 text-xs text-gray-500">
                        Variant SKU: {item.variation.sku}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-600">
                      Qty {item.quantity} × {money(item.price)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-[#232f3e]">
                    {money(Number(item.price) * item.quantity)}
                  </p>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-gray-400">No books in this order.</p>
          )}
        </div>
      </section>

      {!!order.printJobs?.length && (
        <section>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Print Jobs
          </h4>
          <div className="space-y-3">
            {order.printJobs.map((job) => (
              <div key={job.id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[#232f3e]">{job.fileName}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {job.pages} pages · {job.copies} copies
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[#232f3e]">{money(job.price)}</p>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-gray-600 sm:grid-cols-2 lg:grid-cols-3">
                  <p><span className="font-medium">Color:</span> {job.colorMode}</p>
                  <p><span className="font-medium">Binding:</span> {job.binding}</p>
                  <p><span className="font-medium">Paper size:</span> {job.paperSize}</p>
                  <p><span className="font-medium">Paper type:</span> {job.paperType}</p>
                  <p><span className="font-medium">Print type:</span> {job.printType}</p>
                  <p><span className="font-medium">Status:</span> {job.status}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-gray-200 p-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Shipping Details
          </h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p className="font-semibold text-[#232f3e]">
              {order.shippingName || order.user?.name || "Not provided"}
            </p>
            <p>{order.shippingEmail || order.user?.email || "No email"}</p>
            <p>{order.shippingPhone || order.user?.phone || "No phone"}</p>
            <p className="pt-2">{order.shippingAddress || "No street address"}</p>
            <p>{shippingLocation || "No city, country, or postal code"}</p>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 p-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Payment Details
          </h4>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <span className="font-medium text-[#232f3e]">Method:</span>{" "}
              {formatPaymentMethod(order.paymentMethod)}
            </p>
            <p className="break-all">
              <span className="font-medium text-[#232f3e]">Payment ID:</span>{" "}
              {order.paymentId || "Not available"}
            </p>
            {order.onlineAmount != null && (
              <p className="text-green-700">Paid online: {money(order.onlineAmount)}</p>
            )}
            {order.codAmount != null && (
              <p className="text-orange-700">Balance COD: {money(order.codAmount)}</p>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-lg bg-gray-50 p-4">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Order Totals
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span><span>{money(order.subtotal)}</span>
          </div>
          {Number(order.discount || 0) > 0 && (
            <div className="flex justify-between text-green-700">
              <span>Discount</span><span>− {money(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>Tax / GST</span><span>{money(order.tax)}</span>
          </div>
          {shippingCharge !== null && (
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>{shippingCharge === 0 ? "Free" : money(shippingCharge)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-[#232f3e]">
            <span>Total</span><span>{money(order.total)}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
