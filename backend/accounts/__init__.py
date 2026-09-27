* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: Inter, Arial, sans-serif;
  background: #081121;
  color: #edf2ff;
}
button, input, select, textarea {
  width: 100%;
  margin-top: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #2b3d5b;
  background: #10213b;
  color: #ebf3ff;
}
button {
  cursor: pointer;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border: none;
  font-weight: 600;
}
textarea { min-height: 90px; }
.topbar {
  display: flex;
  gap: 12px;
  padding: 18px 20px;
  background: rgba(5, 10, 22, 0.8);
  border-bottom: 1px solid #1f2d45;
}
.topbar button { width: auto; min-width: 120px; }
.panel { padding: 22px; }
.splash, .card, .leaderboard-box { margin-top: 20px; }
.grid { display: grid; gap: 20px; }
.two-col { grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
.card, .leaderboard-box {
  background: #0f1b2e;
  border-radius: 16px;
  padding: 18px;
  border: 1px solid #21334f;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.question-card { margin-top: 12px; }
.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  margin-top: 20px;
}
.answer-btn {
  min-height: 70px;
  font-size: 1rem;
}
.button-row { display: flex; gap: 10px; }
.message-banner {
  margin: 12px 22px 0;
  padding: 12px 16px;
  border-radius: 10px;
  background: rgba(59,130,246,0.2);
  border: 1px solid rgba(59,130,246,0.5);
}
.leaderboard-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #1c2c43;
}
