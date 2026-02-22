// src/components/visuals/AtmosphereParticles.tsx
// Lightweight CSS-based particle effect — no Three.js needed
import { useEffect, useRef } from 'react';

interface Props {
    variant?: 'subtle' | 'intense' | 'nebula' | 'sparkle';
}

export default function AtmosphereParticles({ variant = 'subtle' }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);

    const config = {
        subtle: { count: 60, speed: 0.3, maxSize: 2, opacity: 0.4 },
        intense: { count: 120, speed: 0.6, maxSize: 3, opacity: 0.7 },
        nebula: { count: 80, speed: 0.2, maxSize: 4, opacity: 0.5 },
        sparkle: { count: 100, speed: 0.8, maxSize: 1.5, opacity: 0.8 },
    }[variant];

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let w = window.innerWidth;
        let h = window.innerHeight;
        canvas.width = w;
        canvas.height = h;

        // Create particles
        const particles = Array.from({ length: config.count }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * config.speed,
            vy: (Math.random() - 0.5) * config.speed - 0.1,
            size: Math.random() * config.maxSize + 0.5,
            alpha: Math.random() * config.opacity,
            pulse: Math.random() * Math.PI * 2,
        }));

        const accentColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--accent').trim() || '#C9A961';

        // Parse hex to RGB
        const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result
                ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
                : { r: 201, g: 169, b: 97 }; // fallback gold
        };

        const rgb = hexToRgb(accentColor);

        const handleResize = () => {
            w = window.innerWidth;
            h = window.innerHeight;
            canvas.width = w;
            canvas.height = h;
        };

        window.addEventListener('resize', handleResize);

        const animate = () => {
            ctx.clearRect(0, 0, w, h);

            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                p.pulse += 0.02;

                // Wrap around edges
                if (p.x < 0) p.x = w;
                if (p.x > w) p.x = 0;
                if (p.y < 0) p.y = h;
                if (p.y > h) p.y = 0;

                const flickerAlpha = p.alpha * (0.5 + 0.5 * Math.sin(p.pulse));

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${flickerAlpha})`;
                ctx.fill();

                // Glow effect
                if (p.size > 1.5) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${flickerAlpha * 0.15})`;
                    ctx.fill();
                }
            }

            animRef.current = requestAnimationFrame(animate);
        };

        animRef.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animRef.current);
            window.removeEventListener('resize', handleResize);
        };
    }, [variant]);

    return (
        <div className="fixed inset-0 -z-10 pointer-events-none">
            <canvas
                ref={canvasRef}
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                }}
            />
        </div>
    );
}
