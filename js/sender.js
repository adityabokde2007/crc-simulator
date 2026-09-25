import { db } from './firebase-config.js';
import { ref, set, onValue } from 'firebase/database';
import { encodeCRC, parsePolynomialInput } from './crc.js';
import { simulateChannelTransmission } from './network.js';
import { setupModal, initVideoModal } from './modal.js';
import { showToast } from './toast.js';

document.addEventListener('DOMContentLoaded', () => {
  initVideoModal();
  // IP & Connection State
  let myIP = sessionStorage.getItem('crc_my_ip') || '';

  let targetIP = sessionStorage.getItem('crc_target_ip') || '';
  let connectionStatus = sessionStorage.getItem('crc_conn_status') || 'idle';

  const ipSetupContainer = document.getElementById('ip-setup-container');
  const ipDisplayContainer = document.getElementById('ip-display-container');
  const inputMyIp = document.getElementById('input-my-ip');
  const displayMyIp = document.getElementById('display-my-ip');
  const btnSaveIp = document.getElementById('btn-save-ip');
  const btnEditIp = document.getElementById('btn-edit-ip');
  const connectionPanelWrapper = document.getElementById('connection-panel-wrapper');

  // DOM Elements - Connection
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

  // DOM Elements - Encoder
  const inputData = document.getElementById('input-data');
  const inputPoly = document.getElementById('input-poly');
  const errorData = document.getElementById('error-data');
  const errorPoly = document.getElementById('error-poly');
  const btnEncode = document.getElementById('btn-encode');
  
  // DOM Elements - Transmit
  const transmitSection = document.getElementById('transmit-section');
  const btnTransmit = document.getElementById('btn-transmit');
  const transmitContentDefault = document.getElementById('transmit-content-default');
  const transmitContentLoading = document.getElementById('transmit-content-loading');
  const calcStepsContainer = document.getElementById('calc-steps-container');

  // Logic State
  let currentSession = null; // { codeword, poly, originalData, remainder, steps }
  let currentCodeword = null;
  let unsubscribeFirebase = null;

  // Panels
  const calculationPanel = document.getElementById('calculation-panel');

  // --- Connection Logic ---
  const renderMyIPState = () => {
    if (myIP) {
      ipSetupContainer.classList.add('hidden');
      ipDisplayContainer.classList.remove('hidden');
      ipDisplayContainer.style.display = 'flex';
      displayMyIp.textContent = myIP;
      connectionPanelWrapper.classList.remove('opacity-50', 'pointer-events-none');
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

  renderMyIPState();

  inputTargetIP.value = targetIP;
  inputTargetIP.addEventListener('input', (e) => {
    targetIP = e.target.value;
    sessionStorage.setItem('crc_target_ip', targetIP);
    btnConnect.disabled = !targetIP;
  });
  if (targetIP) btnConnect.disabled = false;

  const renderConnectionState = () => {
    connStateIdle.classList.add('hidden');
    connStatePending.classList.add('hidden');
    connStateAccepted.classList.add('hidden');
    connErrorMsg.classList.add('hidden');
    encoderPanel.classList.add('hidden');

    if (connectionStatus === 'idle') {
      connStateIdle.classList.remove('hidden');
    } else if (connectionStatus === 'pending') {
      connStatePending.classList.remove('hidden');
      displayTargetIP.textContent = targetIP;
    } else if (connectionStatus === 'accepted') {
      connStateAccepted.classList.remove('hidden');
      displayTargetIPAccepted.textContent = targetIP;
      encoderPanel.classList.remove('hidden');
    } else if (connectionStatus === 'rejected') {
      connStateIdle.classList.remove('hidden');
      connErrorMsg.classList.remove('hidden');
    }
  };

  const listenToConnection = () => {
    if (unsubscribeFirebase) unsubscribeFirebase();
    if (!targetIP) return;
    
    const requestRef = ref(db, `connections/${targetIP.replace(/\./g, '_')}/request`);
    unsubscribeFirebase = onValue(requestRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.status) {
        if (connectionStatus === 'pending' && data.status === 'accepted') {
          showToast(`Connection accepted by ${targetIP}`, 'success');
        } else if (connectionStatus === 'pending' && data.status === 'rejected') {
          showToast(`Connection rejected by ${targetIP}`, 'error');
        }
        
        connectionStatus = data.status;
        sessionStorage.setItem('crc_conn_status', connectionStatus);
        renderConnectionState();
      } else {
        if (connectionStatus === 'accepted' || connectionStatus === 'pending') {
          showToast(`Connection dropped by ${targetIP}`, 'warning');
        }
        connectionStatus = 'idle';
        sessionStorage.setItem('crc_conn_status', 'idle');
        renderConnectionState();
      }
    });
  };

  btnConnect.addEventListener('click', async () => {
    if (!targetIP) return;
    try {
      const requestRef = ref(db, `connections/${targetIP.replace(/\./g, '_')}/request`);
      await set(requestRef, {
        fromIP: myIP,
        status: 'pending',
        timestamp: Date.now()
      });
      connectionStatus = 'pending';
      sessionStorage.setItem('crc_conn_status', connectionStatus);
      renderConnectionState();
      listenToConnection();
      showToast(`Connection request sent to ${targetIP}`, 'info');
    } catch (err) {
      console.error(err);
      showToast("Error sending connection request.", 'error');
    }
  });

  if (btnCancelRequest) {
    btnCancelRequest.addEventListener('click', async () => {
      if (!targetIP) return;
      try {
        const requestRef = ref(db, `connections/${targetIP.replace(/\./g, '_')}/request`);
        await set(requestRef, null);
        connectionStatus = 'idle';
        sessionStorage.setItem('crc_conn_status', 'idle');
        renderConnectionState();
        if (unsubscribeFirebase) {
          unsubscribeFirebase();
          unsubscribeFirebase = null;
        }
        showToast(`Request to ${targetIP} cancelled`, 'warning');
      } catch (err) {
        console.error(err);
        showToast("Error cancelling request", 'error');
      }
    });
  }

  btnNewTransmission.addEventListener('click', async () => {
    if (!targetIP) return;
    try {
      const transmissionRef = ref(db, `connections/${targetIP.replace(/\./g, '_')}/transmission`);
      await set(transmissionRef, null);
      resetEncoder();
      showToast('Ready for new transmission', 'info');
    } catch (err) {
      console.error(err);
      showToast("Error starting new transmission", 'error');
    }
  });

  btnDisconnect.addEventListener('click', async () => {
    if (!targetIP) return;
    try {
      const requestRef = ref(db, `connections/${targetIP.replace(/\./g, '_')}/request`);
      await set(requestRef, null);
      connectionStatus = 'idle';
      sessionStorage.setItem('crc_conn_status', 'idle');
      resetEncoder();
      renderConnectionState();
      if (unsubscribeFirebase) {
        unsubscribeFirebase();
        unsubscribeFirebase = null;
      }
      showToast(`Disconnected from ${targetIP}`, 'warning');
    } catch (err) {
      console.error(err);
      showToast("Error disconnecting", 'error');
    }
  });

  // Restore state if returning to page
  renderConnectionState();
  if (connectionStatus === 'pending' || connectionStatus === 'accepted') {
    listenToConnection();
  }

  // --- Encoder Logic ---
  const validateInputs = () => {
    const data = inputData.value.replace(/[^01]/g, '');
    if (inputData.value !== data) {
      inputData.value = data;
    }
    
    const polyStr = inputPoly.value;
    const parsedPoly = parsePolynomialInput(polyStr);

    const isDataValid = /^[01]+$/.test(data);
    const isPolyValid = parsedPoly !== null && parsedPoly.length > 1;

    errorData.classList.toggle('hidden', data.length === 0 || isDataValid);
    errorPoly.classList.toggle('hidden', polyStr.length === 0 || isPolyValid);
    
    inputData.classList.toggle('input-error', !isDataValid && data.length > 0);
    inputPoly.classList.toggle('input-error', !isPolyValid && polyStr.length > 0);

    btnEncode.disabled = !(isDataValid && isPolyValid);
    return { isDataValid, isPolyValid, data, parsedPoly };
  };

  inputData.addEventListener('input', validateInputs);
  inputPoly.addEventListener('input', validateInputs);

  const resetEncoder = () => {
    inputData.value = '';
    inputPoly.value = '';
    currentSession = null;
    transmitSection.classList.add('hidden');
    calculationPanel.classList.add('hidden');
    validateInputs();
  };

  btnEncode.addEventListener('click', () => {
    const { isDataValid, isPolyValid, data, parsedPoly } = validateInputs();
    if (!isDataValid || !isPolyValid) return;

    const res = encodeCRC(data, parsedPoly);
    currentSession = {
      originalData: data,
      poly: parsedPoly,
      ...res
    };
    
    currentCodeword = res.codeword;

    renderCalculationSteps();
    transmitSection.classList.remove('hidden');
    calculationPanel.classList.remove('hidden');
    showToast('Data encoded successfully', 'success');
  });

  btnTransmit.addEventListener('click', async () => {
    if (!targetIP || !currentCodeword || !currentSession) return;
    try {
      btnTransmit.disabled = true;
      transmitContentDefault.classList.add('hidden');
      transmitContentLoading.classList.remove('hidden');
      transmitContentLoading.style.display = 'flex';

      // Simulate channel delay
      await new Promise(resolve => setTimeout(resolve, 1200));

      const finalCodeword = simulateChannelTransmission(currentCodeword);

      const transmissionRef = ref(db, `connections/${targetIP.replace(/\./g, '_')}/transmission`);
      await set(transmissionRef, {
        codeword: finalCodeword,
        poly: currentSession.poly,
        timestamp: Date.now()
      });
      
      transmitContentLoading.classList.add('hidden');
      transmitContentLoading.style.display = '';
      transmitContentDefault.classList.remove('hidden');
      btnTransmit.disabled = false;
      showToast('Transmitted successfully', 'success');
    } catch (err) {
      console.error(err);
      transmitContentLoading.classList.add('hidden');
      transmitContentLoading.style.display = '';
      transmitContentDefault.classList.remove('hidden');
      btnTransmit.disabled = false;
      showToast("Error transmitting data", 'error');
    }
  });

  // --- Calculation Steps Rendering ---
  const renderCalculationSteps = () => {
    if (!currentSession) return;
    calcStepsContainer.innerHTML = '';
    
    const polyStr = currentSession.poly;
    const dataStr = currentSession.originalData;
    const polyLen = polyStr.length;
    const padding = polyLen - 1;
    const appendedData = dataStr + '0'.repeat(padding);
    const remainder = currentSession.remainder;
    
    const userPolyInput = inputPoly.value.trim();
    const isAlgebraic = /x/i.test(userPolyInput);

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

    // Step 1: Original Data
    stepsHtml += createStep(1, 'Original Data', 'The raw binary data entered for transmission.', 
      `<span class="text-text-primary">${dataStr}</span>`
    );

    // Step 2: Generator Polynomial
    let polyContent = `<span class="text-text-primary">${polyStr}</span>`;
    if (isAlgebraic) {
      polyContent = `Expression: <span class="text-text-primary">${userPolyInput}</span><br>Binary: <span class="text-text-primary">${polyStr}</span>`;
    }
    stepsHtml += createStep(2, 'Generator Polynomial', 'The divisor used for error detection.', polyContent);

    // Step 3: Append Zeros
    stepsHtml += createStep(3, 'Append Zeros', 
      `Since the generator polynomial has degree ${padding} (${polyLen} bits, meaning ${padding} zeros must be appended), we append ${padding} zeros to the end of the original data.`,
      `Original: <span class="text-text-primary">${dataStr}</span><br>Padded: <span class="text-text-primary">${dataStr}</span><span class="font-bold text-text-secondary" style="color:var(--color-accent)">${'0'.repeat(padding)}</span>`
    );

    // Step 4: Perform XOR Division
    let divHtml = `
      <div class="flex gap-2 min-w-max font-mono">
        <div>${polyStr}</div>
        <div class="border-l-2 border-border pl-2 flex flex-col" style="white-space: pre;">
          <div>${appendedData}</div>
    `;
    currentSession.steps.forEach((step, idx) => {
      divHtml += `<div class="text-text-secondary border-b border-dashed border-border w-fit">${step.padding}${step.divisor}</div>`;
      let nextStr = step.padding + ' ' + step.xorResult.substring(1);
      if (idx < currentSession.steps.length - 1) {
        nextStr += appendedData[step.padding.length + step.divisor.length];
      }
      if (idx === currentSession.steps.length - 1) {
        const remStr = step.xorResult.substring(1);
        divHtml += `<div>${step.padding} <span class="font-bold" style="color:var(--color-accent)">${remStr}</span></div>`;
      } else {
        divHtml += `<div>${nextStr}</div>`;
      }
    });
    divHtml += `
        </div>
      </div>
    `;
    stepsHtml += createStep(4, 'Perform XOR Division', 'Long division using Modulo-2 arithmetic (XOR).', divHtml);

    // Step 5: Determine the Remainder
    stepsHtml += createStep(5, 'Determine the Remainder (CRC bits)', 
      'The final result of the XOR division is the remainder, which acts as our CRC check bits.',
      `Remainder (CRC check bits): <span class="font-bold" style="color:var(--color-accent)">${remainder}</span>`
    );

    // Step 6: Form the Final Codeword
    stepsHtml += createStep(6, 'Form the Final Codeword',
      'The remainder replaces the appended zeros to form the final transmitted codeword.',
      `Original data + CRC remainder = Codeword<br><br>
       <span class="text-text-primary">${dataStr}</span> + <span class="font-bold" style="color:var(--color-accent)">${remainder}</span> = 
       <span class="text-text-primary">${dataStr}</span><span class="font-bold" style="color:var(--color-accent)">${remainder}</span>`
    );

    calcStepsContainer.innerHTML = stepsHtml;
  };
});
