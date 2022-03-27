var lossBackgroundIndex = 0;
var ffforward
var HSBFrameCount = 0
var minimap
var usernameInput
var activeElement = null
var menuStage = "main menu"
var cursorBlink = false
var xImage
var checkmarkImage

function setup() {
    createCanvas(window.innerWidth, window.innerHeight)
    ffforward = loadFont("/fonts/ffforward.ttf", function() {

    })
    minimap = createGraphics(300, 300)
    usernameInput = createInput("")
    xImage = loadImage("./images/x.png")
    checkmarkImage = loadImage("./images/checkmark.png")
}

const elementsData = {
    "usernameInput": {
        text: "Snake",
        type: "input",
        maxChars: 20,
        onInput: function(data) {
            socket.emit("namechange", data)
        }
    },
    "colorPickerName": {
        status: 0,
    }
}

function getSelf() {
    for(var i = 0; i != knownData.players.length; i++) {
        if(knownData.players[i].id == id) {
            return knownData.players[i]
        }
    }
    return null;
}

function draw() {
    HSBFrameCount = HSBFrameCount == 1000 ? 0 : HSBFrameCount + 1
    background("red")
    fill("black")
    rectMode(CENTER)
    rect(0, 0, 101 * 40, 101 * 40)
    renderApples()
    renderSnakes()
}

function windowResized() {
    resizeCanvas(window.innerWidth, window.innerHeight);
}

function renderMinimap() {
    camera.off()
    image(minimap, width - 325, 25)
    camera.on()
}

function renderUsername(name, color) {
    camera.off()
    colorMode(HSB, 1000)
    fill(color, 1000, 1000)
    textFont(ffforward)
    textSize(30)
    textAlign(LEFT, TOP)
    text(name, 10, 10)
    camera.on()
}

function getAllHeads() {
    var toReturn = []
    for(var i = 0; i != knownData.players.length; i++) {
        if(knownData.players[i].state == "play") {
            toReturn.push(knownData.players[i].blocks[knownData.players[i].blocks.length - 1])
        }
    }
    return toReturn
}

function updateMinimap() {
    minimap.stroke("white")
    minimap.strokeWeight(3)
    minimap.rectMode(CENTER)
    minimap.fill("black")
    minimap.rect(150, 150, 300, 300)
    var allHeads = getAllHeads()
    minimap.fill("yellow")
    minimap.noStroke()
    minimap.push()
    minimap.translate(150, 150)
    for(var i = 0; i != allHeads.length; i++) {
        minimap.circle(allHeads[i].x * 3, allHeads[i].y * 3, 10)
    }
    minimap.pop()
}

//Renders not only the snake but some gui and menu and loss menu
function renderSnakes() {
    if(knownData) {
        rectMode(CENTER)
        var playerState = "game";
        colorMode(HSB, 1000)
        for(var i = 0; i != knownData.players.length; i++) {
            switch(knownData.players[i].state) {
                case "play":
                    if(knownData.players[i].id == id) {
                        camera.position.x += (knownData.players[i].blocks[knownData.players[i].blocks.length - 1].x * 40 - camera.position.x) / 30
                        camera.position.y += (knownData.players[i].blocks[knownData.players[i].blocks.length - 1].y * 40 - camera.position.y) / 30
                    }
                    for(var e = 0; e != knownData.players[i].blocks.length; e++) {
                        if(e != knownData.players[i].blocks.length - 1) {
                            strokeWeight(knownData.players[i].spineSize)
                            stroke(knownData.players[i].spineColor, 1000, 700)
                            line(knownData.players[i].blocks[e].x * 40, knownData.players[i].blocks[e].y * 40, knownData.players[i].blocks[e + 1].x * 40, knownData.players[i].blocks[e + 1].y * 40)
                        }
                        
                        var block = knownData.players[i].blocks[e]
                        fill((e == knownData.players[i].blocks.length - 1 ? knownData.players[i].headColor : knownData.players[i].bodyColor), 1000, 1000);
                        strokeWeight(e == knownData.players[i].blocks.length - 1 ? 0 : 3)
                        rect(block.x * 40, block.y * 40, 30, 30)
                    }
                    if(knownData.players[i].id != id) {
                        fill(knownData.players[i].nameColor, 1000, 1000)
                        textAlign(CENTER, CENTER)
                        textFont(ffforward)
                        textSize(15)
                        var yText = knownData.players[i].direction == "down" ? (knownData.players[i].blocks[knownData.players[i].blocks.length - 1].y + 1) * 40 : (knownData.players[i].blocks[knownData.players[i].blocks.length - 1].y - 1) * 40
                        text(knownData.players[i].name, knownData.players[i].blocks[knownData.players[i].blocks.length - 1].x * 40, yText)
                    }
                    break;
                case "menu":
                    if(knownData.players[i].id == id) {
                        playerState = "menu";
                    }
                    break;
                default:
                    throw new Error("Wow! Why bad user state?")
            }
        }
        switch(playerState) {
            case "menu":
                switch(menuStage) {
                    case "main menu":
                        mainMenu()
                        break;
                    case "loss":
                        loss()
                        break;
                    case "color name change":
                        colorNameChange()
                        break;
                    default:
                        throw new Error("menu stage is bad: " + menuStage)
                }
                break;
            case "game":
                renderMinimap()
                colorMode(HSB, 1000)
                renderUsername(self.name, self.nameColor)
                break;
            default:
                throw new Error("Why is main state bad?" + playerState)
        }
    }
}

