# PayTM Wallet

Wallet API for user balances, on-ramp funding, peer transfers, and merchant payments.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.21.2-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma Client](https://img.shields.io/badge/Prisma_Client-5.22.0-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](server/package.json)

## Overview

This repository currently contains the server side of a wallet system with separate user and merchant flows. The API supports:

- user and merchant signup/signin with JWT-based authentication
- wallet balance lookups
- user on-ramp balance top-ups
- user-to-user transfers
- user-to-merchant payments
- recent transaction history for users and merchants

## Tech Stack

- Node.js
- TypeScript
- Express
- Prisma
- PostgreSQL
- Zod
- JWT
- bcrypt

## Project Structure

```text
.
├── README.md
└── server
    ├── package.json
    ├── prisma
    │   ├── migrations
    │   └── schema.prisma
    ├── src
    │   ├── config.ts
    │   ├── db.ts
    │   ├── index.ts
    │   ├── middleware.ts
    │   ├── validation.ts
    │   └── routes
    │       ├── merchant.ts
    │       └── user.ts
    └── dist
```

## Installation

```bash
cd server
npm install
```

## Configuration

Create a `.env` file in `server/` using [`server/.env.example`](server/.env.example):

```env
DATABASE_URL=postgresql://user:password@localhost:5432/paytm_wallet
JWT_SECRET=your-secret-key-here
PORT=3000
```

`JWT_SECRET` is required at startup. The server derives separate user and merchant signing secrets from it.

## Quick Start

```bash
cd server
npx prisma migrate dev
npx tsc -b
node dist/index.js
```

Or use the existing package script:

```bash
cd server
npm run dev
```

The API listens on `http://localhost:3000` by default.

## API Endpoints

### User routes

Base path: `/api/v1/user`

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/signup` | No | Create a user account and wallet |
| `POST` | `/signin` | No | Authenticate a user and return a JWT |
| `GET` | `/balance` | Bearer token | Fetch wallet balance and locked amount |
| `GET` | `/transactions` | Bearer token | Fetch the latest 20 user-related transactions |
| `POST` | `/onramp` | Bearer token | Increase the signed-in user's balance |
| `POST` | `/transfer/merchant` | Bearer token | Pay a merchant from the user's wallet |
| `POST` | `/send` | Bearer token | Transfer funds to another user |

Example user signup request:

```http
POST /api/v1/user/signup
Content-Type: application/json

{
  "name": "Akash",
  "username": "akash01",
  "password": "secret123"
}
```

Example authenticated user transfer:

```http
POST /api/v1/user/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "toUserId": "user-uuid",
  "amount": 500
}
```

### Merchant routes

Base path: `/api/v1/merchant`

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/signup` | No | Create a merchant account and wallet |
| `POST` | `/signin` | No | Authenticate a merchant and return a JWT |
| `GET` | `/balance` | Bearer token | Fetch merchant balance and locked amount |
| `GET` | `/transactions` | Bearer token | Fetch the latest 20 incoming merchant payments |

Example merchant signin request:

```http
POST /api/v1/merchant/signin
Content-Type: application/json

{
  "username": "merchant01",
  "password": "secret123"
}
```

## Data Model

The Prisma schema defines:

- `User` and `UserAccount`
- `Merchant` and `MerchantAccount`
- `Transaction`

Supported transaction types:

- `ONRAMP`
- `TRANSFER`
- `MERCHANT_PAYMENT`

## Development Notes

- Source files live in [`server/src`](server/src).
- Compiled output is emitted to [`server/dist`](server/dist).
- Request validation is handled with Zod schemas in [`server/src/validation.ts`](server/src/validation.ts).
- Prisma access is centralized in [`server/src/db.ts`](server/src/db.ts).
- There is currently no real test suite configured. `npm test` exits with the default placeholder script.

## License

The server package is currently marked as `ISC` in [`server/package.json`](server/package.json).
