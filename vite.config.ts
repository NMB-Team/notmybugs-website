import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const htmlPages = ['index.html']

export default defineConfig({
	plugins: [react()],
	build: {
		rollupOptions: {
			input: htmlPages,
			output: {
				manualChunks: {
					react: ['react', 'react-dom'],
					three: ['three', '@react-three/fiber'],
				},
			},
		},
	},
})
