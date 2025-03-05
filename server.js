import express from 'express';
import cors from 'cors';
import { randomBytes, createHash } from 'crypto';

const app = express();
app.use(cors());
app.use(express.json());

let playerBalance = 1000;

const generateServerSeed = () => randomBytes(16).toString("hex");

let currentServerSeed = generateServerSeed();
let previousServerSeed = null;

const hashServerSeed = (seed) => createHash("sha256").update(seed).digest("hex");

let hashedServerSeed = hashServerSeed(currentServerSeed);

// Roll dice
app.post("/roll-dice", (req, res) => {
  const { betAmount, clientSeed } = req.body;
  if (betAmount <= 0 || betAmount > playerBalance) {
    return res.status(400).json({ error: "Invalid bet amount" });
  }
  const nonce = Date.now();
  const combinedSeed = `${currentServerSeed}${clientSeed}${nonce}`;
  const hash = createHash("sha256").update(combinedSeed).digest("hex");
  const roll = (parseInt(hash.substring(0, 8), 16) % 6) + 1;
  const isWin = roll >= 4;
  const newBalance = isWin ? playerBalance + (betAmount * 2) : playerBalance - betAmount;
  playerBalance = newBalance;
  previousServerSeed = currentServerSeed;
  currentServerSeed = generateServerSeed();
  hashedServerSeed = hashServerSeed(currentServerSeed);
  res.json({
    roll,
    result: isWin ? "Win" : "Lose",
    newBalance,
    previousServerSeed,
    nonce,
    hashedNewSeed: hashedServerSeed,
  });
});

// Get balance
app.get("/balance", (req, res) => {
  res.json({ balance: playerBalance });
});

// Add balance
app.post("/add-balance", (req, res) => {
  const { amount } = req.body;
  if (typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }
  playerBalance += amount;
  res.json({ balance: playerBalance });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Dice Game Backend Running on http://localhost:${PORT}`);
});
