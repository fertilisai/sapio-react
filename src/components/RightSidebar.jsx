import Button from "./Button.jsx";
import InputKey from "./InputKey.jsx";
import InputNum from "./InputNum.jsx";
import InputSelect from "./InputSelect.jsx";
import { useLocalStorage } from "../hooks/useStorage.js";
import { useState } from "react";
import { settings } from "../data/settings.js";

export default function RightSidebar() {
  // Original state from localStorage
  const [settingsStored, setSettings, removeSettings] = useLocalStorage(
    "settings",
    JSON.stringify(settings)
  );
  const [apiStored, setApi, removeApi] = useLocalStorage("api", "OpenAI");
  const [apiKeyStored, setApiKey, removeApiKey] = useLocalStorage(
    "api-key",
    undefined
  );
  const [modelStored, setModel, removeModel] = useLocalStorage(
    "model",
    "gpt-3.5-turbo"
  );
  const [maxTokensStored, setMaxTokens, removeMaxTokens] = useLocalStorage(
    "max-tokens",
    "256"
  );
  const [temperatureStored, setTemperature, removeTemperature] =
    useLocalStorage("temperature", "0.7");
  const [topPStored, setTopP] = useLocalStorage("top-p", "1");

  // Local state for handling changes
  const [settingsLocal, setSettingsLocal] = useState(settingsStored);
  const [api, setApiLocal] = useState(apiStored);
  const [apiKey, setApiKeyLocal] = useState(apiKeyStored);
  const [model, setModelLocal] = useState(modelStored);
  const [maxTokens, setMaxTokensLocal] = useState(maxTokensStored);
  const [temperature, setTemperatureLocal] = useState(temperatureStored);
  const [topP, setTopPLocal] = useState(topPStored);

  function saveChanges() {
    setSettings(settingsLocal);
    setApi(api);
    setApiKey(apiKey);
    setModel(model);
    setMaxTokens(maxTokens);
    setTemperature(temperature);
    setTopP(topP);
  }

  return (
    <div className="flex flex-row-reverse">
      {/* Sidebar */}
      <aside className="flex">
        <div className="relative h-screen w-60 overflow-y-auto border-l border-slate-300 bg-slate-50 py-8 dark:border-slate-700 dark:bg-slate-900 sm:w-64">
          <div className="mb-4 flex items-center gap-x-2 px-2 text-slate-800 dark:text-slate-200">
            {/* <button className="inline-flex rounded-lg p-1 hover:bg-slate-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                strokeWidth="2"
                stroke="currentColor"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path>
                <path d="M9 4v16"></path>
                <path d="M14 10l2 2l-2 2"></path>
              </svg>
              <span className="sr-only">Close settings sidebar</span>
            </button> */}
            <h2 className="text-lg font-medium">Settings</h2>
          </div>

          {/* API */}
          <div className="px-2 py-4 text-slate-800 dark:text-slate-200">
            <InputSelect
              label="API"
              value={api}
              options={["OpenAI"]}
              onChange={(e) => setApiLocal(e.target.value)}
            />
            <InputKey
              label="API key"
              value={apiKey}
              onChange={(e) => setApiKeyLocal(e.target.value)}
            />
          </div>

          {/* Advanced Settings */}
          <div className="my-4 border-t border-slate-300 px-2 py-4 text-slate-800 dark:border-slate-700 dark:text-slate-200">
            <p className="px-2 text-xs uppercase text-slate-500 dark:text-slate-400">
              Advanced
            </p>

            <InputSelect
              label="Model"
              value={model}
              options={["gpt-3.5-turbo", "gpt-4o", "gpt-4-turbo", "gpt-4"]}
              onChange={(e) => setModelLocal(e.target.value)}
            />
            <InputNum
              label="Max tokens"
              value={maxTokens}
              min="0"
              max="2048"
              step="128"
              onChange={(e) => setMaxTokensLocal(e.target.value)}
            />
            <InputNum
              label="Temperature"
              value={temperature}
              min="0"
              max="2"
              step="0.1"
              onChange={(e) => setTemperatureLocal(e.target.value)}
            />
            <InputNum
              label="Top P"
              value={topP}
              min="0"
              max="1"
              step="0.1"
              onChange={(e) => setTopPLocal(e.target.value)}
            />
            <Button label="Save changes" takeAction={saveChanges} />
          </div>
        </div>
      </aside>
    </div>
  );
}
