const express = require('express');
const app = express();
app.use(express.static('public'));
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
app.get('/', (req, res) => {
    res.sendFile('index.html');
});
app.get('/players', (req, res) => {
    res.send(playersArray());
});
app.get('/blocks', (req, res) => {
    res.send(getAllBlocks());
});
server.listen(process.env.PORT || 5000, () => {
    console.log('listening on http://192.168.0.141:5000/');
});

function random() {
    switch(arguments.length) {
        case 2:
            return Math.floor(Math.random() * (arguments[1] - arguments[0] + 1) + arguments[0])
        case 0:
            return Math.random()
        default: 
            throw new Error("Bad parameters for random")
    }
}
function playersArray() {
    return Object.values(players)
}
function getAllBlocks() {
    var toReturn = []
    var allPlayers = playersArray()
    for(var i = 0; i != allPlayers.length; i++) {
        if(allPlayers[i].state == "play") {
            toReturn = toReturn.concat(allPlayers[i].blocks.slice(0, -1))
        }
    }
    return toReturn
}

//Game code
var players = {}
var apples = []
for(var i = 0; i != 50; i++) {
    apples.push({
        x: random(-50, 50),
        y: random(-50, 50)
    })
}

function generateBlocks() {
    var randomHeadLocationX = random(-40, 40);
    var randomHeadLocationY = random(-40, 40);
    return [
        {x: randomHeadLocationX + 2, y: randomHeadLocationY, type: "body"},
        {x: randomHeadLocationX + 1, y: randomHeadLocationY, type: "body"},
        {x: randomHeadLocationX, y: randomHeadLocationY, type: "head"}
    ]
}

io.on("connection", socket => {
    players[socket.id] = {
        blocks: generateBlocks(),
        spineSize: 20,
        spineColor: 400,
        bodyColor: 100,
        headColor: 0,
        id: socket.id,
        direction: "left",
        directionAlreadyChanged: false,
        state: "menu",
        name: "Snake",
        nameColor: 0,
    }
    socket.on("disconnect", function () {
        delete players[socket.id]
    })
    socket.on("directionchange", data => {
        if(["left", "down", "up", "right"].indexOf(data) != -1 && !players[socket.id].directionAlreadyChanged) {
            switch(data) {
                case "left":
                    if(players[socket.id].direction != "right" && players[socket.id].direction != "left") {
                        players[socket.id].direction = data
                        players[socket.id].directionAlreadyChanged = true
                    }
                    
                    break;
                case "right":
                    if(players[socket.id].direction != "left" && players[socket.id].direction != "right") {
                        players[socket.id].direction = data
                        players[socket.id].directionAlreadyChanged = true
                    }
                    
                    break;
                case "up":
                    if(players[socket.id].direction != "down" && players[socket.id].direction != "up") {
                        players[socket.id].direction = data
                        players[socket.id].directionAlreadyChanged = true
                    }
                    
                    break;
                case "down":
                    if(players[socket.id].direction != "up" && players[socket.id].direction != "down") {
                        players[socket.id].direction = data
                        players[socket.id].directionAlreadyChanged = true
                    }

                    break;
            }
        }
    })
    socket.on("namechange", data => {
        if(players[socket.id].state != "play") {
            players[socket.id].name = data
        }
    })
    socket.on("colornamechange", data => {
        if(players[socket.id].state != "play") {
            players[socket.id].nameColor = data
        }
        
    })
    socket.on("gamestart", () => {
        players[socket.id].blocks = generateBlocks()
        players[socket.id].state = "play"
    })
});


//Update
setInterval(function() {
    var blocksWithIds = getAllBlocks()
    for(var i = 0; i != playersArray().length; i++) {
        var id = playersArray()[i].id

        //GAME UPDATE {
        if(players[id].state == "play") {
            //Apples
            var eatenApple = false;
            for(var t = 0; t != apples.length; t++) {
                var lastBlock = players[id].blocks[players[id].blocks.length - 1]
                if(lastBlock.x == apples[t].x && lastBlock.y == apples[t].y) {
                    eatenApple = true
                    apples[t].x = random(-50, 50)
                    apples[t].y = random(-50, 50)
                    break
                }
                
            }

            
            var firstBlock = JSON.parse(JSON.stringify(players[id].blocks[0]))
            
            for(var t = 0; t != players[id].blocks.length; t++) {
                //Moving
                if(t == players[id].blocks.length - 1) {
                    switch(players[id].direction) {
                        case "left":
                            players[id].blocks[t].x--;
                            break;
                        case "right":
                            players[id].blocks[t].x++;
                            break;
                        case "up":
                            players[id].blocks[t].y--;
                            break;
                        case "down":
                            players[id].blocks[t].y++;
                            break;
                        default:
                            throw new Error("wrong direction")
                    }
                } else {
                    players[id].blocks[t].x = players[id].blocks[t + 1].x
                    players[id].blocks[t].y = players[id].blocks[t + 1].y
                }
            }
            if(eatenApple) {
                players[id].blocks.unshift(firstBlock)
            }
            var head = players[id].blocks[players[id].blocks.length - 1]
            for(var t = 0; t != blocksWithIds.length; t++) {
                if((head.x == blocksWithIds[t].x && head.y == blocksWithIds[t].y) || (head.x < -50 || head.x > 50 || head.y < -50 || head.y > 50)) {
                    io.to(id).emit("loss");
                    players[id].state = "menu"
                }
            }

            players[id].directionAlreadyChanged = false
        }
    }
    //GAME UPDATE }
    io.sockets.emit("gameupdate", {
        players: playersArray(),
        apples: apples,
    })
}, 200)
