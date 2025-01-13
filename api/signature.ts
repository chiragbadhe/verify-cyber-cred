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

export async function create_signature(
  address: Address,
  mint_eligibility: boolean,
  data: string
): Promise<Hex> {
  // Validate data length for bytes32
  const byteLength = new TextEncoder().encode(data).length;
  if (byteLength > 32) {
    throw new Error("Data exceeds bytes32 size limit");
  }

  const valueArray: [`0x${string}`, boolean, `0x${string}`] = [
    address,
    mint_eligibility,
    toHex(data, { size: 32 }) as `0x${string}`,
  ];
  const types = "address, bool, bytes32";
  const encodedData = encodeAbiParameters(
    parseAbiParameters(types),
    valueArray
  );
  const { r, s, v } = await sign({
    hash: hashMessage({ raw: toBytes(keccak256(encodedData)) }),
    privateKey: process.env.VERIFIER_PRIVATE_KEY as `0x${string}`,
  });

  let sBigInt = BigInt(s);
  if (v !== BigInt(27)) {
    sBigInt = sBigInt | (BigInt(1) << BigInt(255));
  }

  return `0x${r.slice(2)}${toHex(sBigInt, { size: 32 }).slice(2)}` as Hex;
}


