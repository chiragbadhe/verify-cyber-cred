import { create_signature } from "../api/signature";
import { verifyTx } from "../api/create-tx-cyber";
import { Address } from "viem";
import dotenv from "dotenv";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

dotenv.config();

const server = setupServer(
  http.get(
    "https://api.w3w.ai/cyber/v1/explorer/address/:address/transactions",
    () => {
      const mockData = {
        data: [
          { block_timestamp: "2025-01-15T10:00:00Z" },
          { block_timestamp: "2025-01-16T11:00:00Z" },
          { block_timestamp: "2024-12-31T23:59:59Z" },
        ],
      };
      return HttpResponse.json(mockData);
    }
  )
);

describe("Verification and Signature Tests", () => {
  const mockAddress: Address = "0x1234567890abcdef1234567890abcdef12345678";
  const mockPrivateKey = process.env.VERIFIER_PRIVATE_KEY;

  beforeAll(() => server.listen());
  afterAll(() => server.close());
  afterEach(() => server.resetHandlers());

  beforeEach(() => {
    process.env.VERIFIER_PRIVATE_KEY = mockPrivateKey;
  });

  afterEach(() => {
    delete process.env.VERIFIER_PRIVATE_KEY;
  });

  describe("verifyTx", () => {
    it("should return true and count for transactions in January 2025", async () => {
      const [isEligible, count] = await verifyTx(mockAddress);
      expect(isEligible).toBe(true);
      expect(count).toBe("2");
    });

    it("should handle API errors gracefully", async () => {
      server.use(
        http.get(
          "https://api.w3w.ai/cyber/v1/explorer/address/:address/transactions",
          () => {
            return new HttpResponse(null, { status: 500 });
          }
        )
      );

      await expect(verifyTx(mockAddress)).rejects.toThrow(
        "Failed to verify address transactions"
      );
    });

    it("should return false and 0 for no transactions", async () => {
      server.use(
        http.get(
          "https://api.w3w.ai/cyber/v1/explorer/address/:address/transactions",
          () => {
            return HttpResponse.json({ data: [] });
          }
        )
      );

      const [isEligible, count] = await verifyTx(mockAddress);
      expect(isEligible).toBe(false);
      expect(count).toBe("0");
    });
  });

  describe("create_signature", () => {
    it("should create valid signature with verification results", async () => {
      const [isEligible, count] = await verifyTx(mockAddress);

      const signature = await create_signature(mockAddress, isEligible, count);

      expect(signature).toMatch(/^0x[a-fA-F0-9]{128}$/);
      expect(signature).toBeTruthy();
    });

    it("should throw error for invalid data size", async () => {
      await expect(
        create_signature(mockAddress, true, "A".repeat(33))
      ).rejects.toThrow("Data exceeds bytes32 size limit");
    });

    it("should create different signatures for different eligibility", async () => {
      const sig1 = await create_signature(mockAddress, true, "1");
      const sig2 = await create_signature(mockAddress, false, "1");

      expect(sig1).not.toEqual(sig2);
      expect(sig1).toMatch(/^0x[a-fA-F0-9]{128}$/);
      expect(sig2).toMatch(/^0x[a-fA-F0-9]{128}$/);
    });

    it("should throw error when private key is missing", async () => {
      delete process.env.VERIFIER_PRIVATE_KEY;

      await expect(create_signature(mockAddress, true, "1")).rejects.toThrow();
    });
  });
});
