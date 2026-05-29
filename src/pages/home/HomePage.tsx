import { Suspense, lazy, useEffect, useState } from 'react'
import SiteFooter from '../../widgets/site-footer/SiteFooter'
import './HomePage.scss'

const LogoScene = lazy(() => import('../../features/logo-scene/LogoScene'))

function AnimatedGradient() {
	return <div className='animated-gradient' aria-hidden='true' />
}

function StartupFade() {
	const [hidden, setHidden] = useState(false)

	useEffect(() => {
		let secondFrame = 0
		const firstFrame = requestAnimationFrame(() => {
			secondFrame = requestAnimationFrame(() => setHidden(true))
		})

		return () => {
			cancelAnimationFrame(firstFrame)
			cancelAnimationFrame(secondFrame)
		}
	}, [])

	return (
		<div
			className={`startup-fade${hidden ? ' startup-fade--hidden' : ''}`}
			aria-hidden='true'
		/>
	)
}

export default function HomePage() {
	return (
		<main className='site-shell'>
			<AnimatedGradient />
			<Suspense fallback={null}>
				<LogoScene />
			</Suspense>
			<SiteFooter />
			<StartupFade />
		</main>
	)
}
