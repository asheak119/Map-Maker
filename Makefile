all: run

build:
	cd cubiomes && $(MAKE)
	cd cubiomes && gcc -shared -o libcubiomes.so noise.o biomes.o layers.o biomenoise.o generator.o finders.o util.o quadbase.o -lm
	cd cubiomes && gcc -shared -o libcubiomes_wrapper.so wrapper.c -L. -lcubiomes -fPIC -Wl,-rpath,.

run: build
	pip install -r requirements.txt
	LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$(PWD)/cubiomes python3 app.py
