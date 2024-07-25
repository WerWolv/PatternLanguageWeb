cmake_minimum_required(VERSION 3.16)
project(plwasm)

set(CMAKE_CXX_STANDARD 23)

add_executable(plwasm.js
        source/main.cpp
        )

include(FetchContent)

FetchContent_Declare(
        libpl
        GIT_REPOSITORY https://github.com/WerWolv/PatternLanguage
)

FetchContent_declare(
        imhex_patterns
        GIT_REPOSITORY https://github.com/WerWolv/ImHex-Patterns
)

FetchContent_MakeAvailable(libpl imhex_patterns)

target_compile_options(plwasm.js PRIVATE -Wall -Wextra -Werror -Wno-unknown-pragmas -Wno-deprecated-declarations -fwasm-exceptions -fexceptions)
target_include_directories(plwasm.js PUBLIC include)
target_link_libraries(plwasm.js PUBLIC libpl libpl-gen fmt::fmt-header-only)
target_link_options(plwasm.js PRIVATE
        -fwasm-exceptions -fexceptions
        -sEXPORTED_FUNCTIONS=_main,_executePatternLanguageCode,_getConsoleResult,_getFormattedResult,_getFormatters,_malloc,_free,_setData,_initialize
        -sEXPORTED_RUNTIME_METHODS=['ccall','allocateUTF8','UTF8ToString']
        -sEXPORT_ES6=1
        -sMODULARIZE=1
        -sASSERTIONS=1
        -sUSE_ES6_IMPORT_META=1
        -sTOTAL_MEMORY=33554432
        -sALLOW_MEMORY_GROWTH=1
        -sFORCE_FILESYSTEM=1
        --embed-file=${imhex_patterns_SOURCE_DIR}/includes@/sources/includes
        --embed-file=${imhex_patterns_SOURCE_DIR}/patterns@/sources/patterns
)

install(CODE "execute_process(COMMAND npm init -y)")