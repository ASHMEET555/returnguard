import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  target: 'es2017',
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', 'ag-grid-community', 'ag-grid-react'],
});
