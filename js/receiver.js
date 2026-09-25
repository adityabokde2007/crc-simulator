import { db } from './firebase-config.js';
import { ref, set, onValue } from 'firebase/database';
import { verifyCRC } from './crc.js';
import { generateReceiverReport } from './pdf-report.js';
import { setupModal, initVideoModal } from './modal.js';
import { showToast } from './toast.js';

document.addEventListener('DOMContentLoaded', () => {
  initVideoModal();
  let myIP = sessionStorage.getItem('crc_my_ip') || '';

  const ipSetupContainer = document.getElementById('ip-setup-container');
  const ipDisplayContainer = document.getElementById('ip-display-container');
  const inputMyIp = document.getElementById('input-my-ip');
  const displayMyIp = document.getElementById('display-my-ip');
  const btnSaveIp = document.getElementById('btn-save-ip');
  const btnEditIp = document.getElementById('btn-edit-ip');
  const connectionPanelWrapper = document.getElementById('connection-panel-wrapper');

  // DOM Elements - Connection
  const connRequestAlert = document.getElementById('conn-request-alert');
  const connStatusAccepted = document.getElementById('conn-status-accepted');
  const connStatusWaiting = document.getElementById('conn-status-waiting');
  const displayReqIP = document.getElementById('display-req-ip');
  const displayConnectedIP = document.getElementById('display-connected-ip');
  const btnAccept = document.getElementById('btn-accept');
  const btnReject = document.getElementById('btn-reject');
  const btnDisconnect = document.getElementById('btn-disconnect');
  
  // DOM Elements - Receiver Panel
  const receiverPanel = document.getElementById('receiver-panel');
  const rxWaitingData = document.getElementById('rx-waiting-data');
  const rxDataView = document.getElementById('rx-data-view');
  const rxBitCells = document.getElementById('rx-bit-cells');
  const btnVerify = document.getElementById('btn-verify');
  const verificationResult = document.getElementById('verification-result');
  const resultPassed = document.getElementById('result-passed');
  const resultFailed = document.getElementById('result-failed');
  const btnRxSeeCalc = document.getElementById('btn-rx-see-calc');
  const btnDownloadPdf = document.getElementById('btn-download-pdf');
  const calcStepsContainer = document.getElementById('calc-steps-container');

  // State
  let connectionRequest = null;
  let receivedCodeword = null;
  let receivedPoly = null;
  let verifyResult = null;

  // Panels
  const calculationPanel = document.getElementById('calculation-panel');

  let isFirstLoad = true;

  // --- IP & Connection Listeners ---
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
  });

  let requestRef, transmissionRef;
  const setupFirebaseListeners = () => {
    if (!myIP) return;
    requestRef = ref(db, `connections/${myIP.replace(/\./g, '_')}/request`);
    transmissionRef = ref(db, `connections/${myIP.replace(/\./g, '_')}/transmission`);

    // On page reload, start from a completely clean slate by clearing Firebase for this IP
    if (isFirstLoad) {
      set(requestRef, null).catch(()=>{});
      set(transmissionRef, null).catch(()=>{});
      isFirstLoad = false;
    }

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
        if (!receivedCodeword) {
          showToast('Data received from sender', 'success');
        }
        receivedCodeword = data.codeword;
        receivedPoly = data.poly;
        renderTransmission();
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
    await set(requestRef, {
      ...connectionRequest,
      status: 'accepted'
    });
    showToast(`Connection accepted from ${connectionRequest.fromIP}`, 'success');
  });

  btnReject.addEventListener('click', async () => {
    await set(requestRef, {
      ...connectionRequest,
      status: 'rejected'
    });
    showToast(`Connection rejected from ${connectionRequest.fromIP}`, 'warning');
    setTimeout(async () => {
      await set(requestRef, null);
    }, 3000);
  });

  if (btnDisconnect) {
    btnDisconnect.addEventListener('click', async () => {
      try {
        if (requestRef) await set(requestRef, null);
        if (transmissionRef) await set(transmissionRef, null);
        showToast('Disconnected from sender', 'warning');
      } catch (err) {
        console.error(err);
      }
    });
  }

  // --- Transmission Rendering ---
  const renderTransmission = () => {
    if (!receivedCodeword) {
      resetReceiverUI();
      return;
    }
    
    rxWaitingData.classList.add('hidden');
    rxDataView.classList.remove('hidden');
    verificationResult.classList.add('hidden');
    btnVerify.disabled = false;
    btnVerify.classList.remove('hidden');

    // Pre-compute CRC to display calculation steps
    verifyResult = verifyCRC(receivedCodeword, receivedPoly);
    renderCalculationSteps();
    calculationPanel.classList.remove('hidden');

    rxBitCells.innerHTML = '';
    receivedCodeword.split('').forEach((bit, idx) => {
      const container = document.createElement('div');
      container.className = 'flex flex-col items-center gap-0.5';
      
      const label = document.createElement('span');
      label.className = 'text-[11px] sm:text-[13px] leading-none text-text-primary font-bold font-mono select-none';
      label.textContent = idx;
      
      const cell = document.createElement('div');
      cell.className = 'bit-cell';
      cell.textContent = bit;
      
      container.appendChild(label);
      container.appendChild(cell);
      rxBitCells.appendChild(container);
    });
  };

  btnVerify.addEventListener('click', () => {
    if (!verifyResult) return;
    
    btnVerify.classList.add('hidden');
    verificationResult.classList.remove('hidden');
    
    resultPassed.classList.add('hidden');
    resultFailed.classList.add('hidden');
    
    if (verifyResult.isValid) {
      resultPassed.classList.remove('hidden');
      showToast('Data integrity verified successfully', 'success');
    } else {
      resultFailed.classList.remove('hidden');
      showToast('Data corruption detected', 'error');
    }
  });

  btnDownloadPdf.addEventListener('click', () => {
    if (!verifyResult || !connectionRequest) return;
    generateReceiverReport(receivedCodeword, receivedPoly, myIP, connectionRequest.fromIP, verifyResult);
  });

  function resetReceiverUI() {
    receivedCodeword = null;
    receivedPoly = null;
    verifyResult = null;
    
    // Completely clear DOM
    rxBitCells.innerHTML = '';
    calcStepsContainer.innerHTML = '';
    
    // Hide panels
    rxDataView.classList.add('hidden');
    calculationPanel.classList.add('hidden');
    verificationResult.classList.add('hidden');
    
    // Show waiting state
    rxWaitingData.classList.remove('hidden');
  };

  // --- Calculation Steps ---
  const renderCalculationSteps = () => {
    if (!verifyResult) return;
    calcStepsContainer.innerHTML = '';
    
    const polyStr = receivedPoly;
    const codeword = receivedCodeword;
    
    const createStep = (stepNum, title, desc, contentHtml) => {
      return `
        <div class="mb-8 last:mb-0">
          <h4 class="text-lg font-bold text-text-primary mb-1">Step ${stepNum}: ${title}</h4>
          <p class="text-sm text-text-secondary mb-3">${desc}</p>
          <div class="bg-background p-4 rounded-md border border-border font-mono text-sm overflow-x-auto">
            ${contentHtml}
          </div>
        </div>
      `;
    };

    let stepsHtml = '';

    // Step 1: Received Data
    stepsHtml += createStep(1, 'Received Data', 'The codeword received from the network (potentially with noise).', 
      `<span class="text-text-primary">${codeword}</span>`
    );

    // Step 2: Generator Polynomial
    stepsHtml += createStep(2, 'Generator Polynomial', 'The divisor used for error detection.', 
      `<span class="text-text-primary">${polyStr}</span>`
    );

    // Step 7: Receiver Divides the Received Codeword
    let divHtml = `
      <div class="flex gap-2 min-w-max font-mono">
        <div>${polyStr}</div>
        <div class="border-l-2 border-border pl-2 flex flex-col" style="white-space: pre;">
          <div>${codeword}</div>
    `;
    verifyResult.steps.forEach((step, idx) => {
      divHtml += `<div class="text-text-secondary border-b border-dashed border-border w-fit">${step.padding}${step.divisor}</div>`;
      let nextStr = step.padding + ' ' + step.xorResult.substring(1);
      if (idx < verifyResult.steps.length - 1) {
        nextStr += codeword[step.padding.length + step.divisor.length];
      }
      
      if (idx === verifyResult.steps.length - 1) {
        const remStr = step.xorResult.substring(1);
        divHtml += `<div>${step.padding} <span class="font-bold text-text-primary">${remStr}</span></div>`;
      } else {
        divHtml += `<div>${nextStr}</div>`;
      }
    });
    divHtml += `
        </div>
      </div>
    `;
    stepsHtml += createStep(7, 'Receiver Divides the Received Codeword', 'Long division using Modulo-2 arithmetic (XOR) on the received codeword.', divHtml);

    // Step 8: Check the Remainder
    const isClean = verifyResult.isValid;
    const verdict = isClean ? 'Clean (No errors detected)' : 'Error detected';
    const finalRem = verifyResult.remainder;
    stepsHtml += createStep(8, 'Check the Remainder', 
      'If the final remainder is all zeros, the data is error-free. If the remainder is non-zero, an error was detected.',
      `Calculated Remainder: <span class="font-bold">${finalRem}</span><br>Verdict: <span class="font-bold">${verdict}</span>`
    );

    calcStepsContainer.innerHTML = stepsHtml;
  };
});
