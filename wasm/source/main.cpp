#include <pl/pattern_language.hpp>

#include <pl/formatters.hpp>

static std::string consoleResult, formattedResult;
static std::vector<pl::u8> loadedData;

static pl::PatternLanguage runtime;
static const auto formatters = pl::gen::fmt::createFormatters();
extern "C" void initialize() {
    runtime.setDangerousFunctionCallHandler([]() {
        return false;
    });

    runtime.setIncludePaths({
            "/sources/includes",
            "/sources/patterns"
    });
}

extern "C" const char *getConsoleResult() {
    return consoleResult.c_str();
}

extern "C" const char *getFormattedResult(const char *formatterName) {
    const auto formatterIter = std::find_if(formatters.begin(), formatters.end(),
                                          [&](const auto &formatter) {
                                              return formatter->getName() == formatterName;
                                          });

    if (formatterIter == formatters.end())
        return "Invalid Formatter!";

    auto &formatter = *formatterIter;

    formatter->enableMetaInformation(true);
    auto result = formatter->format(runtime);

    formattedResult.clear();
    formattedResult.reserve(result.size());
    std::move(result.begin(), result.end(), std::back_inserter(formattedResult));

    return formattedResult.c_str();
}

extern "C" void setData(pl::u8 *data, size_t size) {
    loadedData = std::vector<pl::u8>(data, data + size);

    runtime.setDataSource(0x00, loadedData.size(), [&](pl::u64 address, void *buffer, size_t size) {
        std::memcpy(buffer, loadedData.data() + address, size);
    });
}

extern "C" void executePatternLanguageCode(const char *string) {
    // Execute pattern file
    if (!runtime.executeString(string)) {
        if (const auto& error = runtime.getError(); error.has_value())
            consoleResult += fmt::format("[ERROR]: {}:{} -> {}\n\xAA", error->line, error->column, error->message);
    }

    consoleResult.clear();
    for (const auto &[level, message] : runtime.getConsoleLog()) {
        switch (level) {
            using enum pl::core::LogConsole::Level;

            case Debug:
                consoleResult += fmt::format("[DEBUG] {}\n\xAA", message);
                break;
            case Info:
                consoleResult += fmt::format("[INFO]  {}\n\xAA", message);
                break;
            case Warning:
                consoleResult += fmt::format("[WARN]  {}\n\xAA", message);
                break;
            case Error:
                consoleResult += fmt::format("[ERROR] {}\n\xAA", message);
                break;
        }
    }
}

int main() {
    fmt::print("Pattern Language Module loaded!\n");
}
