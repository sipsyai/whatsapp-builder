import { useState } from "react";
import type {
  TextHeading,
  TextSubheading,
  TextBody,
  TextCaption,
  TextInput,
  TextArea,
  Dropdown,
  RadioButtonsGroup,
  CheckboxGroup,
  ChipsSelector,
  Footer,
  OptIn,
  DatePicker,
  Image,
  DataSourceItem,
  Action,
} from "../../types/flow-json.types";
import { CHARACTER_LIMITS } from "../../constants/character-limits";

// ============================================================================
// Character Counter Component
// ============================================================================

interface CharacterCounterProps {
  current: number;
  max: number;
  className?: string;
}

const CharacterCounter = ({ current, max, className = "" }: CharacterCounterProps) => {
  const remaining = max - current;
  const percentage = (current / max) * 100;

  let colorClass = "text-gray-400";
  if (percentage >= 90) {
    colorClass = "text-red-400";
  } else if (percentage >= 75) {
    colorClass = "text-amber-400";
  }

  return (
    <div className={`text-xs ${colorClass} ${className}`}>
      {remaining} / {max} characters remaining
    </div>
  );
};

// ============================================================================
// Config Modal Base Structure
// ============================================================================

interface BaseConfigModalProps {
  onClose: () => void;
  onSave: (config: any) => void;
  initialConfig?: any;
}

