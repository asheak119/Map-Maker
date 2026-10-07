const CHUNK_SIZE = 100;
const BLOCK_SCALE = 4; // Each block is 4x4 pixels on the canvas tile (so a 100x100 block area is 400x400 pixels)
const TILE_SIZE = CHUNK_SIZE * BLOCK_SCALE;

let currentSeed = parseInt(document.getElementById('seed-input').value) || 12345;

const map = L.map('map', {
    crs: L.CRS.Simple, // Infinite flat map
    minZoom: -2,
    maxZoom: 2,
    zoomSnap: 0.5
}).setView([0, 0], 0);

// Create a custom GridLayer for drawing biomes on a canvas
L.GridLayer.BiomeMap = L.GridLayer.extend({
    createTile: function (coords, done) {
        const tile = L.DomUtil.create('canvas', 'leaflet-tile');
        const tileSize = this.getTileSize();
        tile.width = tileSize.x;
        tile.height = tileSize.y;

        const ctx = tile.getContext('2d');

        // In CRS.Simple, zoom 0 means 1 pixel = 1 CRS unit.
        // If zoom is z, 1 pixel = 2^-z CRS units.
        // A tile is always 256x256 pixels (by default).
        // Let's say 1 CRS unit = 1 Minecraft block.
        // At zoom 0, a 256x256 tile covers 256x256 blocks.
        // At zoom 1, a 256x256 tile covers 128x128 blocks.

        // Let's find the CRS coordinates of the top-left of this tile.
        // The tile's top-left pixel coordinate at this zoom level:
        const nwPoint = coords.scaleBy(tileSize);

        // Unproject to CRS coordinates (blocks)
        const nw = map.unproject(nwPoint, coords.z);
        // Leaflet unproject returns a LatLng. For Simple CRS, Lat is Y (which points UP), Lng is X (points RIGHT).
        // Actually, by default in Leaflet L.CRS.Simple:
        // x = Lng, y = -Lat.
        // So Lat goes down as y goes down in screen coords.
        // Let's just use the unprojected coordinates directly as block coordinates.
        const startX = Math.floor(nw.lng);
        const startZ = Math.floor(-nw.lat);

        // Calculate how many blocks this tile covers
        const sePoint = nwPoint.add(tileSize);
        const se = map.unproject(sePoint, coords.z);
        const endX = Math.floor(se.lng);
        const endZ = Math.floor(-se.lat);

        const width = endX - startX;
        const height = endZ - startZ;

        // If width is very small, we might want to sample.
        // If width is very large (zoomed out), we need a larger step to avoid huge API payloads.
        const step = Math.max(1, Math.floor(width / tileSize.x));
        const apiWidth = Math.ceil(width / step);
        const apiHeight = Math.ceil(height / step);

        // We will stretch the fetched data over the tile
        const blockScaleX = tileSize.x / apiWidth;
        const blockScaleY = tileSize.y / apiHeight;

        fetch(`/api/map?seed=${currentSeed}&startX=${startX}&startZ=${startZ}&width=${apiWidth}&height=${apiHeight}&step=${step}`)
            .then(res => res.json())
            .then(data => {
                drawBiomes(ctx, data.biomes, startX, startZ, step, blockScaleX, blockScaleY);
                done(null, tile);
            })
            .catch(err => {
                console.error(err);
                done(err, tile);
            });

        return tile;
    }
});


