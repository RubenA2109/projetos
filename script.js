const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const brickColors = ["red", "orange", "yellow", "green", "blue", "purple", "cyan"];
let nickname = "";
let score = 0, lives = 3;
let ballSpeed = 2;
let gameRunning = false;
let showMessageTimeout;

const paddle = {
  x: canvas.width / 2 - 35,
  width: 70,
  height: 10,
  speed: 5,
  dx: 0
};

let balls = [{
  x: canvas.width / 2,
  y: canvas.height - 30,
  dx: ballSpeed,
  dy: -ballSpeed,
  radius: 5
}];

const brickRowCount = 7;// 7 bolas para a vertical
const brickColumnCount = 10; //10 bolas para a lateral
const brickWidth = 70;
const brickHeight = 20;
const padding = 10;
const offsetTop = 30;
const offsetLeft = canvas.width - ((brickWidth + padding) * brickColumnCount);

let bricks = [];
let powerUps = [];
const powerUpTypes = [
  "multiBall", "multiBall", "multiBall", "multiBall", // bolas azuis(caem mais bolas)
  "expand","expand"                                                // power-up verde(aumenta o nosso bloco)
];

function createBricks() {
  bricks = [];
  for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
      bricks[c][r] = { x: 0, y: 0, status: 1 };
    }
  }
}

createBricks();

document.addEventListener("keydown", (e) => {
  if (e.key === "a" || e.key === "ArrowLeft") paddle.dx = -paddle.speed;
  else if (e.key === "d" || e.key === "ArrowRight") paddle.dx = paddle.speed;
});

document.addEventListener("keyup", (e) => {
  if (["a", "d", "ArrowLeft", "ArrowRight"].includes(e.key)) paddle.dx = 0;
});

function drawBalls() {
  balls.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.closePath();
  });
}

function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddle.x, canvas.height - paddle.height, paddle.width, paddle.height);
  ctx.fillStyle = "#0f0";
  ctx.fill();
  ctx.closePath();
}

function drawBricks() {
  let allDestroyed = true;
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (b.status === 1) {
        allDestroyed = false;
        const brickX = (c * (brickWidth + padding)) + offsetLeft;
        const brickY = (r * (brickHeight + padding)) + offsetTop;
        b.x = brickX;
        b.y = brickY;
        ctx.beginPath();
        ctx.rect(brickX, brickY, brickWidth, brickHeight);
        ctx.fillStyle = brickColors[r % brickColors.length];
        ctx.fill();
        ctx.closePath();
      }
    }
  }
  if (allDestroyed) endGame(true);
}

function drawPowerUps() {
  powerUps.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.type === "expand" ? "lime" : "cyan";
    ctx.fill();
    ctx.closePath();
  });
}

function collisionDetection() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (b.status == 1) {
        balls.forEach(ball => {
          if (
            ball.x > b.x && ball.x < b.x + brickWidth &&
            ball.y > b.y && ball.y < b.y + brickHeight
          ) {
            ball.dy = -ball.dy;
            b.status = 0;
            score += 5;
            document.getElementById("score").innerText = score;

            ball.dx *= 1.05;
            ball.dy *= 1.05;

            // 20% de chance de largar um power-up
            if (Math.random() < 0.20  ) {
              const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
              powerUps.push({
                x: b.x + brickWidth / 2,
                y: b.y + brickHeight / 2,
                radius: 10,
                type,
                dy: 2
              });
            }
          }
        });
      }
    }
  }
}

function draw() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBalls();
  drawPaddle();
  drawPowerUps();
  collisionDetection();

  // atualizar posição da paddle
  paddle.x += paddle.dx;
  if (paddle.x < 0) paddle.x = 0;
  if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;

  // atualizar bolas
  balls.forEach((b, i) => {
    b.x += b.dx;
    b.y += b.dy;

    if (b.x + b.dx > canvas.width - b.radius || b.x + b.dx < b.radius)
      b.dx = -b.dx;

    if (b.y + b.dy < b.radius)
      b.dy = -b.dy;
    else if (b.y + b.dy > canvas.height - b.radius) {
      if (b.x > paddle.x && b.x < paddle.x + paddle.width)
        b.dy = -b.dy;
      else {
        balls.splice(i, 1);
        if (balls.length === 0) {
          lives--;
          document.getElementById("lives").innerText = lives;
          if (lives <= 0) {
            endGame(false);
            return;
          } else {
            resetBall();
          }
        }
      }
    }
  });

  // atualizar power-ups
  powerUps.forEach((p, index) => {
    p.y += p.dy;

    if (
      p.y + p.radius >= canvas.height - paddle.height &&
      p.x > paddle.x && p.x < paddle.x + paddle.width
    ) {
      if (p.type === "expand") {
        paddle.width *= 1.5;
        setTimeout(() => {
          paddle.width /= 1.5;
        }, 7000); // dura 7 segundos
      } else if (p.type === "multiBall") {
        const mainBall = balls[0];
        balls.push({
          x: mainBall.x,
          y: mainBall.y,
          dx: -mainBall.dx,
          dy: mainBall.dy,
          radius: mainBall.radius
        });
        balls.push({
          x: mainBall.x,
          y: mainBall.y,
          dx: mainBall.dx,
          dy: -mainBall.dy,
          radius: mainBall.radius
        });
      }
      powerUps.splice(index, 1);// remove o power-up capturado
    }

    if (p.y > canvas.height) {
      powerUps.splice(index, 1);
    }
  });

  requestAnimationFrame(draw);
}

