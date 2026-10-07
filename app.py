from flask import Flask, jsonify, request, send_from_directory
from generator import MinecraftMapGenerator
import os

app = Flask(__name__, static_folder='static', static_url_path='')

gen = MinecraftMapGenerator()

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/api/map')
def get_map():
    seed = request.args.get('seed', default=0, type=int)
    start_x = request.args.get('startX', default=0, type=int)
    start_z = request.args.get('startZ', default=0, type=int)
    width = request.args.get('width', default=100, type=int)
    height = request.args.get('height', default=100, type=int)
    step = request.args.get('step', default=1, type=int)

    gen.set_seed(seed)

    # Cap width/height to avoid huge memory usage
    width = min(max(width, 1), 500)
    height = min(max(height, 1), 500)
    step = max(step, 1)

    biomes = gen.get_biomes_rect(start_x, start_z, width, height, step)

    return jsonify({
        'seed': seed,
        'startX': start_x,
        'startZ': start_z,
        'width': width,
        'height': height,
        'step': step,
        'biomes': biomes
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
