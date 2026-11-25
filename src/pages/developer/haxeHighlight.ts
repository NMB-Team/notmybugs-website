import { renderCopy } from '../../content/renderCopy'

const tokens = /(?<comm>\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(?<str>"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(?<num>\b(?:0[xX][\da-fA-F]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b)|(?<qualified>\b(?:limen|hl|haxe|sys)(?:\.[a-zA-Z_]\w*)+)|(?<key>\b(?:abstract|break|case|cast|class|continue|default|do|dynamic|else|enum|extends|extern|false|final|for|from|function|get|if|implements|import|in|inline|interface|never|new|null|override|package|private|public|return|set|static|switch|this|throw|to|true|try|typedef|untyped|using|var|while)\b)|(?<type>\b[A-Z][a-zA-Z_0-9]*\b)/g
const escape = (value: string) => renderCopy('{{value}}', { value })

export function highlightHaxe(source: string, linkType?: (path: string) => string | undefined) {
	let markup = ''
	let offset = 0

	for (const match of source.matchAll(tokens)) {
		markup += escape(source.slice(offset, match.index))
		const [token] = match
		const kind = Object.keys(match.groups!).find(key => match.groups![key] !== undefined)!
		const linked = kind === 'qualified' ? linkType?.(token) : undefined
		const className = kind === 'qualified' ? 'type' : kind
		markup += `<span class="tok-${className}">${linked ?? escape(token)}</span>`
		offset = match.index + token.length
	}

	return markup + escape(source.slice(offset))
}
