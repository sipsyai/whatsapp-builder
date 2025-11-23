import { useEffect, useState } from "react";
import { whatsappConfigApi, type WhatsAppConfig, type TestConnectionResponse } from "./api";
import { copyToClipboard } from "../../utils/clipboard"; // utility to copy text

export const WhatsappConfigPage = () => {
    const [config, setConfig] = useState<Partial<WhatsAppConfig>>({});
    const [webhookUrl, setWebhookUrl] = useState<string>('');

    const [status, setStatus] = useState<"idle" | "saving" | "testing" | "success" | "error">("idle");
    const [message, setMessage] = useState<string>("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setStatus("saving");
        try {
            await whatsappConfigApi.saveConfig(config as WhatsAppConfig);
            setStatus("success");
            setMessage("Configuration saved successfully!");
            // Refresh webhook URL after save
            const webhook = await whatsappConfigApi.getWebhookUrl();
            setWebhookUrl(webhook.webhookUrl);
        } catch (err) {
            setStatus("error");
            setMessage((err as any).response?.data?.message || "Failed to save configuration");
        }
    };

    const handleTest = async () => {
        setStatus("testing");
        try {
            const result: TestConnectionResponse = await whatsappConfigApi.testConnection();
            if (result.success) {
                setStatus("success");
                setMessage(result.message);
            } else {
                setStatus("error");
                setMessage(result.message);
            }
        } catch (err) {
            setStatus("error");
            setMessage((err as any).response?.data?.message || "Connection test failed");
        }
    };

    useEffect(() => {
        const load = async () => {
            try {
                const cfg = await whatsappConfigApi.getConfig();
                setConfig(cfg);
                const webhook = await whatsappConfigApi.getWebhookUrl();
                setWebhookUrl(webhook.webhookUrl);
            } catch (err) {
                console.error('Failed to load config', err);
            }
        };
        load();
    }, []);

    return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-6 bg-white dark:bg-surface-dark rounded-lg shadow-sm">
            <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">WhatsApp API Configuration</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Configure your WhatsApp Business API credentials to enable messaging.
                </p>
            </div>

            <div className="space-y-6">
                {/* Credentials Section */}
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Phone Number ID
                        </label>
                        <input
                            type="text"
                            name="phoneNumberId"
                            value={config.phoneNumberId}
                            onChange={handleChange}
                            placeholder="e.g., 105954558954423"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                        />
                        <p className="text-xs text-gray-500 mt-1">Found in App Dashboard &gt; WhatsApp &gt; API Setup</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            WhatsApp Business Account ID
                        </label>
                        <input
                            type="text"
                            name="businessAccountId"
                            value={config.businessAccountId}
                            onChange={handleChange}
                            placeholder="e.g., 108954558954423"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            System User Access Token
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                name="accessToken"
                                value={config.accessToken}
                                onChange={handleChange}
                                placeholder="EAAG..."
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all font-mono"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Use a permanent token from a System User, not a temporary 24h token.
                        </p>
                    </div>
                </div>

                {/* Webhook Section */}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Webhook Configuration</h2>

                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Callback URL
                            </label>
                            <div className="flex items-center">
                                <input
                                    type="text"
                                    readOnly
                                    value={webhookUrl}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-mono text-sm"
                                />
                                <button
                                    className="ml-2 p-2 text-gray-500 hover:text-green-600 transition-colors"
                                    title="Copy URL"
                                    onClick={() => copyToClipboard(webhookUrl)}
                                >
                                    <span className="material-symbols-outlined text-xl">content_copy</span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Verify Token
                            </label>
                            <input
                                type="text"
                                name="webhookVerifyToken"
                                value={config.webhookVerifyToken}
                                onChange={handleChange}
                                placeholder="Create a secure random string"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Enter this same token in the Meta App Dashboard Webhook configuration.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                        {status === "success" && (
                            <span className="text-green-600 flex items-center text-sm font-medium">
                                <span className="material-symbols-outlined text-lg mr-1">check_circle</span>
                                {message}
                            </span>
                        )}
                        {status === "error" && (
                            <span className="text-red-600 flex items-center text-sm font-medium">
                                <span className="material-symbols-outlined text-lg mr-1">error</span>
                                {message}
                            </span>
                        )}
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={handleTest}
                            disabled={status === "testing" || status === "saving"}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                            {status === "testing" ? "Testing..." : "Test Connection"}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={status === "testing" || status === "saving"}
                            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 flex items-center"
                        >
                            {status === "saving" && (
                                <span className="material-symbols-outlined text-lg animate-spin mr-2">progress_activity</span>
                            )}
                            Save Configuration
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
