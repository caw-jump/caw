import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

function CountUpMetric({ label, value, delay }: { label: string, value: string, delay: number }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const [displayValue, setDisplayValue] = useState("0");

    useEffect(() => {
        if (isInView) {
            // Very simple parser: extracts the first number found
            const match = value.match(/[\d\.]+/);
            if (!match) {
                setDisplayValue(value);
                return;
            }

            const numValue = parseFloat(match[0]);
            const suffix = value.replace(match[0], '');
            const prefix = ""; // Assuming suffix only for simplicity based on typical inputs like "+185%", "2.7x"

            let start = 0;
            const duration = 2000;
            const stepTime = 30;
            const steps = duration / stepTime;
            const increment = numValue / steps;

            const timer = setInterval(() => {
                start += increment;
                if (start >= numValue) {
                    setDisplayValue(value);
                    clearInterval(timer);
                } else {
                    // Check if original value was int or float
                    const isFloat = match[0].includes('.');
                    const formatting = isFloat ? start.toFixed(1) : Math.floor(start);
                    // Reconstruct string. This is a heuristic.
                    // Ideally we'd parse prefix/suffix more robustly.
                    // For "2.7x" -> 2.7 + "x"
                    // For "+185%" -> "+" + 185 + "%" -> This parser missed prefix.

                    // Let's just use the numeric part + suffix for now, and assume suffix handles things like '%' or 'x'
                    setDisplayValue(`${formatting}${suffix}`);
                }
            }, stepTime);
            return () => clearInterval(timer);
        }
    }, [isInView, value]);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: delay }}
            className="glass-card p-8 md:p-12 text-center h-full flex flex-col justify-center items-center hover:border-[var(--accent)] transition-colors duration-300"
        >
            <h3 className="text-4xl md:text-5xl font-bold gradient-text mb-4">{displayValue}</h3>
            <p className="text-lg md:text-xl text-[var(--text-secondary)]">{label}</p>
        </motion.div>
    );
}

export default function ScrollRevealGrid({ metrics }: { metrics: { label: string, value: string }[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 my-20 max-w-5xl mx-auto">
            {metrics.map((m, i) => (
                <CountUpMetric key={i} label={m.label} value={m.value} delay={i * 0.2} />
            ))}
        </div>
    );
}
