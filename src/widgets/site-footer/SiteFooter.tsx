import { useEffect, useState } from 'react'
import { preventProtectedAssetAction } from '../../shared/protectAsset'
import './SiteFooter.scss'

const STATUS_MESSAGES = ['Coming soon', 'Work in progress']
const TYPE_SPEED_MS = 70
const DELETE_SPEED_MS = 45
const CYCLE_MS = 5000
const START_DELAY_MS = 1400

function TypewriterStatus() {
	const [messageIndex, setMessageIndex] = useState(0)
	const [visibleLength, setVisibleLength] = useState(0)
	const [isDeleting, setIsDeleting] = useState(false)
	const [isStarted, setIsStarted] = useState(false)
	const message = STATUS_MESSAGES[messageIndex]

	useEffect(() => {
		const timeout = setTimeout(() => setIsStarted(true), START_DELAY_MS)
		return () => clearTimeout(timeout)
	}, [])

	useEffect(() => {
		if (!isStarted) {
			return undefined
		}

		const holdTime = Math.max(
			CYCLE_MS - message.length * (TYPE_SPEED_MS + DELETE_SPEED_MS),
			1200,
		)

		if (!isDeleting && visibleLength < message.length) {
			const timeout = setTimeout(
				() => setVisibleLength(visibleLength + 1),
				TYPE_SPEED_MS,
			)

			return () => clearTimeout(timeout)
		}

		if (!isDeleting && visibleLength === message.length) {
			const timeout = setTimeout(() => setIsDeleting(true), holdTime)
			return () => clearTimeout(timeout)
		}

		if (isDeleting && visibleLength > 0) {
			const timeout = setTimeout(
				() => setVisibleLength(visibleLength - 1),
				DELETE_SPEED_MS,
			)

			return () => clearTimeout(timeout)
		}

		const timeout = setTimeout(() => {
			setMessageIndex(current => (current + 1) % STATUS_MESSAGES.length)
			setIsDeleting(false)
		}, TYPE_SPEED_MS)

		return () => clearTimeout(timeout)
	}, [isDeleting, isStarted, message, visibleLength])

	return (
		<p className='status-text' aria-live='polite' data-started={isStarted}>
			<span>{message.slice(0, visibleLength)}</span>
			<span className='status-cursor' aria-hidden='true' />
		</p>
	)
}

export default function SiteFooter() {
	return (
		<footer className='site-footer'>
			<img
				className='footer-logo'
				src='/NMB-logo.png'
				alt='NMB Team'
				draggable={false}
				onContextMenu={preventProtectedAssetAction}
				onCopy={preventProtectedAssetAction}
				onDragStart={preventProtectedAssetAction}
			/>
			<TypewriterStatus />
			<div className='footer-meta'>
				<a href='mailto:notmybugs.team@gmail.com'>notmybugs.team@gmail.com</a>
				<a href='https://github.com/NMB-Team' target='_blank' rel='noreferrer'>
					GitHub
				</a>
				<span>© 2026 NMB Team</span>
			</div>
		</footer>
	)
}
