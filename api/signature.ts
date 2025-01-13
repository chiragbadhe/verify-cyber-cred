import {
  encodeAbiParameters,
  parseAbiParameters,
  toBytes,
  Hex,
  hashMessage,
  keccak256,
  toHex,
  Address,
} from "viem";
import { sign } from "viem/accounts";

/**
 * Creates a signature for minting eligibility verification
 * @param address The wallet address to verify
 * @param mint_eligibility Boolean indicating if address is eligible to mint
 * @param data Additional data to include in signature (must fit in bytes32)
 * @returns Hex signature that can be verified on-chain
 */

export async function create_signature(
  address: Address,
  mint_eligibility: boolean,
  data: string
): Promise<Hex> {
  // Verify that data can fit within a bytes32 value
  let dataFitsInBytes32 = false;
  const byteLength = new TextEncoder().encode(data).length;
  dataFitsInBytes32 = byteLength <= 32;
  if (!dataFitsInBytes32) {
    console.log("Data does not fit in bytes32");
    throw new Error("Data exceeds bytes32 size limit");
  }

  // Create array of values to encode: [address, eligibility, data]
  const valueArray: [`0x${string}`, boolean, `0x${string}`] = [
    address,
    mint_eligibility,
    toHex(data, { size: 32 }) as `0x${string}`,
  ];

  // Define parameter types for ABI encoding
  const types = "address, bool, bytes32";

  // Encode the parameters according to Ethereum ABI specification
  const encodedData = encodeAbiParameters(
    parseAbiParameters(types),
    valueArray
  );

  // Create hash of encoded data and sign it with private key
  const { r, s, v } = await sign({
    hash: hashMessage({ raw: toBytes(keccak256(encodedData)) }),
    privateKey: process.env.VERIFIER_PRIVATE_KEY as `0x${string}`,
  });

  // Handle signature malleability
  // In Ethereum signatures, we need to ensure s is in the lower half of the curve
  // If v !== 27, then s is in the upper half and needs to be adjusted
  let sBigInt = BigInt(s);
  if (v !== BigInt(27)) {
    // Set the highest bit of s to 1, effectively converting s to n - s
    // where n is the curve order. This ensures a canonical signature form
    sBigInt = sBigInt | (BigInt(1) << BigInt(255));
  }

  // Convert the potentially modified s value to hex
  const sHex = toHex(sBigInt, { size: 32 });

  // Combine r and s components into final 64-byte signature
  // Note: v is not included as it can be recovered during verification
  const signature = `0x${r.slice(2)}${sHex.slice(2)}` as Hex;

  return signature;
}
