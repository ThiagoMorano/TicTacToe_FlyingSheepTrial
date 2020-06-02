let camera;
let scene;
let renderer;
let pointLight;
let ambientLight;


let playfield = []; // 3x3 Matrix, initialized with 0s for empty spaces
const empty = 0;
const playerMarker = 1;
const enemyMarker = 2;

const playfieldScale = 2.5;

let objectsInPlayfield = []; // Holds the 3D representations of the markers


let hasFinished = false;
let playerTurn = true;
let numberOfMovesTaken = 0;


init();
gameLoop();

function init() {
    //document.onkeydown = handleInput;
    document.addEventListener('mousedown', onMouseDown, false);

    // Scene setup
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    //camera = new THREE.OrthographicCamera( window.innerWidth / - 100, window.innerWidth / 100, window.innerHeight / 100, window.innerHeight / - 100, 1, 1000 );
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild(renderer.domElement);
    
    ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
    scene.add(ambientLight);

    pointLight = new THREE.PointLight(0xffffff);
    pointLight.position.set(-10, 15, 50);
    scene.add(pointLight);

    // Populate playfield with empty
    for(let i = 0; i<3; i++) {
        playfield[i] = [];
        for(let j = 0; j<3; j++) {
            playfield[i][j] = empty;
        }
    }
}


function gameLoop() {
    requestAnimationFrame(gameLoop);

    update();
    render();
}

function update() {
    if(!hasFinished && !playerTurn) {
        enemyMove();
    }

    for(let i = 0; i < objectsInPlayfield.length; i++) {
        objectsInPlayfield[i].update();
    }
}

function render() {
    renderer.render(scene,camera);
}

//#region Input & Marking Fields
function onMouseDown(event) {
    if(!hasFinished) {
            if(playerTurn) {
            let mouse= new THREE.Vector2();
            mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
            mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
            //console.log(`Click at (${mouse.x}, ${mouse.y})`);

            let positionSelected = validateClick(mouse);
            //console.log(`Selection at (${positionSelected.row}, ${positionSelected.column})`);
            if(positionSelected != null) {
                trySelectField(positionSelected.row, positionSelected.column, playerMarker);
            }
        }
    }
}

function validateClick(mouse) {
    let clickRadius = playfieldScale / 10;
    let row;
    let column;
    if(mouse.x < -clickRadius) {
        column = 0;
    } else if (mouse.x > clickRadius) {
        column = 2;
    } else {
        column = 1;
    }

    if(mouse.y < -clickRadius) {
        row = 2;
    } else if (mouse.y > clickRadius) {
        row  = 0;
    } else {
        row = 1;
    }
    return {row, column};
    //console.log(`Selection at (${row}, ${column})`);
}

function handleInput(keyEvent) {
    if(!hasFinished) {

        placeHolderInputHandler(keyEvent);
    }
    else {
        // restart();
    }    
}

function placeHolderInputHandler(keyEvent) {
    if(playerTurn) {
        if(keyEvent.keyCode == 49) { // 1
            trySelectField(0,0, playerMarker);
        }
        if(keyEvent.keyCode == 50) { // 2
            trySelectField(0,1, playerMarker);
        }
        if(keyEvent.keyCode == 51) { // 3
            trySelectField(0,2, playerMarker);
        }
        if(keyEvent.keyCode == 52) { // 4
            trySelectField(1,0, playerMarker);
        }
        if(keyEvent.keyCode == 53) { // 5
            trySelectField(1,1, playerMarker);
        }
        if(keyEvent.keyCode == 54) { // 6
            trySelectField(1,2, playerMarker);
        }
        if(keyEvent.keyCode == 55) { // 7
            trySelectField(2,0, playerMarker);
        }
        if(keyEvent.keyCode == 56) { // 8
            trySelectField(2,1, playerMarker);
        }
        if(keyEvent.keyCode == 57) { // 9
            trySelectField(2,2, playerMarker);
        }
    }
}

