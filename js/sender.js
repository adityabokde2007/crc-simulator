import { db } from './firebase-config.js';
import { ref, set, onValue } from 'firebase/database';
import { showToast } from './toast.js';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

document.addEventListener('DOMContentLoaded', () => {


  let myIP = sessionStorage.getItem('crc_my_ip') || '';
  let targetIP = sessionStorage.getItem('crc_target_ip') || '';
  let connectionStatus = sessionStorage.getItem('crc_conn_status') || 'idle';

  // ─── DOM refs ──────────────────────────────────────────────────────
  const ipSetupContainer = document.getElementById('ip-setup-container');
  const ipDisplayContainer = document.getElementById('ip-display-container');
  const inputMyIp = document.getElementById('input-my-ip');
  const displayMyIp = document.getElementById('display-my-ip');
  const btnSaveIp = document.getElementById('btn-save-ip');
  const btnEditIp = document.getElementById('btn-edit-ip');
  const connectionPanelWrapper = document.getElementById('connection-panel-wrapper');

  const inputTargetIP = document.getElementById('input-target-ip');
  const btnConnect = document.getElementById('btn-connect');
  const connStateIdle = document.getElementById('conn-state-idle');
  const connStatePending = document.getElementById('conn-state-pending');
  const connStateAccepted = document.getElementById('conn-state-accepted');
  const connErrorMsg = document.getElementById('conn-error-msg');
  const displayTargetIP = document.getElementById('display-target-ip');
  const displayTargetIPAccepted = document.getElementById('display-target-ip-accepted');
  const btnCancelRequest = document.getElementById('btn-cancel-request');
  const btnNewTransmission = document.getElementById('btn-new-transmission');
  const btnDisconnect = document.getElementById('btn-disconnect');
  const encoderPanel = document.getElementById('encoder-panel');

  const inputData = document.getElementById('input-data');
  const errorData = document.getElementById('error-data');
  const wordCount = document.getElementById('word-count');
  const btnEncode = document.getElementById('btn-encode');
  
  const transmitSection = document.getElementById('transmit-section');
  const btnTransmit = document.getElementById('btn-transmit');
  const transmitContentDefault = document.getElementById('transmit-content-default');
  const transmitContentLoading = document.getElementById('transmit-content-loading');
  
  const calculationPanel = document.getElementById('calculation-panel');
  const asciiTableBody = document.getElementById('ascii-table-body');
  const asciiTableWrapper = document.getElementById('ascii-table-wrapper');
  const asciiTableToggle = document.getElementById('ascii-table-toggle');
  const asciiToggleText = document.getElementById('ascii-toggle-text');
  const payloadBinaryDisplay = document.getElementById('payload-binary-display');
  const displaySrcMac = document.getElementById('display-src-mac');
  const displayDstMac = document.getElementById('display-dst-mac');
  const calcStepsContainer = document.getElementById('calc-steps-container');
  const crcDivisionOuter = document.getElementById('crc-division-outer');
  const crcDivisionScroll = document.getElementById('crc-division-scroll');
  const crcToggleBtn = document.getElementById('crc-toggle-btn');
  const crcToggleText = document.getElementById('crc-toggle-text');
  const displayFinalCrc = document.getElementById('display-final-crc');
  const displayPayloadLen = document.getElementById('display-payload-len');

  let currentSession = null; 
  let unsubscribeFirebase = null;

  // ═══════════════════════════════════════════════════════════════════
  //  CONNECTION LOGIC (unchanged from before)
  // ═══════════════════════════════════════════════════════════════════

  const renderMyIPState = () => {
    if (myIP) {
      ipSetupContainer.classList.add('hidden');
      ipDisplayContainer.classList.remove('hidden');
      ipDisplayContainer.style.display = 'flex';
      displayMyIp.textContent = myIP;
      connectionPanelWrapper.classList.remove('opacity-50', 'pointer-events-none');
      btnConnect.disabled = inputTargetIP.value.trim() === '';
    } else {
      ipSetupContainer.classList.remove('hidden');
      ipSetupContainer.style.display = 'flex';
      ipDisplayContainer.classList.add('hidden');
      connectionPanelWrapper.classList.add('opacity-50', 'pointer-events-none');
    }
  };

  btnSaveIp.addEventListener('click', () => {
    const ip = inputMyIp.value.trim();
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
      myIP = ip;
      sessionStorage.setItem('crc_my_ip', myIP);
      renderMyIPState();
      showToast('IP address saved', 'success');
    } else {
      showToast('Invalid IP format. e.g. 192.168.1.5', 'error');
    }
  });

  btnEditIp.addEventListener('click', () => {
    myIP = '';
    sessionStorage.removeItem('crc_my_ip');
    inputMyIp.value = displayMyIp.textContent;
    renderMyIPState();
    resetConnection();
  });

  inputTargetIP.addEventListener('input', () => {
    btnConnect.disabled = inputTargetIP.value.trim() === '';
  });

  const renderConnectionState = () => {
    connStateIdle.classList.add('hidden');
    connStatePending.classList.add('hidden');
    connStateAccepted.classList.add('hidden');
    encoderPanel.classList.add('hidden');
    connErrorMsg.classList.add('hidden');

    if (connectionStatus === 'idle') {
      connStateIdle.classList.remove('hidden');
      connStateIdle.style.display = 'flex';
      inputTargetIP.value = targetIP;
      if (unsubscribeFirebase) { unsubscribeFirebase(); unsubscribeFirebase = null; }
    } else if (connectionStatus === 'pending') {
      connStatePending.classList.remove('hidden');
      displayTargetIP.textContent = targetIP;
      listenToConnectionStatus();
    } else if (connectionStatus === 'accepted') {
      connStateAccepted.classList.remove('hidden');
      displayTargetIPAccepted.textContent = targetIP;
      encoderPanel.classList.remove('hidden');
      listenToConnectionStatus();
    } else if (connectionStatus === 'rejected') {
      connStateIdle.classList.remove('hidden');
      connStateIdle.style.display = 'flex';
      connErrorMsg.classList.remove('hidden');
      connectionStatus = 'idle';
      sessionStorage.setItem('crc_conn_status', 'idle');
    }
  };

  const listenToConnectionStatus = () => {
    if (!myIP || !targetIP) return;
    const reqRef = ref(db, `connections/${targetIP.replace(/\./g, '_')}/request`);
    if (unsubscribeFirebase) unsubscribeFirebase();
    unsubscribeFirebase = onValue(reqRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        if (connectionStatus === 'accepted' || connectionStatus === 'pending') {
          showToast('Connection disconnected by receiver', 'warning');
          resetConnection();
        }
        return;
      }
      if (data.fromIP === myIP) {
        if (data.status === 'accepted' && connectionStatus !== 'accepted') {
          connectionStatus = 'accepted';
          sessionStorage.setItem('crc_conn_status', 'accepted');
          renderConnectionState();
          showToast(`Connection accepted by ${targetIP}`, 'success');
        } else if (data.status === 'rejected') {
          connectionStatus = 'rejected';
          sessionStorage.setItem('crc_conn_status', 'rejected');
          renderConnectionState();
        }
      }
    });
  };

  btnConnect.addEventListener('click', async () => {
    const tip = inputTargetIP.value.trim();
    if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(tip)) {
      showToast('Invalid target IP format', 'error');
      return;
    }
    targetIP = tip;
    sessionStorage.setItem('crc_target_ip', targetIP);
    connectionStatus = 'pending';
    sessionStorage.setItem('crc_conn_status', 'pending');
    const reqRef = ref(db, `connections/${targetIP.replace(/\./g, '_')}/request`);
    await set(reqRef, { fromIP: myIP, status: 'pending', timestamp: Date.now() });
    renderConnectionState();
  });

  btnCancelRequest.addEventListener('click', async () => {
    const reqRef = ref(db, `connections/${targetIP.replace(/\./g, '_')}/request`);
    await set(reqRef, null);
    resetConnection();
  });

  btnDisconnect.addEventListener('click', async () => {
    const reqRef = ref(db, `connections/${targetIP.replace(/\./g, '_')}/request`);
    await set(reqRef, null);
    resetConnection();
    showToast('Disconnected', 'warning');
  });

  function resetConnection() {
    targetIP = '';
    connectionStatus = 'idle';
    sessionStorage.setItem('crc_target_ip', '');
    sessionStorage.setItem('crc_conn_status', 'idle');
    if (unsubscribeFirebase) { unsubscribeFirebase(); unsubscribeFirebase = null; }
    resetEncoder();
    renderConnectionState();
  }

  renderMyIPState();
  if (myIP) renderConnectionState();

  // ═══════════════════════════════════════════════════════════════════
  //  ENCODER & TRANSMIT LOGIC
  // ═══════════════════════════════════════════════════════════════════

  inputData.addEventListener('input', () => {
    const val = inputData.value.trim();
    const words = val.length === 0 ? 0 : val.split(/\s+/).length;
    wordCount.textContent = `${words} / 50 words`;

    if (val.length === 0) {
      btnEncode.disabled = true;
      errorData.classList.add('hidden');
    } else if (words > 50) {
      btnEncode.disabled = true;
      errorData.textContent = "Message is too long (max 50 words).";
      errorData.classList.remove('hidden');
    } else {
      btnEncode.disabled = false;
      errorData.classList.add('hidden');
    }
  });

  btnEncode.addEventListener('click', async () => {
    const text = inputData.value.trim();
    if (!text) return;

    btnEncode.disabled = true;
    btnEncode.innerHTML = '<svg class="animate-spin" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Encoding...';

    try {
      const resp = await fetch(`${API_BASE}/api/encapsulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await resp.json();

      if (data.error) {
        showToast(data.error, 'error');
        resetEncoderBtn();
        return;
      }

      currentSession = data;
      renderCalculations(data);
      
    } catch (err) {
      console.error(err);
      showToast('Backend connection failed.', 'error');
    } finally {
      resetEncoderBtn();
    }
  });

  function resetEncoderBtn() {
    btnEncode.disabled = false;
    btnEncode.innerHTML = '<span>Encode Data</span><svg viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
  }

  // ─── Render all calculation steps ──────────────────────────────────
  function renderCalculations(data) {
    calculationPanel.classList.remove('hidden');
    transmitSection.classList.remove('hidden');
    btnTransmit.disabled = false;

    // ── Step 1: ASCII Table ──
    const chars = data.asciiTable;
    let tableHtml = '';
    chars.forEach((c) => {
      const displayChar = c.char === ' ' ? '<span style="color:#9CA3AF;font-style:italic;">Space</span>' : escapeHtml(c.char);
      tableHtml += `<tr style="border-bottom: 1px solid var(--color-border);">
        <td class="p-3 border-r border-border">${displayChar}</td>
        <td class="p-3 border-r border-border">${c.decimal}</td>
        <td class="p-3 border-r border-border">${c.hex}</td>
        <td class="p-3 font-bold text-accent">${c.binary}</td>
      </tr>`;
    });
    asciiTableBody.innerHTML = tableHtml;

    // Collapsible table: show first ~6 rows, collapse rest
    if (chars.length > 6) {
      asciiTableWrapper.classList.add('collapsed');
      asciiTableToggle.classList.remove('hidden');
      asciiTableToggle.classList.remove('is-expanded');
      asciiToggleText.textContent = `Show all ${chars.length} characters`;

      asciiTableToggle.onclick = () => {
        const isExpanded = asciiTableWrapper.classList.toggle('collapsed');
        // isExpanded is true when collapsed is ADDED (i.e. just collapsed)
        if (!isExpanded) {
          // Now expanded
          asciiTableToggle.classList.add('is-expanded');
          asciiToggleText.textContent = 'Show less';
        } else {
          asciiTableToggle.classList.remove('is-expanded');
          asciiToggleText.textContent = `Show all ${chars.length} characters`;
        }
      };
    } else {
      asciiTableWrapper.classList.remove('collapsed');
      asciiTableToggle.classList.add('hidden');
    }

    // Add spaces between every 8 bits for readability in the combined payload
    const spacedPayload = data.payloadBits.match(/.{1,8}/g)?.join(' ') || data.payloadBits;
    payloadBinaryDisplay.textContent = spacedPayload;

    // ── Step 2: MAC Addresses ──
    displaySrcMac.textContent = data.srcMAC;
    displayDstMac.textContent = data.dstMAC;

    // ── Step 3: CRC Long Division (monospace <pre>) ──
    renderCrcDivision(data, 'sender');

    // ── Step 4: Final CRC ──
    displayFinalCrc.textContent = data.crcRemainder;
    displayPayloadLen.textContent = `${data.payloadBits.length} bits`;
  }

  /**
   * Renders the CRC long division as a monospace-aligned <pre> block.
   * Each row is padded to the same column positions.
   */
  function renderCrcDivision(data, mode) {
    const poly = data.generator;
    const frameBits = data.frameBits;
    const padded = frameBits + '0'.repeat(poly.length - 1);
    const steps = data.crcSteps;

    // Build lines of text, each line has the same total width
    const totalWidth = padded.length;
    let lines = [];

    // Line 1: the dividend (frame + padded zeros)
    const dividendLine = frameBits + '0'.repeat(poly.length - 1);
    lines.push({ text: dividendLine.padEnd(totalWidth), type: 'dividend' });

    steps.forEach((step, idx) => {
      const offset = step.padding.length;
      // Divisor line
      const divisorLine = ' '.repeat(offset) + step.divisor;
      lines.push({ text: divisorLine.padEnd(totalWidth), type: 'divisor', offset, len: step.divisor.length });

      // Result / remainder line
      const resultBits = step.xorResult.substring(1);
      if (idx === steps.length - 1) {
        // Final remainder
        const remLine = ' '.repeat(offset + 1) + resultBits;
        lines.push({ text: remLine.padEnd(totalWidth), type: 'remainder' });
      } else {
        // Bring down next bit
        let nextBit = '';
        const nextPos = offset + step.divisor.length;
        if (nextPos < padded.length) {
          nextBit = padded[nextPos];
        }
        const interLine = ' '.repeat(offset + 1) + resultBits + nextBit;
        lines.push({ text: interLine.padEnd(totalWidth), type: 'intermediate' });
      }
    });

    // Build HTML inside <pre>
    let html = '';
    lines.forEach((line) => {
      if (line.type === 'dividend') {
        html += `<span class="crc-dividend-line">${escapeHtml(line.text)}</span>\n`;
      } else if (line.type === 'divisor') {
        // Add a dashed underline effect using border on a span
        const before = escapeHtml(line.text.substring(0, line.offset));
        const divisorText = escapeHtml(line.text.substring(line.offset, line.offset + line.len));
        const after = escapeHtml(line.text.substring(line.offset + line.len));
        html += `${before}<span class="crc-divisor-line crc-separator">${divisorText}</span>${after}\n`;
      } else if (line.type === 'remainder') {
        const trimmed = line.text;
        const leadingSpaces = trimmed.length - trimmed.trimStart().length;
        const remText = trimmed.trimStart().trimEnd();
        html += `${' '.repeat(leadingSpaces)}<span class="crc-remainder-line">${escapeHtml(remText)}</span>\n`;
      } else {
        html += `<span class="crc-dividend-line">${escapeHtml(line.text)}</span>\n`;
      }
    });

    calcStepsContainer.innerHTML = html;

    // Handle expand/collapse
    if (steps.length > 8) {
      crcToggleBtn.classList.remove('hidden');
      crcToggleBtn.classList.remove('is-expanded');
      crcToggleText.textContent = 'Show full calculation';
      crcDivisionScroll.classList.remove('expanded');

      crcToggleBtn.onclick = () => {
        const wasExpanded = crcDivisionScroll.classList.toggle('expanded');
        if (wasExpanded) {
          crcToggleBtn.classList.add('is-expanded');
          crcToggleText.textContent = 'Collapse calculation';
        } else {
          crcToggleBtn.classList.remove('is-expanded');
          crcToggleText.textContent = 'Show full calculation';
        }
      };
    } else {
      crcToggleBtn.classList.add('hidden');
      crcDivisionScroll.classList.add('expanded');
    }

    // Setup scroll fade indicators
    setupScrollFade(crcDivisionOuter, crcDivisionScroll);
  }

  function setupScrollFade(outer, scrollEl) {
    const updateFade = () => {
      const sl = scrollEl.scrollLeft;
      const maxScroll = scrollEl.scrollWidth - scrollEl.clientWidth;
      outer.classList.toggle('has-scroll-left', sl > 4);
      outer.classList.toggle('has-scroll-right', sl < maxScroll - 4);
    };
    scrollEl.addEventListener('scroll', updateFade);
    // Initial check after render
    requestAnimationFrame(updateFade);
    // Re-check on resize
    window.addEventListener('resize', updateFade);
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ─── ACK/NACK DOM refs ─────────────────────────────────────────────
  const ackStatusContainer = document.getElementById('ack-status-container');
  const ackWaiting = document.getElementById('ack-waiting');
  const ackReceived = document.getElementById('ack-received');
  const nackReceived = document.getElementById('nack-received');
  const retransmitProgress = document.getElementById('retransmit-progress');
  const ackTimeout = document.getElementById('ack-timeout');

  let ackListenerUnsub = null;
  let ackTimeoutTimer = null;

  function showAckStatus(state) {
    ackStatusContainer.classList.remove('hidden');
    ackWaiting.classList.add('hidden');
    ackReceived.classList.add('hidden');
    nackReceived.classList.add('hidden');
    if (ackTimeout) ackTimeout.classList.add('hidden');
    if (retransmitProgress) retransmitProgress.classList.add('hidden');
    
    if (state === 'waiting') ackWaiting.classList.remove('hidden');
    else if (state === 'ack') ackReceived.classList.remove('hidden');
    else if (state === 'nack') nackReceived.classList.remove('hidden');
    else if (state === 'timeout') { if (ackTimeout) ackTimeout.classList.remove('hidden'); }
  }

  function hideAckStatus() {
    ackStatusContainer.classList.add('hidden');
    ackWaiting.classList.add('hidden');
    ackReceived.classList.add('hidden');
    nackReceived.classList.add('hidden');
    if (ackTimeout) ackTimeout.classList.add('hidden');
    if (ackTimeoutTimer) { clearTimeout(ackTimeoutTimer); ackTimeoutTimer = null; }
  }

  function stopAckListener() {
    if (ackListenerUnsub) { ackListenerUnsub(); ackListenerUnsub = null; }
    if (ackTimeoutTimer) { clearTimeout(ackTimeoutTimer); ackTimeoutTimer = null; }
  }

  async function listenForAck() {
    if (!targetIP) return;
    const ackRef = ref(db, `connections/${targetIP.replace(/\./g, '_')}/ack`);

    // Clear any previous ack data first, then set up listener
    await set(ackRef, null).catch(() => {});

    stopAckListener();

    // Start 60-second timeout
    ackTimeoutTimer = setTimeout(() => {
      showAckStatus('timeout');
      showToast('Session timeout — no response from receiver', 'warning');
      btnTransmit.disabled = false;
      transmitContentDefault.classList.remove('hidden');
      transmitContentLoading.classList.add('hidden');
      stopAckListener();
    }, 60000);

    ackListenerUnsub = onValue(ackRef, async (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      // Clear timeout since we got a response
      if (ackTimeoutTimer) { clearTimeout(ackTimeoutTimer); ackTimeoutTimer = null; }

      if (data.type === 'ACK') {
        showAckStatus('ack');
        showToast('ACK received — delivery confirmed!', 'success');
        btnTransmit.disabled = false;
        transmitContentDefault.classList.remove('hidden');
        transmitContentLoading.classList.add('hidden');
        stopAckListener();
      } else if (data.type === 'NACK') {
        showAckStatus('nack');
        showToast('NACK received — retransmitting...', 'warning');

        // Show retransmit progress
        if (retransmitProgress) retransmitProgress.classList.remove('hidden');

        // Wait a moment, then retransmit clean
        await new Promise(r => setTimeout(r, 2000));

        if (currentSession && targetIP) {
          // Clear old ack
          await set(ackRef, null).catch(() => {});

          // Retransmit original clean codeword
          const txRef = ref(db, `connections/${targetIP.replace(/\./g, '_')}/transmission`);

          // Play channel animation again
          const channelContainer = document.getElementById('channel-animation-container');
          const movingFrame = document.getElementById('sender-moving-frame');
          if (channelContainer && movingFrame) {
            channelContainer.classList.remove('hidden');
            movingFrame.classList.remove('animate-send');
            void movingFrame.offsetWidth;
            movingFrame.classList.add('animate-send');
            await new Promise(r => setTimeout(r, 2500));
          }

          await set(txRef, {
            codeword: currentSession.finalCodeword,
            generator: currentSession.generator,
            timestamp: Date.now(),
            wasCorrupted: false,
            flippedIndex: -1
          });

          showToast('Frame retransmitted successfully', 'success');
          showAckStatus('waiting');

          // Restart timeout for next ACK/NACK
          ackTimeoutTimer = setTimeout(() => {
            showAckStatus('timeout');
            showToast('Session timeout — no response from receiver', 'warning');
            btnTransmit.disabled = false;
            transmitContentDefault.classList.remove('hidden');
            transmitContentLoading.classList.add('hidden');
            stopAckListener();
          }, 60000);
        }
      }
    });
  }

  // ─── Transmit ──────────────────────────────────────────────────────
  btnTransmit.addEventListener('click', async () => {
    if (!currentSession || !targetIP) return;

    btnTransmit.disabled = true;
    transmitContentDefault.classList.add('hidden');
    transmitContentLoading.classList.remove('hidden');
    hideAckStatus();

    try {
      const resp = await fetch(`${API_BASE}/api/noise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codeword: currentSession.finalCodeword, probability: 0.3 })
      });
      const noiseResult = await resp.json();

      const generatedData = {
        codeword: noiseResult.newCodeword,
        generator: currentSession.generator,
        timestamp: Date.now(),
        wasCorrupted: noiseResult.wasCorrupted,
        flippedIndex: noiseResult.flippedIndex
      };

      // Play channel animation
      const channelContainer = document.getElementById('channel-animation-container');
      const movingFrame = document.getElementById('sender-moving-frame');
      
      if (channelContainer && movingFrame) {
        channelContainer.classList.remove('hidden');
        movingFrame.classList.remove('animate-send');
        void movingFrame.offsetWidth;
        movingFrame.classList.add('animate-send');
        await new Promise(resolve => setTimeout(resolve, 2500));
      }

      const txRef = ref(db, `connections/${targetIP.replace(/\./g, '_')}/transmission`);
      await set(txRef, generatedData);

      showToast('Frame transmitted successfully', 'success');

      // Now wait for ACK/NACK
      showAckStatus('waiting');
      await listenForAck();

    } catch (err) {
      console.error(err);
      showToast('Failed to transmit data', 'error');
      btnTransmit.disabled = false;
      transmitContentDefault.classList.remove('hidden');
      transmitContentLoading.classList.add('hidden');
    }
  });

  btnNewTransmission.addEventListener('click', async () => {
    resetEncoder();
    if (targetIP) {
      const txRef = ref(db, `connections/${targetIP.replace(/\./g, '_')}/transmission`);
      const ackRef = ref(db, `connections/${targetIP.replace(/\./g, '_')}/ack`);
      await set(txRef, null).catch(err => console.error(err));
      await set(ackRef, null).catch(err => console.error(err));
    }
  });

  function resetEncoder() {
    inputData.value = '';
    wordCount.textContent = '0 / 50 words';
    currentSession = null;
    calculationPanel.classList.add('hidden');
    transmitSection.classList.add('hidden');
    btnEncode.disabled = true;
    errorData.classList.add('hidden');
    hideAckStatus();
    stopAckListener();
    
    // Reset channel animation
    const channelContainer = document.getElementById('channel-animation-container');
    const movingFrame = document.getElementById('sender-moving-frame');
    if (channelContainer) channelContainer.classList.add('hidden');
    if (movingFrame) movingFrame.classList.remove('animate-send');
  }
});