//You give a decimal and not a percentage, so it doesn't work the same way vw and vh work in css
function vw(value) {
    return width * value
}
function vh(value) {
    return height * value
}
function viewport(value) {
    return (height + width) / 2 * value
}

function renderApples() {
    if(knownData) {
        fill("red")
        stroke("black")
        strokeWeight(2)
        for(var i = 0; i != knownData.apples.length; i++) {
            circle(knownData.apples[i].x * 40, knownData.apples[i].y * 40, 30)
        }
    }
}

function inactiveHoverActive(inactive, hover, active, mouse, id) {
    inactive()
    if(mouse) {
        hover()
    }
    if(activeElement == id) {
        active()
    }
}

function keyPressed() {
    //Game
    if(self.state == "play") {
        switch(keyCode) {
            case 65:
                socket.emit("directionchange", "left")
                break;
            case 87:
                socket.emit("directionchange", "up")
                break;
            case 68:
                socket.emit("directionchange", "right")
                break;
            case 83:
                socket.emit("directionchange", "down")
                break;
            case 37:
                socket.emit("directionchange", "left")
                break;
            case 38:
                socket.emit("directionchange", "up")
                break;
            case 39:
                socket.emit("directionchange", "right")
                break;
            case 40:
                socket.emit("directionchange", "down")
                break;
        }
    }

    //UI
    //do stage
    if(self.state != "play") {
        if(menuStage == "main menu") {
            if(activeElement != null) {
                if(elementsData[activeElement].type == "input" && keyCode == BACKSPACE) {
                    elementsData[activeElement].text = elementsData[activeElement].text.slice(0, -1)
                    elementsData[activeElement].onInput(elementsData[activeElement].text)
                }
            }
        }
    }
}

function mouseOverRect(x, y, width, height, translateX = 0, translateY = 0, align = "center") {
    switch(align) {
        case "center":
            if(mouseX > x - width / 2 + translateX && mouseX < x + width / 2 + translateX && mouseY > y - height / 2 + translateY && mouseY < y + height / 2 + translateY) {
                return true
            }
            break;
        default:
            throw new Error("wrong align passed " + align)
    }
}

function mousePressed() {
    if(self.state != "play") {
        if(menuStage == "main menu") {
            if(mouseOverRect(0, -50, 500, 60, vw(0.5), vh(0.5))) {
                activeElement = "usernameInput"
            } else {
                activeElement = null
            }
            if(mouseOverRect(0, 50, 200, 60, vw(0.5), vh(0.5))) {
                socket.emit("gamestart")
            }
            if(mouseOverRect(295, -50, 60, 60, vw(0.5), vh(0.5))) {
                elementsData.colorPickerName.status = self.nameColor
                menuStage = "color name change"
            }
        } else if(menuStage == "color name change") {
            if(mouseOverRect(-100, 80, 150, 60, vw(0.5), vh(0.5))) {
                menuStage = "main menu"
            }
            if(mouseOverRect(100, 80, 150, 60, vw(0.5), vh(0.5))) {
                menuStage = "main menu"
                socket.emit("colornamechange", elementsData.colorPickerName.status)
            }
        } else if(menuStage == "loss") {
            if(mouseOverRect(0, 0, 300, 60, vw(0.5), vh(0.5))) {
                menuStage = "main menu"
            }
        }
    }
}

function setCursor() {
    if(self.state != "play") {
        if(cursorBlink) {
            strokeWeight(2)
            stroke("black")
        } else {
            noStroke()
        }
    }
}

function keyTyped() {
    if(self.state != "play") {
        if(menuStage == "main menu") {
            if(activeElement != null) {
                if(elementsData[activeElement].type == "input" && elementsData[activeElement].text.length < elementsData[activeElement].maxChars) {
                    elementsData[activeElement].text += key
                    elementsData[activeElement].onInput(elementsData[activeElement].text)
                }
            }
        }
    }
}

