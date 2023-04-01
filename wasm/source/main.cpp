#include <pl/pattern_language.hpp>

static std::string result;

extern "C" const char *executePatternLanguageCode(const char *string) {
    pl::PatternLanguage runtime;
    runtime.setDangerousFunctionCallHandler([]() {
        return false;
    });

    runtime.setIncludePaths({
       "./patterns"
    });

    // Execute pattern file
    if (!runtime.executeString(string)) {
        if (const auto& error = runtime.getError(); error.has_value())
            result += fmt::format("[ERROR]: {}:{} -> {}\n", error->line, error->column, error->message);
    }

    result.clear();
    for (const auto &[level, message] : runtime.getConsoleLog()) {
        switch (level) {
            using enum pl::core::LogConsole::Level;

            case Debug:
                result += fmt::format("[DEBUG] {}\n", message);
                break;
            case Info:
                result += fmt::format("[INFO]  {}\n", message);
                break;
            case Warning:
                result += fmt::format("[WARN]  {}\n", message);
                break;
            case Error:
                result += fmt::format("[ERROR] {}\n", message);
                break;
        }
    }

    return result.c_str();
}

int main() {
    fmt::print("Pattern Language Module loaded!\n");
}
