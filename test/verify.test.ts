import { create_signature } from "../api/signature";
import axios from "axios";
import { Address } from "viem";
import { verifyTx } from "../api/create-tx-cyber";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("create_signature", () => {
  const mockAddress: Address = "0x1234567890abcdef1234567890abcdef12345678";
  const mockPrivateKey = "0xc4444980d215a43777e47888705177d7f498ae90f3492d9644e922afdb405eb2";

  beforeEach(() => {
    process.env.VERIFIER_PRIVATE_KEY = mockPrivateKey;
  });

  afterEach(() => {
    delete process.env.VERIFIER_PRIVATE_KEY;
  });

  it("should create a valid signature", async () => {
    const mockMintEligibility = true;
    const mockData = "Test data";

    const signature = await create_signature(
      mockAddress,
      mockMintEligibility,
      mockData
    );

    expect(signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
    expect(signature).toBeTruthy();
  });

  it("should throw an error if data exceeds bytes32 size limit", async () => {
    const mockMintEligibility = true;
    const mockData = "A".repeat(33);

    await expect(
      create_signature(mockAddress, mockMintEligibility, mockData)
    ).rejects.toThrow("Data exceeds bytes32 size limit");
  });
});

describe("verifyTx", () => {
  const mockAddress: Address = "0x1234567890abcdef1234567890abcdef12345678";
  const januaryTimestamp = Math.floor(new Date("2025-01-15").getTime() / 1000);
  const decemberTimestamp = Math.floor(new Date("2024-12-15").getTime() / 1000);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return true and transaction count when transactions exist in January 2025", async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        status: "1",
        result: [
          { timeStamp: januaryTimestamp.toString() },
          { timeStamp: januaryTimestamp.toString() },
          { timeStamp: decemberTimestamp.toString() }, // Should be ignored
        ],
      },
    });

    const [isEligible, txCount] = await verifyTx(mockAddress);

    expect(isEligible).toBe(true);
    expect(txCount).toBe("2");
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      "https://api.socialscan.io/cyber",
      expect.any(Object)
    );
  });

  it("should return false and zero transaction count when no transactions exist in January 2025", async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        status: "1",
        result: [{ timeStamp: decemberTimestamp.toString() }],
      },
    });

    const [isEligible, txCount] = await verifyTx(mockAddress);

    expect(isEligible).toBe(false);
    expect(txCount).toBe("0");
  });

  it("should return false when API returns unsuccessful status", async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        status: "0",
        result: [],
      },
    });

    const [isEligible, txCount] = await verifyTx(mockAddress);

    expect(isEligible).toBe(false);
    expect(txCount).toBe("0");
  });

  it("should throw an error when the API call fails", async () => {
    mockedAxios.get.mockRejectedValue(new Error("Network Error"));

    await expect(verifyTx(mockAddress)).rejects.toThrow(
      "Failed to verify address on Cyber"
    );
  });
});
