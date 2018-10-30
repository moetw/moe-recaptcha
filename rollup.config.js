import {terser} from 'rollup-plugin-terser';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  input: './index.js',
  output: {
    name: 'MoeRecaptcha',
    file: 'build/moe-recaptcha.js',
    format: 'umd',
    sourcemap: true
  },
  plugins: [
    nodeResolve({
      jsnext: true,
      main: true
    }),
    terser({
      sourcemap: true,
      warnings: 'verbose',
    })
  ]
};