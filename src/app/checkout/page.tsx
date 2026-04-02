"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useToast } from "@/app/components/ui/Toaster";
import Navbar from "@/app/components/Navbar";

type Step = "cart" | "shipping" | "payment";

const STEPS = [
  { id: "cart" as Step, label: "Review Cart" },
  { id: "shipping" as Step, label: "Shipping" },
  { id: "payment" as Step, label: "Payment" },
];

export default function CheckoutPage() {
  const {
    user,
    loading: authLoading,
    cart,
    printCart,
    removeFromCart,
    updateCartQty,
    clearCart,
    removeFromPrintCart,
    clearPrintCart,
    cartTotal,
  } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("cart");
  const [isLoading, setIsLoading] = useState(false);

  const [shipping, setShipping] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  useEffect(() => {
    if (!authLoading && !user) router.push("/login?redirect=/checkout");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setShipping((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        country: user.country || "India",
      }));
    }
  }, [user]);

  const subtotal = cartTotal;
  const gst = Math.round(subtotal * 0.18 * 100) / 100;
  const total = subtotal + gst;

  const handlePlaceOrder = async () => {
    if (cart.length === 0 && printCart.length === 0) {
      toast("Your cart is empty", "error");
      return;
    }
    setIsLoading(true);
    try {
      // 1. Create order
      const orderRes: any = await api.orders.create({
        items: cart,
        printJobs: printCart.map(job => job.id),
        shippingAddress: {
          name: shipping.name,
          email: shipping.email,
          phone: shipping.phone,
          address: `${shipping.address}, ${shipping.state} ${shipping.pincode}`,
          city: shipping.city,
          country: shipping.country,
        },
      });

      // 2. Create Stripe checkout session
      const paymentRes: any = await api.payment.createCheckout(
        orderRes.order.id,
      );

      // 3. Redirect to Stripe
      clearCart();
      clearPrintCart();
      window.location.href = paymentRes.url;
    } catch (err: any) {
      toast(err.message || "Failed to create order", "error");
      setIsLoading(false);
    }
  };

  if (authLoading || !user) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="pt-28 pb-20 px-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-white mb-8">Checkout</h1>

          {/* Step indicator */}
          <div className="flex items-center gap-0 mb-10">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step === s.id
                        ? "bg-[#2997ff] text-white"
                        : STEPS.findIndex((x) => x.id === step) > i
                          ? "bg-[#30d158] text-white"
                          : "bg-white/[0.08] text-[#86868b]"
                    }`}
                  >
                    {STEPS.findIndex((x) => x.id === step) > i ? "✓" : i + 1}
                  </div>
                  <span
                    className={`text-sm font-medium hidden sm:block ${step === s.id ? "text-white" : "text-[#86868b]"}`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-8 sm:w-16 h-px bg-white/[0.1] mx-2" />
                )}
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-[1fr_340px] gap-8">
            {/* Left panel */}
            <div>
              <AnimatePresence mode="wait">
                {/* Step 1: Cart Review */}
                {step === "cart" && (
                  <motion.div
                    key="cart"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <div className="bg-white/[0.03] border border-white/[0.07] rounded-3xl overflow-hidden">
                      <div className="p-5 border-b border-white/[0.07]">
                        <h2 className="font-semibold text-white">
                          Your Cart ({cart.length + printCart.length} items)
                        </h2>
                      </div>
                      {cart.length === 0 && printCart.length === 0 ? (
                        <div className="p-10 text-center">
                          <p className="text-[#86868b]">Your cart is empty.</p>
                          <button
                            onClick={() => router.push("/books")}
                            className="mt-4 text-[#2997ff] hover:underline text-sm"
                          >
                            Browse Books
                          </button>
                        </div>
                      ) : (
                        <div className="divide-y divide-white/[0.05]">
                          {cart.map((item) => (
                            <div
                              key={item.bookId}
                              className="flex items-center gap-4 p-5"
                            >
                              {item.coverImage ? (
                                <img
                                  src={item.coverImage}
                                  alt={item.title}
                                  className="w-12 h-16 object-cover rounded-xl shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-16 bg-white/[0.06] rounded-xl shrink-0 flex items-center justify-center text-xl">
                                  📖
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                  {item.title}
                                </p>
                                <p className="text-xs text-[#86868b] mt-0.5">
                                  ₹{Number(item.price).toLocaleString("en-IN")}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    updateCartQty(
                                      item.bookId,
                                      Math.max(1, item.quantity - 1),
                                    )
                                  }
                                  className="w-7 h-7 rounded-lg bg-white/[0.06] text-white hover:bg-white/[0.1] transition-colors flex items-center justify-center text-sm"
                                >
                                  −
                                </button>
                                <span className="text-sm font-medium text-white w-5 text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateCartQty(
                                      item.bookId,
                                      item.quantity + 1,
                                    )
                                  }
                                  className="w-7 h-7 rounded-lg bg-white/[0.06] text-white hover:bg-white/[0.1] transition-colors flex items-center justify-center text-sm"
                                >
                                  +
                                </button>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-white">
                                  ₹
                                  {Number(
                                    item.price * item.quantity,
                                  ).toLocaleString("en-IN")}
                                </p>
                                <button
                                  onClick={() => removeFromCart(item.bookId)}
                                  className="text-[10px] text-[#ff453a] hover:underline mt-0.5"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}

                          {printCart.map((job) => (
                            <div key={job.id} className="flex items-center gap-4 p-5">
                              <div className="w-12 h-16 bg-white/[0.06] rounded-xl shrink-0 flex items-center justify-center text-xl">
                                📄
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                  {job.fileName}
                                </p>
                                <p className="text-xs text-[#86868b] mt-0.5">
                                  {job.copies} Copies • {job.colorMode} • {job.binding} Binding
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-white">
                                  ₹{Number(job.price).toLocaleString("en-IN")}
                                </p>
                                <button
                                  onClick={() => removeFromPrintCart(job.id)}
                                  className="text-[10px] text-[#ff453a] hover:underline mt-0.5"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {(cart.length > 0 || printCart.length > 0) && (
                      <button
                        onClick={() => setStep("shipping")}
                        className="mt-5 w-full bg-[#2997ff] hover:bg-[#1a83ff] text-white font-semibold py-3.5 rounded-2xl transition-colors"
                      >
                        Continue to Shipping →
                      </button>
                    )}
                  </motion.div>
                )}

                {/* Step 2: Shipping */}
                {step === "shipping" && (
                  <motion.div
                    key="shipping"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <div className="bg-white/[0.03] border border-white/[0.07] rounded-3xl p-6">
                      <h2 className="font-semibold text-white mb-5">
                        Shipping Details
                      </h2>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          {
                            key: "name",
                            label: "Full Name",
                            span: 2,
                            required: true,
                          },
                          {
                            key: "email",
                            label: "Email",
                            type: "email",
                            required: true,
                          },
                          { key: "phone", label: "Phone" },
                          {
                            key: "address",
                            label: "Street Address",
                            span: 2,
                            required: true,
                          },
                          { key: "city", label: "City", required: true },
                          { key: "state", label: "State" },
                          { key: "pincode", label: "Pincode" },
                          { key: "country", label: "Country", required: true },
                        ].map((f) => (
                          <div
                            key={f.key}
                            className={f.span === 2 ? "col-span-2" : ""}
                          >
                            <label className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider mb-1.5 block">
                              {f.label}
                              {f.required && " *"}
                            </label>
                            <input
                              type={f.type || "text"}
                              required={f.required}
                              value={(shipping as any)[f.key]}
                              onChange={(e) =>
                                setShipping((prev) => ({
                                  ...prev,
                                  [f.key]: e.target.value,
                                }))
                              }
                              className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#2997ff]/60"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3 mt-5">
                      <button
                        onClick={() => setStep("cart")}
                        className="px-6 py-3 rounded-2xl border border-white/[0.1] text-[#86868b] hover:text-white text-sm transition-colors"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={() => {
                          if (
                            !shipping.name ||
                            !shipping.email ||
                            !shipping.address ||
                            !shipping.city ||
                            !shipping.country
                          ) {
                            toast(
                              "Please fill in all required fields",
                              "error",
                            );
                            return;
                          }
                          setStep("payment");
                        }}
                        className="flex-1 bg-[#2997ff] hover:bg-[#1a83ff] text-white font-semibold py-3 rounded-2xl transition-colors text-sm"
                      >
                        Continue to Payment →
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Payment */}
                {step === "payment" && (
                  <motion.div
                    key="payment"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <div className="bg-white/[0.03] border border-white/[0.07] rounded-3xl p-6 mb-4">
                      <h2 className="font-semibold text-white mb-4">Payment</h2>
                      <div className="flex items-center gap-3 bg-white/[0.04] rounded-2xl p-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#635bff] to-[#4834d4] flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-white"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.165-2.609-5.886-6.591-7.305z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            Stripe Secure Checkout
                          </p>
                          <p className="text-xs text-[#86868b]">
                            You'll be redirected to Stripe to complete payment
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-[#86868b] text-xs">
                        <svg
                          className="w-4 h-4 text-[#30d158]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                        256-bit SSL Encryption · Powered by Stripe
                      </div>
                    </div>

                    {/* Shipping summary */}
                    <div className="bg-white/[0.03] border border-white/[0.07] rounded-3xl p-5 mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-semibold text-white">
                          Shipping To
                        </p>
                        <button
                          onClick={() => setStep("shipping")}
                          className="text-xs text-[#2997ff] hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                      <p className="text-sm text-[#86868b]">{shipping.name}</p>
                      <p className="text-xs text-[#86868b]">
                        {shipping.address}, {shipping.city}, {shipping.country}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep("shipping")}
                        className="px-6 py-3 rounded-2xl border border-white/[0.1] text-[#86868b] hover:text-white text-sm transition-colors"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={handlePlaceOrder}
                        disabled={isLoading}
                        className="flex-1 bg-[#2997ff] hover:bg-[#1a83ff] disabled:opacity-60 text-white font-semibold py-3 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
                      >
                        {isLoading && (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                        {isLoading
                          ? "Processing..."
                          : `Pay ₹${total.toLocaleString("en-IN")}`}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Order summary */}
            <div className="lg:sticky lg:top-24 self-start">
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-5">
                <h3 className="font-semibold text-white mb-4 text-sm">
                  Order Summary
                </h3>
                <div className="space-y-3 mb-4">
                  {cart.slice(0, 3).map((item) => (
                    <div key={item.bookId} className="flex items-center gap-3">
                      {item.coverImage && (
                        <img
                          src={item.coverImage}
                          alt={item.title}
                          className="w-8 h-11 object-cover rounded-lg shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-[#86868b]">
                          ×{item.quantity}
                        </p>
                      </div>
                      <p className="text-xs font-semibold text-white">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                  {printCart.slice(0, Math.max(0, 3 - cart.length)).map((job) => (
                    <div key={job.id} className="flex items-center gap-3">
                      <div className="w-8 h-11 bg-white/[0.06] rounded-lg shrink-0 flex items-center justify-center">
                        📄
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">
                          {job.fileName}
                        </p>
                        <p className="text-[10px] text-[#86868b]">
                          ×{job.copies}
                        </p>
                      </div>
                      <p className="text-xs font-semibold text-white">
                        ₹{Number(job.price).toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                  {(cart.length + printCart.length) > 3 && (
                    <p className="text-[10px] text-[#86868b] text-center">
                      +{(cart.length + printCart.length) - 3} more items
                    </p>
                  )}
                </div>

                <div className="border-t border-white/[0.07] pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-[#86868b]">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-[#86868b]">
                    <span>GST (18%)</span>
                    <span>₹{gst.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between font-bold text-white border-t border-white/[0.07] pt-2 mt-2">
                    <span>Total</span>
                    <span>₹{total.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
