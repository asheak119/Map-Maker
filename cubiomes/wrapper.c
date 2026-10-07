#include <stdlib.h>
#include "generator.h"

// Provide a wrapper to create a generator
Generator* create_generator(int mc, uint32_t flags) {
    Generator* g = (Generator*)malloc(sizeof(Generator));
    if (g) {
        setupGenerator(g, mc, flags);
    }
    return g;
}

// Provide a wrapper to free it
void destroy_generator(Generator* g) {
    if (g) {
        free(g);
    }
}

// Provide a fast batch fetch to avoid ctypes overhead
void get_biomes_rect(Generator* g, int start_x, int start_z, int width, int height, int step, int* output) {
    int idx = 0;
    for (int z = 0; z < height; z++) {
        for (int x = 0; x < width; x++) {
            output[idx++] = getBiomeAt(g, 1, start_x + x * step, 64, start_z + z * step);
        }
    }
}
