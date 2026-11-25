import englishUsage from '../../content/en/developer/api/usage.json'
import russianUsage from '../../content/ru/developer/api/usage.json'

type UsageMember = {
	name: string
	kind: string
	signature: string
	doc?: string
}

type UsageType = {
	path: string
	kind: string
	doc?: string
}

const isRussian = document.documentElement.lang === 'ru'
const notes: Record<string, Record<string, string>> = isRussian ? russianUsage : englishUsage
const russianFieldRoles: Record<string, string> = {
	arrayLayers: 'Количество слоёв изображения. Укажите, сколько слоёв должно быть доступно.',
	arraySize: 'Количество элементов или слоёв в массиве ресурсов.',
	baseArrayLayer: 'Первый слой массива, входящий в диапазон.',
	baseMipLevel: 'Первый мип-уровень, входящий в диапазон.',
	byteOffset: 'Смещение в байтах от начала ресурса или блока данных.',
	depth: 'Размер по оси глубины.',
	dstAccessMask: 'Маска доступа для операций после барьера. Укажите виды доступа, которым нужны результаты предыдущих операций.',
	dstStageMask: 'Маска стадий конвейера, на которые распространяется зависимость после барьера.',
	extent: 'Размеры области или ресурса.',
	firstArraySlice: 'Первый слой массива, доступный через это представление (view).',
	height: 'Высота ресурса или области.',
	layerCount: 'Количество слоёв в диапазоне.',
	levelCount: 'Количество мип-уровней в диапазоне.',
	mipLevels: 'Количество мип-уровней, то есть уменьшенных версий изображения.',
	offset: 'Смещение от начала ресурса или области.',
	pNext: 'Необязательный указатель на следующую структуру расширения Vulkan. Добавляйте только совместимые структуры.',
	queueFamilyIndex: 'Индекс семейства очередей для этой операции. Выберите семейство, поддерживаемое устройством.',
	queueFamilyIndices: 'Индексы семейств очередей для совместного использования или доступа. Число индексов должно совпадать с указанным количеством семейств.',
	rowPitch: 'Расстояние в памяти между началами соседних строк. Оно должно соответствовать раскладке, которую требует операция.',
	sampleCount: 'Число сэмплов на элемент. При мультисэмплинге согласуйте его с настройками целей отрисовки и конвейера.',
	sizeInBytes: 'Размер в байтах. Используйте при выделении памяти или расчёте диапазона данных.',
	srcAccessMask: 'Маска доступа для операций до барьера. Укажите виды доступа, которые нужно завершить до зависимых операций.',
	srcStageMask: 'Маска стадий конвейера, на которые распространяется зависимость до барьера.',
	stencilReadMask: 'Маска битов, участвующих в сравнении значений трафарета.',
	stencilWriteMask: 'Маска битов, которые разрешено менять при записи в буфер трафарета.',
	width: 'Ширина ресурса или области.',
}

const russianOpenGlConstants: Record<string, string> = {
	Buffers: 'Передавайте в операции с буферами: например, как цель, привязку или подсказку о способе использования.',
	Capabilities: 'Используйте при настройке или проверке возможностей OpenGL.',
	Commands: 'Передавайте в подходящую команду отрисовки, вычислений или синхронизации.',
	Formats: 'Передавайте как формат данных или тип компонента.',
	Framebuffers: 'Передавайте в операции с буфером кадра: например, как цель, вложение, статус или маску.',
	Queries: 'Передавайте как цель запроса или как параметр, указывающий, какой результат прочитать.',
	Shaders: 'Передавайте в подходящую операцию с шейдером или шейдерной программой.',
	State: 'Используйте в операциях с состоянием OpenGL.',
	Textures: 'Передавайте как цель, параметр или настройку текстуры.',
	VertexArrays: 'Передавайте в подходящую операцию с массивом вершин или вершинным атрибутом.',
}

