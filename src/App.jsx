import { useEffect } from 'react'
import './App.css'

import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

import Module from 'plwasm/plwasm.js'


let PatternLanguage;
Module({
    locateFile: (file) => `wasm/build/${file}`,
}).then((module) => { PatternLanguage = module; });

function executePatternLanguageCode(code) {
    let result = PatternLanguage._executePatternLanguageCode(PatternLanguage.allocateUTF8(code));

    return PatternLanguage.UTF8ToString(result);
}

function printToConsole(text, level) {
    let console = document.getElementById('console');

    let line = document.createElement('p');
    line.innerText = text;
    line.className = level;

    console.appendChild(line);
}

function clearConsole() {
    document.getElementById('console').innerText = '';
}

function getLogLevel(line) {
    if (line.startsWith("[DEBUG]"))
        return "debug";
    else if (line.startsWith("[INFO]"))
        return "info";
    else if (line.startsWith("[WARN]"))
        return "warn";
    else if (line.startsWith("[ERROR]"))
        return "error";
    else
        return "";
}

function execute() {
    const code = editor.getValue();
    clearConsole();

    window.localStorage.setItem('code', code);

    let result = executePatternLanguageCode(code);

    for (let line of result.split('\n')) {
        printToConsole(line, getLogLevel(line));
    }
}

var editor;

function App() {
    var createdEditor = false;
    useEffect(() => {
        if (createdEditor) {
            return;
        }
        createdEditor = true;

        function definition() {
            return {
                defaultToken: 'invalid',

                keywords: [
                    "using",
                    "struct",
                    "union",
                    "enum",
                    "bitfield",
                    "be",
                    "le",
                    "fn",
                    "return",
                    "in",
                    "out",
                    "match",
                    "continue",
                    "break",
                    "ref",
                    "parent",
                    "addressof",
                    "sizeof",
                    "namespace",
                    "padding",
                    "while",
                    "for"
                ],

                typeKeywords: [
                    "u8", "u16", "u24", "u32", "u48", "u64", "u96", "u128",
                    "s8", "s16", "s24", "s32", "s48", "s64", "s96", "s128",
                    "float", "double", "bool", "char", "char16", "str", "auto"
                ],

                operators: [
                    '=', '>', '<', '!', '~', '?', ':',
                    '==', '<=', '>=', '!=', '&&', '||', '++', '--',
                    '+', '-', '*', '/', '&', '|', '^', '%', '<<',
                    '>>', '+=', '-=', '*=', '/=', '&=', '|=',
                    '^=', '%=', '<<=', '>>='
                ],

                // we include these common regular expressions
                symbols: /[=><!~?:&|+\-*\/^%]+/,
                escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

                // The main tokenizer for our languages
                tokenizer: {
                    root: [
                        // identifiers and keywords
                        [/[a-z_$][\w$]*/, {
                            cases: {
                                '@typeKeywords': 'keyword',
                                '@keywords': 'keyword',
                                '@default': 'identifier'
                            }
                        }],
                        [/[A-Z][\w$]*/, 'type.identifier'],  // to show class names nicely

                        // whitespace
                        {include: '@whitespace'},

                        // delimiters and operators
                        [/[{}()\[\]]/, '@brackets'],
                        [/[<>](?!@symbols)/, '@brackets'],
                        [/@symbols/, {
                            cases: {
                                '@operators': 'operator',
                                '@default': ''
                            }
                        }],

                        // Inclusion
                        [/^\s*#\s*include/, { token: 'keyword.directive.include', next: '@include' }],

                        // Preprocessor directive
                        [/^\s*#\s*\w+/, 'keyword.directive'],

                        // numbers
                        [/\d*\.\d+([eE][\-+]?\d+)?[fFdD]?/, 'number.float'],
                        [/0[xX][0-9a-fA-F_]*[0-9a-fA-F][Ll]?/, 'number.hex'],
                        [/0[oO][0-7_]*[0-7][Ll]?/, 'number.octal'],
                        [/0[bB][0-1_]*[0-1][Ll]?/, 'number.binary'],
                        [/\d+[lL]?/, 'number'],

                        // delimiter: after number because of .\d floats
                        [/[;,.]/, 'delimiter'],

                        // strings
                        [/"([^"\\]|\\.)*$/, 'string.invalid'],  // non-teminated string
                        [/"/, 'string', '@string'],

                        // characters
                        [/'[^\\']'/, 'string'],
                        [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
                        [/'/, 'string.invalid']
                    ],

                    whitespace: [
                        [/[ \t\r\n]+/, 'white'],
                        [/\/\*/, 'comment', '@comment'],
                        [/\/\+/, 'comment', '@comment'],
                        [/\/\/.*$/, 'comment'],
                    ],

                    comment: [
                        [/[^\/*]+/, 'comment'],
                        [/\/\+/, 'comment', '@push'],
                        [/\/\*/, 'comment.invalid'],
                        ["\\*/", 'comment', '@pop'],
                        ["\\+/", 'comment', '@pop'],
                        [/[\/*]/, 'comment']
                    ],

                    string: [
                        [/[^\\"]+/, 'string'],
                        [/@escapes/, 'string.escape'],
                        [/\\./, 'string.escape.invalid'],
                        [/"/, 'string', '@pop']
                    ],
                    include: [
                        [
                            /(\s*)(<)([^<>]*)(>)/,
                            [
                                '',
                                'keyword.directive.include.begin',
                                'string.include.identifier',
                                { token: 'keyword.directive.include.end', next: '@pop' }
                            ]
                        ],
                        [
                            /(\s*)(")([^"]*)(")/,
                            [
                                '',
                                'keyword.directive.include.begin',
                                'string.include.identifier',
                                { token: 'keyword.directive.include.end', next: '@pop' }
                            ]
                        ]
                    ]
                }
            };
        }

        monaco.languages.register({
            id: 'pattern_language'
        });
        monaco.languages.setMonarchTokensProvider('pattern_language', definition());

        editor = monaco.editor.create(document.getElementById('container'), {
            theme: 'vs-dark',
            value: window.localStorage.getItem('code'),
            language: 'pattern_language',
            automaticLayout: true
        });

        self.MonacoEnvironment = {
            getWorker(_, label) {
                if (label === 'json') {
                    return new jsonWorker()
                }
                if (label === 'css' || label === 'scss' || label === 'less') {
                    return new cssWorker()
                }
                if (label === 'html' || label === 'handlebars' || label === 'razor') {
                    return new htmlWorker()
                }
                if (label === 'typescript' || label === 'javascript') {
                    return new tsWorker()
                }
                return new editorWorker()
            }
        }
    }, []);



  return (
      <div className="App">
          <div style={{ height: '80vh', width: '100vw' }} id={'container'}></div>
          <div style={{ height: '15vh', width: '100vw' }} className={'console'} id={'console'}></div>
          <div style={{ height: '5vh', width: '100vw' }} className={'buttons'}>
              <button onClick={execute}>Execute</button>
          </div>
      </div>
  )
}

export default App
