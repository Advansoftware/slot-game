const canvas = document.getElementById('slot-canvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spin-btn');
const feedback = document.getElementById('feedback');
const spinSound = document.getElementById('spin-sound');
const winSound = document.getElementById('win-sound');
const multiplierSound = document.getElementById('multiplier-sound');
const spriteSheet = document.getElementById('sprite-sheet');

// Ajuste conforme o tamanho real de cada célula do sprite
const SYMBOL_SIZE_X = 373; // largura de cada célula (1120/3)
const SYMBOL_SIZE_Y = 560; // altura de cada célula (1120/2)
const DEST_SIZE_X = 150;   // largura de exibição
const DEST_SIZE_Y = Math.round(DEST_SIZE_X * (SYMBOL_SIZE_Y / SYMBOL_SIZE_X)); // mantém proporção

// Mapeamento dos símbolos no sprite (coluna, linha)
const symbols = [
    { name: 'tiger',   sx: 0, sy: 0 }, // coluna 0, linha 0
    { name: 'rabbitW', sx: 1, sy: 0 }, // coluna 1, linha 0
    { name: 'rabbitG', sx: 2, sy: 0 }, // coluna 2, linha 0
    { name: 'diamond', sx: 0, sy: 1 }, // coluna 0, linha 1
    { name: 'wild',    sx: 1, sy: 1 }, // coluna 1, linha 1
    { name: 'bell',    sx: 2, sy: 1 }  // coluna 2, linha 1
    // Adicione mais se houver mais símbolos no sprite
];

// Estado do slot: inicializa com todos os símbolos
let grid = [
    [0, 1, 2],
    [3, 4, 5],
    [0, 1, 2]
];
let spinning = false;

// Inicialização: aguarda o carregamento do sprite e do slotEffects
function initSlot() {
    if (!window.slotEffects) {
        setTimeout(initSlot, 50);
        return;
    }

    // Função para redimensionar o canvas
    function resizeCanvas() {
        const maxWidth = Math.min(600, window.innerWidth - 20);
        const maxHeight = Math.min(600, window.innerHeight * 0.8);
        const scale = Math.min(maxWidth / 600, maxHeight / 600);
        
        canvas.style.width = `${600 * scale}px`;
        canvas.style.height = `${600 * scale}px`;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Garante que a sprite sheet está carregada antes de iniciar
    if (!spriteSheet.complete) {
        spriteSheet.onload = () => {
            window.slotEffects.cacheSymbols(); // Adiciona chamada para cache
            window.slotEffects.drawGrid();
        };
    } else {
        window.slotEffects.cacheSymbols(); // Adiciona chamada para cache
        window.slotEffects.drawGrid();
    }

    spinBtn.onclick = () => {
        if (spinning) return;
        spinning = true;
        feedback.textContent = '';
        spinSound.currentTime = 0;
        spinSound.play();
        window.slotEffects.animateSpin(() => {
            spinning = false;
            window.slotEffects.checkWin();
        });
    };
}

// Move a exportação do state para depois da inicialização
window.slotState = {
    canvas, ctx, spinBtn, feedback,
    spinSound, winSound, multiplierSound, spriteSheet,
    SYMBOL_SIZE_X, SYMBOL_SIZE_Y, 
    DEST_SIZE_X, DEST_SIZE_Y,
    symbols, grid
};

initSlot();