const fieldRoles: Record<string, string> = {
	arrayLayers: 'Number of layers in the image array. Set it for the layers the image must expose.',
	arraySize: 'Number of elements or slices in the resource array.',
	baseArrayLayer: 'First array layer included in this range.',
	baseMipLevel: 'First mip level included in this range.',
	byteOffset: 'Starting position in bytes from the base of the resource or data block.',
	depth: 'Extent along the depth axis.',
	dstAccessMask: 'Destination access mask. Include the accesses that need to see the result of the dependency.',
	dstStageMask: 'Destination pipeline stages that the dependency applies to.',
	extent: 'Dimensions of the covered region or resource.',
	firstArraySlice: 'The first array slice included in the view.',
	height: 'Vertical extent of the resource, region, or configuration.',
	layerCount: 'Number of layers in the specified range.',
	levelCount: 'Number of mip levels in the specified range.',
	mipLevels: 'Number of mip levels to describe.',
	offset: 'Starting position relative to the owning resource or region.',
	pNext: 'Optional pointer to the next Vulkan extension structure. Use a compatible extension structure when extending this record.',
	queueFamilyIndex: 'Index of the queue family used by this operation. Use a family supported by the selected device.',
	queueFamilyIndices: 'Queue family indices to use for sharing or access. Keep them consistent with the queue family count.',
	rowPitch: 'Distance between consecutive rows in memory. Use the layout required by the operation.',
	sampleCount: 'Number of samples per element. Match related attachments and pipeline configuration when multisampling.',
	sizeInBytes: 'Size measured in bytes. Use it when sizing or bounding the corresponding data range.',
	srcAccessMask: 'Source access mask. Include the accesses that the dependency must order before later work.',
	srcStageMask: 'Source pipeline stages that the dependency applies to.',
	stencilReadMask: 'Selects the stencil bits considered by a stencil comparison.',
	stencilWriteMask: 'Selects which bits a stencil write can change.',
	width: 'Horizontal extent of the resource, region, or configuration.',
}

const operationPhrases: Record<string, (subject: string) => string> = {
	acquire: subject => `Acquires ${subject} for the caller to use.`,
	allocate: subject => `Allocates ${subject} using the supplied configuration.`,
	begin: subject => `Starts ${subject}. Check for the matching end operation before submitting or releasing its resources.`,
	bind: subject => `Binds ${subject} for the specified operation.`,
	clear: subject => `Clears ${subject} using the supplied values.`,
	compile: subject => `Compiles ${subject} using the supplied inputs and options.`,
	copy: subject => `Copies ${subject} using the supplied source, destination, or ranges.`,
	create: subject => `Creates ${subject} with the supplied arguments.`,
	destroy: subject => `Releases ${subject}. Finish using it before destruction.`,
	draw: subject => `Issues a draw operation for ${subject} using the active rendering state.`,
	enable: subject => `Enables ${subject}.`,
	get: subject => `Reads ${subject}.`,
	is: subject => `Checks whether ${subject} applies.`,
	query: subject => `Queries ${subject}.`,
	read: subject => `Reads ${subject}.`,
	set: subject => `Sets ${subject} from the supplied value or configuration.`,
	update: subject => `Updates ${subject} from the supplied data.`,
	wait: subject => `Waits for ${subject}.`,
	write: subject => `Writes ${subject} using the supplied data.`,
}

const russianOperationPhrases: Record<string, string> = {
	acquire: 'Получает ресурс для дальнейшего использования.',
	allocate: 'Выделяет ресурсы по переданным параметрам.',
	begin: 'Начинает операцию. Перед отправкой команд или освобождением ресурсов проверьте, нужен ли парный вызов завершения.',
	bind: 'Привязывает указанный ресурс для операции.',
	clear: 'Очищает указанный ресурс, используя переданные значения.',
	compile: 'Компилирует переданные данные с указанными настройками.',
	copy: 'Копирует данные между указанными ресурсами или диапазонами.',
	create: 'Создаёт объект с переданными параметрами.',
	destroy: 'Освобождает ресурс. Завершите работу с ним перед вызовом.',
	draw: 'Запускает отрисовку с текущим состоянием конвейера.',
	enable: 'Включает указанную возможность.',
	get: 'Возвращает запрошенное значение.',
	is: 'Проверяет условие, указанное в имени метода.',
	query: 'Запрашивает данные, указанные в сигнатуре.',
	read: 'Читает указанные данные.',
	set: 'Задаёт значение или настройку из аргументов.',
	update: 'Обновляет ресурс переданными данными.',
	wait: 'Ожидает выполнения указанного условия.',
	write: 'Записывает переданные данные.',
}

