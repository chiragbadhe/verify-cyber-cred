import type { VercelRequest, VercelResponse } from "@vercel/node";
import { create_signature } from "./signature";
import { Address, isAddress } from "viem";
import axios from "axios";
import dotenv from "dotenv";
import { fromUnixTime, isWithinInterval } from "date-fns";

dotenv.config();
const CYBER_API_KEY = process.env.CYBER_API_KEY;
const CYBER_API_URL = "https://api.socialscan.io/cyber";

interface CyberResponse {
  status: string;
  message: string;
  result: any[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { address } = req.query;

    if (!address || typeof address !== "string" || !isAddress(address)) {
      return res.status(400).json({ error: "Invalid address provided" });
    }

    const [mint_eligibility, data] = await verifyTx(address as Address);
    
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

export async function verifyTx(address: Address): Promise<[boolean, string]> {
  try {
    const response = await axios.get<CyberResponse>(CYBER_API_URL, {
      params: {
        module: "account",
        action: "txlist",
        address: address,
        apikey: CYBER_API_KEY,
      },
    });

    if (response.data.status !== "1") {
      return [false, "0"];
    }

    const targetInterval = {
      start: new Date("2025-01-01T00:00:00Z"),
      end: new Date("2025-01-31T23:59:59Z"),
    };

    const januaryTxCount = response.data.result.filter((tx) => {
      const txDate = fromUnixTime(parseInt(tx.timeStamp));
      return isWithinInterval(txDate, targetInterval);
    }).length;

    const isEligible = januaryTxCount >= 1;

    return [isEligible, januaryTxCount.toString()];
  } catch (error) {
    console.error("Error fetching data from Cyber API:", error);
    throw new Error("Failed to verify address on Cyber");
  }
}
