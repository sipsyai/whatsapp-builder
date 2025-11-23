export const QuestionTypeModal = ({ onSelect, onClose }: { onSelect: (subType: "text" | "buttons" | "list") => void; onClose: () => void; }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm fade-in">
            <div className="w-full max-w-sm rounded-xl bg-[#F8FAFC] dark:bg-[#1E293B] shadow-2xl">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-700">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <h1 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Ask a question</h1>
                    </div>
                    <div className="space-y-4">
                        <div onClick={() => onSelect("text")} className="group flex cursor-pointer items-center gap-4 rounded-lg bg-orange-500 p-4 text-white shadow-sm transition-all hover:bg-orange-600">
                            <div className="flex-grow">
                                <h2 className="text-lg font-bold">Question</h2>
                                <p className="text-sm opacity-90">Ask anything to the user</p>
                            </div>
                            <span className="material-symbols-outlined text-3xl">person_question</span>
                        </div>
                        <div onClick={() => onSelect("buttons")} className="group flex cursor-pointer items-center gap-4 rounded-lg bg-orange-500 p-4 text-white shadow-sm transition-all hover:bg-orange-600">
                            <div className="flex-grow">
                                <h2 className="text-lg font-bold">Buttons</h2>
                                <p className="text-sm opacity-90">Choices based on buttons<br />(Max 3)</p>
                            </div>
                            <span className="material-symbols-outlined text-3xl">radio_button_checked</span>
                        </div>
                        <div onClick={() => onSelect("list")} className="group flex cursor-pointer items-center gap-4 rounded-lg bg-orange-500 p-4 text-white shadow-sm transition-all hover:bg-orange-600">
                            <div className="flex-grow">
                                <h2 className="text-lg font-bold">List</h2>
                                <p className="text-sm opacity-90">Choices based on buttons<br />(Max 10)</p>
                            </div>
                            <span className="material-symbols-outlined text-3xl">list_alt</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
