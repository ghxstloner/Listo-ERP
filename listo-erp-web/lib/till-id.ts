import Hashids from "hashids";

const SALT = process.env.NEXT_PUBLIC_TILL_ID_SALT ?? "listo-erp-till";
const MIN_LENGTH = 6;

const hashids = new Hashids(SALT, MIN_LENGTH, "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789");
export function encodeTillId(id: number): string {
  return hashids.encode(id);
}
export function decodeTillId(hash: string): number | null {
  const decoded = hashids.decode(hash);
  if (decoded.length !== 1 || typeof decoded[0] !== "number") {
    return null;
  }
  return decoded[0];
}
