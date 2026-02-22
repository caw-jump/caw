import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Simple chevron component if lucide-react isn't available yet
const ChevronDown = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

export default function DeepDiveCard({ title, children }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-gray-700 bg-gray-900/30 rounded-lg overflow-hidden my-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full p-4 text-left font-semibold text-white hover:bg-gray-800 transition-colors"
            >
                <span className="flex items-center gap-2">
                    <span className="bg-blue-600 text-xs px-2 py-1 rounded uppercase tracking-wider">Technical Deep Dive</span>
                    {title}
                </span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                    <ChevronDown />
                </motion.div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-0 text-gray-300 border-t border-gray-800 text-sm leading-relaxed">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
