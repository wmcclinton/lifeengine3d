function getNeighbors(cube, state) {
    const neighbors = [];
    const directions = [
        [-1, 0, 0], [1, 0, 0], [0, -1, 0], [0, 1, 0], [0, 0, -1], [0, 0, 1],
        [-1, -1, 0], [1, -1, 0], [-1, 1, 0], [1, 1, 0], [-1, 0, -1], [1, 0, -1],
        [-1, 0, 1], [1, 0, 1], [0, -1, -1], [0, 1, -1], [0, -1, 1], [0, 1, 1],
        [-1, -1, -1], [1, -1, -1], [-1, 1, -1], [1, 1, -1], [-1, -1, 1], [1, -1, 1],
        [-1, 1, 1], [1, 1, 1]
    ];
    for (let dir of directions) {
        const neighbor = state.find(c => c.x === cube.x + dir[0] && c.y === cube.y + dir[1] && c.z === cube.z + dir[2]);
        if (neighbor) {
            neighbors.push(neighbor);
        }
    }
    return neighbors;
}

function step(state) {
    const nextState = [];

    // Process each cube to decide its next state
    for (let cube of state) {
        const neighbors = getNeighbors(cube, state);
        const liveNeighbors = neighbors.length;

        // Apply Conway's Game of Life rules
        if (liveNeighbors < 2 || liveNeighbors > 3) {
            // Underpopulation or overpopulation: the cube dies
            continue;
        } else if (liveNeighbors === 2 || liveNeighbors === 3) {
            // Two or three neighbors: cube stays alive
            nextState.push({...cube}); // Clone the cube
        }

        // Reproduction: Check if dead cube with exactly 3 neighbors becomes alive
        for (let direction of [
            [-1, 0, 0], [1, 0, 0], [0, -1, 0], [0, 1, 0], [0, 0, -1], [0, 0, 1],
            [-1, -1, 0], [1, -1, 0], [-1, 1, 0], [1, 1, 0], [-1, 0, -1], [1, 0, -1],
            [-1, 0, 1], [1, 0, 1], [0, -1, -1], [0, 1, -1], [0, -1, 1], [0, 1, 1],
            [-1, -1, -1], [1, -1, -1], [-1, 1, -1], [1, 1, -1], [-1, -1, 1], [1, -1, 1],
            [-1, 1, 1], [1, 1, 1]
        ]) {
            const newCube = {
                x: cube.x + direction[0],
                y: cube.y + direction[1],
                z: cube.z + direction[2]
            };

            if (!state.find(c => c.x === newCube.x && c.y === newCube.y && c.z === newCube.z)) {
                // If the new cube is not already in the state (dead cell),
                // check if it has exactly 3 neighbors to be born.
                const deadNeighbors = getNeighbors(newCube, state);
                if (deadNeighbors.length === 3) {
                    nextState.push({ ...newCube, color: '#2ecc71' }); // New random color for birth
                }
            }
        }
    }

    return nextState;
}
