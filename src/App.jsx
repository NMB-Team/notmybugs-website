import { Canvas } from '@react-three/fiber'
import { Preload } from '@react-three/drei'
import LogoModel from './components/LogoModel.jsx'
import Footer from './components/Footer.jsx'

function AnimatedGradient() {
	return <div className='animated-gradient' aria-hidden='true' />
}

export default function App() {
	return (
		<main className='site-shell'>
			<AnimatedGradient />
			<section className='logo-stage' aria-label='NMB Team logo'>
				<Canvas
					camera={{ position: [0, 0, 4.8], fov: 40 }}
					dpr={[1, 2]}
					gl={{ antialias: true, alpha: true }}
				>
					<ambientLight intensity={1.8} />
					<directionalLight position={[3, 4, 5]} intensity={2.8} />

					<LogoModel modelPath='/models/NMB-logo.glb' />
					<Preload all />
				</Canvas>
			</section>
			<Footer />
		</main>
	)
}