function resetBall() {
  balls = [{
    x: canvas.width / 2,
    y: canvas.height - 30,
    dx: ballSpeed,
    dy: -ballSpeed,
    radius: 5
  }];
}

function startGame() {
  nickname = document.getElementById("nickname").value;
  if (!nickname) return alert("Insira o nickname!");

  score = 0;
  lives = 3;
  ballSpeed = 2;
  gameRunning = true;
  document.getElementById("score").innerText = score;
  document.getElementById("lives").innerText = lives;

  resetBall();
  createBricks();
  powerUps = [];

  document.getElementById("entry").style.display = "none";
  document.getElementById("scoreboard").style.display = "none";
  document.getElementById("game-over").style.display = "none";
  document.getElementById("game").style.display = "block";

  const msg = document.getElementById("wasd-message");
  msg.style.display = "block";
  clearTimeout(showMessageTimeout);
  showMessageTimeout = setTimeout(() => {
    msg.style.display = "none";
  }, 3500);

  draw();
}

function endGame(won) {
  gameRunning = false;
  document.getElementById("game").style.display = "none";
  document.getElementById("game-over").style.display = "block";
  document.getElementById("game-over-message").innerText = won ? "Ganhou!" : "Perdeu!";
  document.getElementById("final-score").innerText = `Pontuação Final: ${score}`;

  // Guardar localmente
  const scores = JSON.parse(localStorage.getItem("scores") || "[]");
  scores.push({ name: nickname, score });
  scores.sort((a, b) => b.score - a.score);
  localStorage.setItem("scores", JSON.stringify(scores));


  fetch("http://localhost:3000/api/scores/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      datascore: new Date().toISOString(),   // data atual
      nickname: nickname,                    // nome do jogador
      score: score,                          // pontuação
      game: "Brick Breaker"                  // nome do jogo
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log("Score enviado com sucesso:", data);
  })
  .catch(error => {
    console.error("Erro ao enviar score para a API:", error);
  });
}


function goToEntry() {
  document.getElementById("entry").style.display = "block";
  document.getElementById("game").style.display = "none";
  document.getElementById("game-over").style.display = "none";
  document.getElementById("scoreboard").style.display = "none";
}

async function showScoreboard() {
  try {
    const response = await fetch("http://localhost:3000/api/scores/");
    const data = await response.json();

    const scoresDiv = document.getElementById("scores");

    // Filtrar apenas os scores do jogo "Brick Breaker"
    const brickBreakerScores = data.filter(item => item.game === "Brick Breaker");

    // Ordenar por pontuação (maior primeiro)
    brickBreakerScores.sort((a, b) => b.score - a.score);

    // Mostrar apenas os 10 melhores
    const top10 = brickBreakerScores.slice(0, 10);

    scoresDiv.innerHTML = top10.map((item, index) => {
      let medal = "";
      let bgColor = "#906a6a"; // padrão

      if (index === 0) {
        medal = "🥇";
        bgColor = "#ffeb3b"; // ouro
      } else if (index === 1) {
        medal = "🥈";
        bgColor = "#c0c0c0"; // prata
      } else if (index === 2) {
        medal = "🥉";
        bgColor = "#cd7f32"; // bronze
      }

      return `
        <div class="scoreboard-entry" style="background-color: ${bgColor}">
          <span class="medal">${medal}</span>
          ${index + 1}. ${item.nickname}: ${item.score}
          <span class="medal">${medal}</span>
        </div>
      `;
    }).join("");

    document.getElementById("entry").style.display = "none";
    document.getElementById("scoreboard").style.display = "block";
  } catch (error) {
    console.error("Erro ao carregar o scoreboard:", error);
    alert("Erro ao carregar o scoreboard da API.");
  }
}


window.onload = () => {
  document.getElementById("entry").style.display = "block";
};
