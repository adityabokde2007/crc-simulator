# CRC Simulator

A web-based interactive tool for visualizing Cyclic Redundancy Check (CRC) error detection. This simulator demonstrates how data is encoded using polynomial division in modulo-2 arithmetic, how it can be corrupted during transmission, and how the receiver detects these errors.

## Architecture

This project is built using:
- **Vanilla HTML / CSS / JavaScript** (No frontend frameworks or UI libraries)
- **Firebase Realtime Database** (For real-time connection and transmission simulation between two browser tabs/devices)
- **Vite** (Used as a lightweight development server and module bundler)
- **jsPDF** (For generating downloadable PDF reports)

The app consists of three main pages:
1. `index.html` - The landing page to select a role.
2. `sender.html` - The Sender device page, responsible for encoding data and simulating noise.
3. `receiver.html` - The Receiver device page, responsible for receiving data and verifying integrity.

## Prerequisites

- Node.js (v18 or higher recommended)
- A Firebase project with Realtime Database enabled and rules set to allow read/write (`".read": true`, `".write": true`).

## Getting Started

1. **Clone the repository** (or download the source code).
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Firebase**:
   Create a `.env` file in the root directory and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_DATABASE_URL=your_database_url
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
4. **Run the development server**:
   ```bash
   npm run dev
   ```
5. **Open the app**:
   Navigate to the local URL provided by Vite (usually `http://localhost:5173`). Open it in two separate tabs to simulate the Sender and Receiver.

## Features

- **Real-time Two-Device Simulation**: Connect a sender and receiver using simulated IP addresses.
- **Polynomial Math Visualization**: Step-by-step display of the modulo-2 division process for both encoding and verifying.
- **Noise Injection**: Manually flip bits or inject random errors into the codeword before transmission to observe how CRC catches them.
- **Report Generation**: Download a detailed PDF summary of the transmission and integrity check results.
