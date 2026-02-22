import { motion } from 'framer-motion';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function InteractiveROICalculator() {
    const [spend, setSpend] = useState(50000);
    const [currentROAS, setCurrentROAS] = useState(3);
    const [authorityBoost] = useState(4); // Fixed 4x improvement demo

    const data = Array.from({ length: 12 }, (_, i) => ({
        month: `Month ${i + 1}`,
        current: spend * currentROAS * (1 + i * 0.05),
        withAuthority: spend * currentROAS * authorityBoost * (1 + i * 0.15)
    }));

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="glass-card my-20 p-8 max-w-5xl mx-auto"
        >
            <h3 className="text-3xl font-bold gradient-text text-center mb-8">Project Your Growth With Authority</h3>
            <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div>
                    <label className="block text-xl mb-4 text-[var(--text-secondary)]">Monthly Ad Spend ($)</label>
                    <input type="range" min="10000" max="200000" step="10000" value={spend} onChange={e => setSpend(Number(e.target.value))} className="w-full accent-[var(--accent)] h-2 bg-[var(--surface)] rounded-lg appearance-none cursor-pointer" />
                    <p className="text-center text-2xl font-mono mt-2">${spend.toLocaleString()}</p>
                </div>
                <div>
                    <label className="block text-xl mb-4 text-[var(--text-secondary)]">Current ROAS</label>
                    <input type="range" min="1" max="8" step="0.5" value={currentROAS} onChange={e => setCurrentROAS(Number(e.target.value))} className="w-full accent-[var(--accent)] h-2 bg-[var(--surface)] rounded-lg appearance-none cursor-pointer" />
                    <p className="text-center text-2xl font-mono mt-2">{currentROAS}x</p>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                    <p className="text-[var(--text-secondary)] mb-1">With Authority Engine</p>
                    <p className="text-2xl font-bold"><span className="gradient-text text-5xl">{(currentROAS * authorityBoost).toFixed(1)}x</span> ROAS</p>
                </div>
            </div>
            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="month" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                        <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} tickFormatter={value => `$${value / 1000}k`} />
                        <Tooltip
                            formatter={(v: number) => [`$${Number(v).toLocaleString()}`, 'Revenue']}
                            labelStyle={{ color: 'var(--text-primary)' }}
                            itemStyle={{ color: 'var(--text-primary)' }}
                            contentStyle={{ background: '#0A0A0A', border: '1px solid var(--accent)', borderRadius: '8px' }}
                        />
                        <Line type="monotone" dataKey="current" stroke="var(--text-secondary)" strokeWidth={2} name="Current Trajectory" dot={false} />
                        <Line type="monotone" dataKey="withAuthority" stroke="var(--accent)" strokeWidth={4} name="With Authority Engine" dot={{ r: 4, fill: 'var(--accent)' }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <p className="text-center mt-8 text-xl text-[var(--text-secondary)]">
                <span className="text-[var(--accent)] font-bold">4x efficiency gain</span> ➔ <span className="text-white font-bold">${((data[11].withAuthority - data[11].current) / 1000000).toFixed(1)}M</span> extra revenue projected in Year 1
            </p>
        </motion.div>
    );
}
