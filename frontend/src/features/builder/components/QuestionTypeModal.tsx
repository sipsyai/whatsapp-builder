export const QuestionTypeModal = ({ onSelect, onClose }: { onSelect: (subType: "text" | "buttons" | "list") => void; onClose: () => void; }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm fade-in">
            <div className="w-full max-w-sm rounded-xl bg-white dark:bg-[#193322] shadow-2xl border border-zinc-200 dark:border-white/10">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <button onClick={onClose} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Ask a question</h1>
                    </div>
                    <div className="space-y-3">
                        <div onClick={() => onSelect("text")} className="group flex cursor-pointer items-center gap-4 rounded-lg bg-gradient-to-br from-primary/90 to-primary p-4 text-[#112217] shadow-sm transition-all hover:shadow-lg hover:scale-105">
                            <div className="flex-grow">
                                <h2 className="text-lg font-bold">Question</h2>
                                <p className="text-sm opacity-90">Ask anything to the user</p>
                            </div>
                            <span className="material-symbols-outlined text-3xl">help</span>
                        </div>
                        <div onClick={() => onSelect("buttons")} className="group flex cursor-pointer items-center gap-4 rounded-lg bg-gradient-to-br from-primary/90 to-primary p-4 text-[#112217] shadow-sm transition-all hover:shadow-lg hover:scale-105">
                            <div className="flex-grow">
                                <h2 className="text-lg font-bold">Buttons</h2>
                                <p className="text-sm opacity-90">Choices based on buttons<br />(Max 3)</p>
                            </div>
                            <span className="material-symbols-outlined text-3xl">radio_button_checked</span>
                        </div>
                        <div onClick={() => onSelect("list")} className="group flex cursor-pointer items-center gap-4 rounded-lg bg-gradient-to-br from-primary/90 to-primary p-4 text-[#112217] shadow-sm transition-all hover:shadow-lg hover:scale-105">
                            <div className="flex-grow">
                                <h2 className="text-lg font-bold">List</h2>
                                <p className="text-sm opacity-90">Choices based on list<br />(Max 10)</p>
                            </div>
                            <span className="material-symbols-outlined text-3xl">list_alt</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
