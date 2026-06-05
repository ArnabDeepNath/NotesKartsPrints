"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/app/components/ui/Toaster";
import {
  api,
  type AdminOrderUpdatePayload,
  Order,
  PrintJob,
  ShiprocketMeta,
} from "@/lib/api";

const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

const PRINT_JOB_STATUSES = [
  "PENDING",
  "PRINTING",
  "QUALITY_CHECK",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
).replace(/\/api$/, "");

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const getDownloadUrl = (fileUrl: string) => {
  // If already a full URL, return as-is
  if (fileUrl.startsWith("http")) return fileUrl;
  
  // If it's a relative path (starts with /), prepend the API origin
  if (fileUrl.startsWith("/")) {
    return `${API_ORIGIN}${fileUrl}`;
  }
  
  // Otherwise construct the standard path
  return `${API_ORIGIN}/uploads/prints/${fileUrl}`;
};

const buildOrderDraft = (order: Order): AdminOrderUpdatePayload => ({
  shippingName: order.shippingName || order.user?.name || "",
  shippingEmail: order.shippingEmail || order.user?.email || "",
  shippingPhone: order.shippingPhone || order.user?.phone || "",
  shippingAddress: order.shippingAddress || "",
  shippingCity: order.shippingCity || "",
  shippingCountry: order.shippingCountry || "",
  shippingZip: order.shippingZip || "",
});

