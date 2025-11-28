import React, { useState } from 'react';
import { CONTENT_CATEGORIES } from '../constants/contentCategories';

interface AddContentMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddComponent: (type: string) => void;
}

export const AddContentMenu: React.FC<AddContentMenuProps> = ({
  isOpen,
  onOpenChange,
  onAddComponent,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('text');

  const handleAddComponent = (type: string) => {
    onAddComponent(type);
    onOpenChange(false);
  };

  const currentCategory = CONTENT_CATEGORIES.find(
    (cat) => cat.id === selectedCategory
  );

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => onOpenChange(!isOpen)}
        className={`
          w-full flex items-center justify-center gap-2 px-4 py-3
          border-2 border-dashed rounded-lg
          text-zinc-400 transition-all
          ${
            isOpen
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-zinc-700 hover:border-zinc-600 hover:border-solid hover:bg-zinc-800'
          }
        `}
        type="button"
      >
        <span className="material-symbols-outlined text-xl">add</span>
        <span className="text-sm font-medium">Add content</span>
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => onOpenChange(false)}
          />

          {/* Menu Content - Opens upward */}
          <div
            className="absolute left-0 right-0 bottom-full mb-2 z-20
                       bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg
                       overflow-hidden"
          >
            {/* Category Tabs */}
            <div className="flex border-b border-zinc-700 bg-zinc-850">
              {CONTENT_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`
                    flex-1 flex items-center justify-center gap-2
                    px-4 py-3 text-sm font-medium transition-all
                    border-b-2 -mb-px
                    ${
                      selectedCategory === category.id
                        ? 'border-primary text-primary bg-zinc-800'
                        : 'border-transparent text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50'
                    }
                  `}
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">
                    {category.icon}
                  </span>
                  <span className="hidden sm:inline">{category.label}</span>
                </button>
              ))}
            </div>

            {/* Component Items */}
            <div className="p-2 max-h-80 overflow-y-auto">
              {currentCategory?.items.map((item) => (
                <button
                  key={item.type}
                  onClick={() => handleAddComponent(item.type)}
                  className="w-full flex items-center gap-3 px-3 py-2.5
                           text-left rounded-lg transition-all
                           text-zinc-300 hover:bg-zinc-700 hover:text-white"
                  type="button"
                >
                  <span className="material-symbols-outlined text-xl text-zinc-400">
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
