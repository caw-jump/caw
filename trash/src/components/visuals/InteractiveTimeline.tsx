import { motion } from 'framer-motion';
import { useState } from 'react';

export default function InteractiveTimeline({ steps }: { steps: { title: string; content: string }[] }) {
    const [active, setActive] = useState<number | null>(null);
    return (
        <div className="timeline relative my-20 max-w-5xl mx-auto">
            <div className="absolute left-6 top-0 bottom-0 w-1 bg-[var(--accent-dim)]" />
            {steps.map((step, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.2 }}
                    className="flex gap-8 mb-20 last:mb-0 cursor-pointer"
                    onClick={() => setActive(active === i ? null : i)}
                >
                    <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center text-black font-bold text-xl z-10 shrink-0 border-4 border-[var(--bg)]">
                        {i + 1}
                    </div>
                    <motion.div
                        className={`flex-1 glass-card p-8 transition-all duration-300 ${active === i ? 'border-[var(--accent)] shadow-2xl bg-[var(--surface)]/80' : ''}`}
                        animate={{ scale: active === i ? 1.05 : 1 }}
                    >
                        <h3 className="text-2xl font-bold gradient-text mb-4">{step.title}</h3>
                        <motion.div
                            className="prose prose-invert overflow-hidden"
                            initial={{ maxHeight: '5rem' }}
                            animate={{ maxHeight: active === i ? '1000px' : '5rem' }}
                            transition={{ duration: 0.5 }}
                        >
                            <div dangerouslySetInnerHTML={{ __html: step.content }} className="text-[var(--text-secondary)]" />
                        </motion.div>
                        {active !== i && <p className="text-[var(--accent)] mt-4 text-sm font-bold uppercase tracking-widest">Click to expand →</p>}
                    </motion.div>
                </motion.div>
            ))}
        </div>
    );
}
