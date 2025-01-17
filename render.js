const canvas = document.getElementById('isometricCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let tileWidth = 40;
let tileHeight = 20;

let offsetX = canvas.width / 2;
let offsetY = tileHeight * 2;
let isDragging = false;
let startDragX = 0;
let startDragY = 0;
let zoomFactor = 1;
let rotationAngle = 0; // Rotation angle in radians
const fixedGridSize = 50; // Number of tiles to display
let isPlaying = false;
let stepInterval;
let stepCount = 0; // To keep track of steps


// Example cube data
function generateRandomColor() {
    const randomHex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
    return `#${randomHex()}${randomHex()}${randomHex()}`;
}

function generateRandomCubes(numCubes, min, max) {
    const getRandomCoordinate = () => Math.floor(Math.random() * (max - min) + min);

    let cubes = [];
    for (let i = 0; i < numCubes; i++) {
        cubes.push({
            x: getRandomCoordinate(),
            y: getRandomCoordinate(),
            z: 0,
            color: '#2ecc71'//generateRandomColor()
        });
    }

    return cubes;
}

// Generate 10 random cubes within range [-5, 5] for coordinates
let state = generateRandomCubes(10, -5, 5);

// let state = [
//     { x: 0, y: 0, z: 0, color: '#3498db' },
//     { x: 1, y: 0, z: 0, color: '#2ecc71' },
//     { x: 2, y: 0, z: 0, color: '#e74c3c' },
//     { x: 3, y: 0, z: 0, color: '#9b59b6' },
//     { x: 4, y: 0, z: 0, color: '#f1c40f' },
//     { x: 0, y: 0, z: 1, color: '#3498db' },
//     { x: 0, y: 1, z: 0, color: '#2ecc71' },
//     { x: 0, y: 2, z: 0, color: '#e74c3c' },
//     { x: 0, y: 3, z: 0, color: '#9b59b6' },
//     { x: 0, y: 4, z: 0, color: '#f1c40f' },
// ];


// Function to rotate a point around the origin
function rotatePoint(x, y, angle) {
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    return {
        x: x * cosAngle - y * sinAngle,
        y: x * sinAngle + y * cosAngle
    };
}

// Function to draw an isometric tile
function drawTile(x, y, color) {
    const scaledTileWidth = tileWidth * zoomFactor;
    const scaledTileHeight = tileHeight * zoomFactor;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + scaledTileWidth / 2, y + scaledTileHeight / 2);
    ctx.lineTo(x, y + scaledTileHeight);
    ctx.lineTo(x - scaledTileWidth / 2, y + scaledTileHeight / 2);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#34495e';
    ctx.stroke();
}

// Function to calculate shading based on rotation
function getShadedColors(baseColor, rotation) {
    const rightShade = lightenColor(baseColor, 0.2);
    const leftShade = lightenColor(baseColor, -0.2);
    const topShade = lightenColor(baseColor, 0.0);

    // Adjust shading based on rotation
    const shades = [topShade, leftShade, rightShade];
    const rotationIndex = Math.floor(((rotation / (Math.PI * 2)) % 1) * 3);
    return {
        top: shades[(0 + rotationIndex) % 3],
        left: shades[(1 + rotationIndex) % 3],
        right: shades[(2 + rotationIndex) % 3],
    };
}

// Function to draw an isometric cube
function drawCube(centerX, centerY, Z, color) {
    const scaledTileWidth = tileWidth * zoomFactor;
    const scaledTileHeight = tileHeight * zoomFactor;

    const { top, left, right } = getShadedColors(color, rotationAngle);

    // Top face
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + scaledTileWidth / 2, centerY + scaledTileHeight / 2);
    ctx.lineTo(centerX, centerY + scaledTileHeight);
    ctx.lineTo(centerX - scaledTileWidth / 2, centerY + scaledTileHeight / 2);
    ctx.closePath();
    ctx.fillStyle = top;
    ctx.fill();
    ctx.stroke();

    // Left face
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + scaledTileHeight);
    ctx.lineTo(centerX - scaledTileWidth / 2, centerY + scaledTileHeight / 2);
    ctx.lineTo(centerX - scaledTileWidth / 2, centerY + scaledTileHeight * 1.5);
    ctx.lineTo(centerX, centerY + scaledTileHeight * 2);
    ctx.closePath();
    ctx.fillStyle = left;
    ctx.fill();
    ctx.stroke();

    // Right face
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + scaledTileHeight);
    ctx.lineTo(centerX + scaledTileWidth / 2, centerY + scaledTileHeight / 2);
    ctx.lineTo(centerX + scaledTileWidth / 2, centerY + scaledTileHeight * 1.5);
    ctx.lineTo(centerX, centerY + scaledTileHeight * 2);
    ctx.closePath();
    ctx.fillStyle = right;
    ctx.fill();
    ctx.stroke();

    if (Z < 0.0) {
        // Grid Lines
        ctx.beginPath();
        ctx.lineTo(centerX, centerY + scaledTileHeight);
        ctx.lineTo(centerX - scaledTileWidth / 2, centerY + scaledTileHeight * 1.5);
        ctx.lineTo(centerX, centerY + scaledTileHeight * 2);
        ctx.lineTo(centerX + scaledTileWidth / 2, centerY + scaledTileHeight * 1.5);
        ctx.closePath();
        ctx.stroke();
    }
}

