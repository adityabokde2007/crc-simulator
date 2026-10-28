import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBdFIxRbXZrOT2GhnudRlzyaAOPeeKau50",
  authDomain: "crc-simulator.firebaseapp.com",
  databaseURL: "https://crc-simulator-default-rtdb.firebaseio.com",
  projectId: "crc-simulator",
  storageBucket: "crc-simulator.firebasestorage.app",
  messagingSenderId: "551214015277",
  appId: "1:551214015277:web:5f7e2d8d4ad6943aba29a4"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
