import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Terminal, Zap, Database, Award, Briefcase, Cpu, X,
    BarChart3, Rocket, BarChart2, Menu, Shield, Settings,
    Globe, Lock, ArrowRight, User
} from 'lucide-react';
import './NexusModal.css'; // Re-use existing premium styles

const CommandStation = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('protocols'); // protocols | intel | system
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const toggleMenu = () => setIsOpen(!isOpen);

    // Database of ALL Pages
    const masterIndex = [
        // JUMPSTART PROTOCOLS
        {
            id: 'paid-ads',
            title: 'Paid Acquisition Engine',
            desc: 'Turn ad spend into predictable revenue. Google, Meta, LinkedIn.',
            href: '/services/paid-acquisition',
            icon: Rocket,
            category: 'protocols'
        },
        {
            id: 'funnels',
            title: 'Funnel Architecture',
            desc: 'High-converting landing pages and CRO systems.',
            href: '/services/funnel-architecture',
            icon: Zap,
            category: 'protocols'
        },
        {
            id: 'crm',
            title: 'CRM Transformation',
            desc: 'Automated pipelines and lead nurturing systems.',
            href: '/services/crm-transformation',
            icon: Database,
            category: 'protocols'
        },
        {
            id: 'data',
            title: 'Data & Attribution',
            desc: 'Server-side tracking and ROAS truth.',
            href: '/services/data-attribution',
            icon: BarChart3,
            category: 'protocols'
        },
        {
            id: 'authority',
            title: 'Authority Engine',
            desc: 'Market domination content strategy.',
            href: '/services/authority-engine',
            icon: Award,
            category: 'protocols'
        },
        {
            id: 'retainer',
            title: 'Growth Retainer',
            desc: 'Full-stack growth team implementation.',
            href: '/services/growth-retainer',
            icon: Briefcase,
            category: 'protocols'
        },

        // JUMPSTART INTEL
        {
            id: 'intel-index',
            title: 'Intelligence Database',
            desc: 'Classified growth strategies and tactical briefings.',
            href: '/intel',
            icon: Cpu,
            category: 'intel'
        },
        {
            id: 'intel-crm',
            title: 'CRM Automation Growth',
            desc: 'Deep dive into automation logic.',
            href: '/intel/crm-automation-growth',
            icon: Settings,
            category: 'intel'
        },
        {
            id: 'intel-market',
            title: 'Market Domination',
            desc: 'Strategy for capturing market share.',
            href: '/intel/market-domination-strategy',
            icon: Globe,
            category: 'intel'
        },

        // CHRIS AMAYA (SYSTEM)
        {
            id: 'ca-home',
            title: 'Mainframe Access',
            desc: 'Chris Amaya Personal Site. Technical Architecture.',
            href: 'https://chrisamaya.work',
            icon: Terminal,
            category: 'system',
            external: true
        },
        {
            id: 'ca-contact',
            title: 'Book Technical Audit',
            desc: 'Schedule a session with the Architect.',
            href: 'https://chrisamaya.work#contact',
            icon: User,
            category: 'system',
            external: true
        }
    ];

    // Filter Items by active tab only (search removed for better mobile UX)
    const filteredItems = masterIndex.filter(item => item.category === activeTab);

    const NexusContent = () => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="nav-modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) toggleMenu(); }}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="nexus-card command-station holographic-card"
            >
                {/* Floating Close Button */}
                <button onClick={toggleMenu} className="close-btn-floating" aria-label="Close Command Station">
                    <X size={20} />
                </button>

                <div className="nexus-body">
                    {/* SIDEBAR TABS (Desktop) */}
                    <div className="nexus-sidebar desktop-only">
                        <button className={`nexus-tab ${activeTab === 'protocols' ? 'active' : ''}`} onClick={() => setActiveTab('protocols')}>
                            <Shield size={16} /> Protocols
                        </button>
                        <button className={`nexus-tab ${activeTab === 'intel' ? 'active' : ''}`} onClick={() => setActiveTab('intel')}>
                            <Cpu size={16} /> Intelligence
                        </button>
                        <button className={`nexus-tab ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>
                            <Settings size={16} /> System
                        </button>
                    </div>

                    {/* TOP TABS (Mobile) */}
                    <div className="nexus-mobile-tabs mobile-only">
                        <button className={`nexus-mobile-tab ${activeTab === 'protocols' ? 'active' : ''}`} onClick={() => setActiveTab('protocols')} aria-label="Protocols">
                            <Shield size={16} />
                        </button>
                        <button className={`nexus-mobile-tab ${activeTab === 'intel' ? 'active' : ''}`} onClick={() => setActiveTab('intel')} aria-label="Intelligence">
                            <Cpu size={16} />
                        </button>
                        <button className={`nexus-mobile-tab ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')} aria-label="System">
                            <Settings size={16} />
                        </button>
                    </div>

                    {/* CONTENT GRID */}
                    <div className="nexus-grid-area">
                        {filteredItems.length === 0 ? (
                            <div className="empty-state">
                                <Lock size={40} color="#333" />
                                <p>No records found in database.</p>
                            </div>
                        ) : (
                            <div className="protocol-grid">
                                {filteredItems.map((item, i) => (
                                    <motion.a
                                        key={item.id}
                                        href={item.href}
                                        className="protocol-card"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        target={item.external ? "_blank" : "_self"}
                                    >
                                        <div className="icon-box">
                                            <item.icon size={24} />
                                        </div>
                                        <div className="info-box">
                                            <h4>{item.title}</h4>
                                            <p>{item.desc}</p>
                                        </div>
                                        <div className="arrow-box">
                                            <ArrowRight size={16} />
                                        </div>
                                    </motion.a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* FOOTER STATUS */}
                <div className="nexus-footer">
                    <div className="stat">
                        <span className="label">SERVER</span>
                        <span className="val">ORACLE ARM64</span>
                    </div>
                    <div className="stat">
                        <span className="label">DB STATUS</span>
                        <span className="val good">CONNECTED</span>
                    </div>
                </div>

            </motion.div>
        </motion.div>
    );

    // Bottom Quick Nav (Mobile/Desktop)
    const QuickNavBar = () => (
        <nav className="quick-nav-react">
            <button className="quick-link-react menu-trigger" onClick={toggleMenu}>
                <Menu size={20} className="icon" />
                <span className="label">MENU</span>
            </button>
            <a href="/#survey" className="quick-link-react">
                <Rocket size={18} className="icon" />
                <span className="label">AUDIT</span>
            </a>
            <a href="/services/paid-acquisition" className="quick-link-react">
                <BarChart2 size={18} className="icon" />
                <span className="label">ADS</span>
            </a>
            <a href="https://chrisamaya.work" target="_blank" className="quick-link-react">
                <Terminal size={18} className="icon" />
                <span className="label">DEV</span>
            </a>
        </nav>
    );

    return (
        <>
            {/* Header Trigger Button (Desktop) */}
            <button onClick={toggleMenu} className="start-mission-btn">
                <Terminal size={16} />
                <span>COMMAND STATION</span>
            </button>

            {/* Injected Content - simplified for reliability */}
            {mounted && isOpen && createPortal(<NexusContent />, document.body)}

            {mounted && createPortal(<QuickNavBar />, document.body)}


        </>
    );
};

export default CommandStation;
