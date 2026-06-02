# Logistics Tracking Setup

This document explains how to configure Shiprocket from the admin panel or environment variables and how the logistics flow works in this project.

## What This Integration Does

- Stores Shiprocket credentials in Admin Settings.
- Creates shipments from the admin logistics dashboard.
- Saves shipment metadata in the order notes.
- Refreshes tracking details from Shiprocket and shows the tracking URL in admin.

## Prerequisites

Before enabling the integration, make sure all of these are ready:

- A live Shiprocket account with access to the API.
- A working Shiprocket login email and password.
- At least one pickup location already created in Shiprocket.
- Customer orders must contain shipping name, phone, address, city, country, and zip code.
- The server must be able to reach `https://apiv2.shiprocket.in`.

## Environment Variables

You can drive the Shiprocket integration directly from deployment environment variables. When these are present, the backend will use them instead of the saved logistics credentials.

- `SHIPROCKET_ENABLED=true`
- `SHIPROCKET_TOKEN=your-shiprocket-bearer-token`
- `SHIPROCKET_PICKUP_LOCATION=Primary`
- `SHIPROCKET_CHANNEL_ID=`
- `LOGISTICS_PROVIDER=shiprocket`

`SHIPROCKET_TOKEN` is the preferred setup because it skips the legacy email/password login flow. `SHIPROCKET_CHANNEL_ID` is optional. `LOGISTICS_PROVIDER` is optional unless you plan to support more than one logistics provider.

## Admin Setup

1. Log in as an admin.
2. Open the admin settings page at `/admin/settings`.
3. Scroll to the `Shiprocket Logistics` section.
4. Fill these fields:

- `Enable Shiprocket integration`: turn this on.
- `Provider`: keep this as `shiprocket` unless you are changing the backend integration too.
- `Shiprocket API Token`: paste your Shiprocket bearer token here if you are not using login credentials.
- `Shiprocket Email`: optional fallback for older email/password auth.
- `Shiprocket Password`: optional fallback for older email/password auth.
- `Pickup Location`: the exact pickup location name from Shiprocket. The backend uses `Primary` by default.
- `Channel ID`: optional. Fill this only if your Shiprocket setup requires a specific channel.

5. Click `Save Settings`.

The app stores these values in site settings and uses them whenever an admin creates or tracks a shipment. If the environment variables above are defined, they override the saved logistics values at runtime.

## Daily Workflow

1. Open `/admin/logistics`.
2. In `Book Shipping`, find an order that is ready to dispatch.
3. Click `Create Shipment`.
4. The backend sends the order to Shiprocket and stores:

- Shiprocket order ID
- Shipment ID
- AWB code, when available
- Tracking URL, when available
- Current shipment status

5. After Shiprocket updates the shipment, click `Refresh Tracking`.
6. The latest tracking status and tracking URL are written back to the order notes and shown in the admin UI.

## What The Backend Expects

The shipment payload is built from the order record. These fields are especially important:

- `shippingName`
- `shippingEmail`
- `shippingPhone`
- `shippingAddress`
- `shippingCity`
- `shippingCountry`
- `shippingZip`
- order items and print jobs

If these are missing, Shiprocket may reject the request or create incomplete shipments.

The backend currently uses these defaults when building the payload:

- payment method is mapped to `COD` or `Prepaid`
- shipping charges are sent as `0`
- package dimensions are fixed to `10 x 10 x 4`
- package weight is fixed to `0.5`

If you need more accurate courier rates, update the payload builder in the Shiprocket service before going live at scale.

## Troubleshooting

### `Shiprocket integration is disabled`

- Turn on the Shiprocket checkbox in admin settings.
- Save settings again.

### `Shiprocket credentials are incomplete`

- Set `SHIPROCKET_TOKEN`, or fill both email and password in admin settings.
- Save settings again.

### `Shiprocket authentication failed`

- If you are using `SHIPROCKET_TOKEN`, refresh it in your deployment environment and restart the app.
- If you are using the older credential flow, verify the credentials directly in the Shiprocket dashboard.
- Confirm the account is active and API access is available.

### `Create the shipment before tracking it`

- The order does not have a Shiprocket shipment yet.
- Use `Create Shipment` first.

### Shipment created but no tracking URL yet

- This can happen before the courier is assigned.
- Use `Refresh Tracking` after Shiprocket updates the shipment.

### Pickup location errors

- The value in admin settings must match the Shiprocket pickup location name exactly.

## Operational Notes

- Shipment metadata is stored in the order notes JSON.
- Re-clicking `Create Shipment` on an order that already has Shiprocket metadata returns the existing shipment instead of creating a duplicate.
- Tracking refresh does not change order status automatically in the UI beyond the saved Shiprocket metadata.

## Recommended Go-Live Check

Before using this in production, test with one real order end to end:

1. Place a test order with complete delivery details.
2. Create the shipment from `/admin/logistics`.
3. Confirm the shipment appears in Shiprocket.
4. Click `Refresh Tracking` after courier assignment.
5. Verify the AWB code and tracking URL appear in the admin panel.
