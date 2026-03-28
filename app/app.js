const http = require("http");

const PORT = 3000;

const games = {};

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Number Guessing Game</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0a0a0f;
      --surface: #13131a;
      --border: #2a2a3a;
      --accent: #00ffaa;
      --accent2: #ff4f6d;
      --text: #e8e8f0;
      --muted: #6b6b80;
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Space Mono', monospace;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background-image: radial-gradient(ellipse at 20% 50%, #00ffaa0d 0%, transparent 60%),
                        radial-gradient(ellipse at 80% 20%, #ff4f6d0d 0%, transparent 50%);
    }

    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 2.5rem;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 0 60px #00ffaa0a;
    }

    .tag {
      font-size: 0.65rem;
      letter-spacing: 0.2em;
      color: var(--accent);
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }

    h1 {
      font-family: 'Syne', sans-serif;
      font-size: 2rem;
      font-weight: 800;
      line-height: 1.1;
      margin-bottom: 0.4rem;
    }

    .subtitle {
      color: var(--muted);
      font-size: 0.78rem;
      margin-bottom: 2rem;
    }

    .attempts-bar {
      display: flex;
      gap: 5px;
      margin-bottom: 2rem;
    }

    .attempt-dot {
      flex: 1;
      height: 4px;
      border-radius: 2px;
      background: var(--border);
      transition: background 0.3s;
    }

    .attempt-dot.used { background: var(--accent2); }
    .attempt-dot.active { background: var(--accent); }

    .input-row {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }

    input[type=number] {
      flex: 1;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      font-family: 'Space Mono', monospace;
      font-size: 1.1rem;
      padding: 0.75rem 1rem;
      outline: none;
      transition: border-color 0.2s;
    }

    input[type=number]:focus { border-color: var(--accent); }
    input[type=number]::-webkit-inner-spin-button { display: none; }

    button {
      background: var(--accent);
      color: #000;
      border: none;
      border-radius: 8px;
      font-family: 'Space Mono', monospace;
      font-weight: 700;
      font-size: 0.85rem;
      padding: 0.75rem 1.25rem;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
    }

    button:hover { opacity: 0.85; }
    button:active { transform: scale(0.97); }
    button:disabled { opacity: 0.4; cursor: not-allowed; }

    .message {
      font-size: 0.85rem;
      min-height: 1.4rem;
      margin-bottom: 1.25rem;
      transition: color 0.3s;
    }

    .message.low  { color: #4fc3f7; }
    .message.high { color: #ff9800; }
    .message.win  { color: var(--accent); }
    .message.lose { color: var(--accent2); }

    .history {
      border-top: 1px solid var(--border);
      padding-top: 1.25rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }

    .history-chip {
      font-size: 0.7rem;
      padding: 0.2rem 0.55rem;
      border-radius: 99px;
      border: 1px solid var(--border);
      color: var(--muted);
    }

    .history-chip.low  { border-color: #4fc3f780; color: #4fc3f7; }
    .history-chip.high { border-color: #ff980080; color: #ff9800; }

    #restart-btn {
      display: none;
      margin-top: 1rem;
      width: 100%;
      background: transparent;
      color: var(--accent);
      border: 1px solid var(--accent);
    }

    #restart-btn:hover { background: #00ffaa15; opacity: 1; }
  </style>
</head>
<body>
<div class="card">
  <div class="tag">// devops demo app</div>
  <h1>Guess the Number</h1>
  <p class="subtitle">1 – 100 &nbsp;·&nbsp; 10 attempts</p>

  <div class="attempts-bar" id="bar"></div>

  <div class="input-row">
    <input type="number" id="guess-input" min="1" max="100" placeholder="e.g. 42" />
    <button id="guess-btn" onclick="submitGuess()">Guess</button>
  </div>

  <div class="message" id="message">Make your first guess!</div>
  <div class="history" id="history"></div>
  <button id="restart-btn" onclick="restartGame()">↩ Play Again</button>
</div>

<script>
  let gameId = null;

  async function startGame() {
    const res = await fetch('/api/new', { method: 'POST' });
    const data = await res.json();
    gameId = data.gameId;
    renderBar(0);
    document.getElementById('message').textContent = 'Make your first guess!';
    document.getElementById('message').className = 'message';
    document.getElementById('history').innerHTML = '';
    document.getElementById('guess-btn').disabled = false;
    document.getElementById('guess-input').disabled = false;
    document.getElementById('restart-btn').style.display = 'none';
    document.getElementById('guess-input').value = '';
    document.getElementById('guess-input').focus();
  }

  function renderBar(used) {
    const bar = document.getElementById('bar');
    bar.innerHTML = '';
    for (let i = 0; i < 10; i++) {
      const d = document.createElement('div');
      d.className = 'attempt-dot' + (i < used ? ' used' : i === used ? ' active' : '');
      bar.appendChild(d);
    }
  }

  async function submitGuess() {
    const input = document.getElementById('guess-input');
    const guess = parseInt(input.value);
    if (!guess || guess < 1 || guess > 100) {
      setMessage('Enter a number between 1 and 100.', '');
      return;
    }

    const res = await fetch('/api/guess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, guess })
    });
    const data = await res.json();

    renderBar(data.attempts);
    setMessage(data.message, data.status);

    if (data.guesses) renderHistory(data.guesses);

    if (data.status === 'win' || data.status === 'lose') {
      document.getElementById('guess-btn').disabled = true;
      document.getElementById('guess-input').disabled = true;
      document.getElementById('restart-btn').style.display = 'block';
    }

    input.value = '';
    input.focus();
  }

  function renderHistory(guesses) {
    const el = document.getElementById('history');
    el.innerHTML = guesses.map(g =>
      '<span class="history-chip ' + g.hint + '">' + g.value + ' ' +
      (g.hint === 'low' ? '↑' : g.hint === 'high' ? '↓' : '✓') + '</span>'
    ).join('');
  }

  function setMessage(text, cls) {
    const el = document.getElementById('message');
    el.textContent = text;
    el.className = 'message ' + cls;
  }

  function restartGame() { startGame(); }

  document.getElementById('guess-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') submitGuess();
  });

  startGame();
</script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    return res.end(html);
  }

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ status: "ok" }));
  }

  if (req.method === "POST" && req.url === "/api/new") {
    const id = generateId();
    games[id] = { secret: Math.floor(Math.random() * 100) + 1, attempts: 0, guesses: [] };
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ gameId: id }));
  }

  if (req.method === "POST" && req.url === "/api/guess") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      const { gameId, guess } = JSON.parse(body);
      const game = games[gameId];

      if (!game) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Game not found" }));
      }

      game.attempts++;
      let status, message, hint;

      if (guess === game.secret) {
        status = "win";
        message = "🎉 Correct! The number was " + game.secret + ". You got it in " + game.attempts + " attempt(s)!";
        hint = "win";
      } else if (game.attempts >= 10) {
        status = "lose";
        message = "💀 Game over! The number was " + game.secret + ".";
        hint = guess < game.secret ? "low" : "high";
      } else {
        status = guess < game.secret ? "low" : "high";
        message = guess < game.secret
          ? "📈 Too low! " + (10 - game.attempts) + " attempts left."
          : "📉 Too high! " + (10 - game.attempts) + " attempts left.";
        hint = status;
      }

      game.guesses.push({ value: guess, hint });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status, message, attempts: game.attempts, guesses: game.guesses }));
    });
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log("🎮 Game server running at http://localhost:" + PORT);
  console.log("❤️  Health check: http://localhost:" + PORT + "/health");
});
