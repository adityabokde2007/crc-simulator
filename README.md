# CRC Simulator

A web-based interactive tool for visualizing Cyclic Redundancy Check (CRC) error detection in computer networks. This simulator demonstrates how data is encapsulated into frames, encoded using modulo-2 polynomial division, transmitted through a noisy channel, and verified at the receiver end.

## Architecture

This project is built using:
- **Frontend**: Vanilla HTML5, CSS3, and JavaScript (ES Modules via CDN — zero npm dependencies).
- **Backend**: Python (Flask) for CRC mathematical logic, frame encapsulation/de-encapsulation, and channel simulation.
- **Real-time Sync**: Firebase Realtime Database (via official Google CDN) for peer-to-peer transmission simulation across separate browser tabs/devices.

### Project Structure

```text
crc simulator/
├── assets/          # Project icons and UI graphics
├── css/             # Stylesheets (clean, responsive UI)
├── html/            # Multi-page views
│   ├── index.html       # Landing page (Role selection: Sender or Receiver)
│   ├── sender.html      # Sender dashboard (Encoding, noise injection, transmission)
│   └── receiver.html    # Receiver dashboard (CRC verification, ACK/NACK handling)
├── js/              # Modular frontend scripts
│   ├── firebase-config.js  # Firebase Realtime DB configuration
│   ├── sender.js           # Sender-side UI logic and event handlers
│   ├── receiver.js         # Receiver-side UI logic and verification
│   ├── landing.js          # Landing page accordion & helpers
│   ├── modal.js            # Modal dialog handlers
│   └── toast.js            # Notification toasts
├── app.py           # Flask server (serves frontend & CRC REST APIs)
├── crc_logic.py     # Core CRC calculations, XOR modulo-2 division, MAC headers
└── requirements.txt # Python dependencies (Flask, flask-cors)
```

## Prerequisites

- **Python 3.8+** (No Node.js or npm required!)

## Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/adityabokde2007/crc-simulator.git
   cd crc-simulator
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the application**:
   ```bash
   python app.py
   ```

4. **Open in browser**:
   Navigate to:
   ```text
   http://localhost:5000
   ```
   Open the URL in **two separate tabs** (or two devices):
   - Choose **"I'm the Sender"** on one tab.
   - Choose **"I'm the Receiver"** on the other tab.

## Key Features

- **Real-time Two-Device Simulation**: Connect sender and receiver in real-time using simulated IP addresses over Firebase.
- **Frame Encapsulation**: Converts user text to 8-bit ASCII binary and appends simulated 48-bit MAC addresses (Source & Destination).
- **Polynomial Math Visualization**: Step-by-step display of Modulo-2 binary XOR division using CRC-16-CCITT polynomial (`x^16 + x^12 + x^5 + 1`).
- **Channel Noise Simulation**: Simulates transmission over a noisy channel with bit-flip corruption to observe how CRC catches transmission errors.
- **Automatic ARQ (ACK / NACK)**: If corruption is detected, receiver sends NACK, prompting sender to automatically retransmit a clean frame.
