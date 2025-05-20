let bounceFrame = 0;
let bounceActive = false;
let winFlash = false;
let flashFrame = 0;
let particles = [];
let winningLine = null;
let pulseActive = false;
let pulseFrame = 0;
let score = 0;
let lastWinAmount = 0;
let lastWinCells = [];
let scoreDisplay = 0; // valor animado exibido no canvas
let scoreTarget = 0;  // valor real da pontuação
let scoreAnimFrame = null;
let pulseAnimationFrame = null; // Adicione esta variável no topo do arquivo

// Pontuação por símbolo (ajuste os valores conforme desejar)
const symbolValues = {
    tiger: 2.00,
    rabbitW: 1.50,
    rabbitG: 3.00,
    diamond: 2.50,
    wild: 5.00,
    bell: 1.00
};

// Sempre use window.slotState dentro das funções
function drawGrid(animated = false) {
    const {
        canvas, ctx, feedback, spriteSheet,
        SYMBOL_SIZE_X, SYMBOL_SIZE_Y, 
        DEST_SIZE_X, DEST_SIZE_Y, // <- Ajustado aqui
        symbols, grid
    } = window.slotState;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenha símbolos, com efeito de pulsar nos símbolos vencedores
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            let bounceY = 0;
            let pulse = false;
            let pulseScale = 1;
            if (animated && bounceActive) {
                bounceY = Math.abs(Math.sin((bounceFrame + r * 5 + c * 7) * 0.25)) * 20;
            }
            // Se está pulsando e este símbolo faz parte da linha vencedora
            if (pulseActive && lastWinCells.some(cell => cell[0] === r && cell[1] === c)) {
                pulse = true;
                pulseScale = 1 + 0.15 * Math.sin(pulseFrame * 0.25);
            }
            // Na chamada do drawSymbol, ajuste os parâmetros:
            drawSymbol(
                grid[r][c], 
                c, r, 
                bounceY, 
                ctx, 
                spriteSheet, 
                SYMBOL_SIZE_X, 
                SYMBOL_SIZE_Y, 
                DEST_SIZE_X, 
                DEST_SIZE_Y, 
                symbols, 
                pulse, 
                pulseScale
            );
        }
    }

    // Efeito de brilho ao vencer
    if (winFlash) {
        ctx.save();
        ctx.globalAlpha = 0.3 + 0.2 * Math.sin(flashFrame * 0.3);
        ctx.fillStyle = "#fffde7";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    // Partículas douradas
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life / 1.0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
        ctx.fillStyle = "#ffd700";
        ctx.shadowColor = "#ffd700";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
    });

    // Exibe o valor ganho sobre a linha vencedora durante o pulso
    if (pulseActive && lastWinCells.length > 0 && lastWinAmount > 0) {
        ctx.save();
        ctx.font = "bold 32px Arial";
        ctx.fillStyle = "#fffbe7";
        ctx.strokeStyle = "#ff9800";
        ctx.lineWidth = 4;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        let sumX = 0, sumY = 0;
        lastWinCells.forEach(([r, c]) => {
            sumX += 60 + c * 160 + 80;
            sumY += 60 + r * 160 + 80;
        });
        let cx = sumX / lastWinCells.length;
        let cy = sumY / lastWinCells.length - 40;
        ctx.strokeText(`Ganho ${lastWinAmount.toFixed(2)}`, cx, cy);
        ctx.fillText(`Ganho ${lastWinAmount.toFixed(2)}`, cx, cy);
        ctx.restore();
    }

    // Exibe a pontuação total animada no topo do canvas (mais acima)
    ctx.save();
    ctx.font = "bold 32px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#ffd700";
    ctx.fillStyle = "#fffbe7";
    ctx.shadowColor = "#ff9800";
    ctx.shadowBlur = 18;
    let scoreText = `CRÉDITOS: ${scoreDisplay.toFixed(2)}`;
    ctx.strokeText(scoreText, canvas.width / 2, 2); // <-- alterado de 18 para 2
    ctx.fillText(scoreText, canvas.width / 2, 2);
    ctx.restore();
}

