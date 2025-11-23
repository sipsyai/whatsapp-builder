import { useState } from "react";

export const LandingPage = ({ onStart }: { onStart: () => void }) => {
    const [showModal, setShowModal] = useState(false);

    return (
        <div className="relative flex h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
            <div className="flex flex-1 h-full">
                <aside className="hidden lg:flex w-64 flex-col bg-[#112217] p-4 border-r border-white/10">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div
                                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                                style={{
                                    backgroundImage:
                                        'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB32tnVF4JPu-3hPli9p8pS_7UZC0gFE0AhAcPwETfOGuY2A-glAcSiHkKL3W8ulDxNKsHSXpReQISALGyrbr0S23cvUYZvG0sNfGehJiresV5qzvWy8DpM4vvPK5bp8U4RopEPhxtDS1MogXkowZgw6bOM2A2DaOQD5jGX02oN_rzOwyytUm8IZDQCJLAnWWmpZha0PShn_o6NHKeP9Xz1uf-cIOZGgATZkDVUxXvqXaXqcwv6BH6yiG3HHtix4rEYXiriQy3OLuv-")',
                                }}
                            ></div>
                            <div className="flex flex-col">
                                <h1 className="text-white text-base font-medium leading-normal">
                                    BotBuilders Inc.
                                </h1>
                                <p className="text-[#92c9a4] text-sm font-normal leading-normal">
                                    Workspace
                                </p>
                            </div>
                        </div>
                        <nav className="flex flex-col gap-2 mt-4">
                            <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/70 hover:bg-[#23482f]/50 hover:text-white transition-colors duration-200" href="#">
                                <span className="material-symbols-outlined">dashboard</span>
                                <p className="text-sm font-medium leading-normal">Dashboard</p>
                            </a>
                            <a className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#23482f] text-white" href="#">
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                                <p className="text-sm font-medium leading-normal">Chatbots</p>
                            </a>
                        </nav>
                    </div>
                </aside>
                <main className="flex-1 p-6 lg:p-10 bg-[#102216] overflow-y-auto">
                    <div className="mx-auto max-w-4xl">
                        <div className="flex flex-wrap justify-between gap-3 mb-8">
                            <div className="flex flex-col gap-2">
                                <p className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                                    Create a New Chatbot
                                </p>
                                <p className="text-[#92c9a4] text-base font-normal leading-normal">
                                    Get started by building a new bot from the ground up or select a
                                    pre-built template.
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                            <div className="flex flex-col items-stretch justify-start rounded-xl shadow-[0_0_4px_rgba(0,0,0,0.1)] bg-[#193322] p-6 hover:ring-2 hover:ring-primary/50 transition-all duration-300">
                                <div className="flex w-full min-w-72 grow flex-col items-stretch justify-center gap-4">
                                    <span className="material-symbols-outlined text-primary text-5xl">auto_awesome</span>
                                    <p className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">Start from Scratch</p>
                                    <p className="text-[#92c9a4] text-base font-normal leading-normal h-20">
                                        Build a custom chatbot with full control over its design, logic, and personality.
                                    </p>
                                    <button onClick={() => setShowModal(true)} className="flex mt-auto min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-[#112217] text-sm font-bold leading-normal hover:bg-primary/90 transition-colors">
                                        <span className="truncate">Create Bot</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm fade-in">
                    <div className="w-full max-w-md rounded-xl bg-[#193322] border border-white/10 p-6 shadow-2xl">
                        <div className="flex flex-col gap-4">
                            <h2 className="text-white text-lg font-bold">Name Your Chatbot</h2>
                            <input className="w-full rounded-lg border border-white/20 bg-[#112217] px-3 py-2 text-white" placeholder="e.g., Customer Support Bot" type="text" />
                            <div className="flex justify-end gap-3 mt-4">
                                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-white/70 hover:text-white">Cancel</button>
                                <button onClick={onStart} className="px-4 py-2 bg-primary text-[#112217] rounded-lg font-bold">Create Chatbot</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
