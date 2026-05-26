import React, { useState, useEffect } from "react";
import {
  Code,
  FileText,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  PlusCircle,
  Hash,
  ArrowRight
} from "lucide-react";
import { WorkflowData } from "../types";

interface EditorProps {
  jsonText: string;
  onJsonChange: (text: string) => void;
  isValid: boolean;
  validationError: string | null;
  onFormat: () => void;
  onResetToTemplate: () => void;
}

export const Editor: React.FC<EditorProps> = ({
  jsonText,
  onJsonChange,
  isValid,
  validationError,
  onFormat,
  onResetToTemplate,
}) => {
  const [copied, setCopied] = useState(false);
  const [showHelper, setShowHelper] = useState<boolean>(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
      {/* Editor Main Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-[#161b22] px-4 py-3">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold tracking-wider uppercase font-sans text-slate-300">
            Cấu hình JSON Workflow
          </span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button
            id="btn_format_json"
            onClick={onFormat}
            className="px-2.5 py-1 text-[11px] font-mono hover:text-white bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 rounded-md transition"
            title="Sắp xếp lại cấu trúc JSON cho đẹp mắt"
          >
            Format JSON
          </button>
          <button
            id="btn_copy_json"
            onClick={handleCopy}
            className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-md text-slate-300 hover:text-white text-[11px] font-mono transition flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
          <button
            id="btn_reset_default_template"
            onClick={onResetToTemplate}
            className="p-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white transition rounded-md"
            title="Khôi phục mẫu gốc"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Code Area */}
      <div className="flex-1 relative flex flex-col">
        <textarea
          id="json_workflow_textarea"
          value={jsonText}
          onChange={(e) => onJsonChange(e.target.value)}
          spellCheck={false}
          className="flex-1 w-full h-[320px] md:h-full p-4 bg-[#0d1117] text-slate-200 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          placeholder={`{\n  "title": "My Flow",\n  "layout": "horizontal",\n  "nodes": [],\n  "edges": []\n}`}
        />

        {/* Real-time status diagnostics alerts */}
        <div className="absolute bottom-0 inset-x-0 p-3 bg-slate-950/95 border-t border-slate-900 flex flex-col gap-1 z-10">
          {isValid ? (
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Cấu trúc JSON hợp lệ. Thay đổi được cập nhật trực quan!</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1 text-rose-400 text-xs font-mono font-medium">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>JSON lỗi cú pháp định dạng:</span>
              </div>
              <p className="text-[11px] text-slate-400 pl-5 overflow-auto max-h-[50px] whitespace-pre-wrap break-all leading-snug">
                {validationError}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Helper / Schema Rule Documentation Card */}
      {showHelper && (
        <div className="bg-[#161b22] border-t border-slate-800 p-4 font-sans text-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Hướng dẫn về Cú pháp JSON Quy chuẩn</span>
            </div>
            <button
              onClick={() => setShowHelper(false)}
              className="text-slate-500 hover:text-slate-300 text-[10px]"
            >
              Ẩn đi
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-slate-400 font-sans text-[11px] leading-relaxed">
            <div>
              <p className="font-semibold text-slate-300 mb-1">1. Thuộc tính nodes:</p>
              <ul className="list-disc pl-3.5 space-y-0.5">
                <li><strong className="text-slate-200">type</strong>: <code className="text-amber-500 font-mono">'user'</code>, <code className="text-blue-400 font-mono">'gateway'</code>, <code className="text-sky-400 font-mono">'service'</code>, <code className="text-yellow-500 font-mono">'database'</code>, <code className="text-rose-400 font-mono">'queue'</code>, <code className="text-emerald-400 font-mono">'worker'</code>, <code className="text-teal-400 font-mono">'external_api'</code>, <code className="text-orange-400 font-mono">'condition'</code></li>
                <li><strong className="text-slate-200">status</strong>: <code className="text-slate-400 font-mono">'success' | 'processing' | 'error' | 'idle'</code></li>
                <li><strong className="text-slate-200">details</strong>: danh sách tính năng (mảng string)</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-300 mb-1">2. Thuộc tính edges:</p>
              <ul className="list-disc pl-3.5 space-y-0.5">
                <li><strong className="text-slate-200">from / to</strong>: Phải trùng khớp với <code className="text-slate-200 font-mono">id</code> của một node</li>
                <li><strong className="text-slate-200">type</strong>: <code className="text-slate-300 font-mono">'default' | 'success' | 'error' | 'dashed'</code></li>
                <li><strong className="text-slate-200">layout</strong>: <code className="text-slate-300 font-mono">'horizontal' | 'vertical' | 'custom'</code></li>
              </ul>
            </div>
          </div>
        </div>
      )}
      {!showHelper && (
        <div className="bg-[#161b22]/40 border-t border-slate-800 p-2 text-center">
          <button
            onClick={() => setShowHelper(true)}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline inline-flex items-center gap-1"
          >
            <Lightbulb className="w-3 h-3 text-amber-400" />
            Hiện chỉ dẫn quy định JSON
          </button>
        </div>
      )}
    </div>
  );
};