function enemyMove() {
    let row;
    let column;
    do {
        row = Math.floor((Math.random() * 3) + 0);
        column = Math.floor((Math.random() * 3) + 0);
        //console.log(`enemy on ${row}, ${column}`);
    } while (!trySelectField(row, column, enemyMarker));   
}

function trySelectField(row, column, marker) {
    if(isFieldEmpty(row, column)) {
        markField(row, column, marker);
        validMoveWasTaken();
        return true;
    }
    return false;
}

function isFieldEmpty(row, column) {
    return (playfield[row][column] == empty);
}

function markField(row, column, marker) {
    playfield[row][column] = marker;
    spawnObjectInPosition(row, column, marker);
}

function validMoveWasTaken() {
    //console.log(playfield);

    numberOfMovesTaken++;
    checkEndOfGame();
    playerTurn = !playerTurn;
    
    // if(!playerTurn) {
    //     enemyMove();
    // }
}

function spawnObjectInPosition(row, column, marker) {
    let newObject;
    if(marker == playerMarker) {
        newObject = new PlayerObject();
    }
    else {
        newObject = new EnemyObject();
    }

    newObject.mesh.position.x = -playfieldScale + column * playfieldScale; // -playfield, 0, playfield
    newObject.mesh.position.y = playfieldScale - row * playfieldScale;     // -playfield, 0, playfield
    objectsInPlayfield[objectsInPlayfield.length] = newObject;
    scene.add(newObject.mesh);
}

function PlayerObject() {
    geometry = new THREE.DodecahedronGeometry();
    material = new THREE.MeshLambertMaterial( {color: 0x5dbcd2});
    this.mesh = new THREE.Mesh(geometry, material);
    this.update = function() {
        this.mesh.rotation.x += 0.005;
        this.mesh.rotation.y += 0.005;
    }
}

function EnemyObject() {
    geometry = new THREE.DodecahedronGeometry();
    material = new THREE.MeshLambertMaterial( {color: 0xc7382e});
    this.mesh = new THREE.Mesh(geometry, material);
    this.update = function() {
        this.mesh.rotation.x -= 0.005;
        this.mesh.rotation.y -= 0.005;
    }
}

//#endregion Input & Marking Fields


//#region WinCon
function checkEndOfGame() {
    if(checkWinConditionFor(playerMarker)) {
        playerWins();
        hasFinished = true;
    }
    else if(checkWinConditionFor(enemyMarker)) {
        enemyWins();
        hasFinished = true;
    }
    else if (checkForDraw()) {
        gameDraw();
        hasFinished = true;
    }
}

function checkWinConditionFor(marker) {
    if(checkColumnCompletedWith(marker) ||
       checkRowCompletedWith(marker) ||
       checkDiagonalCompletedWith(marker)) {
           return true;
    }
    return false;
}

function checkColumnCompletedWith(value) {
    if((playfield[0][0] == value && playfield[1][0] == value && playfield[2][0] == value) ||
       (playfield[0][1] == value && playfield[1][1] == value && playfield[2][1] == value) ||
       (playfield[0][2] == value && playfield[1][2] == value && playfield[2][2] == value)) {
        return true;
    }
    return false;
}
function checkRowCompletedWith(value) {
    if((playfield[0][0] == value && playfield[0][1] == value && playfield[0][2] == value) ||
       (playfield[1][0] == value && playfield[1][1] == value && playfield[1][2] == value) ||
       (playfield[2][0] == value && playfield[2][1] == value && playfield[2][2] == value)) {
     return true;
    }
    return false;
}
function checkDiagonalCompletedWith(value) {
    if((playfield[0][0] == value && playfield[1][1] == value && playfield[2][2] == value) ||
       (playfield[0][2] == value && playfield[1][1] == value && playfield[2][0] == value)) {
     return true;
    }
    return false;
}

function checkForDraw() {
    return (numberOfMovesTaken >= 9);
}

function playerWins() {
    console.log("Player won");
}

function enemyWins() {
    console.log("Enemy won");
}

function gameDraw() {
    console.log("Draw");
}

//#endregion WinCon