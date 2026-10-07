# Fantasy Map Generator

A Flask and Leaflet.js based application that generates a customized, interactive fantasy map from any Minecraft seed using the `cubiomes` library.

## Getting Started

1. **Build the C libraries:**
   ```bash
   make build
   ```
2. **Start the server:**
   ```bash
   ./start.sh
   ```
   (Alternatively: `LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$(pwd)/cubiomes python3 app.py`)

3. **Open in browser:**
   Go to `http://localhost:5000`

## Features
- Generates biomes directly matching Minecraft's internal generation.
- Renders as a hand-drawn, parchment-style fantasy map.
- Supports panning, zooming, and setting explicit bounds.
- Custom toggleable icons for features and draggable markers.