const openGlConstants: Record<string, string> = {
	Buffers: 'Use it where a buffer operation expects the corresponding target, binding, or usage hint.',
	Capabilities: 'Use it in OpenGL state or capability checks for the corresponding token.',
	Commands: 'Use it in the draw, dispatch, or synchronization operation that accepts this token.',
	Formats: 'Use it where an OpenGL operation expects the matching format or component type.',
	Framebuffers: 'Use it in the framebuffer operation that accepts this target, attachment, status, or mask.',
	Queries: 'Use it with the query operation for the matching target or result selector.',
	Shaders: 'Use it with the shader or program operation that accepts this token.',
	State: 'Use it where the matching OpenGL state operation accepts this token.',
	Textures: 'Use it where the matching texture operation expects this target, parameter, or option.',
	VertexArrays: 'Use it with the vertex array or attribute operation that accepts this token.',
}

const words = (identifier: string) => identifier
	.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
	.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
	.replace(/_/g, ' ')
	.trim()
	.split(/\s+/)
	.map(word => /^(API|CPU|D3D11|D3D12|DXGI|FSR|GL|GPU|HDR|ID|SDL|SPIRV|SRGB|SRV|UAV|UI|Vk)$/.test(word)
		? word : word.toLowerCase())

function own<T>(index: Record<string, T>, key: string): T | undefined {
	return Object.prototype.hasOwnProperty.call(index, key) ? index[key] : undefined
}

function lookup(type: UsageType, member = '') {
	const entries = notes[type.path.slice('limen.'.length)]
	return entries && own(entries, member)
}

export function typeDescription(type: UsageType) {
	return [lookup(type), type.doc].filter(Boolean).join('\n\n')
}

export function memberDescription(type: UsageType, member: UsageMember) {
	const specific = [lookup(type, member.name), member.doc].filter(Boolean).join('\n\n')

	if (specific) {
		return specific
	}

	const name = type.path.slice(type.path.lastIndexOf('.') + 1)
	const isField = member.kind === 'field' || member.kind === 'staticField'
	const isOption = type.kind === 'enum' || type.kind === 'enumAbstract'
	const isConfiguration = type.kind === 'typedef' || /(?:Desc|CreateInfo|Options|Params|Config|Requirements)$/.test(name)
	const memberWords = words(member.name)

	if (isRussian) {
		const identifier = `\`${member.name}\``

		switch (member.kind) {
			case 'value': {
				const gl = type.path.startsWith('limen.graphics.renderer.opengl.') && own(russianOpenGlConstants, name)

				if (gl) {
					return `Константа OpenGL ${identifier}. ${gl}`
				}

				return isOption
					? `Вариант ${identifier} перечисления \`${name}\`. Передавайте его туда, где нужен этот вариант.`
					: `Именованная константа ${identifier} типа \`${name}\`.`
			}
			case 'operator': {
				const [expression] = member.signature.split('  ·  ', 1)
				return `Используйте \`${expression}\` со значениями указанных типов. Haxe применит эту перегрузку оператора.`
			}
			case 'constructor':
				return `Создаёт объект \`${name}\` с указанными аргументами.`
			case 'field':
			case 'staticField': {
				const role = type.path.startsWith('limen.graphics.') && own(russianFieldRoles, member.name)

				return role || (isConfiguration
					? `Параметр ${identifier} в настройках \`${name}\`.`
					: `Поле ${identifier} типа \`${name}\`.`)
			}
			default: {
				const phrase = memberWords.length > 1 && own(russianOperationPhrases, memberWords[0])
				return phrase || `Метод ${identifier} типа \`${name}\`. Подробности работы этого бэкенда приведены в исходном коде по ссылке выше.`
			}
		}
	}

	if (member.kind === 'value') {
		const meaning = memberWords.join(' ')
		const gl = type.path.startsWith('limen.graphics.renderer.opengl.') && own(openGlConstants, name)

		if (gl) {
			return `OpenGL token for ${meaning}. ${gl}`
		}

		return isOption
			? `Selects the “${meaning}” variant of \`${name}\`. Use it when the operation expects that option.`
			: `The named value for ${meaning}. Use it where the \`${name}\` API expects the corresponding constant.`
	}

	if (member.kind === 'operator') {
		const [expression] = member.signature.split('  ·  ', 1)
		return `Use \`${expression}\` with operands of the types in the signature. Haxe resolves the expression through this overload.`
	}

	if (member.kind === 'constructor') {
		return `Constructs a \`${name}\`. Supply the required arguments before passing it to an operation that accepts this type.`
	}

	if (isField) {
		const role = type.path.startsWith('limen.graphics.') && own(fieldRoles, member.name)

		if (role) {
			return role
		}

		const subject = memberWords.join(' ')
		if (isConfiguration) {
			return `Specifies ${subject} in the \`${name}\` configuration.`
		}

		return `Exposes ${subject} through \`${name}\`.`
	}

	const [verb, ...subject] = memberWords
	const phrase = own(operationPhrases, verb)

	return phrase && subject.length
		? phrase(subject.join(' '))
		: `The ${memberWords.join(' ')} operation on \`${name}\`. Open the linked source for the backend-specific behavior.`
}