// Styling constants mapping biome IDs to LOTR styles
const BIOME_STYLES = {
    // Ocean/Water
    0: { type: 'water' }, // Ocean
    10: { type: 'water' }, // Frozen Ocean
    24: { type: 'water' }, // Deep Ocean
    44: { type: 'water' }, // Warm Ocean
    45: { type: 'water' }, // Lukewarm Ocean
    46: { type: 'water' }, // Cold Ocean
    47: { type: 'water' }, // Deep Warm Ocean
    48: { type: 'water' }, // Deep Lukewarm Ocean
    49: { type: 'water' }, // Deep Cold Ocean
    50: { type: 'water' }, // Deep Frozen Ocean
    7: { type: 'water' }, // River
    11: { type: 'water' }, // Frozen River

    // Mountains/Hills
    3: { type: 'mountain', color: '#c2b280' }, // Extreme Hills
    13: { type: 'mountain', color: '#b5a672' }, // Snowy Mountains
    34: { type: 'mountain', color: '#c2b280' }, // Extreme Hills+
    131: { type: 'mountain', color: '#a89a68' }, // Gravelly Mountains
    162: { type: 'mountain', color: '#a89a68' }, // Gravelly Mountains+

    // Forests
    4: { type: 'forest', density: 0.8 }, // Forest
    18: { type: 'forest', density: 0.8 }, // Wooded Hills
    27: { type: 'forest', density: 0.6 }, // Birch Forest
    28: { type: 'forest', density: 0.6 }, // Birch Forest Hills
    29: { type: 'forest', density: 0.9 }, // Dark Forest
    157: { type: 'forest', density: 0.9 }, // Dark Forest Hills

    // Desert / Badlands
    2: { type: 'desert' }, // Desert
    17: { type: 'desert' }, // Desert Hills
    37: { type: 'desert', color: '#d2b48c' }, // Badlands
    38: { type: 'desert', color: '#d2b48c' }, // Wooded Badlands Plateau
    39: { type: 'desert', color: '#d2b48c' }, // Badlands Plateau

    // Swamps
    6: { type: 'swamp' }, // Swamp
    134: { type: 'swamp' }, // Swamp Hills

    // Plains / Default (parchment)
    1: { type: 'plains' }, // Plains
    129: { type: 'plains' } // Sunflower Plains
};

function getBiomeStyle(id) {
    if (BIOME_STYLES[id]) return BIOME_STYLES[id];
    // General fallbacks based on id heuristics if unknown (very basic)
    if (id >= 44 && id <= 50) return { type: 'water' };
    return { type: 'plains' }; // Default parchment
}

function drawMountain(ctx, x, y, scale) {
    if (!window.showMountains) return;
    ctx.beginPath();
    ctx.moveTo(x, y + scale);
    ctx.lineTo(x + scale / 2, y);
    ctx.lineTo(x + scale, y + scale);
    ctx.strokeStyle = '#5a4628';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Shading
    ctx.beginPath();
    ctx.moveTo(x + scale / 2, y);
    ctx.lineTo(x + scale * 0.7, y + scale);
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.stroke();
}

function drawTree(ctx, x, y, scale) {
    if (!window.showTrees) return;
    ctx.beginPath();
    // Trunk
    ctx.moveTo(x + scale / 2, y + scale);
    ctx.lineTo(x + scale / 2, y + scale / 2);
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Leaves
    ctx.beginPath();
    ctx.arc(x + scale / 2, y + scale / 2, scale / 3, 0, Math.PI * 2);
    ctx.fillStyle = '#4a5d23'; // muted green
    ctx.fill();
    ctx.strokeStyle = '#2d3b14';
    ctx.stroke();
}