// Cache de canvas para os símbolos
const symbolsCache = new Map();

// Ajuste função cacheSymbols para usar window.slotState
function cacheSymbols() {
    const { 
        spriteSheet, symbols,
        SYMBOL_SIZE_X, SYMBOL_SIZE_Y,
        DEST_SIZE_X, DEST_SIZE_Y 
    } = window.slotState;

    if (!spriteSheet.complete) return;

    symbols.forEach((symbol, idx) => {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = DEST_SIZE_X;
        tempCanvas.height = DEST_SIZE_Y;
        
        tempCtx.drawImage(
            spriteSheet,
            symbol.sx * SYMBOL_SIZE_X, 
            symbol.sy * SYMBOL_SIZE_Y, 
            SYMBOL_SIZE_X, SYMBOL_SIZE_Y,
            0, 0, DEST_SIZE_X, DEST_SIZE_Y
        );
        symbolsCache.set(idx, tempCanvas);
    });
}

function drawSymbol(idx, col, row, bounceY, ctx, spriteSheet, SYMBOL_SIZE_X, SYMBOL_SIZE_Y, DEST_SIZE_X, DEST_SIZE_Y, symbols, pulse = false, pulseScale = 1) {
    // Usa símbolo do cache
    const cachedSymbol = symbolsCache.get(idx);
    if (!cachedSymbol) return;

    const GRID_PADDING = 40;
    const SLOT_GAP = 20;
    const slotSize = (600 - (GRID_PADDING * 2) - (SLOT_GAP * 2)) / 3;
    
    const dx = GRID_PADDING + (col * (slotSize + SLOT_GAP)) + (slotSize - DEST_SIZE_X * pulseScale) / 2;
    const dy = GRID_PADDING + (row * (slotSize + SLOT_GAP)) + (slotSize - DEST_SIZE_Y * pulseScale) / 2 + bounceY;

    ctx.save();
    if (pulse) {
        const glowIntensity = 0.5 + 0.5 * Math.sin(pulseFrame * 0.4);
        ctx.filter = `drop-shadow(0 0 12px rgba(255, 215, 0, ${glowIntensity}))`;
    }
    
    ctx.drawImage(cachedSymbol, dx, dy, DEST_SIZE_X * pulseScale, DEST_SIZE_Y * pulseScale);
    ctx.restore();
}

