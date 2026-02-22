import React, { useState, useEffect } from 'react';
const questions = [
    { q: 'How easily can a competitor replicate your core offer?', opts: ['Very Easily', 'Somewhat Easily', 'With Difficulty', 'Nearly Impossible'] },
    { q: 'What percentage of your revenue comes from a single acquisition channel?', opts: ['Over 80%', '50-80%', '25-50%', 'Under 25%'] },
    { q: 'How would you describe your customer data infrastructure?', opts: ['Spreadsheets / Manual', 'Basic CRM', 'Integrated CRM + Analytics', 'Full Attribution Stack'] },
    { q: 'How predictable is your month-over-month revenue growth?', opts: ['Completely Unpredictable', 'Somewhat Volatile', 'Mostly Predictable', 'Highly Predictable'] }
];
export default function MoatAudit() {
    const [step, setStep] = useState(0);
    const [scores, setScores] = useState<number[]>([]);
    const [phase, setPhase] = useState<'quiz' | 'loading' | 'result' | 'capture'>('quiz');
    const [score, setScore] = useState(0);
    const [form, setForm] = useState({ name: '', email: '', phone: '' });
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const handleAnswer = (idx: number) => {
        const newScores = [...scores, idx];
        setScores(newScores);
        if (step < questions.length - 1) { setStep(step + 1) }
        else {
            setPhase('loading');
            setTimeout(() => {
                const base = 14; const range = 24; const raw = newScores.reduce((a, b) => a + b, 0);
                const normalized = Math.floor(base + ((raw / (questions.length * 3)) * range));
                const final = Math.min(Math.max(normalized, 14), 38);
                setScore(final); setPhase('result')
            }, 2500)
        }
    };
    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.name || form.name.length < 2) e.name = 'Required';
        if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
        if (!form.phone || form.phone.length < 10) e.phone = 'Valid phone required';
        setErrors(e); return Object.keys(e).length === 0
    };
    const submitLead = async () => {
        if (!validate()) return;
        const data = { ...form, score, source: 'MoatAudit', submittedAt: new Date().toISOString(), page_url: window.location.href };
        try {
            const existing = JSON.parse(localStorage.getItem('jumpstart_leads') || '[]');
            existing.push(data); localStorage.setItem('jumpstart_leads', JSON.stringify(existing));
            await fetch('/api/submit-lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).catch(() => { })
        } catch (e) { }
        setSubmitted(true)
    };
    if (submitted) return (
        <div style={box}><div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
            <h3 style={{ color: '#fff', fontSize: '1.5rem', margin: '0 0 0.5rem' }}>Audit Request Received</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>Thanks <strong style={{ color: 'var(--accent)' }}>{form.name.split(' ')[0]}</strong>. Chris will review your {score}% moat score and reach out at <strong>{form.phone}</strong>.</p>
        </div></div>
    );
    if (phase === 'capture') return (
        <div style={box}>
            <h3 style={{ color: '#fff', fontSize: '1.35rem', margin: '0 0 0.5rem', textAlign: 'center' }}>Your Moat Score: <span style={{ color: 'var(--accent)' }}>{score}%</span></h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', margin: '0 0 1.5rem', fontSize: '0.95rem' }}>You're losing <strong style={{ color: '#ef4444' }}>{100 - score}%</strong> of potential revenue to competitors. Get your full breakdown:</p>
            {['name', 'email', 'phone'].map(f => (
                <div key={f} style={{ marginBottom: '1rem' }}>
                    <input placeholder={f === 'name' ? 'Full Name' : f === 'email' ? 'Work Email' : 'Phone Number'} value={form[f as keyof typeof form]} onChange={e => setForm({ ...form, [f]: e.target.value })} style={inputStyle} type={f === 'email' ? 'email' : f === 'phone' ? 'tel' : 'text'} />
                    {errors[f] && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{errors[f]}</span>}
                </div>
            ))}
            <button onClick={submitLead} style={btnStyle}>Get My Full Moat Report →</button>
        </div>
    );
    if (phase === 'loading') return (
        <div style={{ ...box, textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto 1.5rem', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono,monospace', fontSize: '0.9rem' }}>Analyzing your competitive moat...</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );
    return (
        <div style={box}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <span style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono,monospace', fontSize: '0.85rem' }}>0{step + 1} / 0{questions.length}</span>
                <div style={{ flex: 1, marginLeft: '1rem', height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${((step + 1) / questions.length) * 100}%`, background: 'var(--gradient-accent)', transition: 'width 0.4s ease', borderRadius: '2px' }}></div>
                </div>
            </div>
            <h3 style={{ color: '#fff', fontSize: '1.25rem', margin: '0 0 1.5rem', lineHeight: 1.4 }}>{questions[step].q}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {questions[step].opts.map((opt, i) => (
                    <button key={i} onClick={() => handleAnswer(i)} style={optStyle} onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--accent)', e.currentTarget.style.background = 'var(--accent-dim)')} onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)', e.currentTarget.style.background = 'rgba(10,10,10,0.6)')}>{opt}</button>
                ))}
            </div>
        </div>
    );
}
const box: React.CSSProperties = { background: 'rgba(10,10,10,0.6)', backdropFilter: 'blur(12px)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '2rem', maxWidth: '600px', margin: '2rem auto' };
const optStyle: React.CSSProperties = { background: 'rgba(10,10,10,0.6)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem 1.25rem', color: '#fff', cursor: 'pointer', textAlign: 'left', fontSize: '1rem', transition: 'all 0.2s', fontFamily: 'inherit' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.85rem 1rem', background: 'rgba(10,10,10,0.8)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: '#fff', fontSize: '1rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
const btnStyle: React.CSSProperties = { width: '100%', padding: '1rem', background: 'var(--gradient-accent)', color: '#050505', fontWeight: 700, fontSize: '1.05rem', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'transform 0.2s' };