export function memberUsage(type: UsageType, member: UsageMember) {
	const owner = type.path.slice(type.path.lastIndexOf('.') + 1)
	const name = member.name
	const qualified = `\`${owner}.${name}\``

	switch (member.kind) {
		case 'constructor':
			return isRussian
				? `Вызовите \`new ${owner}(…)\` с аргументами из сигнатуры выше.`
				: `Call \`new ${owner}(…)\` with the arguments shown above.`
		case 'staticMethod':
			return isRussian
				? `Вызовите \`${owner}.${name}(…)\` напрямую через тип.`
				: `Call \`${owner}.${name}(…)\` directly on the type.`
		case 'method':
			return isRussian
				? `Вызовите \`instance.${name}(…)\` у экземпляра \`${owner}\`.`
				: `Call \`instance.${name}(…)\` on a \`${owner}\` instance.`
		case 'value':
			if (type.kind === 'enum' && member.signature.startsWith(name + '(')) {
				return isRussian
					? `Создавайте \`${owner}.${name}(…)\` с указанными данными или извлекайте их в ветке \`switch\`.`
					: `Construct or pattern-match \`${owner}.${name}(…)\` using the listed payload fields.`
			}
			return isRussian ? `Обращайтесь к значению как ${qualified}.` : `Refer to the value as ${qualified}.`
		case 'field':
		case 'staticField': {
			if (type.kind === 'typedef') {
				const optional = member.signature.startsWith('?')

				return isRussian
					? `${optional ? 'Необязательное' : 'Обязательное'} поле при создании объекта \`${owner}\` через литерал.`
					: `${optional ? 'Optional' : 'Required'} field in a \`${owner}\` object literal.`
			}

			const expression = member.kind === 'staticField' ? qualified : `\`instance.${name}\``
			const access = member.signature.match(/^(?:static )?(?:var |final )?\w+\((\w+), (\w+)\):/)
			const write = access?.[2]

			if (write === 'null' || write === 'never' || /^(?:static )?final /.test(member.signature)) {
				return isRussian
					? `Чтение через ${expression}. Присваивание недоступно.`
					: `Read with ${expression}. Application code cannot assign it.`
			}

			if (access?.[1] === 'never' || access?.[1] === 'null') {
				return isRussian
					? `Запись через ${expression}. Чтение недоступно.`
					: `Assign with ${expression}. Application code cannot read it.`
			}

			return isRussian
				? `Чтение и запись через ${expression}${write === 'set' ? ' (при записи вызывается сеттер)' : ''}.`
				: `Read or assign ${expression}${write === 'set' ? ' (assignment calls its setter)' : ''}.`
		}
		default:
			return ''
	}
}