function loss() {
    camera.off()
    push()
        translate(vw(0.5), vh(0.5))
        colorMode(RGB)
        lossBackgroundIndex = lossBackgroundIndex < 20 ? lossBackgroundIndex + 0.2 : 20
        background(color(255, 255, 255, lossBackgroundIndex))
        if(lossBackgroundIndex == 20) {
            colorMode(HSB, 1000)
            fill(color(HSBFrameCount, 1000, 1000))
            textFont(ffforward)
            textSize(100)
            textAlign(CENTER, CENTER)
            text("Game Over!", 0, -130)
            mouseOverRect(0, 0, 300, 60, vw(0.5), vh(0.5)) ? fill("grey") : fill("dimgrey")
            rectMode(CENTER)
            noStroke()
            rect(0, 0, 300, 60)
            fill(color(HSBFrameCount, 1000, 1000))
            textSize(30)
            text("Back", 0, 5)
        }
    pop()
    camera.on()
}

function colorNameChange() {
    camera.off()
    push()
        //Setup
        translate(vw(0.5), vh(0.5))

        //Background
        colorMode(RGB)
        background(color(255, 255, 255, 20))

        //Title
        colorMode(HSB, 1000)
        fill(color(HSBFrameCount, 1000, 1000))
        textFont(ffforward)
        textSize(70)
        textAlign(CENTER, CENTER)
        text("Name Color", 0, -200)

        //Color Picker
        drawHSBColorRainbow(0, -100, 1000, 50)
        noStroke()
        fill("white")
        triangle(elementsData.colorPickerName.status - 500, -80, elementsData.colorPickerName.status - 20 - 500, -50, elementsData.colorPickerName.status + 20 - 500, -50)
        if(mouseIsPressed && mouseOverRect(0, -100, 1000, 50, vw(0.5), vh(0.5))) {
            elementsData.colorPickerName.status = (mouseX - (vw(0.5) - 500))
        }
        textSize(35)
        colorMode(HSB, 1000)
        fill(elementsData.colorPickerName.status, 1000, 1000)
        text("Preview", 0, 0)
        rectMode(CENTER)
        imageMode(CENTER)
        mouseOverRect(-100, 80, 150, 60, vw(0.5), vh(0.5)) ? fill("darkred") : fill("#630000")
        rect(-100, 80, 150, 60)
        image(xImage, -100, 80, 40, 40)
        mouseOverRect(100, 80, 150, 60, vw(0.5), vh(0.5)) ? fill("green") : fill("darkgreen") 
        rect(100, 80, 150, 60)
        image(checkmarkImage, 100, 80, 40, 40)
        
    pop()
    camera.on()
}

function mainMenu() {
    camera.off()
    push()
        //Setup
        translate(vw(0.5), vh(0.5))

        //Background
        colorMode(RGB)
        background(color(255, 255, 255, 20))

        //Title
        colorMode(HSB, 1000)
        fill(color(HSBFrameCount, 1000, 1000))
        textFont(ffforward)
        textSize(100)
        textAlign(CENTER, CENTER)
        text("Online Snake", 0, -200)

        //Input
        textSize(25)
        textAlign(LEFT, TOP)
        text("Username", -245, -115)
        inactiveHoverActive(function() {
            fill("dimgrey")
        }, function() {
            fill("grey")
        }, function() {
            fill("lightgrey")
        }, mouseOverRect(0, -50, 500, 60, vw(0.5), vh(0.5)), "usernameInput")
        rectMode(CENTER)
        rect(0, -50, 500, 60)
        noStroke()
        fill("black")
        textSize(30)
        text(elementsData.usernameInput.text, -240, -65)
        if(activeElement == "usernameInput") {
            setCursor()
            line(-240 + textWidth(elementsData.usernameInput.text), -70, -240 + textWidth(elementsData.usernameInput.text), -30)
        }

        noStroke()

        //Name Color Button
        mouseOverRect(295, -50, 60, 60, vw(0.5), vh(0.5)) ? fill("grey") : fill("dimgrey")
        rect(295, -50, 60, 60)
        fill(self.nameColor, 1000, 1000)
        rect(295, -50, 40, 40)

        //Play Button
        mouseOverRect(0, 50, 200, 60, vw(0.5), vh(0.5)) ? fill("grey") : fill("dimgrey")
        rect(0, 50, 200, 60)

        textSize(30)
        fill(color(HSBFrameCount, 1000, 1000))
        textAlign(CENTER, CENTER)
        text("Play", 0, 47)

    pop()
    camera.on()
}

setInterval(function() {
    cursorBlink = !cursorBlink;
}, 400)

function drawHSBColorRainbow(x, y, width, height) {
    colorMode(HSB, 1000)
    var size = width / 1000
    strokeWeight(size)
    for(var i = 0; i != 1000; i++) {
        stroke(color(i, 1500, 1500))
        line((x - width / 2) + (i * size), y - height / 2, (x - width / 2) + (i * size), y + height / 2)
    }
    return size;
}