const ConfigModalWrapper = ({
  title,
  onClose,
  onSave,
  children,
  saveDisabled = false,
}: {
  title: string;
  onClose: () => void;
  onSave: () => void;
  children: React.ReactNode;
  saveDisabled?: boolean;
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/50 backdrop-blur-sm fade-in">
      <div className="w-full max-w-2xl h-full bg-[#102216] shadow-2xl overflow-y-auto flex flex-col border-l border-white/10">
        <div className="p-8 flex-1">
          <header className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <button onClick={onClose} className="hover:bg-white/5 p-2 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-white">close</span>
            </button>
          </header>
          {children}
        </div>
        <div className="p-4 border-t border-white/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg hover:bg-white/5 text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saveDisabled}
            className="px-4 py-2 rounded-lg bg-primary text-[#112217] font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ConfigTextHeading
// ============================================================================

interface ConfigTextHeadingProps extends BaseConfigModalProps {
  initialConfig?: Partial<TextHeading>;
}

export const ConfigTextHeading = ({ onClose, onSave, initialConfig }: ConfigTextHeadingProps) => {
  const [text, setText] = useState(initialConfig?.text?.toString() || "");
  const [visible, setVisible] = useState(initialConfig?.visible !== false);

  const handleSave = () => {
    if (!text.trim()) {
      alert("Text is required");
      return;
    }

    const config: Partial<TextHeading> = {
      type: "TextHeading",
      text,
      visible,
    };

    onSave(config);
  };

  const textLimit = CHARACTER_LIMITS.TextHeading.text;
  const isTextValid = text.length <= textLimit;

  return (
    <ConfigModalWrapper
      title="Configure Text Heading"
      onClose={onClose}
      onSave={handleSave}
      saveDisabled={!isTextValid || !text.trim()}
    >
      <div className="space-y-6">
        {/* Text Input */}
        <label className="block">
          <span className="text-sm font-medium text-white">Text *</span>
          <input
            type="text"
            className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter heading text..."
            maxLength={textLimit}
          />
          <CharacterCounter current={text.length} max={textLimit} className="mt-1" />
        </label>

        {/* Visible Toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => setVisible(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <div>
            <span className="text-sm font-medium text-white">Visible</span>
            <p className="text-xs text-gray-400">
              Show this component in the flow
            </p>
          </div>
        </label>

        {/* Help Text */}
        <div className="text-xs text-gray-400 bg-blue-900/20 border border-blue-800 rounded-lg p-3">
          <p className="font-medium text-blue-300 mb-1">Text Heading</p>
          <p>Display a prominent heading at the top of your screen. Use it for screen titles or important announcements.</p>
        </div>
      </div>
    </ConfigModalWrapper>
  );
};

// ============================================================================
// ConfigTextInput
// ============================================================================

interface ConfigTextInputProps extends BaseConfigModalProps {
  initialConfig?: Partial<TextInput>;
}

export const ConfigTextInput = ({ onClose, onSave, initialConfig }: ConfigTextInputProps) => {
  const [label, setLabel] = useState(initialConfig?.label?.toString() || "");
  const [inputType, setInputType] = useState<TextInput["input-type"]>(
    initialConfig?.["input-type"] || "text"
  );
  const [required, setRequired] = useState(initialConfig?.required !== false);
  const [minChars, setMinChars] = useState(initialConfig?.["min-chars"]?.toString() || "");
  const [maxChars, setMaxChars] = useState(initialConfig?.["max-chars"]?.toString() || "");
  const [helperText, setHelperText] = useState(initialConfig?.["helper-text"]?.toString() || "");
  const [name, setName] = useState(initialConfig?.name || "");

  const handleSave = () => {
    if (!label.trim()) {
      alert("Label is required");
      return;
    }

    if (!name.trim()) {
      alert("Field name is required");
      return;
    }

    const config: Partial<TextInput> = {
      type: "TextInput",
      label,
      name,
      "input-type": inputType,
      required,
    };

    if (minChars) config["min-chars"] = minChars;
    if (maxChars) config["max-chars"] = maxChars;
    if (helperText) config["helper-text"] = helperText;

    onSave(config);
  };

  const labelLimit = CHARACTER_LIMITS.TextInput.label;
  const helperTextLimit = CHARACTER_LIMITS.TextInput.helperText;

  const isValid = label.length <= labelLimit && helperText.length <= helperTextLimit && label.trim() && name.trim();

  return (
    <ConfigModalWrapper
      title="Configure Text Input"
      onClose={onClose}
      onSave={handleSave}
      saveDisabled={!isValid}
    >
      <div className="space-y-6">
        {/* Label */}
        <label className="block">
          <span className="text-sm font-medium text-white">Label *</span>
          <input
            type="text"
            className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Full Name"
            maxLength={labelLimit}
          />
          <CharacterCounter current={label.length} max={labelLimit} className="mt-1" />
        </label>

        {/* Field Name */}
        <label className="block">
          <span className="text-sm font-medium text-white">Field Name *</span>
          <input
            type="text"
            className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10 font-mono text-sm"
            value={name}
            onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
            placeholder="e.g. full_name"
          />
          <p className="text-xs text-gray-400 mt-1">
            Used to reference this field's value in data. Use lowercase letters, numbers, and underscores only.
          </p>
        </label>

        {/* Input Type */}
        <label className="block">
          <span className="text-sm font-medium text-white">Input Type</span>
          <select
            className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
            value={inputType}
            onChange={(e) => setInputType(e.target.value as TextInput["input-type"])}
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="email">Email</option>
            <option value="password">Password</option>
            <option value="passcode">Passcode</option>
            <option value="phone">Phone</option>
          </select>
        </label>

        {/* Character Limits */}
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-white">Min Characters</span>
            <input
              type="number"
              className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
              value={minChars}
              onChange={(e) => setMinChars(e.target.value)}
              placeholder="0"
              min="0"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-white">Max Characters</span>
            <input
              type="number"
              className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
              value={maxChars}
              onChange={(e) => setMaxChars(e.target.value)}
              placeholder="80"
              min="0"
            />
          </label>
        </div>

        {/* Helper Text */}
        <label className="block">
          <span className="text-sm font-medium text-white">Helper Text (Optional)</span>
          <input
            type="text"
            className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
            value={helperText}
            onChange={(e) => setHelperText(e.target.value)}
            placeholder="e.g. Enter your full legal name"
            maxLength={helperTextLimit}
          />
          <CharacterCounter current={helperText.length} max={helperTextLimit} className="mt-1" />
        </label>

        {/* Required Toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <div>
            <span className="text-sm font-medium text-white">Required</span>
            <p className="text-xs text-gray-400">
              User must fill this field before proceeding
            </p>
          </div>
        </label>
      </div>
    </ConfigModalWrapper>
  );
};

// ============================================================================
// ConfigDropdown
// ============================================================================

interface ConfigDropdownProps extends BaseConfigModalProps {
  initialConfig?: Partial<Dropdown>;
}

export const ConfigDropdown = ({ onClose, onSave, initialConfig }: ConfigDropdownProps) => {
  const [label, setLabel] = useState(initialConfig?.label?.toString() || "");
  const [required, setRequired] = useState(initialConfig?.required !== false);
  const [dataSource, setDataSource] = useState<DataSourceItem[]>(
    Array.isArray(initialConfig?.["data-source"])
      ? initialConfig["data-source"]
      : [{ id: "option1", title: "Option 1" }]
  );

  const addOption = () => {
    setDataSource([
      ...dataSource,
      { id: `option${dataSource.length + 1}`, title: `Option ${dataSource.length + 1}` },
    ]);
  };

  const removeOption = (index: number) => {
    if (dataSource.length === 1) return;
    setDataSource(dataSource.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: keyof DataSourceItem, value: string) => {
    const newDataSource = [...dataSource];
    newDataSource[index] = { ...newDataSource[index], [field]: value };
    setDataSource(newDataSource);
  };

  const handleSave = () => {
    if (!label.trim()) {
      alert("Label is required");
      return;
    }

    if (dataSource.length === 0) {
      alert("At least one option is required");
      return;
    }

    const config: Partial<Dropdown> = {
      type: "Dropdown",
      label,
      "data-source": dataSource,
      required,
    };

    onSave(config);
  };

  const labelLimit = CHARACTER_LIMITS.Dropdown.label;
  const optionTitleLimit = CHARACTER_LIMITS.Dropdown.optionTitle;
  const optionDescLimit = CHARACTER_LIMITS.Dropdown.optionDescription;

  const isValid = label.length <= labelLimit && label.trim() && dataSource.length > 0;

  return (
    <ConfigModalWrapper
      title="Configure Dropdown"
      onClose={onClose}
      onSave={handleSave}
      saveDisabled={!isValid}
    >
      <div className="space-y-6">
        {/* Label */}
        <label className="block">
          <span className="text-sm font-medium text-white">Label *</span>
          <input
            type="text"
            className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Select Country"
            maxLength={labelLimit}
          />
          <CharacterCounter current={label.length} max={labelLimit} className="mt-1" />
        </label>

        {/* Data Source Editor */}
        <div className="bg-white/5 p-4 rounded-lg border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-white">Options</span>
            <button
              onClick={addOption}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Add Option
            </button>
          </div>

          <div className="space-y-3">
            {dataSource.map((option, index) => (
              <div
                key={option.id}
                className="bg-black/20 p-3 rounded-lg border border-white/5"
              >
                <div className="flex items-start gap-2 mb-2">
                  <input
                    type="text"
                    className="flex-1 p-2 rounded border bg-black/20 text-white border-white/10 text-sm"
                    value={option.title}
                    onChange={(e) => updateOption(index, "title", e.target.value)}
                    placeholder="Option title"
                    maxLength={optionTitleLimit}
                  />
                  <button
                    onClick={() => removeOption(index)}
                    disabled={dataSource.length === 1}
                    className="text-red-500 hover:text-red-400 p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
                <input
                  type="text"
                  className="w-full p-2 rounded border bg-black/20 text-white border-white/10 text-xs"
                  value={option.description || ""}
                  onChange={(e) => updateOption(index, "description", e.target.value)}
                  placeholder="Description (optional)"
                  maxLength={optionDescLimit}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Required Toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <div>
            <span className="text-sm font-medium text-white">Required</span>
            <p className="text-xs text-gray-400">
              User must select an option before proceeding
            </p>
          </div>
        </label>
      </div>
    </ConfigModalWrapper>
  );
};

// ============================================================================
// ConfigRadioButtonsGroup
// ============================================================================

interface ConfigRadioButtonsGroupProps extends BaseConfigModalProps {
  initialConfig?: Partial<RadioButtonsGroup>;
}

export const ConfigRadioButtonsGroup = ({
  onClose,
  onSave,
  initialConfig,
}: ConfigRadioButtonsGroupProps) => {
  const [label, setLabel] = useState(initialConfig?.label?.toString() || "");
  const [required, setRequired] = useState(initialConfig?.required !== false);
  const [mediaSize, setMediaSize] = useState<"regular" | "large">(
    initialConfig?.["media-size"] || "regular"
  );
  const [dataSource, setDataSource] = useState<DataSourceItem[]>(
    Array.isArray(initialConfig?.["data-source"])
      ? initialConfig["data-source"]
      : [{ id: "option1", title: "Option 1" }]
  );

  const addOption = () => {
    setDataSource([
      ...dataSource,
      { id: `option${dataSource.length + 1}`, title: `Option ${dataSource.length + 1}` },
    ]);
  };

  const removeOption = (index: number) => {
    if (dataSource.length === 1) return;
    setDataSource(dataSource.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: keyof DataSourceItem, value: string) => {
    const newDataSource = [...dataSource];
    newDataSource[index] = { ...newDataSource[index], [field]: value };
    setDataSource(newDataSource);
  };

  const handleSave = () => {
    if (!label.trim()) {
      alert("Label is required");
      return;
    }

    if (dataSource.length === 0) {
      alert("At least one option is required");
      return;
    }

    const config: Partial<RadioButtonsGroup> = {
      type: "RadioButtonsGroup",
      label,
      name: label.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      "data-source": dataSource,
      required,
      "media-size": mediaSize,
    };

    onSave(config);
  };

  const labelLimit = CHARACTER_LIMITS.RadioButtonsGroup.label;
  const optionTitleLimit = CHARACTER_LIMITS.RadioButtonsGroup.optionTitle;
  const optionDescLimit = CHARACTER_LIMITS.RadioButtonsGroup.optionDescription;

  const isValid = label.length <= labelLimit && label.trim() && dataSource.length > 0;

  return (
    <ConfigModalWrapper
      title="Configure Radio Buttons Group"
      onClose={onClose}
      onSave={handleSave}
      saveDisabled={!isValid}
    >
      <div className="space-y-6">
        {/* Label */}
        <label className="block">
          <span className="text-sm font-medium text-white">Label *</span>
          <input
            type="text"
            className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Choose a plan"
            maxLength={labelLimit}
          />
          <CharacterCounter current={label.length} max={labelLimit} className="mt-1" />
        </label>

        {/* Media Size */}
        <div className="block">
          <span className="text-sm font-medium text-white block mb-2">Media Size</span>
          <div className="flex gap-3">
            <button
              onClick={() => setMediaSize("regular")}
              className={`flex-1 p-3 rounded-lg border transition-colors ${
                mediaSize === "regular"
                  ? "bg-primary text-[#112217] border-primary"
                  : "bg-black/20 text-white border-white/10"
              }`}
            >
              Regular
            </button>
            <button
              onClick={() => setMediaSize("large")}
              className={`flex-1 p-3 rounded-lg border transition-colors ${
                mediaSize === "large"
                  ? "bg-primary text-[#112217] border-primary"
                  : "bg-black/20 text-white border-white/10"
              }`}
            >
              Large
            </button>
          </div>
        </div>

        {/* Data Source Editor */}
        <div className="bg-white/5 p-4 rounded-lg border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-white">Options</span>
            <button
              onClick={addOption}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Add Option
            </button>
          </div>

          <div className="space-y-3">
            {dataSource.map((option, index) => (
              <div
                key={option.id}
                className="bg-black/20 p-3 rounded-lg border border-white/5"
              >
                <div className="flex items-start gap-2 mb-2">
                  <input
                    type="text"
                    className="flex-1 p-2 rounded border bg-black/20 text-white border-white/10 text-sm"
                    value={option.title}
                    onChange={(e) => updateOption(index, "title", e.target.value)}
                    placeholder="Option title"
                    maxLength={optionTitleLimit}
                  />
                  <button
                    onClick={() => removeOption(index)}
                    disabled={dataSource.length === 1}
                    className="text-red-500 hover:text-red-400 p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
                <input
                  type="text"
                  className="w-full p-2 rounded border bg-black/20 text-white border-white/10 text-xs"
                  value={option.description || ""}
                  onChange={(e) => updateOption(index, "description", e.target.value)}
                  placeholder="Description (optional)"
                  maxLength={optionDescLimit}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Required Toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <div>
            <span className="text-sm font-medium text-white">Required</span>
            <p className="text-xs text-gray-400">
              User must select an option before proceeding
            </p>
          </div>
        </label>
      </div>
    </ConfigModalWrapper>
  );
};

// ============================================================================
// ConfigChipsSelector
// ============================================================================

interface ConfigChipsSelectorProps extends BaseConfigModalProps {
  initialConfig?: Partial<ChipsSelector>;
}

export const ConfigChipsSelector = ({
  onClose,
  onSave,
  initialConfig,
}: ConfigChipsSelectorProps) => {
  const [label, setLabel] = useState(initialConfig?.label?.toString() || "");
  const [name, setName] = useState(initialConfig?.name || "");
  const [description, setDescription] = useState(
    initialConfig?.description?.toString() || ""
  );
  const [required, setRequired] = useState(
    initialConfig?.required === true
  );
  const [minSelectedItems, setMinSelectedItems] = useState<number | undefined>(
    typeof initialConfig?.["min-selected-items"] === "number"
      ? initialConfig["min-selected-items"]
      : undefined
  );
  const [maxSelectedItems, setMaxSelectedItems] = useState<number | undefined>(
    typeof initialConfig?.["max-selected-items"] === "number"
      ? initialConfig["max-selected-items"]
      : undefined
  );
  const [dataSource, setDataSource] = useState<DataSourceItem[]>(
    Array.isArray(initialConfig?.["data-source"])
      ? (initialConfig["data-source"] as DataSourceItem[])
      : [{ id: "option_1", title: "Option 1" }]
  );

  const addOption = () => {
    const newId = `option_${dataSource.length + 1}`;
    setDataSource([...dataSource, { id: newId, title: "" }]);
  };

  const removeOption = (index: number) => {
    if (dataSource.length > 1) {
      setDataSource(dataSource.filter((_, i) => i !== index));
    }
  };

  const updateOption = (
    index: number,
    field: keyof DataSourceItem,
    value: string
  ) => {
    const updated = [...dataSource];
    updated[index] = {
      ...updated[index],
      [field]: value,
      id: field === "title" ? value.toLowerCase().replace(/\s+/g, "_") : updated[index].id,
    };
    setDataSource(updated);
  };

  const isValid =
    label.trim().length > 0 &&
    name.trim().length > 0 &&
    dataSource.length > 0 &&
    dataSource.every((opt) => opt.title?.trim());

  const handleSave = () => {
    const config: Partial<ChipsSelector> = {
      type: "ChipsSelector",
      label,
      name,
      "data-source": dataSource,
      required,
    };

    if (description) config.description = description;
    if (minSelectedItems !== undefined)
      config["min-selected-items"] = minSelectedItems;
    if (maxSelectedItems !== undefined)
      config["max-selected-items"] = maxSelectedItems;

    onSave(config);
  };

  const labelLimit = CHARACTER_LIMITS.ChipsSelector.label;
  const descriptionLimit = CHARACTER_LIMITS.ChipsSelector.description;

  return (
    <ConfigModalWrapper
      title="Configure Chips Selector"
      onClose={onClose}
      onSave={handleSave}
      saveDisabled={!isValid}
    >
      <div className="space-y-6">
        {/* Label */}
        <label className="block">
          <span className="text-sm font-medium text-white">Label *</span>
          <input
            type="text"
            className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Select your interests"
            maxLength={labelLimit}
          />
          <CharacterCounter current={label.length} max={labelLimit} className="mt-1" />
        </label>

        {/* Name */}
        <label className="block">
          <span className="text-sm font-medium text-white">Name (form field name) *</span>
          <input
            type="text"
            className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. interests"
          />
        </label>

        {/* Description */}
        <label className="block">
          <span className="text-sm font-medium text-white">Description</span>
          <input
            type="text"
            className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Help text for users"
            maxLength={descriptionLimit}
          />
          <CharacterCounter
            current={description.length}
            max={descriptionLimit}
            className="mt-1"
          />
        </label>

        {/* Data Source Editor */}
        <div className="bg-white/5 p-4 rounded-lg border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-white">Chips Options</span>
            <button
              onClick={addOption}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Add Option
            </button>
          </div>

          <div className="space-y-3">
            {dataSource.map((option, index) => (
              <div
                key={option.id}
                className="bg-black/20 p-3 rounded-lg border border-white/5"
              >
                <div className="flex items-start gap-2">
                  <input
                    type="text"
                    className="flex-1 p-2 rounded border bg-black/20 text-white border-white/10 text-sm"
                    value={option.title}
                    onChange={(e) => updateOption(index, "title", e.target.value)}
                    placeholder="Chip label"
                  />
                  <button
                    onClick={() => removeOption(index)}
                    disabled={dataSource.length === 1}
                    className="text-red-500 hover:text-red-400 p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selection Limits */}
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-white">Min selections</span>
            <input
              type="number"
              min="0"
              className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
              value={minSelectedItems ?? ""}
              onChange={(e) =>
                setMinSelectedItems(e.target.value ? parseInt(e.target.value) : undefined)
              }
              placeholder="No minimum"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-white">Max selections</span>
            <input
              type="number"
              min="1"
              className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
              value={maxSelectedItems ?? ""}
              onChange={(e) =>
                setMaxSelectedItems(e.target.value ? parseInt(e.target.value) : undefined)
              }
              placeholder="No maximum"
            />
          </label>
        </div>

        {/* Required Toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <div>
            <span className="text-sm font-medium text-white">Required</span>
            <p className="text-xs text-gray-400">
              User must select at least one chip before proceeding
            </p>
          </div>
        </label>
      </div>
    </ConfigModalWrapper>
  );
};

// ============================================================================
// ConfigFooter
// ============================================================================

interface ConfigFooterProps extends BaseConfigModalProps {
  initialConfig?: Partial<Footer>;
}

export const ConfigFooter = ({ onClose, onSave, initialConfig }: ConfigFooterProps) => {
  const [label, setLabel] = useState(initialConfig?.label?.toString() || "");
  const [leftCaption, setLeftCaption] = useState(initialConfig?.["left-caption"]?.toString() || "");
  const [centerCaption, setCenterCaption] = useState(
    initialConfig?.["center-caption"]?.toString() || ""
  );
  const [rightCaption, setRightCaption] = useState(
    initialConfig?.["right-caption"]?.toString() || ""
  );
  const [actionType, setActionType] = useState<"navigate" | "complete" | "data_exchange">(
    (initialConfig?.["on-click-action"]?.name === "update_data" || initialConfig?.["on-click-action"]?.name === "open_url"
      ? "navigate"
      : initialConfig?.["on-click-action"]?.name) as "navigate" | "complete" | "data_exchange" || "navigate"
  );
  const [navigateScreen, setNavigateScreen] = useState("");

  const handleSave = () => {
    if (!label.trim()) {
      alert("Button label is required");
      return;
    }

    let action: Action;
    if (actionType === "navigate") {
      if (!navigateScreen.trim()) {
        alert("Please specify the screen to navigate to");
        return;
      }
      action = {
        name: "navigate",
        next: {
          type: "screen",
          name: navigateScreen,
        },
      };
    } else if (actionType === "complete") {
      action = {
        name: "complete",
      };
    } else {
      action = {
        name: "data_exchange",
      };
    }

    const config: Partial<Footer> = {
      type: "Footer",
      label,
      "on-click-action": action,
    };

    if (leftCaption) config["left-caption"] = leftCaption;
    if (centerCaption) config["center-caption"] = centerCaption;
    if (rightCaption) config["right-caption"] = rightCaption;

    onSave(config);
  };

  const labelLimit = CHARACTER_LIMITS.Footer.label;
  const captionLimit = CHARACTER_LIMITS.Footer.leftCaption;

  const isValid =
    label.length <= labelLimit &&
    leftCaption.length <= captionLimit &&
    centerCaption.length <= captionLimit &&
    rightCaption.length <= captionLimit &&
    label.trim() &&
    (actionType !== "navigate" || navigateScreen.trim());

  return (
    <ConfigModalWrapper
      title="Configure Footer"
      onClose={onClose}
      onSave={handleSave}
      saveDisabled={!isValid}
    >
      <div className="space-y-6">
        {/* Button Label */}
        <label className="block">
          <span className="text-sm font-medium text-white">Button Label *</span>
          <input
            type="text"
            className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Continue, Submit, Next"
            maxLength={labelLimit}
          />
          <CharacterCounter current={label.length} max={labelLimit} className="mt-1" />
        </label>

        {/* Captions */}
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-white">Left Caption (Optional)</span>
            <input
              type="text"
              className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
              value={leftCaption}
              onChange={(e) => setLeftCaption(e.target.value)}
              placeholder="e.g. $99"
              maxLength={captionLimit}
            />
            <CharacterCounter current={leftCaption.length} max={captionLimit} className="mt-1" />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-white">Center Caption (Optional)</span>
            <input
              type="text"
              className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
              value={centerCaption}
              onChange={(e) => setCenterCaption(e.target.value)}
              placeholder="e.g. Step 1/3"
              maxLength={captionLimit}
            />
            <CharacterCounter current={centerCaption.length} max={captionLimit} className="mt-1" />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-white">Right Caption (Optional)</span>
            <input
              type="text"
              className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
              value={rightCaption}
              onChange={(e) => setRightCaption(e.target.value)}
              placeholder="e.g. Total: $99"
              maxLength={captionLimit}
            />
            <CharacterCounter current={rightCaption.length} max={captionLimit} className="mt-1" />
          </label>
        </div>

        {/* Action Configuration */}
        <div className="bg-white/5 p-4 rounded-lg border border-white/10">
          <span className="text-sm font-bold text-white block mb-3">On Click Action</span>

          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => setActionType("navigate")}
                className={`flex-1 p-2 rounded text-sm font-medium transition-colors ${
                  actionType === "navigate"
                    ? "bg-primary text-[#112217]"
                    : "bg-black/20 text-white border border-white/10"
                }`}
              >
                Navigate
              </button>
              <button
                onClick={() => setActionType("complete")}
                className={`flex-1 p-2 rounded text-sm font-medium transition-colors ${
                  actionType === "complete"
                    ? "bg-primary text-[#112217]"
                    : "bg-black/20 text-white border border-white/10"
                }`}
              >
                Complete
              </button>
              <button
                onClick={() => setActionType("data_exchange")}
                className={`flex-1 p-2 rounded text-sm font-medium transition-colors ${
                  actionType === "data_exchange"
                    ? "bg-primary text-[#112217]"
                    : "bg-black/20 text-white border border-white/10"
                }`}
              >
                Data Exchange
              </button>
            </div>

            {actionType === "navigate" && (
              <label className="block">
                <span className="text-sm font-medium text-white">Navigate to Screen *</span>
                <input
                  type="text"
                  className="w-full mt-2 p-2 rounded-lg border bg-black/20 text-white border-white/10 font-mono text-sm"
                  value={navigateScreen}
                  onChange={(e) => setNavigateScreen(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
                  placeholder="e.g. SCREEN_2"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Screen ID to navigate to. Use uppercase letters, numbers, and underscores.
                </p>
              </label>
            )}

            {actionType === "complete" && (
              <div className="text-xs text-gray-400 bg-blue-900/20 border border-blue-800 rounded-lg p-3">
                <p className="font-medium text-blue-300 mb-1">Complete Flow</p>
                <p>Ends the flow and returns collected data to WhatsApp. Use this on the final screen.</p>
              </div>
            )}

            {actionType === "data_exchange" && (
              <div className="text-xs text-gray-400 bg-blue-900/20 border border-blue-800 rounded-lg p-3">
                <p className="font-medium text-blue-300 mb-1">Data Exchange</p>
                <p>Sends current form data to your backend endpoint for validation or processing before proceeding.</p>
              </div>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-400 bg-amber-900/20 border border-amber-800 rounded-lg p-3">
          <p className="font-medium text-amber-300 mb-1">Footer Button</p>
          <p>
            The Footer component creates a sticky button at the bottom of the screen. Only one Footer
            is allowed per screen.
          </p>
        </div>
      </div>
    </ConfigModalWrapper>
  );
};

// ============================================================================
// ConfigTextSubheading
// ============================================================================

interface ConfigTextSubheadingProps extends BaseConfigModalProps {
  initialConfig?: Partial<TextSubheading>;
}

export const ConfigTextSubheading = ({ onClose, onSave, initialConfig }: ConfigTextSubheadingProps) => {
  const [text, setText] = useState(initialConfig?.text?.toString() || "");
  const [visible, setVisible] = useState(initialConfig?.visible !== false);

  const handleSave = () => {
    if (!text.trim()) {
      alert("Text is required");
      return;
    }
    onSave({ type: "TextSubheading", text, visible });
  };

  const textLimit = CHARACTER_LIMITS.TextSubheading?.text || 80;

  return (
    <ConfigModalWrapper title="Configure Text Subheading" onClose={onClose} onSave={handleSave} saveDisabled={!text.trim()}>
      <div className="space-y-6">
        <label className="block">
          <span className="text-sm font-medium text-white">Text *</span>
          <input
            type="text"
            className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter subheading text..."
            maxLength={textLimit}
          />
          <CharacterCounter current={text.length} max={textLimit} className="mt-1" />
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} className="w-4 h-4 rounded" />
          <span className="text-sm font-medium text-white">Visible</span>
        </label>
      </div>
    </ConfigModalWrapper>
  );
};

// ============================================================================
// ConfigTextBody
// ============================================================================

interface ConfigTextBodyProps extends BaseConfigModalProps {
  initialConfig?: Partial<TextBody>;
}

export const ConfigTextBody = ({ onClose, onSave, initialConfig }: ConfigTextBodyProps) => {
  const [text, setText] = useState(initialConfig?.text?.toString() || "");
  const [visible, setVisible] = useState(initialConfig?.visible !== false);

  const handleSave = () => {
    if (!text.trim()) {
      alert("Text is required");
      return;
    }
    onSave({ type: "TextBody", text, visible });
  };

  const textLimit = CHARACTER_LIMITS.TextBody?.text || 4096;

  return (
    <ConfigModalWrapper title="Configure Text Body" onClose={onClose} onSave={handleSave} saveDisabled={!text.trim()}>
      <div className="space-y-6">
        <label className="block">
          <span className="text-sm font-medium text-white">Text *</span>
          <textarea
            className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10 min-h-[120px]"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter body text..."
            maxLength={textLimit}
          />
          <CharacterCounter current={text.length} max={textLimit} className="mt-1" />
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} className="w-4 h-4 rounded" />
          <span className="text-sm font-medium text-white">Visible</span>
        </label>
      </div>
    </ConfigModalWrapper>
  );
};

// ============================================================================
// ConfigTextCaption
// ============================================================================

interface ConfigTextCaptionProps extends BaseConfigModalProps {
  initialConfig?: Partial<TextCaption>;
}

export const ConfigTextCaption = ({ onClose, onSave, initialConfig }: ConfigTextCaptionProps) => {
  const [text, setText] = useState(initialConfig?.text?.toString() || "");
  const [visible, setVisible] = useState(initialConfig?.visible !== false);

  const handleSave = () => {
    if (!text.trim()) {
      alert("Text is required");
      return;
    }
    onSave({ type: "TextCaption", text, visible });
  };

  const textLimit = CHARACTER_LIMITS.TextCaption?.text || 4096;

  return (
    <ConfigModalWrapper title="Configure Text Caption" onClose={onClose} onSave={handleSave} saveDisabled={!text.trim()}>
      <div className="space-y-6">
        <label className="block">
          <span className="text-sm font-medium text-white">Text *</span>
          <textarea
            className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10 min-h-[80px]"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter caption text..."
            maxLength={textLimit}
          />
          <CharacterCounter current={text.length} max={textLimit} className="mt-1" />
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} className="w-4 h-4 rounded" />
          <span className="text-sm font-medium text-white">Visible</span>
        </label>
      </div>
    </ConfigModalWrapper>
  );
};

// ============================================================================
// ConfigTextArea
// ============================================================================

interface ConfigTextAreaProps extends BaseConfigModalProps {
  initialConfig?: Partial<TextArea>;
}

export const ConfigTextArea = ({ onClose, onSave, initialConfig }: ConfigTextAreaProps) => {
  const [label, setLabel] = useState(initialConfig?.label?.toString() || "");
  const [name, setName] = useState(initialConfig?.name || "");
  const [required, setRequired] = useState(initialConfig?.required !== false);
  const [maxLength, setMaxLength] = useState(initialConfig?.["max-length"]?.toString() || "");
  const [helperText, setHelperText] = useState(initialConfig?.["helper-text"]?.toString() || "");

  const handleSave = () => {
    if (!label.trim() || !name.trim()) {
      alert("Label and Field Name are required");
      return;
    }
    const config: Partial<TextArea> = {
      type: "TextArea",
      label,
      name,
      required,
    };
    if (maxLength) config["max-length"] = maxLength;
    if (helperText) config["helper-text"] = helperText;
    onSave(config);
  };

  const labelLimit = CHARACTER_LIMITS.TextArea?.label || 80;

  return (
    <ConfigModalWrapper title="Configure Text Area" onClose={onClose} onSave={handleSave} saveDisabled={!label.trim() || !name.trim()}>
      <div className="space-y-6">
        <label className="block">
          <span className="text-sm font-medium text-white">Label *</span>
          <input
            type="text"
            className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Description"
            maxLength={labelLimit}
          />
          <CharacterCounter current={label.length} max={labelLimit} className="mt-1" />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-white">Field Name *</span>
          <input
            type="text"
            className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10 font-mono text-sm"
            value={name}
            onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
            placeholder="e.g. description"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-white">Max Length</span>
          <input
            type="number"
            className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
            value={maxLength}
            onChange={(e) => setMaxLength(e.target.value)}
            placeholder="e.g. 500"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-white">Helper Text</span>
          <input
            type="text"
            className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
            value={helperText}
            onChange={(e) => setHelperText(e.target.value)}
            placeholder="Optional hint for users"
          />
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="w-4 h-4 rounded" />
          <span className="text-sm font-medium text-white">Required</span>
        </label>
      </div>
    </ConfigModalWrapper>
  );
};

// ============================================================================
// ConfigCheckboxGroup
// ============================================================================

interface ConfigCheckboxGroupProps extends BaseConfigModalProps {
  initialConfig?: Partial<CheckboxGroup>;
}

export const ConfigCheckboxGroup = ({ onClose, onSave, initialConfig }: ConfigCheckboxGroupProps) => {
  const [label, setLabel] = useState(initialConfig?.label?.toString() || "");
  const [name, setName] = useState(initialConfig?.name || "");
  const [required, setRequired] = useState(initialConfig?.required !== false);
  const [dataSource, setDataSource] = useState<DataSourceItem[]>(
    (initialConfig?.["data-source"] as DataSourceItem[]) || [{ id: "1", title: "Option 1" }]
  );

  const addOption = () => {
    setDataSource([...dataSource, { id: String(Date.now()), title: `Option ${dataSource.length + 1}` }]);
  };

  const removeOption = (id: string) => {
    if (dataSource.length > 1) {
      setDataSource(dataSource.filter((o) => o.id !== id));
    }
  };

  const updateOption = (id: string, title: string) => {
    setDataSource(dataSource.map((o) => (o.id === id ? { ...o, title } : o)));
  };

  const handleSave = () => {
    if (!label.trim() || !name.trim()) {
      alert("Label and Field Name are required");
      return;
    }
    onSave({
      type: "CheckboxGroup",
      label,
      name,
      required,
      "data-source": dataSource,
    });
  };

  return (
    <ConfigModalWrapper title="Configure Checkbox Group" onClose={onClose} onSave={handleSave} saveDisabled={!label.trim() || !name.trim()}>
      <div className="space-y-6">
        <label className="block">
          <span className="text-sm font-medium text-white">Label *</span>
          <input
            type="text"
            className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Select options"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-white">Field Name *</span>
          <input
            type="text"
            className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10 font-mono text-sm"
            value={name}
            onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
            placeholder="e.g. selected_options"
          />
        </label>

        <div>
          <span className="text-sm font-medium text-white">Options</span>
          <div className="space-y-2 mt-2">
            {dataSource.map((option) => (
              <div key={option.id} className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 p-2 rounded-lg border bg-black/20 text-white border-white/10"
                  value={option.title}
                  onChange={(e) => updateOption(option.id, e.target.value)}
                />
                <button onClick={() => removeOption(option.id)} className="p-2 text-red-500 hover:bg-red-900/20 rounded">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            ))}
          </div>
          <button onClick={addOption} className="mt-2 text-sm text-primary hover:underline">+ Add Option</button>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="w-4 h-4 rounded" />
          <span className="text-sm font-medium text-white">Required</span>
        </label>
      </div>
    </ConfigModalWrapper>
  );
};

// ============================================================================
// ConfigOptIn
// ============================================================================

interface ConfigOptInProps extends BaseConfigModalProps {
  initialConfig?: Partial<OptIn>;
}

export const ConfigOptIn = ({ onClose, onSave, initialConfig }: ConfigOptInProps) => {
  const [label, setLabel] = useState(initialConfig?.label?.toString() || "");
  const [name, setName] = useState(initialConfig?.name || "");
  const [required, setRequired] = useState(initialConfig?.required !== false);

  const handleSave = () => {
    if (!label.trim() || !name.trim()) {
      alert("Label and Field Name are required");
      return;
    }
    onSave({ type: "OptIn", label, name, required });
  };

  return (
    <ConfigModalWrapper title="Configure Opt-In" onClose={onClose} onSave={handleSave} saveDisabled={!label.trim() || !name.trim()}>
      <div className="space-y-6">
        <label className="block">
          <span className="text-sm font-medium text-white">Label *</span>
          <textarea
            className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10 min-h-[80px]"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. I agree to the terms and conditions"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-white">Field Name *</span>
          <input
            type="text"
            className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10 font-mono text-sm"
            value={name}
            onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
            placeholder="e.g. terms_accepted"
          />
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="w-4 h-4 rounded" />
          <span className="text-sm font-medium text-white">Required</span>
        </label>

        <div className="text-xs text-gray-400 bg-blue-900/20 border border-blue-800 rounded-lg p-3">
          <p className="font-medium text-blue-300 mb-1">Opt-In Component</p>
          <p>Use for consent checkboxes, terms acceptance, or marketing opt-ins.</p>
        </div>
      </div>
    </ConfigModalWrapper>
  );
};

// ============================================================================
// ConfigDatePicker
// ============================================================================

interface ConfigDatePickerProps extends BaseConfigModalProps {
  initialConfig?: Partial<DatePicker>;
}

export const ConfigDatePicker = ({ onClose, onSave, initialConfig }: ConfigDatePickerProps) => {
  const [label, setLabel] = useState(initialConfig?.label?.toString() || "");
  const [name, setName] = useState(initialConfig?.name || "");
  const [helperText, setHelperText] = useState(initialConfig?.["helper-text"]?.toString() || "");

  const handleSave = () => {
    if (!label.trim() || !name.trim()) {
      alert("Label and Field Name are required");
      return;
    }
    const config: Partial<DatePicker> = { type: "DatePicker", label, name };
    if (helperText) config["helper-text"] = helperText;
    onSave(config);
  };

  return (
    <ConfigModalWrapper title="Configure Date Picker" onClose={onClose} onSave={handleSave} saveDisabled={!label.trim() || !name.trim()}>
      <div className="space-y-6">
        <label className="block">
          <span className="text-sm font-medium text-white">Label *</span>
          <input
            type="text"
            className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Date of Birth"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-white">Field Name *</span>
          <input
            type="text"
            className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10 font-mono text-sm"
            value={name}
            onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
            placeholder="e.g. date_of_birth"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-white">Helper Text</span>
          <input
            type="text"
            className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
            value={helperText}
            onChange={(e) => setHelperText(e.target.value)}
            placeholder="Optional hint for users"
          />
        </label>
      </div>
    </ConfigModalWrapper>
  );
};

// ============================================================================
// ConfigImage
// ============================================================================

interface ConfigImageProps extends BaseConfigModalProps {
  initialConfig?: Partial<Image>;
}

export const ConfigImage = ({ onClose, onSave, initialConfig }: ConfigImageProps) => {
  const [src, setSrc] = useState(initialConfig?.src?.toString() || "");
  const [width, setWidth] = useState(initialConfig?.width?.toString() || "");
  const [height, setHeight] = useState(initialConfig?.height?.toString() || "");
  const [aspectRatio, setAspectRatio] = useState(initialConfig?.["aspect-ratio"]?.toString() || "");
  const [scaleType, setScaleType] = useState<Image["scale-type"]>(initialConfig?.["scale-type"] || "contain");

  const handleSave = () => {
    if (!src.trim()) {
      alert("Image source URL is required");
      return;
    }
    const config: Partial<Image> = { type: "Image", src, "scale-type": scaleType };
    if (width) config.width = Number(width);
    if (height) config.height = Number(height);
    if (aspectRatio) config["aspect-ratio"] = Number(aspectRatio);
    onSave(config);
  };

  return (
    <ConfigModalWrapper title="Configure Image" onClose={onClose} onSave={handleSave} saveDisabled={!src.trim()}>
      <div className="space-y-6">
        <label className="block">
          <span className="text-sm font-medium text-white">Image URL *</span>
          <input
            type="url"
            className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
            value={src}
            onChange={(e) => setSrc(e.target.value)}
            placeholder="https://example.com/image.png"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-white">Width (px)</span>
            <input
              type="number"
              className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              placeholder="Auto"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-white">Height (px)</span>
            <input
              type="number"
              className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="Auto"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-white">Aspect Ratio</span>
          <input
            type="number"
            step="0.1"
            className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            placeholder="e.g. 1.5 (width/height)"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-white">Scale Type</span>
          <select
            className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
            value={scaleType}
            onChange={(e) => setScaleType(e.target.value as Image["scale-type"])}
          >
            <option value="contain">Contain</option>
            <option value="cover">Cover</option>
          </select>
        </label>
      </div>
    </ConfigModalWrapper>
  );
};

// ============================================================================
// Main Component Config Modal Router
// ============================================================================

interface ComponentConfigModalProps {
  component: {
    type: string;
    config?: any;
  };
  onSave: (config: any) => void;
  onClose: () => void;
}

export const ComponentConfigModal = ({ component, onSave, onClose }: ComponentConfigModalProps) => {
  switch (component.type) {
    case "TextHeading":
      return <ConfigTextHeading onClose={onClose} onSave={onSave} initialConfig={component.config} />;

    case "TextSubheading":
      return <ConfigTextSubheading onClose={onClose} onSave={onSave} initialConfig={component.config} />;

    case "TextBody":
      return <ConfigTextBody onClose={onClose} onSave={onSave} initialConfig={component.config} />;

    case "TextCaption":
      return <ConfigTextCaption onClose={onClose} onSave={onSave} initialConfig={component.config} />;

    case "TextInput":
      return <ConfigTextInput onClose={onClose} onSave={onSave} initialConfig={component.config} />;

    case "TextArea":
      return <ConfigTextArea onClose={onClose} onSave={onSave} initialConfig={component.config} />;

    case "Dropdown":
      return <ConfigDropdown onClose={onClose} onSave={onSave} initialConfig={component.config} />;

    case "RadioButtonsGroup":
      return <ConfigRadioButtonsGroup onClose={onClose} onSave={onSave} initialConfig={component.config} />;

    case "CheckboxGroup":
      return <ConfigCheckboxGroup onClose={onClose} onSave={onSave} initialConfig={component.config} />;

    case "ChipsSelector":
      return <ConfigChipsSelector onClose={onClose} onSave={onSave} initialConfig={component.config} />;

    case "OptIn":
      return <ConfigOptIn onClose={onClose} onSave={onSave} initialConfig={component.config} />;

    case "DatePicker":
      return <ConfigDatePicker onClose={onClose} onSave={onSave} initialConfig={component.config} />;

    case "Image":
      return <ConfigImage onClose={onClose} onSave={onSave} initialConfig={component.config} />;

    case "Footer":
      return <ConfigFooter onClose={onClose} onSave={onSave} initialConfig={component.config} />;

    default:
      return (
        <ConfigModalWrapper title="Unsupported Component" onClose={onClose} onSave={onClose}>
          <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-4">
            <p className="text-amber-300">
              Configuration modal for {component.type} is not yet implemented.
            </p>
          </div>
        </ConfigModalWrapper>
      );
  }
};
