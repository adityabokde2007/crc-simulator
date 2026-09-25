export function xorDivision(dividend, divisor) {
  let steps = [];
  
  let current = dividend.substring(0, divisor.length);
  let pos = divisor.length;
  
  while (pos <= dividend.length) {
    if (current[0] === '1') {
      let xorResult = '';
      for (let i = 0; i < divisor.length; i++) {
        xorResult += current[i] === divisor[i] ? '0' : '1';
      }
      
      steps.push({
        dividend: current,
        divisor: divisor,
        xorResult: xorResult,
        padding: ' '.repeat(pos - divisor.length)
      });
      
      current = xorResult.substring(1);
    } else {
      let xorResult = '';
      let zeroDivisor = '0'.repeat(divisor.length);
      for (let i = 0; i < divisor.length; i++) {
        xorResult += current[i] === zeroDivisor[i] ? '0' : '1';
      }
      
      steps.push({
        dividend: current,
        divisor: zeroDivisor,
        xorResult: xorResult,
        padding: ' '.repeat(pos - divisor.length)
      });
      
      current = xorResult.substring(1);
    }
    
    if (pos < dividend.length) {
      current += dividend[pos];
    }
    pos++;
  }
  
  return { steps, remainder: current };
}

export function encodeCRC(data, poly) {
  const dividend = data + '0'.repeat(poly.length - 1);
  const { steps, remainder } = xorDivision(dividend, poly);
  return { codeword: data + remainder, steps, remainder };
}

export function verifyCRC(codeword, poly) {
  const { steps, remainder } = xorDivision(codeword, poly);
  const isValid = parseInt(remainder, 2) === 0;
  return { isValid, steps, remainder };
}

export function flipRandomBit(codeword) {
  const index = Math.floor(Math.random() * codeword.length);
  const chars = codeword.split('');
  chars[index] = chars[index] === '0' ? '1' : '0';
  return { newCodeword: chars.join(''), flippedIndex: index };
}

export function parsePolynomialInput(input) {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^[01]+$/.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.toLowerCase().includes('x')) {
    let cleanStr = trimmed.toLowerCase().replace(/\s+/g, '');
    
    // Normalize Unicode superscripts to regular digits
    cleanStr = cleanStr.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (match) => {
      const map = {
        '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', 
        '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9'
      };
      return map[match];
    });
    
    if (/[^x\^\+0-9]/.test(cleanStr)) {
      return null;
    }

    const terms = cleanStr.split('+').filter(t => t.length > 0);
    const powers = [];

    for (const term of terms) {
      if (term === 'x') {
        powers.push(1);
      } else if (term.startsWith('x^')) {
        const powerStr = term.substring(2);
        const power = parseInt(powerStr, 10);
        if (isNaN(power) || power < 0) return null;
        powers.push(power);
      } else if (term.startsWith('x') && term.length > 1) {
        // Handles x4 after superscript normalization or if user just types x4
        const powerStr = term.substring(1);
        const power = parseInt(powerStr, 10);
        if (isNaN(power) || power < 0) return null;
        powers.push(power);
      } else if (/^\d+$/.test(term)) {
        powers.push(0);
      } else {
        return null; 
      }
    }

    if (powers.length === 0) return null;

    const maxPower = Math.max(...powers);
    const binaryArr = Array(maxPower + 1).fill('0');
    
    for (const p of powers) {
      binaryArr[maxPower - p] = '1';
    }

    return binaryArr.join('');
  }

  return null;
}
