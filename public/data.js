//GAME RENDERING VARIABLES
var knownData;
var self

const socket = io.connect("http://192.168.0.141:5000/");
var id
socket.on("connect", function() {
    id = socket.id
})

async function ajax(url) {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.addEventListener("load", function () {
            try {
                resolve(this.responseText);
            } catch (error) {
                reject(error);
            }
        });
        request.open("GET", url);
        request.send();
        request.addEventListener("error", reject)
    });
}

/** @returns {void} */
async function updateData() {
    //document.getElementById("random-number").innerText = await ajax("/random");
}

socket.on("gameupdate", data => {
    knownData = data;
    self = getSelf()
    updateMinimap()
    updateLeaderboard()
})

socket.on("loss", () => {
    menuStage = "loss"
})

