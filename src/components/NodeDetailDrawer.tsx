import React, { useState, useEffect } from "react";
import {
  X,
  Database,
  Server,
  Activity,
  Layers,
  Globe,
  User,
  AlertCircle,
  CheckCircle2,
  Trash,
  Plus,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Tag,
  Clock,
  Settings,
  Flame
} from "lucide-react";
import { WorkflowNode, WorkflowEdge, NodeType, NodeStatus } from "../types";
import { getNodeColorClasses, getNodeIcon } from "./Canvas";

interface NodeDetailDrawerProps {
  node: WorkflowNode | null;
  edges: WorkflowEdge[];
  onClose: () => void;
  onUpdateNode: (updatedNode: WorkflowNode) => void;
  onDeleteNode: (id: string) => void;
  onShowNotification: (message: string, type: "success" | "error" | "info") => void;
}

export const NodeDetailDrawer: React.FC<NodeDetailDrawerProps> = ({
  node,
  edges,
  onClose,
  onUpdateNode,
  onDeleteNode,
  onShowNotification,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [labelInput, setLabelInput] = useState("");
  const [newDetailTag, setNewDetailTag] = useState("");

  useEffect(() => {
    if (node) {
      setLabelInput(node.label);
    }
  }, [node]);

  if (!node) return null;

  const copyIdToClipboard = () => {
    navigator.clipboard.writeText(node.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1500);
  };

  // Find upstream dependencies (edges pointing TO this node)
  const upstreamEdges = edges.filter((e) => e.to === node.id);
  // Find downstream dependencies (edges pointing FROM this node)
  const downstreamEdges = edges.filter((e) => e.from === node.id);

  const handleStatusChange = (status: NodeStatus) => {
    onUpdateNode({ ...node, status });
    onShowNotification(`Đã thiết đặt trạng thái Node ${node.id} thành '${status}'`, "success");
  };

  const handleTypeChange = (type: NodeType) => {
    onUpdateNode({ ...node, type });
    onShowNotification(`Đã đổi phân loại Node ${node.id} thành '${type}'`, "success");
  };

  const handleSaveLabel = () => {
    if (!labelInput.trim()) return;
    onUpdateNode({ ...node, label: labelInput.trim() });
    onShowNotification("Đã cập nhật nhãn tên Node thành công!", "success");
  };

  const handleAddDetailTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDetailTag.trim()) return;
    const currentDetails = node.details || [];
    if (currentDetails.includes(newDetailTag.trim())) {
      onShowNotification("Chi tiết kỹ thuật này đã tồn tại trên Node!", "info");
      return;
    }
    const updatedDetails = [...currentDetails, newDetailTag.trim()];
    onUpdateNode({ ...node, details: updatedDetails });
    setNewDetailTag("");
    onShowNotification("Đã thêm thông số kỹ thuật mới thành công!", "success");
  };

  const handleRemoveDetailTag = (tagToRemove: string) => {
    const updatedDetails = (node.details || []).filter((tag) => tag !== tagToRemove);
    onUpdateNode({ ...node, details: updatedDetails });
    onShowNotification("Đã loại bỏ thông số kỹ thuật này.", "info");
  };

  const { border, bg, accentText, badgeColor } = getNodeColorClasses(node.type, node.status);

  return (
    <div
      id="node_details_panel"
      className="w-full lg:w-[350px] bg-[#0d1017] border-l border-slate-800/80 flex flex-col h-full animate-slideInRight"
    >
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800 bg-[#161b22]">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-sky-400 rotate-45" />
          <h3 className="text-xs font-bold tracking-widest uppercase text-slate-300">
            Thông tin Node kỹ thuật
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
          title="Đóng bảng"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Body Scroll */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Visual Avatar Card */}
        <div className={`p-4 rounded-xl border ${border} ${bg} flex items-center gap-3 relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#0d1017] to-slate-950`}>
          <div className="absolute top-0 right-0 p-1 opacity-5">
            {getNodeIcon(node.type, "w-20 h-20")}
          </div>

          <div className={`p-2.5 rounded-lg ${badgeColor} shrink-0 shadow-inner`}>
            {getNodeIcon(node.type, "w-6 h-6")}
          </div>
          <div className="flex-1 min-w-0">
            <h4 id="drawer_node_label" className="text-sm font-semibold text-white tracking-wide truncate">
              {node.label}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-mono text-slate-500 truncate select-all">{node.id}</span>
              <button
                onClick={copyIdToClipboard}
                className="text-slate-500 hover:text-slate-300 transition"
                title="Sao chép ID Node"
              >
                {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* 1. Edit Name Module */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 font-mono block">
            Tên node & Hiển thị
          </span>
          <div className="flex gap-1.5">
            <input
              id="node_input_label_drawer"
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-sans text-slate-200 focus:outline-none focus:border-indigo-500/80"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveLabel();
              }}
            />
            <button
              onClick={handleSaveLabel}
              className="px-3 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 text-slate-300 text-xs rounded-lg transition"
            >
              Lưu
            </button>
          </div>
        </div>

        {/* 2. Interactive Status Setter */}
        <div className="space-y-2.5">
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 font-mono block">
            Trạng thái mô phỏng (Status)
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {(["success", "processing", "error", "idle"] as NodeStatus[]).map((st) => (
              <button
                key={st}
                onClick={() => handleStatusChange(st)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-mono font-medium transition cursor-pointer border ${
                  node.status === st
                    ? st === "success"
                      ? "border-emerald-500/50 bg-emerald-950/20 text-emerald-400"
                      : st === "processing"
                      ? "border-sky-500/50 bg-sky-950/15 text-sky-400"
                      : st === "error"
                      ? "border-rose-500/50 bg-rose-950/15 text-rose-400"
                      : "border-slate-400 bg-slate-800 text-slate-200"
                    : "border-slate-800/80 hover:border-slate-700/85 bg-slate-950/90 text-slate-400"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    st === "success"
                      ? "bg-emerald-400"
                      : st === "processing"
                      ? "bg-sky-400 animate-ping"
                      : st === "error"
                      ? "bg-rose-500 animate-pulse"
                      : "bg-slate-500"
                  }`}
                />
                <span className="capitalize">{st}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Type Class Select */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 font-mono block">
            Phân loại kỹ thuật (NodeType)
          </span>
          <select
            id="node_type_select_drawer"
            value={node.type}
            onChange={(e) => handleTypeChange(e.target.value as NodeType)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 cursor-pointer"
          >
            <option value="user">User / Actor (Client)</option>
            <option value="gateway">API Gateway / Load Balancer</option>
            <option value="service">Microservice Router</option>
            <option value="database">Database Storage / Replica</option>
            <option value="queue">Message Queue / Event Log</option>
            <option value="worker">Background Job Worker</option>
            <option value="external_api">External Cloud / API Service</option>
            <option value="condition">Conditional Splitter (Logic)</option>
            <option value="step">Generic Flow Step</option>
          </select>
        </div>

        {/* 4. Details / Technical parameters */}
        <div className="space-y-3">
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 font-mono block">
            Thông số Kỹ thuật (Details)
          </span>

          <form onSubmit={handleAddDetailTag} className="flex gap-1.5">
            <input
              id="node_input_tag_drawer"
              type="text"
              value={newDetailTag}
              onChange={(e) => setNewDetailTag(e.target.value)}
              placeholder="VD: Port 8080 or Redis IP..."
              className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-sans text-slate-200 focus:outline-none focus:border-indigo-500/80"
            />
            <button
              id="btn_add_tag_drawer"
              type="submit"
              className="p-1 px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
              title="Thêm chi tiết"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {node.details && node.details.length > 0 ? (
              node.details.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300"
                >
                  <Tag className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDetailTag(tag)}
                    className="text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 p-0.5 rounded transition"
                    title="Xóa"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-[11px] font-sans text-slate-500 italic">
                Chưa có thông số cấu hình. Hãy thêm mới bên trên!
              </span>
            )}
          </div>
        </div>

        {/* 5. Structural Inter-node Connection Dependency tracing */}
        <div className="space-y-3">
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 font-mono block">
            Liên kết Phụ thuộc (Connections)
          </span>

          <div className="space-y-2">
            <div>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mb-1">
                <ArrowLeft className="w-3 h-3 shrink-0" /> Inbound ( Đầu vào ):
              </span>
              {upstreamEdges.length > 0 ? (
                <div className="space-y-1 pl-3 border-l border-slate-800">
                  {upstreamEdges.map((edge, idx) => (
                    <div key={idx} className="text-[11px] text-slate-400 font-mono flex items-center gap-1 truncate">
                      <span className="text-slate-500">[{edge.from}]</span>
                      <ArrowRight className="w-2.5 h-2.5 text-slate-600 shrink-0" />
                      <span className="text-slate-300 italic">{edge.label || "default_link"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 pl-3 italic">Không có links inbound (đây là Seed Node)</div>
              )}
            </div>

            <div className="pt-1.5">
              <span className="text-[10px] text-sky-400 font-mono flex items-center gap-1 mb-1">
                Outbound ( Đầu ra ): <ArrowRight className="w-3 h-3 shrink-0" />
              </span>
              {downstreamEdges.length > 0 ? (
                <div className="space-y-1 pl-3 border-l border-slate-800">
                  {downstreamEdges.map((edge, idx) => (
                    <div key={idx} className="text-[11px] text-slate-400 font-mono flex items-center gap-1 truncate">
                      <ArrowRight className="w-2.5 h-2.5 text-slate-600 shrink-0" />
                      <span className="text-slate-300 italic">{edge.label || "default_link"}</span>
                      <span className="text-slate-500">[{edge.to}]</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 pl-3 italic">Không có links outbound (đây là Terminal Node)</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Drawer Footer Actions */}
      <div className="px-4 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2">
        <button
          id="btn_delete_selected_node"
          onClick={() => {
            if (confirm(`Bạn chắc chắn muốn xóa Node '${node.id}'? Các liên kết tương ứng cũng sẽ bị gỡ bỏ.`)) {
              onDeleteNode(node.id);
            }
          }}
          className="flex-1 py-2 bg-gradient-to-r from-rose-950 to-rose-900/80 hover:from-rose-900 border border-rose-800/80 hover:border-rose-600 hover:text-white text-rose-200 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
        >
          <Trash className="w-3.5 h-3.5" />
          <span>Xóa Node Hệ Thống</span>
        </button>
      </div>
    </div>
  );
};
