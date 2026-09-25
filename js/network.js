export function generateFakeIP() {
  const existingIP = sessionStorage.getItem('crc_device_ip');
  if (existingIP) {
    return existingIP;
  }
  
  const lastOctet = Math.floor(Math.random() * 254) + 1;
  const newIP = `203.0.113.${lastOctet}`;
  
  sessionStorage.setItem('crc_device_ip', newIP);
  return newIP;
}

export function simulateChannelTransmission(codeword) {
  // 30% chance to flip one random bit to simulate channel noise
  if (Math.random() < 0.3) {
    const index = Math.floor(Math.random() * codeword.length);
    const chars = codeword.split('');
    chars[index] = chars[index] === '0' ? '1' : '0';
    return chars.join('');
  }
  return codeword; // Clean transmission (70% chance)
}
