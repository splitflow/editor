import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import dts from 'vite-plugin-dts'
import packageJson from './package.json'

const FILES_WITH_SVELTE_LIFECYCLE_IMPORT = [
    'extensions/flush',
    'extensions/format',
    'editable',
    'extension',
    'windowselection'
]

export default defineConfig((env) => ({
    plugins: [svelte(), dts()],
    build: {
        emptyOutDir: !env.isSsrBuild,
        minify: false,
        lib: {
            entry: env.isSsrBuild ? './src/lib/ssr.ts' : './src/lib/index.ts'
        },
        outDir: 'dist-js',
        rollupOptions: {
            treeshake: false,
            external: withEntryPoints(Object.keys(packageJson.dependencies)),
            output: [{
                format: 'es',
                preserveModules: true,
                preserveModulesRoot: 'src/lib',
                entryFileNames: entryFileNames(env, 'js')
            },
            {
                format: 'cjs',
                preserveModules: true,
                preserveModulesRoot: 'src/lib',
                entryFileNames: entryFileNames(env, 'cjs')
            }]
        }
    }

}))

function entryFileNames(env: { isSsrBuild?: boolean }, ext: string) {
    return (chunk: { name: string }) => {
        if (chunk.name.endsWith('.svelte')) {
            return `${chunk.name}${env.isSsrBuild ? '.ssr' : ''}.${ext}`
        }
        if (FILES_WITH_SVELTE_LIFECYCLE_IMPORT.includes(chunk.name)) {
            return `${chunk.name}${env.isSsrBuild ? '.ssr' : ''}.${ext}`
        }
        if (chunk.name.startsWith('node_modules')) {
            return `${chunk.name.slice(13)}.${ext}`
        }
        return `${chunk.name}.${ext}`
    }
}

function withEntryPoints(deps: string[]) {
    return deps.map((v) => new RegExp(`^${v}.*$`))
}

