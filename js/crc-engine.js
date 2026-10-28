const CRC16_POLY = "10001000000100001";

export function xorDivision(dividend, divisor) {
  let steps = [];
  let current = dividend.substring(0, divisor.length);
  let pos = divisor.length;

  while (pos <= dividend.length) {
    let xorResult = '';
    const isOne = current[0] === '1';
    const div = isOne ? divisor : '0'.repeat(divisor.length);

    for (let i = 0; i < divisor.length; i++) {
      xorResult += current[i] === div[i] ? '0' : '1';
    }

    steps.push({
      dividend: current,
      divisor: div,
      xorResult: xorResult,
      padding: ' '.repeat(pos - divisor.length)
    });

    current = xorResult.substring(1);
    if (pos < dividend.length) {
      current += dividend[pos];
    }
    pos++;
  }

  return { steps, remainder: current };
}

export function textToBinary(text) {
  let chars = [];
  let binaryStr = '';
  for (let i = 0; i < text.length; i++) {
    const dec = text.charCodeAt(i);
    const hx = dec.toString(16).padStart(2, '0');
    const binVal = dec.toString(2).padStart(8, '0');
    binaryStr += binVal;
    chars.push({ char: text[i], decimal: dec, hex: hx, binary: binVal });
  }
  return { chars, binaryString: binaryStr, message: text };
}

export function binaryToText(binaryStr) {
  let chars = [];
  for (let i = 0; i < binaryStr.length - 7; i += 8) {
    const chunk = binaryStr.substring(i, i + 8);
    const code = parseInt(chunk, 2);
    if (code >= 32 && code <= 126) {
      chars.push(String.fromCharCode(code));
    } else {
      chars.push('');
    }
  }
  return chars.join('');
}

export function generateRandomMac() {
  const bytes = [];
  for (let i = 0; i < 6; i++) {
    bytes.push(Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase());
  }
  return bytes.join(':');
}

export function macToBinary(mac) {
  const clean = mac.replace(/[:-]/g, '');
  return parseInt(clean, 16).toString(2).padStart(48, '0');
}

export function binaryToMac(bin) {
  const hex = parseInt(bin, 2).toString(16).padStart(12, '0').toUpperCase();
  let parts = [];
  for (let i = 0; i < 12; i += 2) {
    parts.push(hex.substring(i, i + 2));
  }
  return parts.join(':');
}

export function clientEncapsulate(message) {
  const textInfo = textToBinary(message);
  const srcMac = generateRandomMac();
  const dstMac = generateRandomMac();
  const headerBits = macToBinary(srcMac) + macToBinary(dstMac);
  const payloadBits = textInfo.binaryString;
  const frameBits = headerBits + payloadBits;
  const dividend = frameBits + '0'.repeat(CRC16_POLY.length - 1);
  const { steps, remainder } = xorDivision(dividend, CRC16_POLY);
  const finalCodeword = frameBits + remainder;

  return {
    message,
    asciiTable: textInfo.chars,
    payloadBits,
    srcMAC: srcMac,
    dstMAC: dstMac,
    headerBits,
    frameBits,
    generator: CRC16_POLY,
    crcSteps: steps,
    crcRemainder: remainder,
    finalCodeword
  };
}

export function clientDeencapsulate(codeword) {
  const { steps, remainder } = xorDivision(codeword, CRC16_POLY);
  const isValid = parseInt(remainder, 2) === 0;
  const headerBits = codeword.slice(0, 96);
  const payloadBits = codeword.slice(96, -16);
  const srcMac = binaryToMac(headerBits.slice(0, 48));
  const dstMac = binaryToMac(headerBits.slice(48, 96));
  const decodedText = binaryToText(payloadBits);

  return {
    isValid,
    crcRemainder: remainder,
    crcSteps: steps,
    srcMAC: srcMac,
    dstMAC: dstMac,
    payloadBits,
    decodedText
  };
}

export function clientSimulateChannel(codeword, probability = 0.3) {
  if (Math.random() < probability) {
    const idx = Math.floor(Math.random() * codeword.length);
    const chars = codeword.split('');
    chars[idx] = chars[idx] === '0' ? '1' : '0';
    return { newCodeword: chars.join(''), flippedIndex: idx, wasCorrupted: true };
  }
  return { newCodeword: codeword, flippedIndex: -1, wasCorrupted: false };
}

