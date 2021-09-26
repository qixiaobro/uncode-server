const fs = require("fs")
const rollup = require("rollup");
const { babel, getBabelOutputPlugin } = require("@rollup/plugin-babel");
const del = require("rollup-plugin-delete");
const json = require("@rollup/plugin-json");
const commonjs = require("@rollup/plugin-commonjs");
const { terser } = require("rollup-plugin-terser");

// 获取根目录的'package.json'
const packageJSON = require("./package.json");
// 读取 生成模式 下需要的依赖包
const packageJSONForProduction = {
  name: packageJSON.name,
  dependencies: packageJSON.dependencies,
};

const inputOptions = {
  input: "./src/app.js",
  plugins: [
    // 打包前先清空输出文件夹
    del({ targets: "./dist/*" }),

    // babel 相关的配置, 主要是做兼容
    getBabelOutputPlugin({
      presets: [["@babel/preset-env", { targets: { node: "current" } }]],
      plugins: [["@babel/plugin-transform-runtime", { useESModules: false }]],
    }),
    babel({ babelHelpers: "bundled", exclude: "node_modules/**" }),

    // 这里是把入口文件(app.js)以外的业务代码也进行打包(require进来的文件)
    json(),
    commonjs(),

    // 代码的压缩或混淆
    terser(),
  ],
};
const outputOptions = { dir: "./dist", format: "cjs", exports:'auto' };

async function build() {
  // create a bundle
  const bundle = await rollup.rollup(inputOptions);

  // generate code and a sourcemap
  // const { code, map } = await bundle.generate(outputOptions);

  // or write the bundle to disk
  await bundle.write(outputOptions);

  // 生成生产模式的 package.json, 在服务器上使用
  const writeStream = fs.createWriteStream("./dist/package.json");
  writeStream.write(JSON.stringify(packageJSONForProduction));
}

build();