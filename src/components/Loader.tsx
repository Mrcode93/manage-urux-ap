import React from 'react';
import { motion } from 'framer-motion';
import whiteLogo from '../assets/images/white.png';
import blackLogo from '../assets/images/black.png';
import { useStore } from '../store/useStore';

interface LoaderProps {
    message?: string;
    fullScreen?: boolean;
}

/**
 * Modern & Simple Minimalist Loader
 * Optimized for Urux Management System Premium Aesthetic
 */
const Loader: React.FC<LoaderProps> = ({
    message = 'جاري التحميل',
    fullScreen = true
}) => {
    const { darkMode } = useStore();

    const containerClasses = fullScreen
        ? "fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl transition-colors duration-500"
        : "absolute inset-0 z-[50] flex items-center justify-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm rounded-3xl";

    return (
        <div className={containerClasses}>
            <div className="flex flex-col items-center gap-8">
                <div className="relative flex items-center justify-center">
                    {/* Clean spinning ring */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="w-20 h-20 border-2 border-slate-200 dark:border-white/5 border-t-blue-500 dark:border-t-blue-400 rounded-full"
                    />

                    {/* Pulsating Logo */}
                    <motion.div
                        animate={{
                            scale: [1, 1.05, 1],
                            opacity: [0.6, 1, 0.6]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute"
                    >
                        <img
                            src={darkMode ? whiteLogo : blackLogo}
                            alt="Urux Logo"
                            className="w-10 h-auto opacity-90"
                        />
                    </motion.div>

                    {/* Subtle glow effect */}
                    <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-400/10 blur-2xl rounded-full" />
                </div>

                <div className="flex flex-col items-center gap-2">
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2"
                    >
                        <span className="text-sm font-black italic text-slate-900 dark:text-white tracking-tight">URUX</span>
                        <span className="text-sm font-black italic text-blue-600 dark:text-blue-500 tracking-tight">MANAGEMENT</span>
                    </motion.div>

                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                            {message}
                        </span>
                        <div className="flex gap-1.5">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        opacity: [0.3, 1, 0.3],
                                        scale: [0.8, 1, 0.8]
                                    }}
                                    transition={{
                                        duration: 1,
                                        repeat: Infinity,
                                        delay: i * 0.2,
                                        ease: "easeInOut"
                                    }}
                                    className="w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Loader;
