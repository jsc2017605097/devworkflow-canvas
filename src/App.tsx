import React, { useState, useEffect, useRef } from "react";
import {
  Workflow,
  Sparkles,
  LayoutGrid,
  TrendingUp,
  RotateCcw,
  BookOpen,
  Info,
  Layers,
  FileCode,
  CheckCircle,
  Play,
  Share2,
  Trash2,
  GitBranch,
  X,
  FileText
} from "lucide-react";
import { WorkflowData, WorkflowNode, WorkflowEdge, NodeType, EdgeType, WORKFLOW_TEMPLATES } from "./types";
import { Canvas } from "./components/Canvas";
import { Editor } from "./components/Editor";
import { AiAssistant } from "./components/AiAssistant";
import { NodeDetailDrawer } from "./components/NodeDetailDrawer";
import { Toolbar } from "./components/Toolbar";

export default function App() {
  // Initialize from hash link if available, otherwise default to Microservices template
  const loadInitialWorkflow = (): WorkflowData => {
    try {
      if (typeof window !== "undefined" && window.location.hash.startsWith("#flow=")) {
        const hashPayload = window.location.hash.slice(6);
        const decoded = decodeURIComponent(escape(atob(hashPayload)));
        const parsed = JSON.parse(decoded);
        if (parsed && parsed.title && Array.isArray(parsed.nodes)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Lỗi khi tải dữ liệu từ liên kết chia sẻ hash URL:", e);
    }
    return WORKFLOW_TEMPLATES.microservices;
  };

  const initialWorkflow = loadInitialWorkflow();
  const [workflow, setWorkflow] = useState<WorkflowData>(initialWorkflow);
  
  // JSON plain text backing editor
  const [jsonText, setJsonText] = useState<string>(JSON.stringify(initialWorkflow, null, 2));
  const [isValid, setIsValid] = useState<boolean>(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Active highlighted nodes inside inspector drawer
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Simulation play loop
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [activeSimStep, setActiveSimStep] = useState<number | null>(null);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Notification states
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
    id: number;
  } | null>(null);

  const showNotification = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now();
    setNotification({ message, type, id });
  };

  // Close notifications after 3.2s
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => {
        setNotification(null);
      }, 3200);
      return () => clearTimeout(t);
    }
  }, [notification]);

  // Sync canvas nodes update directly down to text editor
  const syncWorkflowToText = (updatedWorkflow: WorkflowData) => {
    setWorkflow(updatedWorkflow);
    setJsonText(JSON.stringify(updatedWorkflow, null, 2));
    setIsValid(true);
    setValidationError(null);
  };

  // Handle incoming edits from code area
  const handleJsonTextChange = (text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      if (!parsed.title) {
        throw new Error("Sơ đồ cần có thuộc tính 'title' để hiển thị tên tiêu đề.");
      }
      if (!Array.isArray(parsed.nodes)) {
        throw new Error("Thuộc tính 'nodes' phải là một mảng danh sách.");
      }
      if (!Array.isArray(parsed.edges)) {
        throw new Error("Thuộc tính 'edges' phải là một mảng liên kết đường nối.");
      }

      setWorkflow(parsed);
      setIsValid(true);
      setValidationError(null);
    } catch (err: any) {
      setIsValid(false);
      setValidationError(err.message || "Cú pháp JSON lỗi");
    }
  };

  // Drag coordinate synchronizers
  const handleUpdateNodePosition = (id: string, x: number, y: number) => {
    const updatedNodes = workflow.nodes.map(n => (n.id === id ? { ...n, x, y } : n));
    const nextWorkflow: WorkflowData = { ...workflow, nodes: updatedNodes, layout: "custom" };
    syncWorkflowToText(nextWorkflow);
  };

  // Load existing templates
  const handleSelectTemplate = (key: string) => {
    const selectedTemplate = WORKFLOW_TEMPLATES[key];
    if (selectedTemplate) {
      syncWorkflowToText(selectedTemplate);
      setSelectedNodeId(null);
      setIsSimulating(false);
      showNotification(`Đã tải sơ đồ mẫu: ${selectedTemplate.title}`, "success");
    }
  };

  // Auto layout align trigger
  const handleAlignLayout = (layoutType: "horizontal" | "vertical" | "custom") => {
    const nextWorkflow: WorkflowData = { ...workflow, layout: layoutType };
    syncWorkflowToText(nextWorkflow);
    showNotification(`Đã đổi căn lề tự động: ${layoutType.toUpperCase()}`, "success");
  };

  // Auto clean pretty JSON formatter
  const handleFormatJsonText = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setIsValid(true);
      setValidationError(null);
      showNotification("Đã chuẩn hóa định dạng JSON!", "success");
    } catch (err: any) {
      showNotification("JSON hiện tại đang có lỗi cú pháp, không thể căn lề.", "error");
    }
  };

  // Generate flow from AI successful payload
  const handleAiGenerationSuccess = (aiPayload: any) => {
    syncWorkflowToText(aiPayload);
    setSelectedNodeId(null);
    setIsSimulating(false);
  };

  // Simulation timer controls
  useEffect(() => {
    if (isSimulating) {
      setActiveSimStep(0);
      showNotification("Bắt đầu chạy mô phỏng gói tin hành trình...", "success");

      simTimerRef.current = setInterval(() => {
        setActiveSimStep((prevStep) => {
          if (prevStep === null) return 0;
          const nextStep = prevStep + 1;
          if (nextStep >= workflow.edges.length) {
            showNotification("Chu kỳ mô phỏng hoàn tất! Đang lặp lại...", "success");
            return 0; // Loop over
          }
          return nextStep;
        });
      }, 2000);
    } else {
      if (simTimerRef.current) {
        clearInterval(simTimerRef.current);
      }
      setActiveSimStep(null);
    }

    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [isSimulating, workflow.edges.length]);

  const handleStepSim = (direction: "next" | "prev") => {
    if (activeSimStep === null) {
      setActiveSimStep(0);
      return;
    }
    if (direction === "next") {
      const nextStep = (activeSimStep + 1) % workflow.edges.length;
      setActiveSimStep(nextStep);
    } else {
      const prevStep = (activeSimStep - 1 + workflow.edges.length) % workflow.edges.length;
      setActiveSimStep(prevStep);
    }
  };

  // Selected single Node updates from Sidebar drawer
  const selectedNode = workflow.nodes.find(n => n.id === selectedNodeId) || null;

  const handleUpdateNode = (updatedNode: WorkflowNode) => {
    const updatedNodes = workflow.nodes.map(n => (n.id === updatedNode.id ? updatedNode : n));
    syncWorkflowToText({ ...workflow, nodes: updatedNodes });
  };

  const handleDeleteNode = (id: string) => {
    // Erase node
    const updatedNodes = workflow.nodes.filter(n => n.id !== id);
    // Erase loose edges associated with this node
    const updatedEdges = workflow.edges.filter(e => e.from !== id && e.to !== id);
    
    syncWorkflowToText({ ...workflow, nodes: updatedNodes, edges: updatedEdges });
    setSelectedNodeId(null);
    showNotification(`Đã loại bỏ Node ${id} và các liên kết phụ thuộc.`, "success");
  };

  // Toolbar adding injections
  const handleAddNewNode = (newNodeInfo: { id: string; label: string; type: NodeType; details: string[] }) => {
    const newNode: WorkflowNode = {
      ...newNodeInfo,
      status: "idle",
      x: 100 + Math.random() * 80,
      y: 100 + Math.random() * 80,
    };
    const updatedNodes = [...workflow.nodes, newNode];
    syncWorkflowToText({ ...workflow, nodes: updatedNodes });
  };

  const handleAddNewEdge = (newEdge: { from: string; to: string; label: string; type: EdgeType }) => {
    const updatedEdges = [...workflow.edges, newEdge];
    syncWorkflowToText({ ...workflow, edges: updatedEdges });
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans select-none antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* 1. Global Notification Banner */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-slideInRight max-w-sm">
          <div className={`p-4 rounded-xl shadow-2xl border flex items-center gap-3 ${
            notification.type === "success"
              ? "bg-[#0c1f17] border-emerald-500/30 text-emerald-300"
              : notification.type === "error"
              ? "bg-[#251216] border-rose-500/30 text-rose-300"
              : "bg-[#0b192c] border-indigo-500/20 text-indigo-300"
          }`}>
            <div className={`p-1.5 rounded-lg shrink-0 ${
              notification.type === "success"
                ? "bg-emerald-900/60"
                : notification.type === "error"
                ? "bg-rose-900/40"
                : "bg-indigo-950"
            }`}>
              <CheckCircle className="w-4 h-4 shrink-0" />
            </div>
            <p className="text-xs font-semibold leading-relaxed tracking-wide">
              {notification.message}
            </p>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white ml-auto cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Page Navigation / Branding Header */}
      <header className="border-b border-slate-900 bg-[#0b0d13]/80 backdrop-blur sticky top-0 z-40 px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-950/40 shrink-0">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider uppercase text-slate-100 font-sans leading-none">
              DevWorkflow Canvas
            </h1>
            <p className="text-[10px] text-slate-400 mt-1">
              Hệ thống dựng và mô phỏng luồng thông tin trong thiết kế kiến trúc kỹ thuật
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Info Meter */}
          <div className="hidden lg:flex items-center gap-4 bg-slate-950/80 border border-slate-900 rounded-xl py-1.5 px-3.5 text-xs font-mono text-slate-400 leading-none">
            <div className="flex items-center gap-1">
              <span>Nodes:</span>
              <span className="text-sky-400 font-semibold">{workflow.nodes.length}</span>
            </div>
            <div className="h-3.5 w-px bg-slate-800" />
            <div className="flex items-center gap-1">
              <span>Lines:</span>
              <span className="text-purple-400 font-semibold">{workflow.edges.length}</span>
            </div>
            <div className="h-3.5 w-px bg-slate-800" />
            <span className="text-[10px] uppercase text-indigo-400 font-bold bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-950">
              Developer Workspace
            </span>
          </div>
        </div>
      </header>

      {/* 3. Main Split Window Architecture */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden h-[calc(100vh-56px)]">
        
        {/* Left Side: Canvas & Toolbar Controls */}
        <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto gap-4 md:gap-5">
          
          {/* Top Level Action Toolbar */}
          <Toolbar
            currentWorkflow={workflow}
            onSelectTemplate={handleSelectTemplate}
            isSimulating={isSimulating}
            onToggleSimulation={setIsSimulating}
            activeSimStep={activeSimStep}
            onStepSim={handleStepSim}
            onAddNewNode={handleAddNewNode}
            onAddNewEdge={handleAddNewEdge}
            onShowNotification={showNotification}
          />

          {/* Sơ đồ Workspace Render Canvas Info */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex flex-col">
                <h2 id="current_workflow_title" className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  📁 {workflow.title}
                </h2>
                {workflow.description && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {workflow.description}
                  </p>
                )}
              </div>

              {/* Align actions */}
              <div className="flex items-center gap-1 bg-slate-900/60 p-1 border border-slate-800 rounded-lg shrink-0">
                <span className="text-[10px] text-slate-500 font-mono px-1.5">Autolayout:</span>
                <button
                  id="btn_align_horizontal"
                  onClick={() => handleAlignLayout("horizontal")}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                    workflow.layout === "horizontal"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Xếp tự động hàng ngang"
                >
                  X
                </button>
                <button
                  id="btn_align_vertical"
                  onClick={() => handleAlignLayout("vertical")}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                    workflow.layout === "vertical"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Xếp tự động hàng dọc"
                >
                  Y
                </button>
                <button
                  id="btn_align_custom"
                  onClick={() => handleAlignLayout("custom")}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                    workflow.layout === "custom"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Bật tọa độ tự do trong JSON"
                >
                  Free
                </button>
              </div>
            </div>

            {/* Render interactive Drag Canvas */}
            <Canvas
              workflow={workflow}
              onUpdateNodePosition={handleUpdateNodePosition}
              onSelectNode={(node) => setSelectedNodeId(node ? node.id : null)}
              selectedNodeId={selectedNodeId}
              activeSimStep={activeSimStep}
              isSimulating={isSimulating}
            />
          </div>

          {/* AI generator segment */}
          <AiAssistant
            onGenerateSuccess={handleAiGenerationSuccess}
            onShowNotification={showNotification}
          />

          {/* In-depth Telemetry summary logger */}
          <div className="bg-[#0b0e14] border border-slate-900 rounded-xl p-4">
            <h4 className="text-[10px] font-bold tracking-widest text-slate-500 font-mono uppercase mb-3 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              Sổ tay giám sát liên kết truyền tin
            </h4>
            <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
              {workflow.edges.map((edge, index) => {
                const isActive = isSimulating && activeSimStep === index;
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs font-mono transition-all ${
                      isActive
                        ? "bg-sky-950/20 border-sky-500/30 text-sky-300"
                        : "bg-slate-950/40 border-slate-900 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] text-slate-600 shrink-0">#{index+1}</span>
                      <span className="font-semibold text-slate-300">[{edge.from}]</span>
                      <span className="text-slate-600">→</span>
                      <span className="font-semibold text-slate-300">[{edge.to}]</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-500 font-sans italic">{edge.label || "default_protocol"}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold leading-none ${
                        edge.type === "success"
                          ? "bg-emerald-950 text-emerald-400"
                          : edge.type === "error"
                          ? "bg-rose-950 text-rose-400"
                          : "bg-slate-900 text-slate-400"
                      }`}>
                        {edge.type || "default"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side Column: JSON Live Editor & Node Details Config */}
        <div className="w-full lg:w-[480px] border-t lg:border-t-0 lg:border-l border-slate-900 flex flex-row shrink-0 h-full overflow-hidden bg-[#0a0d14]">
          
          {/* Sub-split: Live editor always takes full column block, detail panel slides next to it */}
          <div className="flex-1 flex flex-col h-full bg-[#0d1017]">
            <Editor
              jsonText={jsonText}
              onJsonChange={handleJsonTextChange}
              isValid={isValid}
              validationError={validationError}
              onFormat={handleFormatJsonText}
              onResetToTemplate={() => {
                // Find matching loaded template or reset to standard microservices
                const currentTitle = workflow.title;
                const matchedKey = Object.keys(WORKFLOW_TEMPLATES).find(k => WORKFLOW_TEMPLATES[k].title === currentTitle) || "microservices";
                handleSelectTemplate(matchedKey);
              }}
            />
          </div>

          {/* Selected Node Drawer */}
          {selectedNodeId && (
            <NodeDetailDrawer
              node={selectedNode}
              edges={workflow.edges}
              onClose={() => setSelectedNodeId(null)}
              onUpdateNode={handleUpdateNode}
              onDeleteNode={handleDeleteNode}
              onShowNotification={showNotification}
            />
          )}

        </div>
      </main>
    </div>
  );
}
