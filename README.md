# Fantasy Map Generator

A Flask and Leaflet.js based application that generates a customized, interactive fantasy map from any Minecraft seed using the `cubiomes` library.

## Getting Started

You only need to run one command to install dependencies, build the libraries, and start the app:

```bash
make run
```

Then open your browser to `http://localhost:5000`.

## Features
- Generates biomes directly matching Minecraft's internal generation.
- Renders as a hand-drawn, parchment-style fantasy map.
- Supports panning, zooming, and setting explicit bounds.
- Custom toggleable icons for features and draggable markers.