export default function AdminLogisticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState<Record<string, boolean>>({});
  const [orderDrafts, setOrderDrafts] = useState<
    Record<string, AdminOrderUpdatePayload>
  >({});

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "ADMIN")) {
      router.push("/");
    }
  }, [authLoading, router, user]);

  const fetchLogistics = useCallback(async () => {
    try {
      setLoading(true);
      const [ordersRes, printJobsRes] = await Promise.all([
        api.admin.orders({ limit: "100" }) as Promise<{ orders: Order[] }>,
        api.admin.printJobs({ limit: "100" }) as Promise<{
          printJobs: PrintJob[];
        }>,
      ]);
      setOrders(ordersRes.orders || []);
      setPrintJobs(printJobsRes.printJobs || []);
    } catch (error: unknown) {
      toast(
        getErrorMessage(error, "Failed to load logistics dashboard"),
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchLogistics();
    }
  }, [fetchLogistics, user]);

  const summary = useMemo(() => {
    const shipmentsCreated = orders.filter(
      (order) => order.shiprocket?.shipmentId,
    ).length;
    const pendingBooks = orders.filter((order) =>
      ["PAID", "PROCESSING"].includes(order.status),
    ).length;
    const printQueue = printJobs.filter((job) =>
      ["PENDING", "PRINTING", "QUALITY_CHECK"].includes(job.status),
    ).length;

    return { shipmentsCreated, pendingBooks, printQueue };
  }, [orders, printJobs]);

  const runAction = async (key: string, action: () => Promise<void>) => {
    try {
      setBusyKey(key);
      await action();
    } finally {
      setBusyKey(null);
    }
  };

  const handleOrderStatus = async (orderId: string, status: string) => {
    await runAction(`order-status-${orderId}`, async () => {
      await api.admin.updateOrder(orderId, { status });
      toast("Order status updated", "success");
      await fetchLogistics();
    });
  };

  const toggleEditor = (order: Order) => {
    setEditorOpen((current) => ({
      ...current,
      [order.id]: !current[order.id],
    }));
    setOrderDrafts((current) =>
      current[order.id]
        ? current
        : {
            ...current,
            [order.id]: buildOrderDraft(order),
          },
    );
  };

  const updateDraftField = (
    order: Order,
    field: keyof AdminOrderUpdatePayload,
    value: string,
  ) => {
    setOrderDrafts((current) => ({
      ...current,
      [order.id]: {
        ...(current[order.id] || buildOrderDraft(order)),
        [field]: value,
      },
    }));
  };

  const handleOrderDetailsSave = async (order: Order) => {
    const draft = orderDrafts[order.id] || buildOrderDraft(order);

    await runAction(`order-details-${order.id}`, async () => {
      await api.admin.updateOrder(order.id, draft);
      toast("Order details updated", "success");
      setEditorOpen((current) => ({
        ...current,
        [order.id]: false,
      }));
      await fetchLogistics();
    });
  };

  const handleCreateShipment = async (orderId: string) => {
    await runAction(`create-shipment-${orderId}`, async () => {
      const res = (await api.admin.createShipment(orderId)) as {
        message: string;
      };
      toast(res.message || "Shipment created", "success");
      await fetchLogistics();
    });
  };

  const handleRefreshTracking = async (orderId: string) => {
    await runAction(`refresh-tracking-${orderId}`, async () => {
      const res = (await api.admin.refreshShipmentTracking(orderId)) as {
        message: string;
      };
      toast(res.message || "Tracking refreshed", "success");
      await fetchLogistics();
    });
  };

  const handlePrintJobStatus = async (jobId: string, status: string) => {
    await runAction(`print-status-${jobId}`, async () => {
      await api.admin.updatePrintJob(jobId, { status });
      toast("Print job updated", "success");
      await fetchLogistics();
    });
  };

  const renderShipmentMeta = (shiprocket?: ShiprocketMeta | null) => {
    if (!shiprocket) {
      return <p className="text-xs text-gray-400">No shipment created yet.</p>;
    }

    return (
      <div className="space-y-1 text-xs text-gray-600">
        <p>
          <span className="font-semibold text-[#232f3e]">Shipment:</span>{" "}
          {shiprocket.shipmentId || "Pending"}
        </p>
        <p>
          <span className="font-semibold text-[#232f3e]">Status:</span>{" "}
          {shiprocket.status || "Pending"}
        </p>
        <p>
          <span className="font-semibold text-[#232f3e]">AWB:</span>{" "}
          {shiprocket.awbCode || "Pending"}
        </p>
        {shiprocket.trackingUrl && (
          <a
            href={shiprocket.trackingUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex text-[#146eb4] hover:underline"
          >
            Open tracking link
          </a>
        )}
      </div>
    );
  };

  if (authLoading || !user || user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#e47911] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e47911]">
              Admin Logistics
            </p>
            <h1 className="text-3xl font-black text-[#232f3e] mt-2">
              Ship books, track orders, and download print files.
            </h1>
            <p className="mt-2 text-sm text-gray-500 max-w-3xl">
              This page is the operations hub for order dispatch and
              print-on-demand fulfillment. Create Shiprocket shipments for book
              orders and download PDF files for print jobs from one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-[#232f3e] hover:border-[#232f3e]"
            >
              Back to Admin
            </Link>
            <button
              onClick={fetchLogistics}
              className="inline-flex items-center rounded-full bg-[#232f3e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#111827]"
            >
              Refresh Logistics
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          {[
            {
              label: "Book Orders To Process",
              value: summary.pendingBooks,
              icon: "📦",
            },
            {
              label: "Shipments Created",
              value: summary.shipmentsCreated,
              icon: "🚚",
            },
            { label: "Print Queue", value: summary.printQueue, icon: "🖨️" },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="text-2xl">{card.icon}</div>
              <div className="mt-3 text-3xl font-black text-[#e47911]">
                {card.value}
              </div>
              <p className="mt-1 text-sm text-gray-500">{card.label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] mb-8 auto-rows-max">
          <section className="rounded-3xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl font-bold text-[#232f3e]">
                  Book Shipping
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Update order status, create Shiprocket shipments, and refresh
                  tracking.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-10 text-center text-sm text-gray-400">
                Loading order logistics...
              </div>
            ) : orders.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                No orders found.
              </div>
            ) : (
              <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-gray-200 bg-[#fbfcfd] p-4 md:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
                        Order
                      </p>
                      <h3 className="text-lg font-bold text-[#232f3e] mt-1">
                        #{order.id.slice(-8).toUpperCase()}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {order.user?.name || order.shippingName || "Customer"} ·{" "}
                        {order.user?.email || order.shippingEmail || "No email"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <select
                        value={order.status}
                        onChange={(event) =>
                          void handleOrderStatus(order.id, event.target.value)
                        }
                        disabled={busyKey === `order-status-${order.id}`}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-[#232f3e]"
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => void handleCreateShipment(order.id)}
                        disabled={
                          busyKey === `create-shipment-${order.id}` ||
                          Boolean(order.shiprocket?.shipmentId)
                        }
                        className="rounded-lg bg-[#e47911] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {order.shiprocket?.shipmentId
                          ? "Shipment Created"
                          : "Create Shipment"}
                      </button>
                      <button
                        onClick={() => void handleRefreshTracking(order.id)}
                        disabled={
                          busyKey === `refresh-tracking-${order.id}` ||
                          !order.shiprocket?.shipmentId
                        }
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-[#232f3e] disabled:opacity-50"
                      >
                        Refresh Tracking
                      </button>
                      <button
                        onClick={() => toggleEditor(order)}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-[#232f3e]"
                      >
                        {editorOpen[order.id] ? "Close Edit" : "Edit Fields"}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr_0.9fr] mt-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
                        Delivery
                      </p>
                      <p className="mt-2 text-sm text-[#232f3e]">
                        {order.shippingAddress || "Address unavailable"}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {[
                          order.shippingCity,
                          order.shippingCountry,
                          order.shippingZip,
                        ]
                          .filter(Boolean)
                          .join(", ") || "Location unavailable"}
                      </p>
                      <p className="mt-2 text-sm text-gray-500">
                        {order.shippingPhone || order.user?.phone || "No phone"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
                        Items
                      </p>
                      <div className="mt-2 space-y-2 text-sm text-gray-600">
                        {order.items.map((item) => (
                          <p key={item.id}>
                            {item.book?.title || "Book"} · {item.quantity} qty
                          </p>
                        ))}
                        {order.printJobs?.map((job) => (
                          <p key={job.id}>
                            Print job: {job.fileName} · {job.copies} copies
                          </p>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
                        Shiprocket
                      </p>
                      <div className="mt-2">
                        {renderShipmentMeta(order.shiprocket)}
                      </div>
                    </div>
                  </div>

                  {editorOpen[order.id] && (
                    <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
                            Edit Shipment Details
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            Update the order contact and delivery fields used
                            for Shiprocket.
                          </p>
                        </div>
                        <button
                          onClick={() => void handleOrderDetailsSave(order)}
                          disabled={busyKey === `order-details-${order.id}`}
                          className="rounded-lg bg-[#232f3e] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          Save Changes
                        </button>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <input
                          type="text"
                          value={
                            orderDrafts[order.id]?.shippingName ??
                            buildOrderDraft(order).shippingName ??
                            ""
                          }
                          onChange={(event) =>
                            updateDraftField(
                              order,
                              "shippingName",
                              event.target.value,
                            )
                          }
                          placeholder="Customer name"
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-[#232f3e]"
                        />
                        <input
                          type="email"
                          value={
                            orderDrafts[order.id]?.shippingEmail ??
                            buildOrderDraft(order).shippingEmail ??
                            ""
                          }
                          onChange={(event) =>
                            updateDraftField(
                              order,
                              "shippingEmail",
                              event.target.value,
                            )
                          }
                          placeholder="Customer email"
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-[#232f3e]"
                        />
                        <input
                          type="tel"
                          value={
                            orderDrafts[order.id]?.shippingPhone ??
                            buildOrderDraft(order).shippingPhone ??
                            ""
                          }
                          onChange={(event) =>
                            updateDraftField(
                              order,
                              "shippingPhone",
                              event.target.value,
                            )
                          }
                          placeholder="Shipping phone"
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-[#232f3e]"
                        />
                        <input
                          type="text"
                          value={
                            orderDrafts[order.id]?.shippingAddress ??
                            buildOrderDraft(order).shippingAddress ??
                            ""
                          }
                          onChange={(event) =>
                            updateDraftField(
                              order,
                              "shippingAddress",
                              event.target.value,
                            )
                          }
                          placeholder="Delivery address"
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-[#232f3e] md:col-span-2 xl:col-span-2"
                        />
                        <input
                          type="text"
                          value={
                            orderDrafts[order.id]?.shippingCity ??
                            buildOrderDraft(order).shippingCity ??
                            ""
                          }
                          onChange={(event) =>
                            updateDraftField(
                              order,
                              "shippingCity",
                              event.target.value,
                            )
                          }
                          placeholder="City"
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-[#232f3e]"
                        />
                        <input
                          type="text"
                          value={
                            orderDrafts[order.id]?.shippingCountry ??
                            buildOrderDraft(order).shippingCountry ??
                            ""
                          }
                          onChange={(event) =>
                            updateDraftField(
                              order,
                              "shippingCountry",
                              event.target.value,
                            )
                          }
                          placeholder="Country"
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-[#232f3e]"
                        />
                        <input
                          type="text"
                          value={
                            orderDrafts[order.id]?.shippingZip ??
                            buildOrderDraft(order).shippingZip ??
                            ""
                          }
                          onChange={(event) =>
                            updateDraftField(
                              order,
                              "shippingZip",
                              event.target.value,
                            )
                          }
                          placeholder="Postal code"
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-[#232f3e]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm h-fit">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-xl font-bold text-[#232f3e]">Print Queue</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Download customer PDFs, mark print progress, and keep dispatch
                    moving.
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="py-10 text-center text-sm text-gray-400">
                  Loading print queue...
                </div>
              ) : printJobs.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">
                  No print jobs found.
                </div>
              ) : (
                <div className="space-y-3 max-h-[800px] overflow-y-auto">
                  {printJobs.map((job) => (
                    <div
                      key={job.id}
                      className="rounded-lg border border-gray-200 bg-[#fbfcfd] p-3"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-[#232f3e]">
                            {job.fileName}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {job.user?.name || "Customer"}
                          </p>
                        </div>
                        <select
                          value={job.status}
                          onChange={(event) =>
                            void handlePrintJobStatus(
                              job.id,
                              event.target.value,
                            )
                          }
                          disabled={busyKey === `print-status-${job.id}`}
                          className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-[#232f3e]"
                        >
                          {PRINT_JOB_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="text-xs text-gray-600 space-y-1 mb-3">
                        <p>{job.pages} pages · {job.copies} copies</p>
                        <p>{job.colorMode} · {job.printType} · {job.paperType}</p>
                        <p className="text-gray-400">
                          Created {job.createdAt
                            ? new Date(job.createdAt).toLocaleDateString()
                            : "recently"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <a
                          href={getDownloadUrl(job.fileUrl)}
                          download={job.fileName}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-md bg-[#232f3e] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1a2332]"
                          onClick={(e) => {
                            const url = getDownloadUrl(job.fileUrl);
                            if (!url.startsWith("http") && !url.startsWith("/uploads")) {
                              e.preventDefault();
                              alert(`Invalid file URL: ${url}`);
                            }
                          }}
                        >
                          Download PDF
                        </a>
                        {job.order?.id && (
                          <span className="inline-flex rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-[#232f3e]">
                            Order #{job.order.id.slice(-6).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
        </div>
      </main>
    </div>
  );
}
