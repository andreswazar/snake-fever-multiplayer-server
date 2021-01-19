module.exports = {
    emitGreenAppleEaten: exportEmitGreenAppleEatenFunction
}

const { initializeGame, gameLoop, getDirection } = require("./game");
const { makeID } = require("./utility");

const io = require("socket.io")({
    cors: {
        origin: "*",
    }
});

const stateRooms = {};
const clientRooms = {};

io.on("connection", (client) => {

    client.emit("connectedSuccesfully");
    
    client.on("Movement", movementHandler);
    client.on("newGame", newGameHandler);
    client.on("joinGame", joinGameHandler);


    function newGameHandler() {
        let roomCode = makeID();
        clientRooms[client.id] = roomCode; // Maps client's ID to the room ID (room code)
        client.emit("gameCode", roomCode);

        stateRooms[roomCode] = initializeGame(); // Maps a room to a game state

        client.join(roomCode);
        client.number = 1;
        client.emit("playerNumberAssign", 1);
    }

    function joinGameHandler(roomCode) {
        const room = io.sockets.adapter.rooms.get(roomCode);

        let numClients = 0;
        if (room) {
            numClients = room.size;
        }

        // Check if lobby doesn't exist or if it's already full
        if (numClients === 0) {
            client.emit("unknownGame");
            return;
        } else if (numClients > 1) {
            client.emit("fullGame");
            return;
        }

        clientRooms[client.id] = roomCode; // Maps client's ID to the room ID (room code)

        client.join(roomCode);
        client.number = 2;
        client.emit("playerNumberAssign", 2);

        io.sockets.in(roomCode).emit("beginGame");
        startGameInterval(roomCode);
    }

    function movementHandler(keyCode) {
        const roomName = clientRooms[client.id]; // Checks if client is playing a game

        if (!roomName) { // If client isn't in a game then do nothing with the key press
            return;
        }

        try {
            keyCode = parseInt(keyCode);
        } catch (error) {
            console.error(error);
            return;
        }

        const direction = getDirection(keyCode, stateRooms[roomName].players[client.number - 1]);

        if (direction) {
            stateRooms[roomName].players[client.number - 1].direction = direction;
        }
    }
});

function startGameInterval(roomCode) {
    exportEmitGreenAppleEatenFunction(roomCode); // Exports a closure that contains the room code
    
    const intervalID = setInterval(() => {
        const gameOver = gameLoop(stateRooms[roomCode]);
        if (!gameOver) {
            emitGameState(roomCode, stateRooms[roomCode]);
        } else {
            emitGameOver(roomCode);
            clearInterval(intervalID);
        }
    }, 150);
}

function emitGameState(roomCode, gameState) { // Send game state to clients
    io.sockets.in(roomCode).emit("gameState", JSON.stringify(gameState));
}

function emitGameOver(roomCode) { // Tell clients that the game ended
    io.sockets.in(roomCode).emit("gameOver");
    clearRooms(roomCode);
    disconnectPlayers(roomCode);
}

function disconnectPlayers(roomCode) {
    for (let socket in io.sockets.in(roomCode).sockets)
    {
        socket.disconnect(true);
    }
}

function clearRooms(roomCode) {
    const room = io.sockets.adapter.rooms.get(roomCode);
    for (let client of room) {
        clientRooms[client] = null;
    }
    stateRooms[roomCode] = null;
}

function exportEmitGreenAppleEatenFunction(roomCode) {
    let emitGreenAppleEatenClosure = function() {
        io.sockets.in(roomCode).emit("greenAppleEaten");
    }

    module.exports.emitGreenAppleEaten = emitGreenAppleEatenClosure;
}

io.listen(3000);