import { create } from "zustand";
import { CodeEditorState } from "../types";
import { LANGUAGE_CONFIG } from "../(root)/_constants";
import { Monaco } from "@monaco-editor/react";

const getInitialState = () => {
  //if we're on the server , return default value
  if (typeof window === "undefined") {
    return {
      language: "javascript",
      theme: "vs-dark",
      fontSize: 16,
    };
  }
  // if we're on the client, try to get the saved values from local storage
  const savedLanguage = localStorage.getItem("editor-language") || "javascript";
  const savedTheme = localStorage.getItem("editor-theme") || "vs-dark";
  const savedFontSize = parseInt(
    localStorage.getItem("editor-fontSize") || "16"
  );
  return {
    language: savedLanguage,
    theme: savedTheme,
    fontSize: savedFontSize,
  };
};
export const useCodeEditorStore = create<CodeEditorState>((set, get) => {
  const initialState = getInitialState();
  return {
    ...initialState,
    output: "",
    isRunning: false,
    error: null,
    editor: null,
    executionResult: null,
    getCode: () => get().editor?.getValue() || "",
    setEditor: (editor: Monaco) => {
      const savedCode = localStorage.getItem(`editor-code-${get().language}`);
      if (savedCode) {
        editor.setValue(savedCode);
      }
      set({ editor });
    },
    setTheme: (theme: string) => {
      localStorage.setItem("editor-theme", theme);
      set({ theme });
    },
    setFontSize: (fontSize: number) => {
      localStorage.setItem("editor-fontSize", fontSize.toString());
      set({ fontSize });
    },
    setLanguage: (language: string) => {
      //save current language code before switching
      const currentLanguage = get().editor?.getValue();
      if (currentLanguage) {
        localStorage.setItem(`editor-code-${get().language}`, currentLanguage);
      }
      //get the saved code for the new language
      localStorage.setItem("editor-language", language);
      set({ language, output: "", error: null });
    },
    runCode: async () => {
      const { language, getCode } = get();
      const code = getCode();
      if (!code) {
        set({ error: "No code to run, please add some code!" });
        return;
      }
      set({ isRunning: true, output: "", error: null });
      try {
        const runtime = LANGUAGE_CONFIG[language].pistonRuntime;
        const response = await fetch("https://emkc.org/api/v2/piston/execute", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            language: runtime.language,
            version: runtime.version,
            files: [
              {
                content: code,
              },
            ],
          }),
        });
        const data = await response.json();
        console.log("data back from piston:", data);
        //handle Api-level errors
        if (data.message) {
          set({
            error: data.message,
            executionResult: { code, output: "", error: data.message },
          });
          return;
        }
        //handle compilation errors
        if (data.compile && data.compile.code !== 0) {
          const error = data.compile.stderr || data.compile.output;
          set({
            error,
            executionResult: { code, output: "", error },
          });
          return;
        }
        //runtime errors
        if (data.run && data.run.code !== 0) {
          const error = data.run.stderr || data.run.output;
          set({
            error,
            executionResult: { code, output: "", error },
          });
          return;
        }
        //success
        const output = data.run.output || data.compile.output;
        set({
          output: output.trim(),
          executionResult: { code, output, error: null },
        });
      } catch (error) {
        console.error("Error running code:", error);
        set({
          error: "An error occurred while running the code.",
          executionResult: { code, output: "", error: "An error occurred." },
        });
      } finally {
        set({ isRunning: false });
      }
    },
  };
});
