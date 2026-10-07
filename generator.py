import ctypes
import os
import sys

def get_lib_path(name):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    if sys.platform == 'win32':
        return os.path.join(base_dir, 'cubiomes', f'{name}.dll')
    elif sys.platform == 'darwin':
        return os.path.join(base_dir, 'cubiomes', f'{name}.dylib')
    else:
        return os.path.join(base_dir, 'cubiomes', f'{name}.so')

lib_cubiomes = get_lib_path('libcubiomes')
lib_wrapper = get_lib_path('libcubiomes_wrapper')

try:
    lib = ctypes.CDLL(lib_cubiomes)
    wrap_lib = ctypes.CDLL(lib_wrapper)

    wrap_lib.create_generator.argtypes = [ctypes.c_int, ctypes.c_uint32]
    wrap_lib.create_generator.restype = ctypes.c_void_p

    wrap_lib.destroy_generator.argtypes = [ctypes.c_void_p]

    lib.applySeed.argtypes = [ctypes.c_void_p, ctypes.c_int, ctypes.c_uint64]

    # void get_biomes_rect(Generator* g, int start_x, int start_z, int width, int height, int step, int* output);
    wrap_lib.get_biomes_rect.argtypes = [ctypes.c_void_p, ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.POINTER(ctypes.c_int)]
except OSError as e:
    print(f"Failed to load libraries: {e}")
    lib = None
    wrap_lib = None

class MinecraftMapGenerator:
    def __init__(self, mc_version=27): # default 1.21.3
        if wrap_lib is None:
            raise RuntimeError("Cubiomes wrapper library is not loaded.")
        self.g = wrap_lib.create_generator(mc_version, 0)
        self.current_seed = None

    def __del__(self):
        if wrap_lib and hasattr(self, 'g') and self.g:
            wrap_lib.destroy_generator(self.g)

    def set_seed(self, seed: int):
        if self.current_seed != seed:
            lib.applySeed(self.g, 0, seed) # dim 0 = OVERWORLD
            self.current_seed = seed

    def get_biomes_rect(self, start_x: int, start_z: int, width: int, height: int, step: int = 1):
        num_biomes = width * height
        # Allocate an array of C ints
        output_array = (ctypes.c_int * num_biomes)()

        # Call the fast C function
        wrap_lib.get_biomes_rect(self.g, start_x, start_z, width, height, step, output_array)

        # Convert to 2D python list
        biomes = []
        idx = 0
        for _ in range(height):
            row = []
            for _ in range(width):
                row.append(output_array[idx])
                idx += 1
            biomes.append(row)

        return biomes
