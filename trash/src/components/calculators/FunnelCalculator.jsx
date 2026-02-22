import React, { useState, useEffect } from 'react';

const FunnelCalculator = () => {
    const [traffic, setTraffic] = useState(1000);
    const [optinRate, setOptinRate] = useState(15); // Landing Page Conversion
    const [closeRate, setCloseRate] = useState(10); // Sales Close Rate
    const [ticketPrice, setTicketPrice] = useState(2500);

    const [results, setResults] = useState({
        leads: 0,
        sales: 0,
        revenue: 0,
        rpl: 0 // Revenue Per Lead
    });

    useEffect(() => {
        const leads = Math.round(traffic * (optinRate / 100));
        const sales = Math.round(leads * (closeRate / 100));
        const revenue = sales * ticketPrice;
        const rpl = leads > 0 ? revenue / leads : 0;

        setResults({ leads, sales, revenue, rpl });
    }, [traffic, optinRate, closeRate, ticketPrice]);

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    return (
        <div className="funnel-calc-card">
            <div className="calc-header">
                <h3>⚡ Funnel Velocity Simulator</h3>
                <p>The impact of fixing a "Leaky Bucket".</p>
            </div>

            <div className="calc-flex">
                <div className="inputs-col">
                    <div className="input-row">
                        <label>
                            Monthly Traffic
                            <input type="number" value={traffic} onChange={(e) => setTraffic(Number(e.target.value))} />
                        </label>
                    </div>
                    <div className="input-row">
                        <label>
                            Landing Page Conv. Rate (%)
                            <input type="number" step="0.5" value={optinRate} onChange={(e) => setOptinRate(Number(e.target.value))} />
                        </label>
                    </div>
                    <div className="input-row">
                        <label>
                            Sales Close Rate (%)
                            <input type="number" step="1" value={closeRate} onChange={(e) => setCloseRate(Number(e.target.value))} />
                        </label>
                    </div>
                    <div className="input-row">
                        <label>
                            Offer Price ($)
                            <input type="number" value={ticketPrice} onChange={(e) => setTicketPrice(Number(e.target.value))} />
                        </label>
                    </div>
                </div>

                <div className="visual-col">
                    <div className="funnel-step top">
                        <span>{traffic.toLocaleString()} Visitors</span>
                    </div>
                    <div className="arrow">↓</div>
                    <div className="funnel-step middle">
                        <span>{results.leads.toLocaleString()} Leads</span>
                        <small>({optinRate}%)</small>
                    </div>
                    <div className="arrow">↓</div>
                    <div className="funnel-step bottom">
                        <span>{results.sales.toLocaleString()} Sales</span>
                        <small>({closeRate}%)</small>
                    </div>

                    <div className="total-revenue">
                        <span>Total Revenue</span>
                        <strong>{formatCurrency(results.revenue)}</strong>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .funnel-calc-card {
          background: #000;
          border: 1px solid #333;
          border-radius: 12px;
          padding: 2rem;
          margin: 3rem 0;
          font-family: 'Inter', sans-serif;
        }
        .calc-header h3 { color: #fff; margin-bottom: 0.5rem; }
        .calc-header p { color: #666; font-size: 0.9rem; margin-bottom: 2rem; }
        
        .calc-flex { display: flex; gap: 3rem; align-items: center; }
        @media (max-width: 768px) { .calc-flex { flex-direction: column; } }
        
        .inputs-col { flex: 1; }
        .input-row { margin-bottom: 1rem; }
        .input-row label { display: block; font-size: 0.85rem; color: #aaa; font-weight: 500; }
        .input-row input { 
          width: 100%; padding: 0.75rem; background: #111; 
          border: 1px solid #333; color: #fff; border-radius: 4px;
        }
        
        .visual-col { flex: 1; text-align: center; }
        .funnel-step {
          background: rgba(255,255,255,0.05);
          margin: 0 auto;
          display: flex; flex-direction: column; justify-content: center;
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff; font-weight: 600;
        }
        .top { width: 100%; height: 60px; border-radius: 8px 8px 0 0; }
        .middle { width: 70%; height: 60px; background: rgba(201,169,97,0.1); border-color: #C9A961; }
        .bottom { width: 40%; height: 60px; background: rgba(201,169,97,0.3); border-color: #C9A961; border-radius: 0 0 8px 8px; }
        
        .arrow { color: #555; font-size: 1.25rem; margin: 5px 0; }
        
        .total-revenue { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px dashed #333; }
        .total-revenue span { display: block; font-size: 0.9rem; color: #888; text-transform: uppercase; }
        .total-revenue strong { display: block; font-size: 2.5rem; color: #FFD700; font-weight: 900; }
      `}</style>
        </div>
    );
};

export default FunnelCalculator;