// Simplifica o drawGrid removendo as referências à linha vencedora
function drawGrid(animated = false) {
    const {
        canvas, ctx, feedback, spriteSheet,
        SYMBOL_SIZE_X, SYMBOL_SIZE_Y, 
        DEST_SIZE_X, DEST_SIZE_Y, // <- Ajustado aqui
        symbols, grid
    } = window.slotState;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenha símbolos, com efeito de pulsar nos símbolos vencedores
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            let bounceY = 0;
            let pulse = false;
            let pulseScale = 1;
            if (animated && bounceActive) {
                bounceY = Math.abs(Math.sin((bounceFrame + r * 5 + c * 7) * 0.25)) * 20;
            }
            // Se está pulsando e este símbolo faz parte da linha vencedora
            if (pulseActive && lastWinCells.some(cell => cell[0] === r && cell[1] === c)) {
                pulse = true;
                pulseScale = 1 + 0.15 * Math.sin(pulseFrame * 0.25);
            }
            // Na chamada do drawSymbol, ajuste os parâmetros:
            drawSymbol(
                grid[r][c], 
                c, r, 
                bounceY, 
                ctx, 
                spriteSheet, 
                SYMBOL_SIZE_X, 
                SYMBOL_SIZE_Y, 
                DEST_SIZE_X, 
                DEST_SIZE_Y, 
                symbols, 
                pulse, 
                pulseScale
            );
        }
    }

    // Efeito de brilho ao vencer
    if (winFlash) {
        ctx.save();
        ctx.globalAlpha = 0.3 + 0.2 * Math.sin(flashFrame * 0.3);
        ctx.fillStyle = "#fffde7";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    // Partículas douradas
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life / 1.0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
        ctx.fillStyle = "#ffd700";
        ctx.shadowColor = "#ffd700";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
    });

    // Exibe o valor ganho sobre a linha vencedora durante o pulso
    if (pulseActive && lastWinCells.length > 0 && lastWinAmount > 0) {
        ctx.save();
        ctx.font = "bold 32px Arial";
        ctx.fillStyle = "#fffbe7";
        ctx.strokeStyle = "#ff9800";
        ctx.lineWidth = 4;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        let sumX = 0, sumY = 0;
        lastWinCells.forEach(([r, c]) => {
            sumX += 60 + c * 160 + 80;
            sumY += 60 + r * 160 + 80;
        });
        let cx = sumX / lastWinCells.length;
        let cy = sumY / lastWinCells.length - 40;
        ctx.strokeText(`Ganho ${lastWinAmount.toFixed(2)}`, cx, cy);
        ctx.fillText(`Ganho ${lastWinAmount.toFixed(2)}`, cx, cy);
        ctx.restore();
    }

    // Exibe a pontuação total animada no topo do canvas (mais acima)
    ctx.save();
    ctx.font = "bold 30px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#ffd700";
    ctx.fillStyle = "#fffbe7";
    ctx.shadowColor = "#ff9800";
    ctx.shadowBlur = 18;
    let scoreText = `CRÉDITOS: ${scoreDisplay.toFixed(2)}`;
    ctx.strokeText(scoreText, canvas.width / 2, 2); // <-- alterado de 18 para 2
    ctx.fillText(scoreText, canvas.width / 2, 2);
    ctx.restore();
}

function animateSpin(callback) {
    const { grid, symbols } = window.slotState;
    let frames = 15; // Reduzido para 15 frames
    bounceActive = true;
    bounceFrame = 0;

    if (pulseAnimationFrame) {
        cancelAnimationFrame(pulseAnimationFrame);
        pulseAnimationFrame = null;
        pulseActive = false;
        winningLine = null;
        lastWinCells = [];
    }

    let lastFrame = performance.now();
    const interval = 1000 / 60; // 60 FPS target

    function spinFrame(now) {
        if (now - lastFrame < interval) {
            requestAnimationFrame(spinFrame);
            return;
        }
        lastFrame = now;

        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                grid[r][c] = Math.floor(Math.random() * symbols.length);
            }
        }
        drawGrid(true);
        bounceFrame++;
        frames--;
        
        if (frames > 0) {
            requestAnimationFrame(spinFrame);
        } else {
            bounceActive = false;
            smoothStop(callback);
        }
    }
    requestAnimationFrame(spinFrame);
}

function smoothStop(callback) {
    const { grid, symbols } = window.slotState;
    let easeFrames = 10; // Reduzido de 15 para 10 frames
    let ease = 1;
    function easeFrame() {
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (Math.random() < ease) {
                    grid[r][c] = Math.floor(Math.random() * symbols.length);
                }
            }
        }
        drawGrid(true);
        ease *= 0.6; // Aumentado de 0.7 para 0.6 para parar mais rápido
        if (--easeFrames > 0) {
            requestAnimationFrame(easeFrame);
        } else {
            drawGrid();
            callback();
        }
    }
    easeFrame();
}

