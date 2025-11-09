# Payment System Integration (P4BA17)

## Overview

토스페이먼츠 API를 통합한 AI 평가 리포트 구매 결제 시스템입니다.

## Files Created

### 1. Toss Payments Client
- **File**: `src/lib/payment/toss-client.ts`
- **Purpose**: 토스페이먼츠 API 클라이언트
- **Features**:
  - Payment confirmation
  - Payment cancellation
  - Payment inquiry
  - Mock mode support (when API keys are not configured)
  - Amount calculation helper

### 2. API Endpoints

#### Checkout API
- **Endpoint**: `POST /api/payments/checkout`
- **File**: `src/app/api/payments/checkout/route.ts`
- **Purpose**: Create payment order
- **Request Body**:
  ```json
  {
    "politician_id": "uuid",
    "evaluators": ["claude", "chatgpt", "gemini", "grok", "perplexity"] | ["all"]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "order_id": "ORDER_...",
    "amount": 500000,
    "order_name": "정치인명 - AI 평가 리포트",
    "customer_email": "user@example.com",
    "customer_name": "사용자명"
  }
  ```

#### Confirm API
- **Endpoint**: `POST /api/payments/confirm`
- **File**: `src/app/api/payments/confirm/route.ts`
- **Purpose**: Confirm payment with Toss Payments
- **Request Body**:
  ```json
  {
    "paymentKey": "string",
    "orderId": "string",
    "amount": 500000
  }
  ```
- **Security**:
  - User authentication required
  - Order ownership verification
  - Amount validation (server-side vs client-side)
  - Prevents duplicate confirmation

#### History API
- **Endpoint**: `GET /api/payments/history`
- **File**: `src/app/api/payments/history/route.ts`
- **Purpose**: Get user's payment history
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20)
  - `status`: Filter by status (pending, completed, failed, cancelled, refunded)
  - `politician_id`: Filter by politician

#### Cancel API
- **Endpoint**: `POST /api/payments/[id]/cancel`
- **File**: `src/app/api/payments/[id]/cancel/route.ts`
- **Purpose**: Cancel/refund payment
- **Request Body**:
  ```json
  {
    "cancelReason": "취소 사유",
    "cancelAmount": 500000  // Optional, for partial cancellation
  }
  ```

#### Webhook API
- **Endpoint**: `POST /api/payments/webhook`
- **File**: `src/app/api/payments/webhook/route.ts`
- **Purpose**: Handle Toss Payments webhook events
- **Events**:
  - `PAYMENT_COMPLETED`: Payment successful
  - `PAYMENT_CANCELED`: Payment canceled
  - `PAYMENT_FAILED`: Payment failed
- **Security**: Webhook signature verification (TODO in production)

## Environment Variables

Add to `.env.local`:

```bash
# Toss Payments API Keys
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...  # Client key (public)
TOSS_SECRET_KEY=test_sk_...              # Secret key (server-only)
```

## Pricing

- **Individual AI Model**: ₩500,000 per model
- **Bundle (All 5 models)**: ₩2,500,000

### Supported AI Models
1. Claude
2. ChatGPT
3. Gemini
4. Grok
5. Perplexity

## Database Schema

Uses the existing `payments` table with the following structure:

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'KRW',
  payment_method VARCHAR(50) NOT NULL,
  transaction_id VARCHAR(200) UNIQUE,
  pg_provider VARCHAR(50),
  status VARCHAR(50), -- pending, completed, failed, cancelled, refunded
  purpose VARCHAR(100),
  description TEXT,
  metadata JSONB,
  paid_at TIMESTAMP,
  refunded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Metadata Structure

```json
{
  "politician_id": "uuid",
  "politician_name": "정치인명",
  "evaluators": ["claude", "chatgpt"],
  "purchased_all": false,
  "toss_data": { /* Toss response */ },
  "approved_at": "ISO timestamp",
  "payment_method_detail": "CARD",
  "card_info": {
    "company": "신한",
    "number": "1234****5678",
    "approve_no": "12345678"
  }
}
```

## Security Features

1. **Authentication**: All endpoints require user login (except webhook)
2. **Authorization**: Users can only access their own payment records
3. **Amount Validation**: Server-side amount calculation prevents tampering
4. **Idempotency**: Prevents duplicate payment confirmations
5. **Transaction Safety**: Uses database transactions for critical operations
6. **Webhook Security**: Signature verification (TODO in production)

## Mock Mode

When API keys are not configured, the system operates in mock mode:
- Returns simulated responses
- No actual payment processing
- Useful for development and testing
- Console warnings indicate mock mode

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (in dev mode)"
}
```

HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error

## Testing

### Manual Testing

1. **Create Order**:
   ```bash
   curl -X POST http://localhost:3000/api/payments/checkout \
     -H "Content-Type: application/json" \
     -d '{
       "politician_id": "uuid",
       "evaluators": ["claude"]
     }'
   ```

2. **Confirm Payment** (Mock mode):
   ```bash
   curl -X POST http://localhost:3000/api/payments/confirm \
     -H "Content-Type: application/json" \
     -d '{
       "paymentKey": "test_key",
       "orderId": "ORDER_...",
       "amount": 500000
     }'
   ```

3. **Get Payment History**:
   ```bash
   curl http://localhost:3000/api/payments/history
   ```

### Integration with Toss Payments

For production deployment:

1. Sign up at https://developers.tosspayments.com
2. Get API keys (Client Key & Secret Key)
3. Update environment variables
4. Configure webhook URL in Toss dashboard
5. Implement webhook signature verification
6. Test with Toss test keys before going live

## Future Enhancements

1. **Webhook Signature Verification**: Implement HMAC-SHA256 verification
2. **Partial Refunds**: Support partial cancellation
3. **Payment Analytics**: Track conversion rates, revenue
4. **Receipt Generation**: PDF receipt generation
5. **Payment Notifications**: Email/SMS notifications
6. **Subscription Support**: Recurring payments for premium features
7. **Multiple Payment Methods**: Add bank transfer, mobile payments

## Documentation

- [Toss Payments API Docs](https://docs.tosspayments.com/)
- [Toss Payments Dashboard](https://developers.tosspayments.com/)

## Task Information

- **Task ID**: P4BA17
- **Phase**: Phase 4
- **Area**: Backend APIs
- **Agent**: backend-developer
- **Created**: 2025-11-09
