import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Terminal,
    Zap,
    Database,
    Award,
    Briefcase,
    Cpu,
    X,
    Search,
    BarChart3,
    Rocket,
    BarChart2,
    Calculator,
    Menu,
    Shield,
    Settings
} from 'lucide-react';
import './NexusModal.css';

const NavigationModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('protocols');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const toggleMenu = () => setIsOpen(!isOpen);

    // Lock Body Scroll
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    // Navigation Handler
    const handleNavigation = (target) => {
        if (target.startsWith('#')) {
            const element = document.querySelector(target) || document.getElementById(target.replace('#', ''));
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: target === '#visuals' ? 'start' : 'center' });
                setIsOpen(false);
                return;
            }
        } else if (target === 'tools') {
            const calc = document.querySelector('.roas-calculator-card, .funnel-calc-card, .ltv-card');
            const services = document.querySelector('.services-section');
            if (calc) {
                calc.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setIsOpen(false);
                return;
            } else if (services) {
                services.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setIsOpen(false);
                return;
            }
        }

        // Redirects
        if (target === '#survey') window.location.href = '/#survey';
        else if (target === '#visuals') window.location.href = '/#visuals';
        else if (target === 'tools') window.location.href = '/services/paid-acquisition';

        setIsOpen(false);
    };

    const protocols = [
        { label: 'Strategic Methodology', desc: '90-Day Scaling Roadmap', href: '/services/paid-acquisition', icon: Search },
        { label: 'Funnel Architecture', desc: 'CRO & Landing Pages', href: '/services/funnel-architecture', icon: Zap },
        { label: 'CRM Systems', desc: 'Automated Lead Nurture', href: '/services/crm-transformation', icon: Database },
        { label: 'Data & Attribution', desc: 'Server-Side Tracking', href: '/services/data-attribution', icon: BarChart3 },
        { label: 'Authority Engine', desc: 'Market Domination Content', href: '/services/authority-engine', icon: Award },
        { label: 'Growth Retainer', desc: 'Full-Service Growth Team', href: '/services/growth-retainer', icon: Briefcase },
    ];

    const NexusContent = () => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="nav-modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) toggleMenu(); }}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                className="nexus-card"
            >
                {/* Sidebar */}
                <div className="nexus-sidebar">
                    <div className="nexus-logo">NEXUS v2.1</div>
                    <div className="nexus-tabs">
                        <button
                            className={`nexus-tab ${activeTab === 'protocols' ? 'active' : ''}`}
                            onClick={() => setActiveTab('protocols')}
                        >
                            <Shield size={16} /> Protocols
                        </button>
                        <button
                            className={`nexus-tab ${activeTab === 'intel' ? 'active' : ''}`}
                            onClick={() => setActiveTab('intel')}
                        >
                            <Cpu size={16} /> Intelligence
                        </button>
                        <button
                            className={`nexus-tab ${activeTab === 'system' ? 'active' : ''}`}
                            onClick={() => setActiveTab('system')}
                        >
                            <Settings size={16} /> System
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="nexus-content">
                    <div className="nexus-header">
                        <div className="nexus-title">
                            {activeTab === 'protocols' && 'Active Protocols'}
                            {activeTab === 'intel' && 'Intelligence Database'}
                            {activeTab === 'system' && 'System Status'}
                        </div>
                        <button onClick={toggleMenu} className="close-btn-nexus">
                            <X size={20} />
                        </button>
                    </div>

                    {activeTab === 'protocols' && (
                        <div className="protocol-grid">
                            {protocols.map((p, i) => (
                                <motion.a
                                    key={p.href}
                                    href={p.href}
                                    className="protocol-card"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <p.icon size={20} className="p-icon" />
                                    <div className="p-info">
                                        <span className="p-title">{p.label}</span>
                                        <span className="p-desc">{p.desc}</span>
                                    </div>
                                </motion.a>
                            ))}
                        </div>
                    )}

                    {activeTab === 'intel' && (
                        <div className="protocol-grid">
                            <motion.a
                                href="/intel"
                                className="protocol-card"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Cpu size={20} className="p-icon" />
                                <div className="p-info">
                                    <span className="p-title">Knowledge Base Index</span>
                                    <span className="p-desc">Access classified growth strategies.</span>
                                </div>
                            </motion.a>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div style={{ color: '#888', fontSize: '0.9rem', lineHeight: '1.6' }}>
                            <p style={{ marginBottom: '1rem' }}><strong style={{ color: '#fff' }}>SERVER:</strong> ORACLE ARM64 (OPT-1)</p>
                            <p style={{ marginBottom: '1rem' }}><strong style={{ color: '#fff' }}>NODE:</strong> v20.19.6 [Stable]</p>
                            <p style={{ marginBottom: '1rem' }}><strong style={{ color: '#fff' }}>STATUS:</strong> OPERATIONAL</p>

                            <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '1.5rem 0' }} />

                            <a href="https://chrisamaya.work" target="_blank" style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                color: '#C9A961', textDecoration: 'none', fontWeight: 'bold'
                            }}>
                                <Terminal size={14} /> Connect to Mainframe (ChrisAmaya.work)
                            </a>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );

    const QuickNavBar = () => (
        <nav className="quick-nav-react">
            <button className="quick-link-react menu-trigger" onClick={toggleMenu}>
                <Menu size={20} className="icon" />
                <span className="label">Menu</span>
            </button>
            <button className="quick-link-react" onClick={() => handleNavigation('#survey')}>
                <Rocket size={18} className="icon" />
                <span className="label">Audit</span>
            </button>
            <button className="quick-link-react" onClick={() => handleNavigation('#visuals')}>
                <BarChart2 size={18} className="icon" />
                <span className="label">Charts</span>
            </button>
            <button className="quick-link-react" id="tools-link" onClick={() => handleNavigation('tools')}>
                <Calculator size={18} className="icon" />
                <span className="label">Tools</span>
            </button>
        </nav>
    );

    return (
        <>
            {/* Header Trigger */}
            <button
                onClick={toggleMenu}
                className="start-mission-btn"
                aria-label="Open System Menu"
            >
                <Terminal size={16} />
                <span>START MISSION</span>
            </button>

            {/* Portaled Elements */}
            <AnimatePresence>
                {isOpen && mounted && createPortal(<NexusContent />, document.body)}
            </AnimatePresence>

            {/* QuickNav - Always rendered */}
            {mounted && createPortal(<QuickNavBar />, document.body)}

            {/* Inline styles for QuickNav to ensure they persist even if CSS fails to load */}
            <style>{`
                .quick-nav-react {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 90%;
                    max-width: 450px;
                    background: rgba(15, 15, 15, 0.85);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 50px;
                    display: flex;
                    justify-content: space-evenly;
                    align-items: center;
                    padding: 0.6rem 2rem;
                    z-index: 9900;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.6);
                    transition: all 0.3s ease;
                }
                .quick-nav-react:hover {
                    background: rgba(15, 15, 15, 0.95);
                    border-color: rgba(201, 169, 97, 0.3);
                    transform: translateX(-50%) translateY(-2px);
                }
                .quick-link-react {
                    background: none;
                    border: none;
                    text-decoration: none;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    color: #999;
                    font-size: 0.75rem;
                    font-weight: 500;
                    transition: all 0.2s;
                    min-width: 50px;
                    position: relative;
                    font-family: 'Inter', sans-serif;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                }
                .quick-link-react:hover { color: #fff; }
                .quick-link-react:hover .icon { transform: scale(1.1); }
                .menu-trigger { order: -1; }
            `}</style>
        </>
    );
};

export default NavigationModal;
