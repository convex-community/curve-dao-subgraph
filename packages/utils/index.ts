import { Address, Bytes } from '@graphprotocol/graph-ts'

export function bytesToAddress(input: Bytes): Address {
  const inputAsStr = input.toHexString()
  if (inputAsStr.length != 42) {
    return Address.zero()
  } else return Address.fromString(inputAsStr)
}

// convert a hex string (without leading '0x') to ASCII
export function hexStringToAscii(input: string): string {
  let res = '';
  for (let i = 0; i < input.length; i += 2) {
    const parsedInt: i32 = parseInt(input.slice(i, i + 2), 16) as i32
    res += String.fromCharCode(parsedInt);
  }
  return res;
}

export function parseIpfsResult(input: string): string {
  const text = hexStringToAscii(input.slice(2))
  return text.slice(9, -2)
}