// Utility function to lighten or darken a color
function lightenColor(color, amount) {
    const usePound = color[0] === "#";
    let num = parseInt(color.slice(1), 16);
    let r = (num >> 16) + amount * 255;
    let g = ((num >> 8) & 0x00ff) + amount * 255;
    let b = (num & 0x0000ff) + amount * 255;

    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));

    return (usePound ? "#" : "") + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Function to draw the tile floor
function drawFloor() {
    const scaledTileWidth = tileWidth * zoomFactor;
    const scaledTileHeight = tileHeight * zoomFactor;

    const cols = fixedGridSize;
    const rows = fixedGridSize;

    for (let row = -rows; row <= rows; row++) {
        for (let col = -cols; col <= cols; col++) {
            const rotated = rotatePoint(col, row, rotationAngle);
            const x = offsetX + (rotated.x - rotated.y) * (scaledTileWidth / 2);
            const y = offsetY + (rotated.x + rotated.y) * (scaledTileHeight / 2);
            drawTile(x, y, '#bdc3c7');
        }
    }
}

// Function to draw compass
function drawCompass() {
    const compassSize = 60;
    const compassX = canvas.width - 80;
    const compassY = 80;

    ctx.save();
    ctx.translate(compassX, compassY);
    ctx.rotate(rotationAngle + (Math.PI/4));

    // Draw compass circle
    ctx.beginPath();
    ctx.arc(0, 0, compassSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#000000";
    ctx.stroke();

    // Draw compass arrows
    ctx.beginPath();
    ctx.moveTo(0, -compassSize / 2);
    ctx.lineTo(10, -compassSize / 2 + 15);
    ctx.lineTo(-10, -compassSize / 2 + 15);
    ctx.closePath();
    ctx.fillStyle = "#e74c3c"; // North arrow
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, compassSize / 2);
    ctx.lineTo(10, compassSize / 2 - 15);
    ctx.lineTo(-10, compassSize / 2 - 15);
    ctx.closePath();
    ctx.fillStyle = "#34495e"; // South arrow
    ctx.fill();

    ctx.restore();
}

// Function to draw origin line
function drawOriginLines() {
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY+1.5*(tileHeight * zoomFactor));
    ctx.lineTo(offsetX, offsetY+1.5*(tileHeight * zoomFactor)-10);
    ctx.strokeStyle = "#e74c3c"; // Red color
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.strokeStyle = '#34495e'; // Reset color
}

// Function to render cubes based on 3D locations
function renderCubes(cubes) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the floor first
    drawFloor();

    // Sort cubes by height (z) to draw the lowest first
    cubes.sort((a, b) => {
        if (a.x !== b.x) {
            if ((Math.trunc(Math.sin(rotationAngle)) + Math.trunc(Math.cos(rotationAngle))) == 1) {
                return a.x - b.x; // Sort by x
            } else {
                return b.x - a.x; // Sort by x
            }
        } else if (a.y !== b.y) {
            if ((Math.trunc(Math.sin(rotationAngle)) + Math.trunc(Math.cos(rotationAngle))) == 1) {
                if ((Math.trunc(Math.sin(rotationAngle))  == 0)) {
                    return a.y - b.y;
                } else {
                    return b.y - a.y;
                }
            } else {
                if ((Math.trunc(Math.sin(rotationAngle))  == 0)) {
                    return b.y - a.y;
                } else {
                    return a.y - b.y;
                }
            }
        }
        return a.z - b.z; // Sort by z if both x and y are equal
    });

    // Sort cubes by height (z) to draw the lowest first
    cubes.sort((a, b) => a.z - b.z);

    const scaledTileWidth = tileWidth * zoomFactor;
    const scaledTileHeight = tileHeight * zoomFactor;

    for (const cube of cubes) {
        const rotated = rotatePoint(cube.x, cube.y, rotationAngle);
        const centerX = offsetX + (rotated.x - rotated.y) * (scaledTileWidth / 2);
        const centerY = offsetY + (rotated.x + rotated.y) * (scaledTileHeight / 2) - cube.z * scaledTileHeight;
        const Z = cube.z;
        let cubeColor = cube.color;
        if (cube.z < 0) {
            cubeColor = lightenColor(cube.color, -0.5); // Darken the color for cubes below the floor
        }
        drawCube(centerX, centerY, Z, cubeColor);
    }

    // Display step count in the top right corner
    ctx.font = "20px Arial";
    ctx.fillStyle = "#000000";
    ctx.fillText(`Step: ${stepCount}`, canvas.width - 100, 30);
    ctx.fillText(`Direction: [${Math.trunc(Math.sin(rotationAngle))}, ${Math.trunc(Math.cos(rotationAngle))}]`, canvas.width - 275, 30);

    // Draw compass
    drawCompass();

    // Draw the origin line
    drawOriginLines();
}