function checkWin() {
    const { grid, feedback, winSound, multiplierSound, symbols } = window.slotState;
    const first = grid[0][0];
    let allSame = true;
    for (let r = 0; r < 3; r++)
        for (let c = 0; c < 3; c++)
            if (grid[r][c] !== first) allSame = false;
    winningLine = null;
    lastWinCells = [];
    lastWinAmount = 0;
    if (allSame) {
        let symbolName = symbols[first].name;
        lastWinAmount = symbolValues[symbolName] * 9 * 10;
        score += lastWinAmount;
        scoreTarget = score;
        animateScore();
        lastWinCells = [
            [0,0],[0,1],[0,2],
            [1,0],[1,1],[1,2],
            [2,0],[2,1],[2,2]
        ];
        feedback.innerHTML = `<span style="color:#ffd700;font-weight:bold;">10x MULTIPLICADOR!</span>`;
        multiplierSound.currentTime = 0;
        multiplierSound.play();
        winningLine = { type: "all" };
        pulseWinningLine();
        explodeParticles();
    } else {
        let line = getWinningLine();
        if (line) {
            let cells = [];
            if (line.type === "row") {
                for (let c = 0; c < 3; c++) cells.push([line.idx, c]);
            } else if (line.type === "diag" && line.idx === 0) {
                for (let i = 0; i < 3; i++) cells.push([i, i]);
            } else if (line.type === "diag" && line.idx === 1) {
                for (let i = 0; i < 3; i++) cells.push([i, 2 - i]);
            }
            lastWinCells = cells;
            lastWinAmount = cells.reduce((sum, [r, c]) => sum + symbolValues[symbols[grid[r][c]].name], 0);
            score += lastWinAmount;
            scoreTarget = score;
            animateScore();
            feedback.innerHTML = `Você ganhou!`;
            winSound.currentTime = 0;
            winSound.play();
            winningLine = line;
            pulseWinningLine();
        } else {
            feedback.innerHTML = ``; // Remove a mensagem "Tente novamente"
        }
    }
}

// Retorna qual linha horizontal ou diagonal venceu (ou null)
function getWinningLine() {
    const { grid } = window.slotState;
    // Linhas horizontais
    for (let r = 0; r < 3; r++) {
        if (grid[r][0] === grid[r][1] && grid[r][1] === grid[r][2])
            return { type: "row", idx: r };
    }
    // Diagonal principal
    if (grid[0][0] === grid[1][1] && grid[1][1] === grid[2][2])
        return { type: "diag", idx: 0 };
    // Diagonal secundária
    if (grid[0][2] === grid[1][1] && grid[1][1] === grid[2][0])
        return { type: "diag", idx: 1 };
    return null;
}

function pulseWinningLine() {
    pulseActive = true;
    pulseFrame = 0;
    
    function pulseAnim() {
        pulseFrame++;
        drawGrid();
        
        pulseAnimationFrame = requestAnimationFrame(pulseAnim);
    }
    pulseAnim();
}

function explodeParticles() {
    particles = new Array(20).fill(null).map(() => ({  // Reduzido para 20 partículas
        x: 300 + Math.random() * 200 - 100,
        y: 300 + Math.random() * 200 - 100,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        size: 4 + Math.random() * 4,
        life: 1.0
    }));

    let lastFrame = performance.now();
    const interval = 1000 / 30; // 30 FPS é suficiente para partículas

    function partAnim(now) {
        if (now - lastFrame < interval) {
            requestAnimationFrame(partAnim);
            return;
        }
        lastFrame = now;

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;  // Morte mais rápida
        });
        particles = particles.filter(p => p.life > 0);
        drawGrid();
        
        if (particles.length > 0) {
            requestAnimationFrame(partAnim);
        }
    }
    requestAnimationFrame(partAnim);
}

// Animação do score subindo até o valor real
function animateScore() {
    if (scoreAnimFrame) cancelAnimationFrame(scoreAnimFrame);
    function step() {
        if (scoreDisplay < scoreTarget) {
            let diff = scoreTarget - scoreDisplay;
            scoreDisplay += Math.max(0.1, diff * 0.25); // Aumentado de 0.05/0.18 para 0.1/0.25
            if (scoreDisplay > scoreTarget) scoreDisplay = scoreTarget;
            drawGrid();
            scoreAnimFrame = requestAnimationFrame(step);
        } else {
            scoreDisplay = scoreTarget;
            drawGrid();
            scoreAnimFrame = null;
        }
    }
    step();
}

window.slotEffects = {
    drawGrid,
    animateSpin,
    checkWin,
    cacheSymbols
};
