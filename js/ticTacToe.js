let camera;
let scene;
let renderer;
let pointLight;
let ambientLight;
let fontLoader;
let textGameEnd;
// let ui;
// let uiRectangle;
// let uiText;


const markerGeometry = new THREE.DodecahedronGeometry();
const playerMarkerMaterial = new THREE.MeshLambertMaterial( {color: 0x5dbcd2});
const enemyMarkerMaterial = new THREE.MeshLambertMaterial( {color: 0xc7382e});

let playfield = []; // 3x3 Matrix, initialized with 0s for empty spaces
const empty = 0;
const playerMarker = 1;
const enemyMarker = 2;

const playfieldScale = 2.5;

let objectsInPlayfield = []; // Holds the 3D representations of the markers
let playfieldBarriers = [];

// Game state
// Set in startGame()
let hasFinished;
let playerTurn;
let numberOfMovesTaken;
let playerScore = 0;
let enemyScore = 0;

let hasPlayerWon = false;
let hasEnemyWon = false;
let defaultSpeed =  0.005;
let winSpeed = 0.015;
let loseSpeed = 0.0025;




init();
gameLoop();

function init() {
    //window.onkeydown = placeHolderInputHandler;
    window.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('resize', onResize);

    // Scene setup
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    //camera = new THREE.OrthographicCamera( window.innerWidth / - 100, window.innerWidth / 100, window.innerHeight / 100, window.innerHeight / - 100, 1, 1000 );
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild(renderer.domElement);

    // Lights
    ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
    scene.add(ambientLight);

    pointLight = new THREE.PointLight(0xffffff);
    pointLight.position.set(-10, 15, 50);
    scene.add(pointLight);

    // Playfield
    createPlayfieldBarriers();

    fontLoader =  new THREE.FontLoader();


    startGame();
    

    //createScoreUI();
    
}

// function createScoreUI() {
//     ui = new ThreeUI(renderer.domElement, 720);
//     uiRectangle = ui.createRectangle('#000000', 0, 0, 500, 100);
//     uiRectangle.alpha = 0;
//     uiRectangle.anchor.x = ThreeUI.anchors.center;
//     uiRectangle.anchor.y = ThreeUI.anchors.center;

//     // Add some text to the rectangle
//     uiText = ui.createText('Score', 40, 'Arial', 'white');
//     uiText.textAlign = 'center';
//     uiText.textBaseline = 'middle';
//     uiText.anchor.x = ThreeUI.anchors.center;
//     uiText.anchor.y = ThreeUI.anchors.center;

//     uiText.parent = uiRectangle;
//}

function startGame() {
    hasFinished = false;
    playerTurn = true;
    numberOfMovesTaken = 0; 
    hasPlayerWon = false;
    hasEnemyWon = false;

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
    //ui.render(renderer);
    renderer.render(scene,camera);
}

function onResize() {
    let width = window.innerWidth;
    let height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}

function createPlayfieldBarriers() {
    playfieldBarriers[0] = new PlayfieldBarrier();
    playfieldBarriers[0].mesh.scale.x = 0.01;
    playfieldBarriers[0].mesh.scale.y = 6;
    playfieldBarriers[0].mesh.position.x = -playfieldScale/2;
    playfieldBarriers[1] = new PlayfieldBarrier();
    playfieldBarriers[1].mesh.scale.x = 0.01;
    playfieldBarriers[1].mesh.scale.y = 6;
    playfieldBarriers[1].mesh.position.x = playfieldScale/2;
    playfieldBarriers[2] = new PlayfieldBarrier();
    playfieldBarriers[2].mesh.scale.x = 6;
    playfieldBarriers[2].mesh.scale.y = 0.01;
    playfieldBarriers[2].mesh.position.y = -playfieldScale/2;
    playfieldBarriers[3] = new PlayfieldBarrier();
    playfieldBarriers[3].mesh.scale.x = 6;
    playfieldBarriers[3].mesh.scale.y = 0.01;
    playfieldBarriers[3].mesh.position.y = playfieldScale/2;

    scene.add(playfieldBarriers[0].mesh);
    scene.add(playfieldBarriers[1].mesh);
    scene.add(playfieldBarriers[2].mesh);
    scene.add(playfieldBarriers[3].mesh);
}

function PlayfieldBarrier() {
    geometry = new THREE.CubeGeometry();
    material = new THREE.MeshLambertMaterial( {color: 0xf0f0f0});
    this.mesh = new THREE.Mesh(geometry, material);
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
    } else {
        restartGame();
    }
}

