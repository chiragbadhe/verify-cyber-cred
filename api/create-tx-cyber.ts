import type { VercelRequest, VercelResponse } from "@vercel/node";
import { create_signature } from "./signature";
import { Address, isAddress } from "viem";
import { parseISO, isWithinInterval } from "date-fns";

/**
 * API endpoint handler for verifying transactions and generating signatures
 * Checks if an address has transactions in January 2025 and returns eligibility status
 *
 * @param req - Vercel HTTP request object containing address query parameter
 * @param res - Vercel HTTP response object
 * @returns JSON response with mint eligibility, transaction count, and verification signature
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { address } = req.query;

    // Validate the provided address
    if (!address || typeof address !== "string" || !isAddress(address)) {
      return res.status(400).json({ error: "Invalid address provided" });
    }

    // Get transaction verification results
    const [mint_eligibility, data] = await verifyTx(address as Address);

    // Generate cryptographic signature of the verification results
    const signature = await create_signature(
      address as Address,
      mint_eligibility,
      data
    );

    return res.status(200).json({ mint_eligibility, data, signature });
  } catch (error) {
    console.error("Error in handler:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Verifies if an address has transactions in January 2025
 *
 * @param address - Ethereum address to check transactions for
 * @returns Tuple containing [boolean eligibility status, string transaction count]
 * @throws Error if transaction verification fails
 */
export async function verifyTx(address: Address): Promise<[boolean, string]> {
  try {
    // Fetch transaction history from Cyber API
    const response = await fetch(
      `https://api.w3w.ai/cyber/v1/explorer/address/${address}/transactions`
    );

    const data = (await response.json()) as {
      data?: Array<{ block_timestamp: string }>;
    };

    // Return default values if no transaction data
    if (!data || !data.data) {
      return [false, "0"];
    }

    // Define the target time interval (January 2025)
    const targetInterval = {
      start: new Date("2025-01-01T00:00:00Z"),
      end: new Date("2025-01-31T23:59:59Z"),
    };

    // Count transactions within January 2025
    const januaryTxCount = data.data.filter((tx) => {
      const txDate = parseISO(tx.block_timestamp);
      return isWithinInterval(txDate, targetInterval);
    }).length;

    // Determine eligibility (must have at least 1 transaction)
    const isEligible = januaryTxCount >= 1;

    return [isEligible, januaryTxCount.toString()];
  } catch (error) {
    console.error("Error fetching transaction data:", error);
    throw new Error("Failed to verify address transactions");
  }
}
