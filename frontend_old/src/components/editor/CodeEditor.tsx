"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function CodeEditor({ value, onChange }: Props) {
  const options = useMemo(
    () => ({
      minimap: { enabled: false },
      fontSize: 14,
      scrollBeyondLastLine: false,
      automaticLayout: true,
    }),
    [],
  );

  return (
    <div className="h-80 w-full overflow-hidden rounded border">
      <MonacoEditor
        height="100%"
        defaultLanguage="python"
        value={value}
        onChange={(v) => onChange(v ?? "")}
        theme="vs-dark"
        options={options}
      />
    </div>
  );
}

