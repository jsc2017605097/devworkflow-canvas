import React, { useState } from "react";
import {
  FileText,
  Play,
  PlayCircle,
  Square,
  ChevronRight,
  PlusCircle,
  Link,
  Share2,
  Check,
  ChevronLeft,
  Settings,
  Database,
  Grid,
  Zap,
  ShieldAlert
} from "lucide-react";
import { WorkflowData, WORKFLOW_TEMPLATES, NodeType, EdgeType } from "../types";

interface ToolbarProps {
  currentWorkflow: WorkflowData;
  onSelectTemplate: (key: string) => void;
  isSimulating: boolean;
  onToggleSimulation: (active: boolean) => void;
  activeSimStep: number | null;
  onStepSim: (direction: "next" | "prev") => void;
  onAddNewNode: (node: { id: string; label: string; type: NodeType; details: string[] }) => void;
  onAddNewEdge: (edge: { from: string; to: string; label: string; type: EdgeType }) => void;
  onShowNotification: (message: string, type: "success" | "error" | "info") => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentWorkflow,
  onSelectTemplate,
  isSimulating,
  onToggleSimulation,
  activeSimStep,
  onStepSim,
  onAddNewNode,
  onAddNewEdge,
  onShowNotification,
}) => {
  const [activeTab, setActiveTab] = useState<"templates" | "add_node" | "add_edge">("templates");
  const [copiedLink, setCopiedLink] = useState(false);

  // Forms states
  const [nodeId, setNodeId] = useState("");
  const [nodeLabel, setNodeLabel] = useState("");
  const [nodeType, setNodeType] = useState<NodeType>("service");
  const [nodeDetail, setNodeDetail] = useState("");

  const [edgeFrom, setEdgeFrom] = useState("");
  const [edgeTo, setEdgeTo] = useState("");
  const [edgeLabel, setEdgeLabel] = useState("");
  const [edgeType, setEdgeType] = useState<EdgeType>("default");

  // Share layout link
  const handleShareLink = () => {
    try {
      const serialized = btoa(unescape(encodeURIComponent(JSON.stringify(currentWorkflow))));
      const shareUrl = `${window.location.origin}${window.location.pathname}#flow=${serialized}`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      onShowNotification("Đã sao chép liên kết chia sẻ sơ đồ cấu hình này vào Clipboard!", "success");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      onShowNotification("Có lỗi xảy ra khi mã hóa chia sẻ địa chỉ.", "error");
    }
  };

  const handleCreateNode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = nodeId.trim().toLowerCase().replace(/\s+/g, "_");
    if (!cleanId || !nodeLabel.trim()) {
      onShowNotification("Vui lòng điền đầy đủ Mã Code và Tên hiển thị Node.", "error");
      return;
    }

    const currentIds = currentWorkflow.nodes.map(n => n.id);
    if (currentIds.includes(cleanId)) {
      onShowNotification("Mã ID Node này đã tồn tại trong sơ đồ!", "error");
      return;
    }

    onAddNewNode({
      id: cleanId,
      label: nodeLabel.trim(),
      type: nodeType,
      details: nodeDetail.trim() ? [nodeDetail.trim()] : []
    });

    setNodeId("");
    setNodeLabel("");
    setNodeDetail("");
    onShowNotification("Đã chèn Node mới vào canvas thành công!", "success");
  };

  const handleCreateEdge = (e: React.FormEvent) => {
    e.preventDefault();
    const fromId = edgeFrom.trim();
    const toId = edgeTo.trim();

    if (!fromId || !toId) {
      onShowNotification("Vui lòng chọn hoặc nhập đầy đủ nguồn và đích kết nối.", "error");
      return;
    }

    if (fromId === toId) {
      onShowNotification("Node đích không được trùng với Node nguồn đầu vào.", "error");
      return;
    }

    const currentIds = currentWorkflow.nodes.map(n => n.id);
    if (!currentIds.includes(fromId) || !currentIds.includes(toId)) {
      onShowNotification("ID của Node nguồn hoặc Node đích không tồn tại trên bản vẽ!", "error");
      return;
    }

    onAddNewEdge({
      from: fromId,
      to: toId,
      label: edgeLabel.trim(),
      type: edgeType
    });

    setEdgeFrom("");
    setEdgeTo("");
    setEdgeLabel("");
    onShowNotification("Đã khởi tạo liên kết kết nối thành công!", "success");
  };

  return (
    <div className="bg-[#11141c] border border-slate-800/80 rounded-2xl p-5 shadow-lg">
      
      {/* Simulation Controls HUD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/60 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-950/20 border border-emerald-500/20 rounded-xl">
            <PlayCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Trình kiểm thử dòng thông điệp (Simulator)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Hỗ trợ mô phỏng di chuyển gói dữ liệu và xung tín hiệu đầu cuối
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSimulating ? (
            <>
              <button
                id="btn_sim_prev"
                onClick={() => onStepSim("prev")}
                className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition"
                title="Lùi lại bước trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="px-3.5 py-1.5 bg-sky-950/20 text-sky-400 border border-sky-500/10 font-mono text-xs rounded-lg select-none">
                Bước {activeSimStep !== null ? activeSimStep + 1 : 0} / {currentWorkflow.edges.length}
              </div>

              <button
                id="btn_sim_next"
                onClick={() => onStepSim("next")}
                className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition"
                title="Sự kiện tiếp theo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                id="btn_stop_simulation"
                onClick={() => onToggleSimulation(false)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white border border-rose-500 text-xs font-semibold rounded-lg transition"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Dừng xe</span>
              </button>
            </>
          ) : (
            <button
              id="btn_play_simulation"
              onClick={() => {
                if (!currentWorkflow.edges.length) {
                  onShowNotification("Bản vẽ của bạn chưa có liên kết (edges) nào để mô phỏng dữ liệu di chuyển!", "info");
                  return;
                }
                onToggleSimulation(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 text-xs font-semibold rounded-lg transition shadow-md shadow-emerald-950/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Bắt Đầu Mô Phỏng</span>
            </button>
          )}

          <button
            id="btn_share_flow"
            onClick={handleShareLink}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#161b22] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 text-xs font-semibold rounded-lg transition"
            title="Tạo liên kết để chia sẻ bản vẽ hiện tại"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? "Đã lấy link" : "Chia Sẻ Luồng"}</span>
          </button>
        </div>
      </div>

      {/* Toolbar Sub-Tabs */}
      <div className="flex border-b border-slate-900 mb-4">
        <button
          id="toolbar_tab_templates"
          onClick={() => setActiveTab("templates")}
          className={`px-4 py-2 text-xs font-semibold transition cursor-pointer ${
            activeTab === "templates"
              ? "text-indigo-400 border-b-2 border-indigo-500 bg-indigo-950/10"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Mẫu sơ đồ có sẵn
        </button>
        <button
          id="toolbar_tab_add_node"
          onClick={() => setActiveTab("add_node")}
          className={`px-4 py-2 text-xs font-semibold transition cursor-pointer ${
            activeTab === "add_node"
              ? "text-indigo-400 border-b-2 border-indigo-500 bg-indigo-950/10"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          + Thêm nhanh Node
        </button>
        <button
          id="toolbar_tab_add_edge"
          onClick={() => setActiveTab("add_edge")}
          className={`px-4 py-2 text-xs font-semibold transition cursor-pointer ${
            activeTab === "add_edge"
              ? "text-indigo-400 border-b-2 border-indigo-500 bg-indigo-950/10"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          + Mắc nối liên kết (Edge)
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "templates" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(WORKFLOW_TEMPLATES).map(([key, item]) => {
            const isSelected = currentWorkflow.title === item.title;
            return (
              <button
                key={key}
                id={`btn_template_select_${key}`}
                onClick={() => onSelectTemplate(key)}
                className={`flex flex-col justify-between p-3.5 rounded-xl border transition-all text-left cursor-pointer ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-950/20 hover:bg-indigo-950/30 shadow-inner"
                    : "border-slate-800/80 hover:border-slate-700 bg-[#0a0c10] hover:bg-slate-900"
                }`}
              >
                <div>
                  <span className="text-[10px] font-mono text-slate-500 block mb-1">
                    {key === "microservices"
                      ? "System Design"
                      : key === "cicd_pipeline"
                      ? "DevOps GitOps"
                      : "Big Data Ingestion"}
                  </span>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-white line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                
                <span className="text-[9px] font-mono text-indigo-400 font-semibold tracking-wide flex items-center gap-1 mt-2.5">
                  Load Template <ChevronRight className="w-2.5 h-2.5" />
                </span>
              </button>
            );
          })}
        </div>
      )}

      {activeTab === "add_node" && (
        <form onSubmit={handleCreateNode} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Mã ID node (id)
            </label>
            <input
              id="input_add_node_id"
              type="text"
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
              placeholder="vd: order_service"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-sans text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Tên Node (label)
            </label>
            <input
              id="input_add_node_label"
              type="text"
              value={nodeLabel}
              onChange={(e) => setNodeLabel(e.target.value)}
              placeholder="vd: Order Microservice"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-sans text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5 col-span-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Kiểu linh kiện
            </label>
            <select
              id="input_add_node_type"
              value={nodeType}
              onChange={(e) => setNodeType(e.target.value as NodeType)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-200 cursor-pointer focus:outline-none focus:border-indigo-500"
            >
              <option value="user">User / Client Client</option>
              <option value="gateway">API Gateway / Ingress</option>
              <option value="service">Backend Microservice</option>
              <option value="database">Database System</option>
              <option value="queue">Message Stream Queue</option>
              <option value="worker">Job Worker Thread</option>
              <option value="external_api">Third-party API Cloud</option>
              <option value="condition">Conditional Branch</option>
              <option value="step">Generic Flow Step</option>
            </select>
          </div>

          <button
            id="btn_submit_add_node"
            type="submit"
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition border border-indigo-500 flex items-center justify-center gap-1 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Thêm Node</span>
          </button>
        </form>
      )}

      {activeTab === "add_edge" && (
        <form onSubmit={handleCreateEdge} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Node nguồn (from)
            </label>
            <select
              id="input_add_edge_from"
              value={edgeFrom}
              onChange={(e) => setEdgeFrom(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 cursor-pointer"
            >
              <option value="">-- Chọn Node nguồn --</option>
              {currentWorkflow.nodes.map(n => (
                <option key={n.id} value={n.id}>{n.label} ({n.id})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Node đích (to)
            </label>
            <select
              id="input_add_edge_to"
              value={edgeTo}
              onChange={(e) => setEdgeTo(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 cursor-pointer"
            >
              <option value="">-- Chọn Node đích --</option>
              {currentWorkflow.nodes.map(n => (
                <option key={n.id} value={n.id}>{n.label} ({n.id})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Mô tả liên kết (label)
            </label>
            <input
              id="input_add_edge_label"
              type="text"
              value={edgeLabel}
              onChange={(e) => setEdgeLabel(e.target.value)}
              placeholder="Ví dụ: HTTP POST, SQL Query..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Loại đường truyền
            </label>
            <select
              id="input_add_edge_type"
              value={edgeType}
              onChange={(e) => setEdgeType(e.target.value as EdgeType)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-200 cursor-pointer focus:outline-none"
            >
              <option value="default">Default Slate Solid</option>
              <option value="success">Emerald Active Flow</option>
              <option value="error">Dashed Warning Red</option>
              <option value="dashed">Dashed General Grey</option>
            </select>
          </div>

          <button
            id="btn_submit_add_edge"
            type="submit"
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition border border-indigo-500 flex items-center justify-center gap-1 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Mắc dây</span>
          </button>
        </form>
      )}
    </div>
  );
};