function drawWave(ctx, x, y, scale) {
    if (!window.showRivers) return; // reusing this for all water for now
    ctx.beginPath();
    ctx.moveTo(x, y + scale / 2);
    ctx.quadraticCurveTo(x + scale / 4, y, x + scale / 2, y + scale / 2);
    ctx.quadraticCurveTo(x + scale * 0.75, y + scale, x + scale, y + scale / 2);
    ctx.strokeStyle = '#7c9a92'; // muted blue/green ink
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawBiomes(ctx, biomes, startX, startZ, step, blockScaleX, blockScaleY) {
    if (!biomes || biomes.length === 0) return;

    // First pass: background colors
    for (let z = 0; z < biomes.length; z++) {
        for (let x = 0; x < biomes[z].length; x++) {
            const style = getBiomeStyle(biomes[z][x]);
            const px = x * blockScaleX;
            const py = z * blockScaleY;

            if (style.type === 'water') {
                ctx.fillStyle = '#d1dfd9';
            } else if (style.type === 'desert') {
                ctx.fillStyle = style.color || '#e4d5b7';
            } else if (style.type === 'swamp') {
                ctx.fillStyle = '#d0d3b6';
            } else if (style.type === 'mountain') {
                ctx.fillStyle = style.color || '#d8cbb6';
            } else {
                ctx.fillStyle = '#f4ecd8';
            }
            // Fill rect with a slight overlap to prevent subpixel gaps
            ctx.fillRect(Math.floor(px), Math.floor(py), Math.ceil(blockScaleX), Math.ceil(blockScaleY));
        }
    }

    // Second pass: Draw LOTR icons based on probability/density
    // Group adjacent similar biomes visually by using seeded randomness based on coords
    for (let z = 0; z < biomes.length; z++) {
        for (let x = 0; x < biomes[z].length; x++) {
            const style = getBiomeStyle(biomes[z][x]);
            const px = x * blockScaleX;
            const py = z * blockScaleY;

            // Adjust icon scaling based on zoom
            const iconScale = Math.min(blockScaleX * 3, 20); // cap max size

            // Global block coordinates for consistent hashing
            const globalX = startX + x * step;
            const globalZ = startZ + z * step;

            const rand = Math.abs(Math.sin(globalX * 12.9898 + globalZ * 78.233)) % 1;

            // Only draw icons if zoom is close enough, else it gets too cluttered
            if (iconScale > 2) {
                if (style.type === 'water') {
                    if (rand < 0.02) drawWave(ctx, px, py, iconScale);
                } else if (style.type === 'mountain') {
                    if (rand < 0.05) drawMountain(ctx, px, py, iconScale);
                } else if (style.type === 'forest') {
                    const density = style.density || 0.5;
                    if (rand < density * 0.1) drawTree(ctx, px, py, iconScale);
                } else if (style.type === 'swamp') {
                    if (rand < 0.05) {
                        ctx.beginPath();
                        ctx.moveTo(px, py + iconScale);
                        ctx.lineTo(px + iconScale/2, py);
                        ctx.strokeStyle = '#4a5d23';
                        ctx.stroke();
                    }
                }
            }
        }
    }
}

// Global state for toggles
window.showTrees = document.getElementById('toggle-trees').checked;
window.showMountains = document.getElementById('toggle-mountains').checked;
window.showRivers = document.getElementById('toggle-rivers').checked;

document.getElementById('toggle-trees').addEventListener('change', (e) => {
    window.showTrees = e.target.checked;
    redrawMap();
});
document.getElementById('toggle-mountains').addEventListener('change', (e) => {
    window.showMountains = e.target.checked;
    redrawMap();
});
document.getElementById('toggle-rivers').addEventListener('change', (e) => {
    window.showRivers = e.target.checked;
    redrawMap();
});

let biomeLayer = new L.GridLayer.BiomeMap();
map.addLayer(biomeLayer);

function redrawMap() {
    map.removeLayer(biomeLayer);

    // Check bounds
    const minX = document.getElementById('min-x').value;
    const maxX = document.getElementById('max-x').value;
    const minZ = document.getElementById('min-z').value;
    const maxZ = document.getElementById('max-z').value;

    let bounds = null;
    if (minX !== '' && maxX !== '' && minZ !== '' && maxZ !== '') {
        // In our coordinate system, Lat is -Z, Lng is X
        const southWest = L.latLng(-parseInt(maxZ), parseInt(minX));
        const northEast = L.latLng(-parseInt(minZ), parseInt(maxX));
        const bounds = L.latLngBounds(southWest, northEast);
        map.setMaxBounds(bounds);
        biomeLayer = new L.GridLayer.BiomeMap({ bounds: bounds });
    } else {
        map.setMaxBounds(null);
        biomeLayer = new L.GridLayer.BiomeMap();
    }

    map.addLayer(biomeLayer);
}

// Marker logic
document.getElementById('marker-btn').addEventListener('click', () => {
    const label = prompt("Enter marker label:", "New Town");
    if (!label) return;

    // Create marker at center of current view
    const center = map.getCenter();
    const marker = L.marker(center, {
        draggable: true,
        title: label
    }).addTo(map);

    // Add a popup with the label
    marker.bindPopup(`<b>${label}</b>`).openPopup();
});

document.getElementById('update-btn').addEventListener('click', () => {
    currentSeed = parseInt(document.getElementById('seed-input').value) || 0;
    const x = parseInt(document.getElementById('x-input').value) || 0;
    const z = parseInt(document.getElementById('z-input').value) || 0;

    redrawMap();

    const latlng = L.latLng(-z, x);
    map.setView(latlng);
});
