# Cyber Network Transaction Verifier - January 2025

This project provides a template for verifying Ethereum addresses on the Cyber network. It verifies transaction history on the Cyber network during January 2025.

## Project Structure

```
verify-cyber-cred
├── api
│   ├── create-tx-base.ts
│   └── signature.ts
├── test
│   └── verify.test.ts
├── .env
├── .env.sample
├── .gitignore
├── bun.lockb
├── jest.config.js
├── package.json
├── README.md
└── tsconfig.json
```

## Features

1. **Transaction Verification**: Verifies if an address has any transactions on the Cyber network during January 2025.
2. **Signature Generation**: Creates a cryptographic signature for verified addresses containing eligibility status and transaction count.

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   bun install
   ```
3. Copy `.env.sample` to `.env` and fill in the required values:
   ```
   VERIFIER_PRIVATE_KEY=your_private_key
   ```

## Usage

### Balance Verification

The `create-tx-cyber.ts` file contains the logic for checking an address's interaction on cyber in month january 2025.

### Running Tests

To run the tests:

```
bun run test
```

## API Endpoints

The project is designed to be deployed as serverless functions. The main handler functions are:

- `/api/create-tx-cyber`: check transaction count on cyber in month january 2025

Both endpoints return a JSON response with the verification result and a signature.

## Environment Variables

- `VERIFIER_PRIVATE_KEY`: Your Basescan API key for accessing the Basescan API


Contributions are welcome! Please feel free to submit a Pull Request.
