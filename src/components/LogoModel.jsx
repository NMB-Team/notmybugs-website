import { useFrame, useThree } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

const MODEL_PATH = '/models/NMB-logo.glb'
const FRONT_FACE_ROTATION_X = -Math.PI * 0.5
const SCREEN_Y_FLIP_SCALE = [1, -1, 1]
const LOGO_MATERIAL = new THREE.MeshStandardMaterial({
	color: '#ffffff',
	roughness: 0.5,
	metalness: 1,
})

function getTargetSize(viewport) {
	const shortestSide = Math.min(viewport.width, viewport.height)
	const aspect = viewport.width / viewport.height
	const aspectCompensation = THREE.MathUtils.clamp(aspect, 0.74, 1.18)

	return THREE.MathUtils.clamp(
		shortestSide * 0.48 * aspectCompensation,
		1.35,
		2.55,
	)
}

export default function LogoModel({ modelPath = MODEL_PATH }) {
	const groupRef = useRef()
	const dragRef = useRef({
		active: false,
		pointerId: null,
		lastX: 0,
		lastY: 0,
		targetX: 0,
		targetY: 0,
		idleDirection: 1,
	})
	const pointerRef = useRef({ x: 0, previousX: 0, moveX: 0 })
	const { gl, viewport } = useThree()
	const [scene, setScene] = useState(null)
	const model = useMemo(() => scene?.clone(true), [scene])
	const modelScale = useMemo(() => {
		if (!scene) {
			return 1
		}

		const box = new THREE.Box3().setFromObject(scene)
		const size = box.getSize(new THREE.Vector3())
		const maxSize = Math.max(size.x, size.y, size.z)

		return maxSize > 0 ? 1 / maxSize : 1
	}, [scene])

	useEffect(() => {
		let active = true
		const loader = new GLTFLoader()

		const loadModel = async () => {
			try {
				const response = await fetch(modelPath, { method: 'HEAD' })
				const contentType = response.headers.get('content-type') || ''

				if (!response.ok || contentType.includes('text/html')) {
					console.error(`NMB logo model was not found at ${modelPath}`)
					return
				}

				loader.load(
					modelPath,
					gltf => {
						if (active) {
							gltf.scene.traverse(object => {
								if (object.isMesh) {
									object.castShadow = false
									object.receiveShadow = false
									object.material = LOGO_MATERIAL
								}
							})
							setScene(gltf.scene)
						}
					},
					undefined,
					error => {
						console.error(
							`Unable to load NMB logo model from ${modelPath}`,
							error,
						)
					},
				)
			} catch (error) {
				console.error(`Unable to load NMB logo model from ${modelPath}`, error)
			}
		}

		loadModel()

		return () => {
			active = false
		}
	}, [modelPath])

	useLayoutEffect(() => {
		if (!model) {
			return
		}

		const box = new THREE.Box3().setFromObject(model)
		const center = box.getCenter(new THREE.Vector3())
		model.position.set(-center.x, -center.y, -center.z)
	}, [model])

	useEffect(() => {
		const canvas = gl.domElement
		const state = dragRef.current

		const onPointerMove = event => {
			const pointer = pointerRef.current
			const deltaPointerX = event.clientX - pointer.previousX
			pointer.x = event.clientX
			pointer.moveX = THREE.MathUtils.clamp(deltaPointerX, -24, 24)
			pointer.previousX = event.clientX

			if (!state.active) {
				return
			}

			if (Math.abs(deltaPointerX) > 0.5) {
				state.idleDirection = deltaPointerX > 0 ? 1 : -1
			}

			const deltaX = event.clientX - state.lastX
			const deltaY = event.clientY - state.lastY
			state.targetY += deltaX * 0.01
			state.targetX = THREE.MathUtils.clamp(
				state.targetX + deltaY * 0.008,
				-0.55,
				0.55,
			)
			state.lastX = event.clientX
			state.lastY = event.clientY
		}

		const onPointerDown = event => {
			state.active = true
			state.pointerId = event.pointerId
			state.lastX = event.clientX
			state.lastY = event.clientY
			canvas.setPointerCapture(event.pointerId)
		}

		const onPointerUp = () => {
			state.active = false
			state.pointerId = null
		}

		window.addEventListener('pointermove', onPointerMove)
		canvas.addEventListener('pointerdown', onPointerDown)
		canvas.addEventListener('pointerup', onPointerUp)
		canvas.addEventListener('pointercancel', onPointerUp)

		return () => {
			window.removeEventListener('pointermove', onPointerMove)
			canvas.removeEventListener('pointerdown', onPointerDown)
			canvas.removeEventListener('pointerup', onPointerUp)
			canvas.removeEventListener('pointercancel', onPointerUp)
		}
	}, [gl])

	useFrame((_, delta) => {
		const group = groupRef.current
		if (!group) {
			return
		}

		const state = dragRef.current
		const pointer = pointerRef.current
		const damping = 1 - Math.exp(-delta * 7)
		const targetScale = modelScale * getTargetSize(viewport)

		state.targetY += state.idleDirection * delta * 0.12

		if (!state.active) {
			state.targetX = THREE.MathUtils.lerp(
				state.targetX,
				0,
				1 - Math.exp(-delta * 2.8),
			)
			pointer.moveX = THREE.MathUtils.lerp(pointer.moveX, 0, 0.04)
		}

		group.rotation.x = THREE.MathUtils.lerp(
			group.rotation.x,
			state.targetX,
			damping,
		)
		group.rotation.y = THREE.MathUtils.lerp(
			group.rotation.y,
			state.targetY,
			damping,
		)
		group.scale.setScalar(
			THREE.MathUtils.lerp(
				group.scale.x,
				targetScale,
				1 - Math.exp(-delta * 5),
			),
		)
	})

	const initialScale = modelScale * getTargetSize(viewport)

	return (
		<group ref={groupRef} scale={initialScale}>
			{model && (
				<group scale={SCREEN_Y_FLIP_SCALE}>
					<group rotation={[FRONT_FACE_ROTATION_X, 0, 0]}>
						<primitive object={model} />
					</group>
				</group>
			)}
		</group>
	)
}
