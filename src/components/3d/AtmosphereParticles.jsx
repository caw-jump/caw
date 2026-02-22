import React from 'react';

// Replaces heavy 3D canvas with performant CSS Holographic Grid
const AtmosphereParticles = () => {
    return (
        <div className="fixed inset-0 z-[-1] pointer-events-none bg-black overflow-hidden">
            {/* Holographic Grid Overlay */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `
                    linear-gradient(rgba(201, 169, 97, 0.05) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(201, 169, 97, 0.05) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px',
                maskImage: 'radial-gradient(circle at 50% 50%, black 30%, transparent 80%)',
                WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 30%, transparent 80%)',
                opacity: 0.6
            }} />

            {/* Ambient Gold Glow */}
            <div style={{
                position: 'absolute',
                top: '0',
                left: '50%',
                transform: 'translate(-50%, -20%)',
                width: '80vw',
                height: '80vw',
                background: 'radial-gradient(circle, rgba(201, 169, 97, 0.08) 0%, transparent 70%)',
                filter: 'blur(80px)',
                opacity: 0.8
            }} />

            {/* Floating Dust Particles (CSS Animation) */}
            <div className="dust-particles" />
            <style>{`
                .dust-particles {
                    position: absolute; inset: 0;
                    background-image: radial-gradient(#fff 1px, transparent 1px);
                    background-size: 50px 50px;
                    opacity: 0.1;
                    animation: float 20s linear infinite;
                }
                @keyframes float {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-50px); }
                }
                /* Reduced intensity on mobile */
                @media (max-width: 768px) {
                    .dust-particles {
                        opacity: 0.05;
                        background-size: 80px 80px; /* Fewer particles */
                    }
                }
            `}</style>
        </div>
    );
};

export default AtmosphereParticles;
