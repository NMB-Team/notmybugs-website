import { Canvas } from '@react-three/fiber'
import { preventProtectedAssetAction } from '../../shared/protectAsset'
import LogoModel from './LogoModel'
import './LogoScene.scss'

export default function LogoScene() {
	return (
		<section
			className='logo-stage'
			aria-label='NMB Team logo'
			onContextMenu={preventProtectedAssetAction}
			onCopy={preventProtectedAssetAction}
			onDragStart={preventProtectedAssetAction}
		>
			<Canvas
				camera={{ position: [0, 0, 4.8], fov: 40 }}
				dpr={[1, 2]}
				gl={{ antialias: true, alpha: true }}
			>
				<ambientLight intensity={1.8} />
				<directionalLight position={[3, 4, 5]} intensity={2.8} />

				<LogoModel modelPath='/models/NMB-logo.glb' />
			</Canvas>
		</section>
	)
}
