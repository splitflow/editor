import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import dts from 'vite-plugin-dts'
import cssByJs from 'vite-plugin-css-injected-by-js'
import packageJson from './package.json'

export default defineConfig({
    plugins: [svelte(), dts(), cssByJs()],
    build: {
        minify: false,
        lib: {
            entry: './src/lib/index.ts',
            name: 'index',
            fileName: 'index'
        },
        rollupOptions: {
            external: [
                //...withEntryPoints(Object.keys(packageJson.dependencies)) //getContext from createStyle fails
            ]
        }
    }
})

function withEntryPoints(deps: string[]) {
    return deps.map((v) => new RegExp(`^${v}.*$`))
}
