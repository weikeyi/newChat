/** @type {import('prettier').Config} */
const config = {
    tabWidth: 4,               // 缩进 4 个空格
    useTabs: false,            // 不使用 tab，使用空格缩进
    semi: false,               // 末尾不要加分号
    singleQuote: true,        // 使用单引号
    trailingComma: 'es5',     // 在 ES5 中有效的地方添加尾随逗号（更常用）
    bracketSpacing: true,     // 对象大括号内添加空格：{ foo: bar }
    arrowParens: 'avoid',     // 对于只有一个参数的箭头函数省略括号
    endOfLine: 'lf',          // 使用 LF 换行（统一换行符）
    printWidth: 100           // 每行最大字符数（可选，默认是 80）
}

export default config