// Function to update cube data
function updateState() {
    stepCount++;
    state = step(state);
    renderCubes(state);
}

// Mouse events for panning
canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    startDragX = e.clientX;
    startDragY = e.clientY;
    canvas.style.cursor = 'grabbing';
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const dx = e.clientX - startDragX;
        const dy = e.clientY - startDragY;
        startDragX = e.clientX;
        startDragY = e.clientY;
        offsetX += dx;
        offsetY += dy;
        renderCubes(state);
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
    canvas.style.cursor = 'grab';
});

canvas.addEventListener('mouseleave', () => {
    isDragging = false;
    canvas.style.cursor = 'grab';
});

// Buttons for zooming, rotation, play, and pause
const zoomInButton = document.createElement('button');
const zoomOutButton = document.createElement('button');
const rotateClockwiseButton = document.createElement('button');
const rotateCounterClockwiseButton = document.createElement('button');
const playButton = document.createElement('button');
const pauseButton = document.createElement('button');
const resetButton = document.createElement('button');

zoomInButton.textContent = 'Zoom In';
zoomOutButton.textContent = 'Zoom Out';
rotateClockwiseButton.textContent = 'Rotate Clockwise';
rotateCounterClockwiseButton.textContent = 'Rotate Counter Clockwise';
playButton.textContent = 'Play';
pauseButton.textContent = 'Pause';
resetButton.textContent = 'Reset';

zoomInButton.style.position = zoomOutButton.style.position = rotateClockwiseButton.style.position = rotateCounterClockwiseButton.style.position = playButton.style.position = pauseButton.style.position = resetButton.style.position =  'absolute';
zoomInButton.style.top = '10px';
zoomInButton.style.left = '10px';
zoomOutButton.style.top = '50px';
zoomOutButton.style.left = '10px';
rotateClockwiseButton.style.top = '90px';
rotateClockwiseButton.style.left = '10px';
rotateCounterClockwiseButton.style.top = '130px';
rotateCounterClockwiseButton.style.left = '10px';
playButton.style.top = '170px';
playButton.style.left = '10px';
pauseButton.style.top = '210px';
pauseButton.style.left = '10px';
resetButton.style.top = '250px';
resetButton.style.left = '10px';

[zoomInButton, zoomOutButton, rotateClockwiseButton, rotateCounterClockwiseButton, playButton, pauseButton, resetButton].forEach(button => {
    button.style.padding = '10px';
    button.style.zIndex = '1000';
    button.style.cursor = 'pointer';
    document.body.appendChild(button);
});

zoomInButton.addEventListener('click', () => {
    zoomFactor *= 1.1;
    renderCubes(state);
});

zoomOutButton.addEventListener('click', () => {
    zoomFactor *= 0.9;
    renderCubes(state);
});

rotateClockwiseButton.addEventListener('click', () => {
    rotationAngle += Math.PI / 2; // Rotate by 22.5 degrees
    renderCubes(state);
});

rotateCounterClockwiseButton.addEventListener('click', () => {
    rotationAngle -= Math.PI / 2; // Rotate by 22.5 degrees
    renderCubes(state);
});

playButton.addEventListener('click', () => {
    if (!isPlaying) {
        isPlaying = true;
        stepInterval = setInterval(updateState, 1000); // Update every second
    }
});

pauseButton.addEventListener('click', () => {
    if (isPlaying) {
        isPlaying = false;
        clearInterval(stepInterval);
    }
});

resetButton.addEventListener('click', () => {
    state = generateRandomCubes(10, -5, 5);
    stepCount = 0;
    renderCubes(state);
});

// Resize canvas and redraw grid on window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    renderCubes(state);
});

// Initial render
renderCubes(state);