function validateClick(mouse) {
    // Here I went with the first solution that came to mind after playing around with the event clicks.
    // However, it for sure doesn't look that great. How would this be done in a better way?
    let clickRadiusVertical = playfieldScale / 8;
    let clickRadiusHorizontal = playfieldScale / 12;
    let row;
    let column;
    if(mouse.x < -clickRadiusHorizontal) {
        column = 0;
    } else if (mouse.x > clickRadiusHorizontal) {
        column = 2;
    } else {
        column = 1;
    }

    if(mouse.y < -clickRadiusVertical) {
        row = 2;
    } else if (mouse.y > clickRadiusVertical) {
        row  = 0;
    } else {
        row = 1;
    }
    return {row, column};
    //console.log(`Selection at (${row}, ${column})`);
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
    this.mesh = new THREE.Mesh(markerGeometry, playerMarkerMaterial);
    this.update = function() {
        if(hasPlayerWon) {
            this.mesh.rotation.x += winSpeed;
            this.mesh.rotation.y += winSpeed;
        } else if(hasEnemyWon) {
            this.mesh.rotation.x -= loseSpeed;
            this.mesh.rotation.y -= loseSpeed;
        } else {
            this.mesh.rotation.x += defaultSpeed;
            this.mesh.rotation.y += defaultSpeed;
        }        
    }
}

function EnemyObject() {
    this.mesh = new THREE.Mesh(markerGeometry, enemyMarkerMaterial);
    this.update = function() {
        if(hasEnemyWon) {
            this.mesh.rotation.x -= winSpeed;
            this.mesh.rotation.y -= winSpeed;
        } else if(hasPlayerWon) {
            this.mesh.rotation.x += loseSpeed;
            this.mesh.rotation.y += loseSpeed;
        } else {
            this.mesh.rotation.x -= defaultSpeed;
            this.mesh.rotation.y -= defaultSpeed;
        }    
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
    playerScore++;
    hasPlayerWon = true;
    console.log(`Player won, score ${playerScore} x ${enemyScore}`);

    fontLoader.load('fonts/helvetiker_regular.typeface.json', function ( font ) {
        let textGeometry = new THREE.TextGeometry( "WIN", {
            font: font,
            size: 15,
            height: 5,
            curveSegments: 16,
            bevelEnabled: true,
            bevelThickness: 1,
            bevelSize: 1,
            bevelOffset: 0,
            bevelSegments: 1
        });
      
        let textMaterial = new THREE.MeshPhongMaterial( 
          { color: 0xffffff, specular: 0xffffff }
        );
      
        textGameEnd = new THREE.Mesh( textGeometry, textMaterial );
        textGameEnd.position.x = -2;
        textGameEnd.position.y = -0.5;
        textGameEnd.position.z = 1;

        textGameEnd.scale.x = 0.1;
        textGameEnd.scale.y = 0.1;
        textGameEnd.scale.z = 0.1;
        scene.add( textGameEnd );
      });
}

function enemyWins() {
    enemyScore++;
    hasEnemyWon = true;
    console.log(`Enemy won, score ${playerScore} x ${enemyScore}`);

    fontLoader.load('fonts/helvetiker_regular.typeface.json', function ( font ) {
        let textGeometry = new THREE.TextGeometry( "LOSE", {
            font: font,
            size: 10,
            height: 5,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 1,
            bevelSize: 1,
            bevelOffset: 0,
            bevelSegments: 1
        });
      
        let textMaterial = new THREE.MeshPhongMaterial( 
          { color: 0xffffff, specular: 0xffffff }
        );
      
        textGameEnd = new THREE.Mesh( textGeometry, textMaterial );
        textGameEnd.position.x = -1.7;
        textGameEnd.position.y = 0;
        textGameEnd.position.z = 1;

        textGameEnd.scale.x = 0.1;
        textGameEnd.scale.y = 0.1;
        textGameEnd.scale.z = 0.1;
        scene.add( textGameEnd );
      });
}

function gameDraw() {
    console.log(`Draw,  score ${playerScore} x ${enemyScore}`);
    fontLoader.load('fonts/helvetiker_regular.typeface.json', function ( font ) {
        let textGeometry = new THREE.TextGeometry( "DRAW", {
            font: font,
            size: 10,
            height: 5,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 1,
            bevelSize: 1,
            bevelOffset: 0,
            bevelSegments: 1
        });
      
        let textMaterial = new THREE.MeshPhongMaterial( 
          { color: 0xffffff, specular: 0xffffff }
        );
      
        textGameEnd = new THREE.Mesh( textGeometry, textMaterial );
        textGameEnd.position.x = -1.9;
        textGameEnd.position.y = 0;
        textGameEnd.position.z = 1;

        textGameEnd.scale.x = 0.1;
        textGameEnd.scale.y = 0.1;
        textGameEnd.scale.z = 0.1;
        scene.add( textGameEnd );
      });
}

function restartGame() {
    // Is this enough to dispose the objects?
    for(let i = 0; i<objectsInPlayfield.length; i++) {
        scene.remove(objectsInPlayfield[i].mesh);
    }
    objectsInPlayfield = [];

    scene.remove(textGameEnd);

    startGame();
}

//#endregion WinCon


function placeHolderInputHandler(keyEvent) {
    if(!hasFinished) {
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
    else {
        // restart();
    }    
}
