import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Points, PointMaterial } from '@react-three/drei';
import * as random from "maath/random/dist/maath-random.esm";

function StarField(props) {
    const ref = useRef();
    const [sphere] = useState(() => {
        const data = random.inSphere(new Float32Array(5000 * 3), { radius: 50 });
        // Safety check
        for (let i = 0; i < data.length; i++) {
            if (isNaN(data[i])) data[i] = 0;
        }
        return data;
    });

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.x -= delta / 30;
            ref.current.rotation.y -= delta / 40;
        }
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
                <PointMaterial
                    transparent
                    color="#ffffff"
                    size={0.05}
                    sizeAttenuation={true}
                    depthWrite={false}
                />
            </Points>
        </group>
    );
}

function RotatingBox() {
    const mesh = useRef();
    useFrame((state, delta) => (mesh.current.rotation.x += delta * 0.5));

    return (
        <mesh ref={mesh}>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial color="orange" wireframe />
        </mesh>
    );
}

export default function SpaceScene() {
    return (
        <div className="h-[500px] w-full bg-black rounded-lg overflow-hidden">
            <Canvas>
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                <StarField />
                <Float speed={2} rotationIntensity={1} floatIntensity={2}>
                    <RotatingBox />
                </Float>
            </Canvas>
        </div>
    );
}
