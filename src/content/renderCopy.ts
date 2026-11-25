const entities: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;',
}

export function renderCopy(template: string, messages: Readonly<Record<string, string>>) {
	return template.replace(/\{\{\{([\w.-]+)\}\}\}|\{\{([\w.-]+)\}\}/g,
		(_, inlineKey: string | undefined, plainKey: string) => {
			const key = inlineKey ?? plainKey

			if (!Object.prototype.hasOwnProperty.call(messages, key)) {
				throw new Error('Missing translation: ' + key)
			}

			const text = messages[key]
			return inlineKey ? text : text.replace(/[&<>"']/g, character => entities[character])
		},
	)
}
