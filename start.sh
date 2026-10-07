#!/bin/bash
cd "$(dirname "$0")"
make build
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$(pwd)/cubiomes
python3 app.py
