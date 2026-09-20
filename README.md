<div align="center">
  <img src="public/favicon.svg" alt="CRC Simulator Logo" width="120" height="120" />
  
  # CRC Simulator
  
  *An interactive tool for visualizing Cyclic Redundancy Check (CRC) error detection.*

  <p align="center">
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
    <img src="https://img.shields.io/badge/jsPDF-FF0000?style=for-the-badge&logo=adobe-acrobat-reader&logoColor=white" alt="jsPDF" />
  </p>
</div>

## About the project

CRC Simulator is a client-side educational tool built for a college microproject. It lets users encode binary data using a CRC generator polynomial, simulate transmission errors by introducing random or manual bit-flips, and verify data integrity on the receiver side. The entire encoding and decoding process is visualized step-by-step, making it an excellent resource for understanding how error detection algorithms function at a granular level.

## Features

### 📤 Sender Panel
- **Dual Input Modes:** Input binary directly (e.g., `100000111`) or via polynomial expression (e.g., `x^8+x^2+x+1`).
- **Encoding Generation:** Calculates the CRC remainder and generates the transmitted codeword.
- **Division Steps:** View the exact step-by-step modulo-2 long division operations in a dedicated modal.

### 📡 Transmission Channel
- **Indexed Bit Visualization:** View the codeword cleanly aligned with explicit bit indices.
- **Error Injection:** Introduce noise by manually flipping a bit by its index or generating random errors.
- **Visual Feedback:** Flipped bits are explicitly highlighted for clarity before sending data to the receiver.

### 📥 Receiver Panel
- **Integrity Verification:** Scans the received codeword and verifies it against the generator polynomial.
- **Pass/Fail Status:** Clean, responsive UI indicating whether the payload was clean or corrupted.
- **Calculation Modal:** See the step-by-step math used to resolve the zero or non-zero remainder.

### 📄 PDF Report
- **Downloadable Summaries:** Generates and exports a summary report of the full simulation run (including polynomials, payloads, and results) straight to PDF using jsPDF.

### 🎨 UI/UX
- **Modern Design:** Crisp light theme with a steel-blue accent palette.
- **Clarity:** Monospace binary display and a clean, responsive layout designed for desktop and mobile web experiences.

## Tech stack

This is a fully client-side application with **NO backend or database**.

| Technology | Role |
| --- | --- |
| **React** | Core component-based UI library managing state and interactivity. |
| **TypeScript** | Strict typing for robust CRC calculation logic and robust code. |
| **Tailwind CSS** | Utility-first CSS framework for rapid, highly-customized styling. |
| **Vite** | Lightning-fast frontend tooling and bundler. |
| **jsPDF** | Client-side generation of simulation PDF reports. |

## Architecture

```text
User Browser
 └── React App (Client-side only)
      ├── All CRC logic computed in-browser
      └── PDF export via jsPDF (No server, no external API calls)
```

## Project structure

```text
crc-simulator/
├── public/
│   ├── favicon.svg
│   ├── favicon.ico
│   └── how_it_works.mp4
├── src/
│   ├── components/
│   │   ├── DivisionSteps.tsx
│   │   ├── EncoderPanel.tsx
│   │   ├── HowItWorksPanel.tsx
│   │   ├── Modal.tsx
│   │   ├── ReceiverPanel.tsx
│   │   └── TransmissionChannel.tsx
│   ├── utils/
│   │   └── crc.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Getting started

### Prerequisites
- Node.js 20+

### Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/yourusername/crc-simulator.git
cd crc-simulator
npm install
```

### Environment Variables
This is a fully client-side application. **No environment variables are needed.**

### Run locally
Start the Vite development server:
```bash
npm run dev
```
Then, open your browser and navigate to `http://localhost:5173`.

## Deployment

Since the app has no backend or complex environment configurations, deploying is as simple as building the static files and hosting them.

1. Build the production bundle:
   ```bash
   npm run build
   ```
2. Deploy the `dist/` folder to your preferred static hosting platform like **Vercel**, **Netlify**, or **GitHub Pages**. No backend configuration or environment variables are needed!

<br />

<div align="center">
  <em>Built to make error detection visible, one bit at a time.</em>
</div>
