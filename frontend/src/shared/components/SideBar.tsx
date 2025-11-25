import React from 'react';

interface SideBarProps {
    currentView: string;
    onNavigate: (view: string) => void;
}

export const SideBar: React.FC<SideBarProps> = ({ currentView, onNavigate }) => {
    const navItems = [
        { id: 'chatbots', label: 'My Chatbots', icon: 'smart_toy' },
        { id: 'builder', label: 'Builder', icon: 'account_tree' },
        { id: 'sessions', label: 'Sessions', icon: 'history' },
        { id: 'chat', label: 'Chat', icon: 'chat' },
        { id: 'users', label: 'Users', icon: 'group' },
        { id: 'flows', label: 'WhatsApp Flows', icon: 'check_box' },
        { id: 'settings', label: 'Settings', icon: 'settings' },
    ];

    return (
        <aside className="w-64 flex-col bg-[#112217] p-4 border-r border-white/10 hidden lg:flex">
            <div className="flex flex-col gap-4">
                {/* Logo/Brand */}
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

                {/* Navigation */}
                <nav className="flex flex-col gap-2 mt-4">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 ${currentView === item.id
                                ? 'bg-[#23482f] text-white'
                                : 'text-white/70 hover:bg-[#23482f]/50 hover:text-white'
                                }`}
                        >
                            <span
                                className="material-symbols-outlined"
                                style={currentView === item.id ? { fontVariationSettings: "'FILL' 1" } : {}}
                            >
                                {item.icon}
                            </span>
                            <p className="text-sm font-medium leading-normal">{item.label}</p>
                        </button>
                    ))}
                </nav>
            </div>
        </aside>
    );
};
