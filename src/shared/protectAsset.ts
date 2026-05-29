type ProtectedAssetEvent = {
	preventDefault: () => void
}

export function preventProtectedAssetAction(event: ProtectedAssetEvent) {
	event.preventDefault()
}
