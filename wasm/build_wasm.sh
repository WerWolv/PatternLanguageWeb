#!/usr/bin/env bash

cd wasm || exit
mkdir -p build
cd build || exit
cmake .. -DLIBPL_SHARED_LIBRARY=OFF -DLIBPL_ENABLE_CLI=OFF -DCMAKE_C_COMPILER=emcc -DCMAKE_CXX_COMPILER=em++ -DCMAKE_EXE_LINKER_FLAGS="-fwasm-exceptions" -DCMAKE_CXX_FLAGS="-fwasm-exceptions" -DCMAKE_BUILD_TYPE=Release
make install -j