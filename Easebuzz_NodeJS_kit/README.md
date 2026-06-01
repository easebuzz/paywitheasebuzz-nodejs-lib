# Easebuzz Node.js Integration Kit

A sample integration kit for [Easebuzz Payment Gateway](https://easebuzz.in/) built with Node.js and Express. This kit demonstrates how to integrate all Easebuzz APIs in a simple, merchant-friendly way.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v14 or higher
- npm (comes with Node.js)
- Easebuzz merchant account ([Sign up here](https://dashboard.easebuzz.in/))

---

## Quick Start

### 1. Clone or download this repository

```bash
git clone <repository-url>
cd Easebuzz_NodeJS_kit
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file and add your credentials:

```bash
cp .env
```

Edit `.env` with your Easebuzz merchant key and salt:

```env
EASEBUZZ_MERCHANT_KEY=your_merchant_key_here
EASEBUZZ_SALT=your_salt_here
EASEBUZZ_ENV=test
```

### 4. Start the server

```bash
node index.js
```

### 5. Open in browser

```
http://localhost:3000
```

---

## Environment Configuration

| Variable | Description | Values |
|----------|-------------|--------|
| `EASEBUZZ_MERCHANT_KEY` | Your Easebuzz merchant key | From dashboard |
| `EASEBUZZ_SALT` | Your Easebuzz salt key | From dashboard |
| `EASEBUZZ_ENV` | Environment mode | `test` (sandbox) or `prod` (live) |

---

## APIs Included

| # | API | Description | Endpoint |
|---|-----|-------------|----------|
| 1 | Initiate Payment | Start a payment (redirects to Easebuzz) | pay domain |
| 2 | Initiate Payment (iFrame) | Start a payment in popup/iframe | pay domain |
| 3 | Seamless Payment | Merchant-hosted payment (card/UPI/NB) | pay domain |
| 4 | Transaction V2 | Get transaction details by ID | dashboard domain |
| 5 | Transaction Date V2 | Get transactions by date range | dashboard domain |
| 6 | Refund V2 | Initiate a refund | dashboard domain |
| 7 | Refund Status | Check refund status | dashboard domain |
| 8 | Payout/Settlement | Get settlement details by date range | dashboard domain |
| 9 | Easy Collect | Create a payment link (SMS/Email/WhatsApp) | dashboard domain |

---

## Project Structure

```
├── easebuzz-lib/                 # Core library (all API logic here)
│   ├── utils.js                  # Shared utilities (hash, HTTP, validation, config)
│   ├── initiate_payment.js       # Hosted payment (redirect)
│   ├── initiate_payment_iframe.js # iFrame payment (Checkout SDK)
│   ├── initiate_seamless_payment.js # Seamless payment (merchant-hosted)
│   ├── transaction.js         # Transaction retrieval
│   ├── transaction_date.js    # Transaction by date range
│   ├── refund.js              # Initiate refund
│   ├── refund_status.js          # Check refund status
│   ├── payout.js                 # Settlement/payout retrieval
│   └── easy_collect.js           # Create payment link
├── public/                       # Static frontend assets
│   ├── index.html                # Home page with API links
│   ├── css/style.css             # Styles
│   ├── js/form-validation.js     # Client-side validation
│   └── images/                   # Logo
├── views/                        # HTML form pages (one per API)
│   ├── initiate_payment.html
│   ├── initiate_payment_iframe.html
│   ├── seamless_payment.html
│   ├── transaction.html
│   ├── transaction_date.html
│   ├── refund.html
│   ├── refund_status.html
│   ├── payout.html
│   └── easy_collect.html
├── index.js                      # Express server & router
├── response.js                   # Payment callback handler (surl/furl)
├── .env                          # Environment configuration (add your credentials here)
├── .gitignore
├── package.json
└── README.md
```

---

## How It Works

### Architecture

1. **Frontend forms** submit to `POST /easebuzz?api_name=<api_name>`
2. **Router** (`index.js`) reads `api_name`, loads the corresponding handler from `easebuzz-lib/`
3. **Handler** validates input, generates hash, calls Easebuzz API, returns result
4. **Router** displays the response (redirect, JSON, or HTML page)

### Using in Your Project

You can copy the `easebuzz-lib/` folder into your own Node.js project. Each API file is independent and only depends on `utils.js`:

```javascript
const initiatePayment = require('./easebuzz-lib/initiate_payment');

// Call with your data
const result = await initiatePayment(postData, merchantKey, salt, env);

// Handle result
if (result.action === 'redirect') {
  res.redirect(result.url);
}
```

---

## Payment Flow

### Hosted Payment (Redirect)
1. User fills form → submits
2. Backend calls Easebuzz `/payment/initiateLink`
3. User is redirected to Easebuzz payment page
4. After payment, Easebuzz POSTs to your `surl`/`furl` (callback URL)
5. Backend verifies reverse hash and displays result

### iFrame Payment (Popup)
1. User fills form → AJAX submit (no page reload)
2. Backend calls Easebuzz `/payment/initiateLink` → returns `access_key`
3. Frontend opens Easebuzz Checkout SDK popup with `access_key`
4. Payment completes inside popup → `onResponse` callback fires
5. Result displayed inline on the same page

### Seamless Payment (Merchant-Hosted)
1. User fills form with card/UPI/NB details → submits
2. Backend separates payment params from seamless params
3. Backend encrypts card details (AES-256-CBC) if card payment
4. Backend calls `/payment/initiateLink` → gets `access_key`
5. Backend calls `/initiate_seamless_payment/` with `access_key` + payment details
6. Response is either a bank redirect page (HTML) or JSON result

---

## Testing

### Test Credentials
Use your sandbox credentials from the Easebuzz test dashboard.

### Test Card Details (for Seamless)
- Card Number: `4111111111111111`
- Expiry: `12/25`
- CVV: `123`
- Card Holder: `Test User`

### Test UPI
- UPI VPA: `success@easebuzz` (for success)
- UPI VPA: `failure@easebuzz` (for failure)

---

## Auto-Fill Feature

Every form page has an "Auto Fill Data" toggle in the header. Turn it ON to populate the form with valid test data for quick testing.

---

## Callback URL (surl/furl)

Set your success and failure URLs to:
```
http://localhost:3000/response
```

This endpoint verifies the reverse hash from Easebuzz and displays the payment result.

---

## Documentation

- [Easebuzz API Documentation](https://docs.easebuzz.in/)
- [Initiate Payment API](https://docs.easebuzz.in/docs/payment-gateway/8ec545c331e6f-initiate-payment-api)
- [Seamless Integration](https://docs.easebuzz.in/docs/payment-gateway/k3ho860cy66zh-seamless-integration-merchant-hosted)
- [Refund API](https://docs.easebuzz.in/docs/payment-gateway/c2ac48618b3bd-refund-api-v2)
- [Settlement API](https://docs.easebuzz.in/docs/payment-gateway/k0ynpfmhx3x0y-settlement-api)
- [Easy Collect API](https://docs.easebuzz.in/docs/payment-gateway/xnp0bvcy0ywmn-easy-collect)

---

## Support

For integration support, contact [Easebuzz Support](https://easebuzz.in/contact) or email support@easebuzz.in.
