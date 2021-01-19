module.exports = {
    initializeGame,
    gameLoop,
    getDirection
}

let server = require("./server.js");

// Board variables
const boardSize = 640;
const tileSize = 16;

function initializeGame() { // Returns an initial state with a random food location
    const gameState = createGameState();
    generateGreenApple(gameState);
    return gameState;
}

function createGameState() {
    return {
        players: [{
            direction: {
                x: 1,
                y: 0,
            },
            body: [
                {x: 64, y: 64},
            ],
            lastDirectionCode: 39,
        }, {
            direction: {
                x: -1,
                y: 0,
            },
            body: [
                {x: 576, y: 576},
            ],
            lastDirectionCode: 37,
        }],
        greenApple: {},
    };
}

function gameLoop(gameState) {
    if (!gameState) {
        return;
    }

    for (let player of gameState.players)
    {
        moveSnakeHead(player);
        moveSnakeBody(player);
        checkForGreenAppleConsumption(gameState, player);
        if (checkForGameOver(player)) {
            return true; // Lets server know that the game is over
        }
    }

    return false;
}

function generateGreenApple(gameState) {

    // If the position clashes with the position of another entity, continue the loop until an unique position is generated
    whileLoop: while (true) { 
        greenApple = {
            x: Math.floor((Math.random() * boardSize / tileSize)) * tileSize,
            y: Math.floor((Math.random() * boardSize / tileSize)) * tileSize,
        }

        for (let player of gameState.players) {
            for (let block of player.body) {
                if (greenApple.x == block.x && greenApple.y == block.y) {
                    continue whileLoop;
                }
            }      
        }

        // for (let i = 0; i < obstacles.length; i++) {
        //     if (positionX == obstacles[i].x && positionY == obstacles[i].y) {
        //         continue whileLoop;
        //     }
        // }

        // for (let i = 0; i < redApples.length; i++) {
        //     if (positionX == redApples[i].x && positionY == redApples[i].y) {
        //         continue whileLoop;
        //     }
        // }
        
        break;
    } 

    gameState.greenApple = greenApple;
}

// Snake movement variables
let previousPosition = {
    x: 0,
    y: 0
};

function moveSnakeHead(player) {
    previousPosition = { ...player.body[0] };

    player.body[0].x += player.direction.x * tileSize;
    player.body[0].y += player.direction.y * tileSize;

    player.lastDirectionCode = player.direction.code; // Prevents 180 degree turns
}

function moveSnakeBody(player) {
    let previousX = 0;
    let previousY = 0;
        
    for (let i = 1; i <= player.body.length - 1; i++ ) {
        previousX = previousPosition.x;
        previousY = previousPosition.y;
        previousPosition.x = player.body[i].x;
        previousPosition.y = player.body[i].y;

        player.body[i].x = previousX;
        player.body[i].y = previousY;
    } // After this loop finishes, previousPosition will point to an empty cell behind the snake
}

function checkForGreenAppleConsumption(gameState, player) {
    
    if (gameState.greenApple.x === player.body[0].x && gameState.greenApple.y === player.body[0].y) {
        player.body.push({ ...previousPosition });

        server.emitGreenAppleEaten();
        generateGreenApple(gameState); // Generates new food location
    }
}

function checkForGameOver(player) {
    // Check for off-screen death
    if (player.body[0].x < 0 || player.body[0].x > boardSize || player.body[0].y < 0 || player.body[0].y > boardSize) {
        return true;
    } 

    // Check for snake crashing against itself
    for (let i = 1; i < player.body.length; i++) {
        if (player.body[i].x === player.body[0].x && player.body[i].y === player.body[0].y) {
            return true;
        }
    }

    return false;
}

// Direction Variables
let newDirection = {}; // Prevents 180 degree turns

function getDirection(keyCode, player) {
    switch (keyCode) {
        case 37: { // left
            if (player.lastDirectionCode != 39) {
                newDirection = { x: -1, y: 0, code: keyCode };
            }
        }
        break;
        case 38: { // down
            if (player.lastDirectionCode != 40) {
                newDirection = { x: 0, y: -1, code: keyCode };
            }
        }
        break;
        case 39: { // right
            if (player.lastDirectionCode != 37) {
                newDirection = { x: 1, y: 0, code: keyCode };
            }
        }
        break;
        case 40: { // up
            if (player.lastDirectionCode != 38) {
                newDirection = { x: 0, y: 1, code: keyCode };
            }
        }
        break;
    }

    return newDirection;
}