import React, { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'

export function renderPage(page: ReactNode) {
	const root = document.getElementById('root')

	if (!root) {
		throw new Error('Root element was not found')
	}

	createRoot(root).render(<React.StrictMode>{page}</React.StrictMode>)
}
