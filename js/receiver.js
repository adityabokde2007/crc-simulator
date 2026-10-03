import { db } from './firebase-config.js';
import { ref, set, onValue } from 'firebase/database';
import { showToast } from './toast.js';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

document.addEventListener('DOMContentLoaded', () => {

  let myIP = sessionStorage.getItem('crc_my_ip') || '';

  // ─── DOM refs ──────────────────────────────────────────────────────
  const ipSetupContainer = document.getElementById('ip-setup-container');
  const ipDisplayContainer = document.getElementById('ip-display-container');
  const inputMyIp = document.getElementById('input-my-ip');
  const displayMyIp = document.getElementById('display-my-ip');
  const btnSaveIp = document.getElementById('btn-save-ip');
  const btnEditIp = document.getElementById('btn-edit-ip');
  const connectionPanelWrapper = document.getElementById('connection-panel-wrapper');

  const connRequestAlert = document.getElementById('conn-request-alert');
  const connStatusAccepted = document.getElementById('conn-status-accepted');
  const connStatusWaiting = document.getElementById('conn-status-waiting');
  const displayReqIP = document.getElementById('display-req-ip');
  const displayConnectedIP = document.getElementById('display-connected-ip');
  const btnAccept = document.getElementById('btn-accept');
  const btnReject = document.getElementById('btn-reject');
  const btnDisconnect = document.getElementById('btn-disconnect');
  
  const receiverPanel = document.getElementById('receiver-panel');
  const rxWaitingData = document.getElementById('rx-waiting-data');
  const rxDataView = document.getElementById('rx-data-view');
  const rxRawBitstream = document.getElementById('rx-raw-bitstream');
  const btnVerify = document.getElementById('btn-verify');
  
  const rxLayersContainer = document.getElementById('rx-layers-container');
  const rxCalcStepsContainer = document.getElementById('rx-calc-steps-container');
  const rxCrcDivisionOuter = document.getElementById('rx-crc-division-outer');
  const rxCrcDivisionScroll = document.getElementById('rx-crc-division-scroll');
  const rxCrcToggleBtn = document.getElementById('rx-crc-toggle-btn');
  const rxCrcToggleText = document.getElementById('rx-crc-toggle-text');
  
  const resultPassed = document.getElementById('result-passed');
  const resultFailed = document.getElementById('result-failed');
  const decodedMessageBox = document.getElementById('decoded-message-box');
  const garbledMessageBox = document.getElementById('garbled-message-box');

  let connectionRequest = null;
  let receivedTransmission = null;
  let isFirstLoad = true;
  let receiverTimeoutTimer = null;

  // ═══════════════════════════════════════════════════════════════════
  //  CONNECTION LOGIC
  // ═══════════════════════════════════════════════════════════════════

  const renderMyIPState = () => {
    if (myIP) {
      ipSetupContainer.classList.add('hidden');
      ipDisplayContainer.classList.remove('hidden');
      ipDisplayContainer.style.display = 'flex';
      displayMyIp.textContent = myIP;
      connectionPanelWrapper.classList.remove('opacity-50', 'pointer-events-none');
      setupFirebaseListeners();
    } else {
      ipSetupContainer.classList.remove('hidden');
      ipSetupContainer.style.display = 'flex';
      ipDisplayContainer.classList.add('hidden');
      connectionPanelWrapper.classList.add('opacity-50', 'pointer-events-none');
    }
  };

  btnSaveIp.addEventListener('click', async () => {
    const ip = inputMyIp.value.trim();
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
      myIP = ip;
      sessionStorage.setItem('crc_my_ip', myIP);
      
      // Clear any old stale data for this IP to prevent auto-connect
      const ipNode = myIP.replace(/\./g, '_');
      await set(ref(db, `connections/${ipNode}`), null).catch(() => {});
      
      renderMyIPState();
      showToast('IP address saved', 'success');
    } else {
      showToast('Invalid IP format. e.g. 192.168.1.10', 'error');
    }
  });

  btnEditIp.addEventListener('click', () => {
    myIP = '';
    sessionStorage.removeItem('crc_my_ip');
    inputMyIp.value = displayMyIp.textContent;
    renderMyIPState();
  });

  let requestRef, transmissionRef;
  const setupFirebaseListeners = () => {
    if (!myIP) return;
    requestRef = ref(db, `connections/${myIP.replace(/\./g, '_')}/request`);
    transmissionRef = ref(db, `connections/${myIP.replace(/\./g, '_')}/transmission`);

    onValue(requestRef, (snapshot) => {
      const newData = snapshot.val();
      if (!connectionRequest && newData && newData.status === 'pending') {
        showToast(`Incoming connection request from ${newData.fromIP}`, 'info');
      }
      connectionRequest = newData;
      if (!connectionRequest || connectionRequest.status !== 'accepted') {
        resetReceiverUI();
      }
      renderConnectionState();
    });

    onValue(transmissionRef, (snapshot) => {
      const data = snapshot.val();
      if (data && connectionRequest?.status === 'accepted') {
        if (!receivedTransmission || receivedTransmission.timestamp !== data.timestamp) {
          receivedTransmission = data;
          showToast('Frame received!', 'success');
          renderInitialTransmission();
        }
      } else {
        resetReceiverUI();
      }
    });
  };

  renderMyIPState();

  const renderConnectionState = () => {
    connRequestAlert.classList.add('hidden');
    connStatusAccepted.classList.add('hidden');
    connStatusWaiting.classList.add('hidden');
    receiverPanel.classList.add('hidden');

    if (!connectionRequest) {
      connStatusWaiting.classList.remove('hidden');
    } else if (connectionRequest.status === 'pending') {
      displayReqIP.textContent = connectionRequest.fromIP;
      connRequestAlert.classList.remove('hidden');
    } else if (connectionRequest.status === 'accepted') {
      displayConnectedIP.textContent = connectionRequest.fromIP;
      connStatusAccepted.classList.remove('hidden');
      receiverPanel.classList.remove('hidden');
    } else if (connectionRequest.status === 'rejected') {
      connStatusWaiting.classList.remove('hidden');
    }
  };

  btnAccept.addEventListener('click', async () => {
    await set(requestRef, { ...connectionRequest, status: 'accepted' });
    showToast(`Connection accepted from ${connectionRequest.fromIP}`, 'success');
  });

  btnReject.addEventListener('click', async () => {
    await set(requestRef, { ...connectionRequest, status: 'rejected' });
    showToast(`Connection rejected from ${connectionRequest.fromIP}`, 'warning');
    setTimeout(async () => { await set(requestRef, null); }, 3000);
  });

  if (btnDisconnect) {
    btnDisconnect.addEventListener('click', async () => {
      try {
        if (requestRef) await set(requestRef, null);
        if (transmissionRef) await set(transmissionRef, null);
        showToast('Disconnected from sender', 'warning');
      } catch (err) { console.error(err); }
    });
  }

  function resetReceiverUI() {
    receivedTransmission = null;
    rxDataView.classList.add('hidden');
    rxLayersContainer.classList.add('hidden');
    rxWaitingData.classList.remove('hidden');
    btnVerify.classList.remove('hidden');
    btnVerify.disabled = false;
    const rxChannelAnim = document.getElementById('rx-channel-animation-container');
    if (rxChannelAnim) rxChannelAnim.classList.add('hidden');
  }

  // ═══════════════════════════════════════════════════════════════════
  //  RECEIVER DATA LOGIC
  // ═══════════════════════════════════════════════════════════════════

  const renderInitialTransmission = async () => {
    rxWaitingData.classList.add('hidden');
    rxDataView.classList.add('hidden');
    btnVerify.classList.add('hidden'); // Hide verify button - auto verify
    rxLayersContainer.classList.add('hidden');

    // Reset ACK/NACK button states
    const btnSendAck = document.getElementById('btn-send-ack');
    const btnSendNack = document.getElementById('btn-send-nack');
    const ackSentStatus = document.getElementById('ack-sent-status');
    const nackSentStatus = document.getElementById('nack-sent-status');
    if (btnSendAck) { btnSendAck.disabled = false; btnSendAck.style.opacity = '1'; btnSendAck.textContent = "Send ACK to Sender"; }
    if (btnSendNack) { btnSendNack.disabled = false; btnSendNack.style.opacity = '1'; btnSendNack.textContent = "Send NACK — Request Retransmission"; }
    if (ackSentStatus) ackSentStatus.classList.add('hidden');
    if (nackSentStatus) nackSentStatus.classList.add('hidden');

    // Handle Receiver Timeout (matches Sender's 60s timeout)
    if (receiverTimeoutTimer) clearTimeout(receiverTimeoutTimer);
    receiverTimeoutTimer = setTimeout(() => {
      if (btnSendAck && !btnSendAck.disabled) {
        btnSendAck.disabled = true;
        btnSendAck.style.opacity = '0.5';
        btnSendAck.textContent = "Timeout (Sender Stopped)";
      }
      if (btnSendNack && !btnSendNack.disabled) {
        btnSendNack.disabled = true;
        btnSendNack.style.opacity = '0.5';
        btnSendNack.textContent = "Timeout (Sender Stopped)";
      }
      showToast('Session timeout — Sender is no longer listening', 'warning');
    }, 60000);

    // Play incoming frame channel animation
    const rxChannelContainer = document.getElementById('rx-channel-animation-container');
    const rxMovingFrame = document.getElementById('rx-moving-frame');

    if (rxChannelContainer && rxMovingFrame) {
      rxChannelContainer.classList.remove('hidden');
      rxMovingFrame.classList.remove('animate-receive');
      void rxMovingFrame.offsetWidth;
      rxMovingFrame.classList.add('animate-receive');

      const rxMovingPayload = document.getElementById('rx-moving-payload');
      if (receivedTransmission.wasCorrupted && rxMovingPayload) {
        rxMovingPayload.classList.add('moving-corrupted');
      } else if (rxMovingPayload) {
        rxMovingPayload.classList.remove('moving-corrupted');
      }

      await new Promise(resolve => setTimeout(resolve, 2800));
    }

    // Now show the data view
    rxDataView.classList.remove('hidden');
    
    const codeword = receivedTransmission.codeword;
    let bitStreamHtml = escapeHtml(codeword);

    if (receivedTransmission.wasCorrupted && receivedTransmission.flippedIndex !== undefined) {
      const idx = receivedTransmission.flippedIndex;
      bitStreamHtml = escapeHtml(codeword.substring(0, idx)) + 
                      `<span class="text-error font-bold" style="background:rgba(196,89,63,0.12);padding:0 1px;border-radius:2px;">${escapeHtml(codeword[idx])}</span>` + 
                      escapeHtml(codeword.substring(idx + 1));
    }
    
    rxRawBitstream.innerHTML = bitStreamHtml;

    // Set bits info (Header is always 96 bits)
    const generatorLen = receivedTransmission.generator ? receivedTransmission.generator.length : 17; // default CRC-16 is 17 bits
    const crcLen = generatorLen - 1;
    const payloadLen = codeword.length - 96 - crcLen;
    const crcTrailerBits = codeword.slice(-crcLen);

    const rxDisplayPayload = document.getElementById('rx-display-payload-len');
    const rxDisplayCrc = document.getElementById('rx-display-final-crc');
    if (rxDisplayPayload) rxDisplayPayload.textContent = `${payloadLen} bits`;
    if (rxDisplayCrc) rxDisplayCrc.textContent = crcTrailerBits;

    // AUTO-VERIFY: Automatically run CRC verification
    await autoVerify();
  };

  async function autoVerify() {
    if (!receivedTransmission) return;

    try {
      const resp = await fetch(`${API_BASE}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codeword: receivedTransmission.codeword })
      });
      const result = await resp.json();
      
      if (result.error) {
        showToast(result.error, 'error');
        return;
      }
      
      renderVerificationProcess(result);

    } catch (err) {
      console.error('Verify error:', err);
      showToast('Error connecting to backend.', 'error');
    }
  }

  btnVerify.addEventListener('click', async () => {
    if (!receivedTransmission) return;
    
    btnVerify.disabled = true;
    btnVerify.innerHTML = '<svg class="animate-spin" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Verifying...';

    try {
      const resp = await fetch(`${API_BASE}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codeword: receivedTransmission.codeword })
      });
      const result = await resp.json();
      
      if (result.error) {
        showToast(result.error, 'error');
        resetVerifyBtn();
        return;
      }
      
      btnVerify.classList.add('hidden');
      renderVerificationProcess(result);

    } catch (err) {
      console.error('Verify error:', err);
      showToast('Error connecting to backend.', 'error');
      resetVerifyBtn();
    }
  });

  function resetVerifyBtn() {
    btnVerify.disabled = false;
    btnVerify.innerHTML = '<span>Verify CRC Integrity</span><svg viewBox="0 0 24 24"><path d="m9 12 2 2 4-4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/><path d="M5 12V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5"/></svg>';
  }

  function renderVerificationProcess(result) {
    rxLayersContainer.classList.remove('hidden');

    // ── CRC Long Division (monospace <pre>) ──
    const poly = '10001000000100001';
    const codeword = receivedTransmission.codeword;
    const steps = result.crcSteps;
    const totalWidth = codeword.length;

    let lines = [];
    
    // Dividend line
    lines.push({ text: codeword.padEnd(totalWidth), type: 'dividend' });

    steps.forEach((step, idx) => {
      const offset = step.padding.length;
      const divisorLine = ' '.repeat(offset) + step.divisor;
      lines.push({ text: divisorLine.padEnd(totalWidth), type: 'divisor', offset, len: step.divisor.length });

      const resultBits = step.xorResult.substring(1);
      if (idx === steps.length - 1) {
        const remLine = ' '.repeat(offset + 1) + resultBits;
        lines.push({ text: remLine.padEnd(totalWidth), type: result.isValid ? 'remainder-valid' : 'remainder-error' });
      } else {
        let nextBit = '';
        const nextPos = offset + step.divisor.length;
        if (nextPos < codeword.length) {
          nextBit = codeword[nextPos];
        }
        const interLine = ' '.repeat(offset + 1) + resultBits + nextBit;
        lines.push({ text: interLine.padEnd(totalWidth), type: 'intermediate' });
      }
    });

    let html = '';
    lines.forEach((line) => {
      if (line.type === 'dividend') {
        html += `<span class="crc-dividend-line">${escapeHtml(line.text)}</span>\n`;
      } else if (line.type === 'divisor') {
        const before = escapeHtml(line.text.substring(0, line.offset));
        const divisorText = escapeHtml(line.text.substring(line.offset, line.offset + line.len));
        const after = escapeHtml(line.text.substring(line.offset + line.len));
        html += `${before}<span class="crc-divisor-line crc-separator">${divisorText}</span>${after}\n`;
      } else if (line.type === 'remainder-valid') {
        const trimmed = line.text;
        const leadingSpaces = trimmed.length - trimmed.trimStart().length;
        const remText = trimmed.trimStart().trimEnd();
        html += `${' '.repeat(leadingSpaces)}<span class="crc-remainder-line">${escapeHtml(remText)}</span>\n`;
      } else if (line.type === 'remainder-error') {
        const trimmed = line.text;
        const leadingSpaces = trimmed.length - trimmed.trimStart().length;
        const remText = trimmed.trimStart().trimEnd();
        html += `${' '.repeat(leadingSpaces)}<span class="crc-remainder-error">${escapeHtml(remText)}</span>\n`;
      } else {
        html += `<span class="crc-dividend-line">${escapeHtml(line.text)}</span>\n`;
      }
    });

    rxCalcStepsContainer.innerHTML = html;

    // Handle expand/collapse
    if (steps.length > 8) {
      rxCrcToggleBtn.classList.remove('hidden');
      rxCrcToggleBtn.classList.remove('is-expanded');
      rxCrcToggleText.textContent = 'Show full calculation';
      rxCrcDivisionScroll.classList.remove('expanded');

      rxCrcToggleBtn.onclick = () => {
        const wasExpanded = rxCrcDivisionScroll.classList.toggle('expanded');
        if (wasExpanded) {
          rxCrcToggleBtn.classList.add('is-expanded');
          rxCrcToggleText.textContent = 'Collapse calculation';
        } else {
          rxCrcToggleBtn.classList.remove('is-expanded');
          rxCrcToggleText.textContent = 'Show full calculation';
        }
      };
    } else {
      rxCrcToggleBtn.classList.add('hidden');
      rxCrcDivisionScroll.classList.add('expanded');
    }

    // Setup scroll fade indicators
    setupScrollFade(rxCrcDivisionOuter, rxCrcDivisionScroll);

    // ── Result ──
    resultPassed.classList.add('hidden');
    resultFailed.classList.add('hidden');

    if (result.isValid) {
      resultPassed.classList.remove('hidden');
      decodedMessageBox.textContent = result.decodedText;
    } else {
      resultFailed.classList.remove('hidden');
      garbledMessageBox.textContent = result.decodedText;
    }
  }

  function setupScrollFade(outer, scrollEl) {
    const updateFade = () => {
      const sl = scrollEl.scrollLeft;
      const maxScroll = scrollEl.scrollWidth - scrollEl.clientWidth;
      outer.classList.toggle('has-scroll-left', sl > 4);
      outer.classList.toggle('has-scroll-right', sl < maxScroll - 4);
    };
    scrollEl.addEventListener('scroll', updateFade);
    requestAnimationFrame(updateFade);
    window.addEventListener('resize', updateFade);
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ─── ACK/NACK Logic (ARQ) ─────────────────────────────────────────
  const btnSendAck = document.getElementById('btn-send-ack');
  const btnSendNack = document.getElementById('btn-send-nack');
  const ackSentStatus = document.getElementById('ack-sent-status');
  const nackSentStatus = document.getElementById('nack-sent-status');

  if (btnSendAck) {
    btnSendAck.addEventListener('click', async () => {
      if (!myIP) return;
      if (receiverTimeoutTimer) clearTimeout(receiverTimeoutTimer);
      const ackRef = ref(db, `connections/${myIP.replace(/\./g, '_')}/ack`);
      await set(ackRef, { type: 'ACK', timestamp: Date.now() });
      btnSendAck.disabled = true;
      btnSendAck.style.opacity = '0.5';
      if (ackSentStatus) ackSentStatus.classList.remove('hidden');
      showToast('ACK sent to sender', 'success');
    });
  }

  if (btnSendNack) {
    btnSendNack.addEventListener('click', async () => {
      if (!myIP) return;
      if (receiverTimeoutTimer) clearTimeout(receiverTimeoutTimer);
      const ackRef = ref(db, `connections/${myIP.replace(/\./g, '_')}/ack`);
      await set(ackRef, { type: 'NACK', timestamp: Date.now() });
      btnSendNack.disabled = true;
      btnSendNack.style.opacity = '0.5';
      if (nackSentStatus) nackSentStatus.classList.remove('hidden');
      showToast('NACK sent — requesting retransmission', 'warning');
    });
  }

});
