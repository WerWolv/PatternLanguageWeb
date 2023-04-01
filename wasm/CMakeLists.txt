cmake_minimum_required(VERSION 3.16)
project(plwasm)

set(CMAKE_CXX_STANDARD 23)

add_subdirectory(external/pattern_language)

add_executable(plwasm.js
        source/main.cpp
        )

target_compile_options(plwasm.js PRIVATE -Wall -Wextra -Werror -Wno-unknown-pragmas)
target_include_directories(plwasm.js PUBLIC include)
target_link_libraries(plwasm.js PUBLIC libpl libpl-gen fmt::fmt-header-only intervaltree)
target_link_options(plwasm.js PRIVATE -sEXPORTED_FUNCTIONS=_main,_executePatternLanguageCode -sEXPORTED_RUNTIME_METHODS=['ccall','allocateUTF8','UTF8ToString'] -sEXPORT_ES6=1 -sMODULARIZE=1 -sUSE_ES6_IMPORT_META=1)

install(CODE "execute_process(COMMAND npm init -y)")