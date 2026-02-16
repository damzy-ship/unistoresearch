import React, { useState } from 'react';

interface AuthModalV2Props {
    isOpen: boolean;
    onClose: () => void;
}

type AuthView = 'signin' | 'signup' | 'otp';

export const AuthModalV2: React.FC<AuthModalV2Props> = ({ isOpen, onClose }) => {
    const [view, setView] = useState<AuthView>('signin');
    const [method, setMethod] = useState<'email' | 'phone'>('email');

    if (!isOpen) return null;

    const renderSignIn = () => (
        <div className="w-full max-w-[480px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 md:p-10 border border-primary/10 animate-in fade-in zoom-in duration-300 overflow-y-auto max-h-[90vh] no-scrollbar">
            {/* Header Section */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-6">
                    <div className="bg-primary/10 p-2 rounded-lg">
                        <span className="material-symbols-outlined text-primary text-2xl">shopping_bag</span>
                    </div>
                    <span className="font-bold text-2xl tracking-tight">
                        <span className="text-primary">uni</span>
                        <span className="text-blue-700">store.</span>
                    </span>
                </div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Sign In</h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-base leading-relaxed">
                    Sign in to contact sellers and track your requests.
                </p>
            </div>

            {/* Toggle Segmented Control */}
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 mb-8 rounded-lg">
                <button
                    onClick={() => setMethod('email')}
                    className={`flex-1 py-2.5 text-sm font-semibold transition-all rounded-lg ${method === 'email' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
                >
                    Use email
                </button>
                <button
                    onClick={() => setMethod('phone')}
                    className={`flex-1 py-2.5 text-sm font-semibold transition-all rounded-lg ${method === 'phone' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
                >
                    Use phone
                </button>
            </div>

            {/* Sign In Form */}
            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); if (method === 'phone') setView('otp'); }}>
                {method === 'email' ? (
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">Email</label>
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors">mail</span>
                            <input
                                className="w-full pl-12 pr-4 h-14 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400 rounded-lg outline-none"
                                placeholder="Enter your email"
                                type="email"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">Phone Number</label>
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors">phone_iphone</span>
                            <input
                                className="w-full pl-12 pr-4 h-14 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400 rounded-lg outline-none"
                                placeholder="+234 812 345 6789"
                                type="tel"
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Password</label>
                        <button type="button" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">Forgot password?</button>
                    </div>
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors">lock</span>
                        <input
                            className="w-full pl-12 pr-4 h-14 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400 rounded-lg outline-none"
                            placeholder="Enter your password"
                            type="password"
                        />
                    </div>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                    <button className="w-full h-14 bg-primary text-white font-bold hover:bg-primary/90 hover:scale-[0.99] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 rounded-lg">
                        Sign In
                    </button>
                    <button onClick={onClose} type="button" className="w-full h-14 bg-transparent text-zinc-600 dark:text-zinc-400 font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all rounded-lg">
                        Cancel
                    </button>
                </div>
            </form>

            {/* Social Divider */}
            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-zinc-900 px-4 text-zinc-400 font-medium whitespace-nowrap">Or continue with</span>
                </div>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <button className="flex items-center justify-center h-12 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors gap-2 rounded-lg">
                    <img className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVS4mok1zudI81j2YvmuheY-FiTwceOlvSVdUv6gysVS5dJj1xohYZDeR3PnzdhWYprdr4EOUOS-vw8NQUkrYMG1sVUotdY6T8cUerU_SGHDAHXwYeENDPT3d9k251dNSIVo4uEfWD2y0JVoZ4VDB4AS7CaYpvaKa52MwcQ6devwcxPtqcbuK8P85hBBrv5R0Aeu5-u5X__JREbTj1pg1UkJ7eP0uoWu0J3UjHdGWwHXu02fn9RqBFHJZPjk6aXyXT4fWSTeYWM3k" alt="Google" />
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Google</span>
                </button>
                <button className="flex items-center justify-center h-12 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors gap-2 rounded-lg">
                    <img className="w-5 h-5 dark:invert" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbnFXkORREwyJsZfzHHje5uTfU7XKR7tx-cd6FCCZhxpOzykmVrKcw_wFR78_knlQsNahIWHm_Aa_F-KW0hAUpIAMQzvAmkVJ-Qlv-ptoyf_SPoRKvUk6z0pQDoq6pfYTKHRTfoEw7uMxS9IwDKr-Z5olvWLT5wW-kY2rCJ9FgrxxUnyfcSEVHLeNRu0c7mpYa0p3x4y-LcCjcNGHIq9w1l5NIwR9kTxkskmIfdYmusQjGeNd19slqcs7CwZZanijkN2DwDWtKx1o" alt="Apple" />
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Apple</span>
                </button>
            </div>

            <div className="text-center pb-2">
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                    Don't have an account?
                    <button onClick={() => setView('signup')} className="text-primary font-bold hover:underline underline-offset-4 ml-1">Sign Up</button>
                </p>
            </div>
        </div>
    );

    const renderSignUp = () => (
        <div className="w-full max-w-md bg-white dark:bg-[#2d1e16] rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] p-6 animate-in slide-in-from-right duration-300 border border-primary/10 no-scrollbar">
            <div className="flex items-center mb-6">
                <button onClick={() => setView('signin')} className="text-[#221610] dark:text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-primary/10 transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h2 className="text-[#221610] dark:text-white text-lg font-bold flex-1 text-center pr-10">Create Account</h2>
            </div>

            <header className="pb-6">
                <h1 className="text-[#221610] dark:text-white tracking-tight text-3xl font-extrabold leading-tight mb-2">
                    Join <span className="text-primary">uni</span><span className="text-blue-600">store.</span>
                </h1>
                <p className="text-[#221610]/70 dark:text-white/70 text-base font-normal leading-relaxed">
                    Create an account to contact sellers and track your requests.
                </p>
            </header>

            <div className="space-y-6 mb-8">
                <div>
                    <label className="text-zinc-900 dark:text-white text-sm font-bold tracking-wide mb-3 block px-1">University</label>
                    <div className="flex gap-2">
                        <button className="flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all bg-primary text-white shadow-sm border border-primary">Bingham</button>
                        <button className="flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all bg-white dark:bg-white/5 text-gray-500 border border-gray-200 dark:border-white/10">Veritas</button>
                    </div>
                </div>
                <div>
                    <label className="text-zinc-900 dark:text-white text-sm font-bold tracking-wide mb-3 block px-1">Account Type</label>
                    <div className="flex gap-2">
                        <button className="flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all bg-primary text-white shadow-sm border border-primary">User</button>
                        <button className="flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all bg-white dark:bg-white/5 text-gray-500 border border-gray-200 dark:border-white/10">Merchant</button>
                    </div>
                </div>
            </div>

            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setView('otp'); }}>
                <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary group-focus-within:text-primary">person</span>
                    <input className="w-full bg-white dark:bg-[#2d1e16] border-2 border-transparent focus:border-primary focus:ring-0 py-4 pl-12 pr-6 text-[#221610] dark:text-white placeholder:text-gray-400 shadow-sm transition-all rounded-xl outline-none font-medium" placeholder="Full Name" type="text" />
                </div>
                <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">mail</span>
                    <input className="w-full bg-white dark:bg-[#2d1e16] border-2 border-transparent focus:border-primary focus:ring-0 py-4 pl-12 pr-6 text-[#221610] dark:text-white placeholder:text-gray-400 shadow-sm transition-all rounded-xl outline-none font-medium" placeholder="Email Address" type="email" />
                </div>
                <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">phone_iphone</span>
                    <input className="w-full bg-white dark:bg-[#2d1e16] border-2 border-transparent focus:border-primary focus:ring-0 py-4 pl-12 pr-6 text-[#221610] dark:text-white placeholder:text-gray-400 shadow-sm transition-all rounded-xl outline-none font-medium" placeholder="Phone Number" type="tel" />
                </div>
                <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">lock</span>
                    <input className="w-full bg-white dark:bg-[#2d1e16] border-2 border-transparent focus:border-primary focus:ring-0 py-4 pl-12 pr-12 text-[#221610] dark:text-white placeholder:text-gray-400 shadow-sm transition-all rounded-xl outline-none font-medium" placeholder="Password" type="password" />
                </div>

                <div className="pt-6 space-y-3">
                    <button className="w-full bg-primary text-white font-bold py-4 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-lg rounded-lg">Create Account</button>
                    <button onClick={onClose} type="button" className="w-full bg-transparent text-[#221610] dark:text-white font-semibold py-4 hover:bg-primary/5 transition-all text-base border border-primary/20 rounded-lg">Cancel</button>
                </div>
            </form>

            <p className="text-center text-xs text-gray-500 mt-8 pb-4">
                By creating an account, you agree to our <br />
                <a className="text-primary font-medium hover:underline" href="#">Terms of Service</a> and <a className="text-primary font-medium hover:underline" href="#">Privacy Policy</a>.
            </p>
        </div>
    );

    const renderOTP = () => (
        <div className="w-full max-w-md bg-white dark:bg-[#2d1e16] rounded-2xl shadow-2xl border border-primary/10 overflow-hidden animate-in fade-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center px-6 py-4 justify-between border-b border-gray-100 dark:border-white/5 sticky top-0 bg-white dark:bg-[#2d1e16] z-10">
                <button onClick={() => setView('signup')} className="text-[#181311] dark:text-white flex size-10 shrink-0 items-center hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors justify-center">
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">U</span>
                    </div>
                    <h2 className="text-[#181311] dark:text-white text-lg font-bold leading-tight tracking-tight">unistore</h2>
                </div>
                <div className="size-10"></div>
            </div>

            <div className="px-6 py-10 md:px-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
                        <span className="material-symbols-outlined text-primary text-3xl">sms</span>
                    </div>
                    <h2 className="text-[#181311] dark:text-white tracking-tight text-2xl md:text-3xl font-bold mb-3">Verify Your Phone</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base leading-relaxed">
                        Enter the 6-digit code sent to <span className="font-semibold text-[#181311] dark:text-white">+234 812 *** 4567</span>
                    </p>
                </div>

                <div className="flex justify-center mb-10">
                    <div className="flex gap-2 sm:gap-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <input
                                key={i}
                                className="flex h-12 w-10 sm:h-14 sm:w-12 text-center text-xl font-bold rounded-lg border-2 border-gray-200 dark:border-white/10 bg-transparent focus:border-primary focus:ring-0 transition-all dark:text-white outline-none"
                                maxLength={1}
                                type="text"
                                inputMode="numeric"
                            />
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <button onClick={onClose} className="flex w-full cursor-pointer items-center justify-center rounded-lg h-14 px-5 bg-primary hover:bg-primary/90 text-white text-base font-bold transition-all shadow-lg shadow-primary/20">
                        Verify & Continue
                    </button>
                    <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Didn't receive the code?
                            <button className="text-primary font-semibold hover:underline ml-1">Resend Code (0:59)</button>
                        </p>
                    </div>
                </div>

                <div className="mt-12 p-4 bg-primary/5 dark:bg-primary/10 rounded-xl flex items-start gap-3 border border-primary/10 mb-4">
                    <span className="material-symbols-outlined text-primary text-xl">info</span>
                    <p className="text-xs md:text-sm text-primary/80 dark:text-primary/90 leading-relaxed font-medium">
                        Make sure you're using a phone number that can receive SMS. Carrier charges may apply.
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[4px] transition-all animate-in fade-in duration-300">
            <div className="absolute inset-0" onClick={onClose} />
            <div className="relative z-10 w-full flex justify-center items-center h-full">
                {view === 'signin' && renderSignIn()}
                {view === 'signup' && renderSignUp()}
                {view === 'otp' && renderOTP()}
            </div>
        </div>
    );
};
