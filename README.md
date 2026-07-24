# Pageant Voting System - Backend API

## 🎉 NEW FEATURES (Latest Update)

### User Registration & Admin Management System

**Major additions to the original pay-per-vote system:**

✅ **User Registration System**
- Users can register to become contestants
- Email validation and uniqueness checks
- Profile management (name, email, phone, bio, social media)
- Optional payment before registration (admin-controlled)

✅ **Admin Control Panel**
- Complete admin dashboard with authentication
- Real-time statistics (users, votes, revenue)
- Admin-controlled payment requirements
- System settings management

✅ **Contestant Approval Workflow**
- Admin reviews all registered users
- Approve/reject contestant applications
- Only approved users appear in voting
- Admin notes and audit trail

✅ **Image Upload (Cloudinary)**
- Upload contestant photos
- Automatic image optimization
- Secure cloud storage
- Delete old images on update

✅ **Bulk User Import**
- Import users from CSV/Excel files
- Automatic validation and error reporting
- Duplicate detection
- Auto-approve option
- [Sample CSV Template](./sample-bulk-upload.csv)

✅ **Manual Vote Management**
- Admin can add votes manually
- Track offline votes
- Audit trail for admin actions
- Reason tracking

### 📚 New Documentation
- **[API Documentation](./API_DOCUMENTATION.md)** - Complete API reference for new features
- **[Implementation Summary](./IMPLEMENTATION_SUMMARY.md)** - Detailed feature breakdown

### 🔑 Admin Access

Default credentials (⚠️ change in production):
```
Email: admin@pageant.com
Password: admin123
```

Create admin user:
```bash
npm run seed:admin
```

### 🌐 New Environment Variables

Add to your `.env`:
```env
# Cloudinary (Required for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Admin Configuration
ADMIN_EMAIL=admin@pageant.com
ADMIN_PASSWORD=admin123
JWT_SECRET=your_jwt_secret_key_here

# Registration Settings
REGISTRATION_FEE=5000
REQUIRE_PAYMENT_BEFORE_REGISTRATION=false
```

### 📋 New API Endpoints

#### User Registration
- `GET /api/users/registration/settings` - Check if payment required
- `POST /api/users/register` - Register new user
- `POST /api/payments/registration/initialize` - Init registration payment
- `GET /api/payments/registration/verify` - Verify registration payment

#### Admin Management (🔒 Requires JWT)
- `POST /api/admin/login` - Admin login
- `GET /api/admin/settings` - Get system settings
- `PUT /api/admin/settings` - Update settings
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - List all users (with filters)
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id` - Update user (with image upload)
- `DELETE /api/admin/users/:id` - Delete user
- `POST /api/admin/users/:id/approve` - Approve as contestant
- `POST /api/admin/users/:id/reject` - Reject application
- `POST /api/admin/users/bulk-upload` - Bulk import users
- `POST /api/admin/votes/add` - Manually add votes

### 🎯 Complete User Flow

**With Payment Required:**
1. User pays registration fee → 2. Verifies payment → 3. Completes registration → 4. Admin approves → 5. User becomes contestant

**Without Payment:**
1. User registers directly → 2. Admin approves → 3. User becomes contestant

**Bulk Upload:**
1. Admin uploads CSV → 2. System validates and creates users → 3. Auto-approves if enabled

See [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for detailed flows.

---

# Original System Documentation

Pay-per-vote backend system with Paystack, Flutterwave, and Bank Transfer integration.

## 🎯 System Overview

This is a **pay-per-vote** system where:
- No user registration/authentication required
- Voters pay to cast votes
- Payment methods: Paystack, Flutterwave, Bank Transfer
- Votes are applied after successful payment

## 📋 Features

✅ **Payment Integration**
- Paystack payment gateway
- Flutterwave payment gateway
- Direct bank transfer support
- Webhook handling for auto-verification

✅ **Vote Management**
- Buy multiple votes at once
- Vote packages (1, 10, 50 votes)
- Real-time vote counting
- Results and statistics

✅ **Candidate Management**
- CRUD operations for candidates
- Category-based filtering (Miss, Mister, Teen)
- Vote tracking per candidate

✅ **Transaction Tracking**
- Complete transaction history
- Payment status tracking
- Automatic vote application

## 🛠️ Tech Stack

- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Paystack API** - Payment gateway
- **Flutterwave API** - Payment gateway
- **Swagger** - API documentation

## 📦 Installation

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)

### Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**

Create/Update `.env` file:
```env
PORT=4545
MONGO_URI=mongodb://localhost:27017/pegeant-voting

