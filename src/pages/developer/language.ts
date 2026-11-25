const preferenceKey = 'nmb-wiki-language'

export function getWikiLanguage(): 'en' | 'ru' {
	try {
		const saved = window.localStorage.getItem(preferenceKey)

		if (saved === 'en' || saved === 'ru') {
			return saved
		}
	} catch {
		// storage may be disabled by the browser
	}

	const preferences = navigator.languages.length ? navigator.languages : [navigator.language]

	for (const locale of preferences) {
		const [language] = locale.toLowerCase().split('-')

		if (language === 'en' || language === 'ru') {
			return language
		}
	}

	return 'en'
}

export function rememberWikiLanguage(language: string) {
	try {
		window.localStorage.setItem(preferenceKey, language)
	} catch {
		// the language link still works when storage is disabled
	}
}
