import { jsPDF } from 'jspdf';

export function generateReceiverReport(codeword, poly, myIP, senderIP, result) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(47, 93, 140); // text-accent
  doc.text('CRC Simulation Report', 20, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(91, 100, 120); // text-secondary
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);
  
  // Network Info
  doc.setFontSize(14);
  doc.setTextColor(28, 35, 51); // text-primary
  doc.text('Network Configuration', 20, 45);
  
  doc.setFontSize(11);
  doc.text(`Sender IP: ${senderIP}`, 25, 55);
  doc.text(`Receiver IP: ${myIP}`, 25, 62);
  
  // Transmission Data
  doc.setFontSize(14);
  doc.text('Transmission Data', 20, 77);
  
  doc.setFontSize(11);
  doc.text(`Received Codeword: ${codeword}`, 25, 87);
  doc.text(`Generator Polynomial: ${poly}`, 25, 94);
  
  // Integrity Results
  doc.setFontSize(14);
  doc.text('Integrity Check Results', 20, 109);
  
  let yPos = 119;
  
  if (result.isValid) {
    doc.setTextColor(62, 130, 103); // success
    doc.text('Status: PASSED - No errors detected', 25, yPos);
  } else {
    doc.setTextColor(196, 89, 63); // error
    doc.text('Status: FAILED - Errors detected in transmission', 25, yPos);
  }
  
  doc.setTextColor(28, 35, 51); // back to primary
  yPos += 15;
  
  doc.setFontSize(12);
  doc.text('Analysis:', 20, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.text('- The receiver performed modulo-2 division of the received codeword', 20, yPos);
  yPos += 6;
  doc.text(`  by the generator polynomial (${poly}).`, 20, yPos);
  yPos += 6;
  doc.text(`- The resulting remainder was: ${result.remainder}`, 20, yPos);
  yPos += 6;
  
  const conclusion = result.isValid 
    ? '- Since the remainder is zero, no errors were detected.' 
    : '- Since the remainder is non-zero, errors were detected in the transmission.';
    
  doc.text(conclusion, 20, yPos);
  yPos += 20;
  
  doc.text('Thank you for using the CRC Simulator!', 20, yPos);
  
  doc.save('crc-report.pdf');
}
