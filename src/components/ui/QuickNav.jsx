import React, { useEffect } from 'react';
import { Rocket, BarChart2, Calculator, Menu } from 'lucide-react';
import './NavigationModal.css'; // Reuse CSS or define new

const QuickNav = () => {
    const handleScroll = (id) => {
        const element = document.querySelector(id) || document.getElementById(id.replace('#', ''));
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleToolsClick = () => {
        const calc = document.querySelector('.roas-calculator-card, .funnel-calc-card, .ltv-card');
        const services = document.querySelector('.services-section');
        if (calc) {
            calc.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (services) {
            services.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            window.location.href = '/services/paid-acquisition';
        }
    };

    const toggleMenu = () => {
        console.log('React QuickNav: Dispatching open-nav-modal');
        // Dispatch standard custom event works across vanilla and React
        window.dispatchEvent(new CustomEvent('open-nav-modal'));
    };

    return (
        <nav className="quick-nav-react">
            <button className="quick-link-react menu-trigger" onClick={toggleMenu}>
                <Menu size={20} className="icon" />
                <span className="label">Menu</span>
            </button>
            <button className="quick-link-react" onClick={() => handleScroll('#survey')}>
                <Rocket size={18} className="icon" />
                <span className="label">Audit</span>
            </button>
            <button className="quick-link-react" onClick={() => handleScroll('.visuals-section')}>
                <BarChart2 size={18} className="icon" />
                <span className="label">Charts</span>
            </button>
            <button className="quick-link-react" id="tools-link" onClick={handleToolsClick}>
                <Calculator size={18} className="icon" />
                <span className="label">Tools</span>
            </button>

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
                    z-index: 9900; /* Just below modal */
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

                .quick-link-react .icon {
                    margin-bottom: 4px;
                    transition: transform 0.2s;
                }

                .quick-link-react:hover {
                    color: #fff;
                }
                
                .quick-link-react:hover .icon {
                    transform: scale(1.1);
                }

                /* Specific for Menu button to ensure it stands out subtly */
                .menu-trigger {
                    order: -1;
                }
            `}</style>
        </nav>
    );
};

export default QuickNav;