# Client URL
CLIENT_URL=http://localhost:5173

# Payment Configuration
PRICE_PER_VOTE=100

# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key_here

# Flutterwave Configuration
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-your_flutterwave_secret_key_here
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-your_flutterwave_public_key_here
FLUTTERWAVE_WEBHOOK_SECRET=your_webhook_secret_here

# Bank Transfer Details
BANK_NAME=Your Bank Name
ACCOUNT_NUMBER=1234567890
ACCOUNT_NAME=Pageant Voting Account
```

3. **Seed sample data:**
```bash
# Seed candidates
npm run seed

# Seed vote packages (optional)
npm run seed:packages
```

4. **Start server:**
```bash
npm run dev
```

Server will run on: `http://localhost:4545`

## 📚 API Documentation

**Swagger UI:** `http://localhost:4545/api-docs`

## 🔌 API Endpoints

### Candidates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/candidates` | Get all candidates |
| GET | `/api/candidates/category/:category` | Get by category |
| GET | `/api/candidates/:id` | Get single candidate |
| POST | `/api/candidates` | Create candidate |
| PUT | `/api/candidates/:id` | Update candidate |
| DELETE | `/api/candidates/:id` | Delete candidate |

### Votes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/votes/results` | Get voting results |
| GET | `/api/votes/statistics` | Get vote statistics |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/initialize` | Initialize payment |
| GET | `/api/payments/verify?reference=xxx` | Verify payment |
| GET | `/api/payments/packages` | Get vote packages |
| GET | `/api/payments/transactions` | Get all transactions |
| GET | `/api/payments/transaction/:ref` | Get transaction by reference |
| POST | `/api/payments/webhook/paystack` | Paystack webhook |
| POST | `/api/payments/webhook/flutterwave` | Flutterwave webhook |

## 💳 Payment Flow

### 1. Initialize Payment

```bash
POST /api/payments/initialize
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "08012345678",
  "candidateId": "60d5ec49f1b2c72b8c8e4f1b",
  "numberOfVotes": 10,
  "paymentMethod": "paystack"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment initialized successfully",
  "data": {
    "authorizationUrl": "https://checkout.paystack.com/xxx",
    "accessCode": "xxx",
    "reference": "PGV-1234567890-ABC123"
  }
}
```

### 2. Redirect User to Payment Page

User completes payment on Paystack/Flutterwave

### 3. Verify Payment

```bash
GET /api/payments/verify?reference=PGV-1234567890-ABC123
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "transaction": {
      "_id": "xxx",
      "fullName": "John Doe",
      "email": "john@example.com",
      "numberOfVotes": 10,
      "paymentStatus": "successful",
      "votesApplied": true
    },
    "candidate": {
      "name": "Emma Johnson",
      "votes": 52
    }
  }
}
```

### 4. Votes Automatically Applied

The system automatically:
- Marks transaction as successful
- Adds votes to candidate
- Creates vote record

## 📊 Database Models

### Transaction
```javascript
{
  fullName: String,
  email: String,
  phone: String,
  candidateId: ObjectId (ref: Candidate),
  numberOfVotes: Number,
  amount: Number,
  paymentMethod: String (paystack/flutterwave/bank_transfer),
  paymentStatus: String (pending/successful/failed),
  paymentReference: String (unique),
  votesApplied: Boolean,
  createdAt: Date
}
```

### Vote
```javascript
{
  transactionId: ObjectId (ref: Transaction),
  candidateId: ObjectId (ref: Candidate),
  category: String (Miss/Mister/Teen),
  numberOfVotes: Number,
  voterEmail: String,
  voterName: String,
  timestamp: Date
}
```

### Candidate
```javascript
{
  name: String,
  age: Number,
  photo: String,
  bio: String,
  category: String (Miss/Mister/Teen),
  votes: Number (default: 0),
  createdAt: Date
}
```

### VotePackage
```javascript
{
  name: String,
  numberOfVotes: Number,
  price: Number,
  currency: String (default: NGN),
  isActive: Boolean,
  discount: Number
}
```

## 🔐 Payment Gateway Setup

### Paystack Setup

1. Sign up at [paystack.com](https://paystack.com)
2. Get your API keys from Settings → API Keys
3. Add keys to `.env` file:
```env
PAYSTACK_SECRET_KEY=sk_test_xxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
```

### Flutterwave Setup

1. Sign up at [flutterwave.com](https://flutterwave.com)
2. Get your API keys from Settings → API
3. Add keys to `.env` file:
```env
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxxxx
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxxxx
FLUTTERWAVE_WEBHOOK_SECRET=xxxxx
```

### Webhook Configuration

**Paystack Webhook URL:**
```
https://your-domain.com/api/payments/webhook/paystack
```

**Flutterwave Webhook URL:**
```
https://your-domain.com/api/payments/webhook/flutterwave
```

## 🧪 Testing

### Test Payment (Paystack)

Use Paystack test cards:
```
Card: 4084084084084081
CVV: 408
Expiry: Any future date
PIN: 0000
OTP: 123456
```

### Test Payment (Flutterwave)

Use Flutterwave test cards:
```
Card: 5531886652142950
CVV: 564
Expiry: 09/32
PIN: 3310
OTP: 12345
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port | Yes |
| MONGO_URI | MongoDB connection string | Yes |
| CLIENT_URL | Frontend URL for CORS | Yes |
| PRICE_PER_VOTE | Price per vote in kobo/cent | Yes |
| PAYSTACK_SECRET_KEY | Paystack secret key | For Paystack |
| PAYSTACK_PUBLIC_KEY | Paystack public key | For Paystack |
| FLUTTERWAVE_SECRET_KEY | Flutterwave secret key | For Flutterwave |
| FLUTTERWAVE_PUBLIC_KEY | Flutterwave public key | For Flutterwave |
| FLUTTERWAVE_WEBHOOK_SECRET | Flutterwave webhook secret | For Flutterwave |
| BANK_NAME | Bank name for transfers | For Bank Transfer |
| ACCOUNT_NUMBER | Account number | For Bank Transfer |
| ACCOUNT_NAME | Account name | For Bank Transfer |

## 🚀 Deployment

### Production Checklist

- [ ] Use production API keys (remove `_test_`)
- [ ] Set secure MONGO_URI (MongoDB Atlas)
- [ ] Configure webhooks on payment gateways
- [ ] Set CLIENT_URL to production frontend
- [ ] Enable HTTPS
- [ ] Add rate limiting
- [ ] Set up monitoring

## 🔧 Troubleshooting

### Payment not verifying
- Check webhook configuration
- Verify API keys are correct
- Check server logs for errors

### Votes not applying
- Check `votesApplied` flag in transaction
- Verify candidate exists
- Check server logs

### Webhook not receiving
- Ensure webhook URL is publicly accessible
- Check webhook signature validation
- Test webhook manually

## 📞 Support

For issues or questions:
- Check Swagger docs: `/api-docs`
- Review this README
- Check server logs

## 📄 License

MIT

---

**Built for seamless pageant voting! 🎭✨**
