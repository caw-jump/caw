import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ContactFormState {
    name: string;
    email: string;
    message: string;
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    utm_content?: string;
    utm_term?: string;
    page_url?: string;
    [key: string]: string | undefined;
}

const ContactForm = () => {
    const [formData, setFormData] = useState<ContactFormState>({
        name: '',
        email: '',
        message: '',
        utm_source: '',
        utm_medium: '',
        utm_campaign: ''
    });

    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    // Capture UTMs on Load
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const params = new URLSearchParams(window.location.search);
        const utms: Record<string, string> = {};
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(key => {
            const val = params.get(key);
            if (val) utms[key] = val;
        });
        utms.page_url = window.location.href;

        if (Object.keys(utms).length > 0) {
            setFormData(prev => ({ ...prev, ...utms }));
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');

        try {
            const submissionData = {
                ...formData,
                submittedAt: new Date().toISOString(),
                userAgent: navigator.userAgent,
                formType: 'contact_form'
            };

            // 1. Postgres Internal API
            await fetch('/api/submit-lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionData)
            }).catch(err => console.warn('Postgres save fail:', err));

            // 2. Webhook (optional) - only when env set; no hardcoded fallback
            const webhook = typeof import.meta !== 'undefined' && (import.meta as any).env?.PUBLIC_N8N_WEBHOOK;

            if (webhook) {
                await fetch(webhook, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(submissionData)
                }).catch(err => console.warn('Webhook save fail:', err));
            }

            setStatus('success');
            setFormData(prev => ({ ...prev, name: '', email: '', message: '' })); // Reset display fields
        } catch (error) {
            console.error('Submission error:', error);
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <div className="glass-card p-12 text-center">
                <h3 className="text-3xl font-bold mb-4 text-accent">Message Sent!</h3>
                <p className="text-white/80">Thanks for reaching out {formData.name.split(' ')[0]}. We'll get back to you shortly.</p>
                <button
                    onClick={() => setStatus('idle')}
                    className="mt-8 text-sm text-accent underline hover:text-white transition"
                >
                    Send another message
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="glass-card p-12 space-y-8">
            <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full p-6 bg-bg-card border border-border rounded-2xl focus:border-accent transition text-white outline-none"
            />
            <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full p-6 bg-bg-card border border-border rounded-2xl focus:border-accent transition text-white outline-none"
            />
            <textarea
                name="message"
                placeholder="Message"
                rows={8}
                value={formData.message}
                onChange={handleChange}
                required
                className="w-full p-6 bg-bg-card border border-border rounded-2xl focus:border-accent transition text-white outline-none"
            ></textarea>

            <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full py-6 bg-accent text-black font-bold text-xl rounded-2xl hover:scale-105 transition disabled:opacity-50 disabled:scale-100"
            >
                {status === 'submitting' ? 'Sending...' : 'Send Message'}
            </button>

            {status === 'error' && (
                <p className="text-red-400 text-center">Something went wrong. Please try again.</p>
            )}
        </form>
    );
};

export default ContactForm;
