import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Database,
  Server,
  Activity,
  Layers,
  Globe,
  User,
  AlertCircle,
  CheckCircle2,
  Cpu,
  HelpCircle,
  Play,
  RotateCcw,
  Zap,
  ZoomIn,
  ZoomOut,
  Maximize,
  Maximize2,
  Minimize2,
  Clock,
  Settings,
  HelpCircle as QuestionIcon
} from "lucide-react";
import { WorkflowData, WorkflowNode, WorkflowEdge, NodeType, NodeStatus } from "../types";

interface CanvasProps {
  workflow: WorkflowData;
  onUpdateNodePosition: (id: string, x: number, y: number) => void;
  onSelectNode: (node: WorkflowNode | null) => void;
  selectedNodeId: string | null;
  activeSimStep: number | null;
  isSimulating: boolean;
}

// Map NodeTypes to styled cards and professional icons
export function getNodeIcon(type: NodeType, className = "w-5 h-5") {
  switch (type) {
    case "user":
      return <User className={className} />;
    case "gateway":
      return <Layers className={className} />;
    case "service":
      return <Server className={className} />;
    case "database":
      return <Database className={className} />;
    case "queue":
      return <Cpu className={className} />;
    case "worker":
      return <Zap className={className} />;
    case "external_api":
      return <Globe className={className} />;
    case "condition":
      return <Activity className={className} />;
    default:
      return <Clock className={className} />;
  }
}

export function getNodeColorClasses(type: NodeType, status: NodeStatus) {
  let border = "border-slate-800";
  let bg = "bg-slate-900/90";
  let shadow = "shadow-slate-950/20";
  let accentText = "text-slate-400";
  let badgeColor = "bg-slate-800 text-slate-300";

  switch (type) {
    case "user":
      border = "border-indigo-500/40 text-indigo-400";
      bg = "bg-indigo-950/40 backdrop-blur-md";
      accentText = "text-indigo-200";
      badgeColor = "bg-indigo-900/50 text-indigo-300 border border-indigo-500/20";
      break;
    case "gateway":
      border = "border-purple-500/40 text-purple-400";
      bg = "bg-purple-950/40 backdrop-blur-md";
      accentText = "text-purple-200";
      badgeColor = "bg-purple-900/50 text-purple-300 border border-purple-500/20";
      break;
    case "service":
      border = "border-sky-500/40 text-sky-400";
      bg = "bg-sky-950/40 backdrop-blur-md";
      accentText = "text-sky-200";
      badgeColor = "bg-sky-900/50 text-sky-300 border border-sky-500/20";
      break;
    case "database":
      border = "border-amber-500/40 text-amber-400";
      bg = "bg-amber-950/40 backdrop-blur-md";
      accentText = "text-amber-200";
      badgeColor = "bg-amber-900/50 text-amber-300 border border-amber-500/20";
      break;
    case "queue":
      border = "border-rose-500/40 text-rose-400";
      bg = "bg-rose-950/40 backdrop-blur-md";
      accentText = "text-rose-200";
      badgeColor = "bg-rose-900/50 text-rose-300 border border-rose-500/20";
      break;
    case "worker":
      border = "border-emerald-500/40 text-emerald-400";
      bg = "bg-emerald-950/40 backdrop-blur-md";
      accentText = "text-emerald-200";
      badgeColor = "bg-emerald-900/50 text-emerald-300 border border-emerald-500/20";
      break;
    case "external_api":
      border = "border-teal-500/40 text-teal-400";
      bg = "bg-teal-950/40 backdrop-blur-md";
      accentText = "text-teal-200";
      badgeColor = "bg-teal-900/50 text-teal-300 border border-teal-500/20";
      break;
    case "condition":
      border = "border-orange-500/40 text-orange-400";
      bg = "bg-orange-950/40 backdrop-blur-md";
      accentText = "text-orange-200";
      badgeColor = "bg-orange-900/50 text-orange-300 border border-orange-500/20";
      break;
    default:
      border = "border-slate-500/40 text-slate-400";
      bg = "bg-slate-950/40 backdrop-blur-md";
      accentText = "text-slate-200";
      badgeColor = "bg-slate-800 text-slate-300 border border-slate-700";
  }

  // Overlay status border glows
  let statusGlow = "";
  if (status === "processing") {
    statusGlow = "ring-2 ring-sky-400 animate-pulse border-sky-400";
  } else if (status === "error") {
    statusGlow = "ring-2 ring-rose-500 border-rose-500/80 shadow-rose-950/40";
  } else if (status === "success") {
    statusGlow = "ring-1 ring-emerald-500/50 shadow-emerald-950/20";
  }

  return { border, bg, shadow, accentText, badgeColor, statusGlow };
}

export function computeAutoLayout(nodes: WorkflowNode[], edges: WorkflowEdge[], layout: "horizontal" | "vertical" | "custom"): WorkflowNode[] {
  if (layout === "custom") {
    const hasPositions = nodes.every(n => n.x !== undefined && n.y !== undefined);
    if (hasPositions) return nodes;
  }

  // 1. Calculate in-degrees and build adjacency lists
  const adj: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};
  
  nodes.forEach(node => {
    adj[node.id] = [];
    inDegree[node.id] = 0;
  });

  edges.forEach(edge => {
    if (adj[edge.from] && adj[edge.to] !== undefined) {
      adj[edge.from].push(edge.to);
      inDegree[edge.to]++;
    }
  });

  // 2. BFS Kahn's logic to group nodes by topological distance/rank level
  const queue: string[] = [];
  const rank: Record<string, number> = {};
  
  nodes.forEach(node => {
    if (inDegree[node.id] === 0) {
      queue.push(node.id);
      rank[node.id] = 0;
    }
  });

  // Avoid infinite loops on cycles
  let visitedCount = 0;
  const maxSafety = nodes.length * 2;

  while (queue.length > 0 && visitedCount < maxSafety) {
    const current = queue.shift()!;
    visitedCount++;
    const currentRank = rank[current] || 0;

    adj[current].forEach(neighbor => {
      const nextRank = Math.max(rank[neighbor] || 0, currentRank + 1);
      rank[neighbor] = nextRank;
      
      inDegree[neighbor]--;
      // Push anyway to complete rank checking or break loop safety limits
      if (inDegree[neighbor] <= 0 || visitedCount > nodes.length) {
        queue.push(neighbor);
      }
    });
  }

  // Safety handle disconnected or cyclical remaining nodes
  nodes.forEach(node => {
    if (rank[node.id] === undefined) {
      rank[node.id] = 0;
    }
  });

  // 3. Group by rank levels
  const rankGroups: Record<number, string[]> = {};
  nodes.forEach(node => {
    const r = rank[node.id];
    if (!rankGroups[r]) rankGroups[r] = [];
    if (!rankGroups[r].includes(node.id)) {
      rankGroups[r].push(node.id);
    }
  });

  // 4. Transform positions based on ranks
  const computedNodes = nodes.map(node => {
    // If layout is custom and node has positions, carry over
    if (layout === "custom" && node.x !== undefined && node.y !== undefined) {
      return node;
    }

    const currentRank = rank[node.id];
    const siblings = rankGroups[currentRank] || [node.id];
    const siblingIndex = siblings.indexOf(node.id);
    const siblingsCount = siblings.length;

    let x = 100;
    let y = 100;

    if (layout === "vertical") {
      // In vertical, rank is vertical offset (y), siblings are spread horizontally (x)
      const horizontalRange = siblingsCount > 1 ? siblingsCount * 250 : 250;
      const startX = 400 - (horizontalRange / 2);
      x = startX + (siblingIndex * 250) + 125;
      y = currentRank * 160 + 85;
    } else {
      // Horizontal (default), rank is horizontal offset (x), siblings are spread vertically (y)
      x = currentRank * 260 + 100;
      // Center vertical alignment
      const verticalRange = siblingsCount > 1 ? siblingsCount * 140 : 140;
      const startY = 300 - (verticalRange / 2);
      y = startY + (siblingIndex * 140) + 70;
    }

    return {
      ...node,
      // Fallback or use assigned coordinates
      x: node.x !== undefined && layout === "custom" ? node.x : x,
      y: node.y !== undefined && layout === "custom" ? node.y : y,
    };
  });

  return computedNodes;
}

export const Canvas: React.FC<CanvasProps> = ({
  workflow,
  onUpdateNodePosition,
  onSelectNode,
  selectedNodeId,
  activeSimStep,
  isSimulating,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Transform settings & Fullscreen
  const [zoom, setZoom] = useState<number>(0.9);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 50, y: 30 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Sync state with physical full screen change (such as pressing ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement && document.fullscreenElement === containerRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Listen to escape key for manual fallback fullscreen state exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (isFullscreen) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    } else {
      containerRef.current.requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch((err) => {
          console.warn("Fullscreen API failed or restricted, falling back to viewport overlay mode", err);
          setIsFullscreen(true);
        });
    }
  };

  // Grid background positioning
  const backgroundPosition = `${pan.x}px ${pan.y}px`;

  // Standardize positions with layout math
  const processedNodes = useMemo(() => {
    return computeAutoLayout(workflow.nodes, workflow.edges, workflow.layout);
  }, [workflow.nodes, workflow.edges, workflow.layout]);

  // Create lookup dictionary for coordinates
  const nodeCoords = useMemo(() => {
    const coords: Record<string, { x: number; y: number }> = {};
    processedNodes.forEach(node => {
      coords[node.id] = { x: node.x || 0, y: node.y || 0 };
    });
    return coords;
  }, [processedNodes]);

  // Node Drag State
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const dragOffsets = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Pan Canvas
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".node-card") || (e.target as HTMLElement).closest("button")) {
      return; // click inside nodes or controls should not trigger pan
    }
    setIsPanning(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    } else if (draggedNodeId && containerRef.current) {
      // Convert browser delta offset inside Zoom factor
      const rect = containerRef.current.getBoundingClientRect();
      const currentMouseXInCanvas = (e.clientX - rect.left - pan.x) / zoom;
      const currentMouseYInCanvas = (e.clientY - rect.top - pan.y) / zoom;
      
      const newX = Math.round(currentMouseXInCanvas - dragOffsets.current.x);
      const newY = Math.round(currentMouseYInCanvas - dragOffsets.current.y);

      // Lock positions inside a reasonable box boundaries
      const boundedX = Math.max(10, Math.min(2200, newX));
      const boundedY = Math.max(10, Math.min(1800, newY));

      onUpdateNodePosition(draggedNodeId, boundedX, boundedY);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedNodeId(null);
  };

  // Wheel zoom action
  const handleWheel = (e: React.WheelEvent) => {
    // Only zoom if over the workspace region, bypass on rich content inside node
    e.preventDefault();
    const zoomIntensity = 0.05;
    const nextZoom = e.deltaY < 0 ? Math.min(1.8, zoom + zoomIntensity) : Math.max(0.4, zoom - zoomIntensity);
    setZoom(nextZoom);
  };

  // Start dragging node
  const handleNodeDragStart = (e: React.MouseEvent, nodeId: string, nodeX: number, nodeY: number) => {
    e.stopPropagation();
    if (isSimulating) return; // Disable drag during active gameplay
    setDraggedNodeId(nodeId);
    
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickXInCanvas = (e.clientX - rect.left - pan.x) / zoom;
      const clickYInCanvas = (e.clientY - rect.top - pan.y) / zoom;
      
      dragOffsets.current = {
        x: clickXInCanvas - nodeX,
        y: clickYInCanvas - nodeY,
      };
    }
  };

  const centerWorkspace = () => {
    if (!processedNodes.length) return;
    // Calculate bounding box of nodes
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    
    processedNodes.forEach(n => {
      const x = n.x ?? 0;
      const y = n.y ?? 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const graphCenterX = (minX + maxX) / 2 + 100; // adding card half-offset
      const graphCenterY = (minY + maxY) / 2 + 45;
      
      setPan({
        x: rect.width / 2 - graphCenterX * zoom,
        y: rect.height / 2 - graphCenterY * zoom,
      });
    }
  };

  useEffect(() => {
    // Auto center graph design when templates or full screen size change
    const timer = setTimeout(() => {
      centerWorkspace();
    }, 150);
    return () => clearTimeout(timer);
  }, [workflow.title, isFullscreen]);

  return (
    <div
      ref={containerRef}
      id="workspace_canvas"
      className={`bg-[#090b10] overflow-hidden select-none cursor-grab active:cursor-grabbing border border-slate-800/80 transition-all ${
        isFullscreen
          ? "fixed inset-0 z-[100] w-screen h-screen rounded-none"
          : "relative flex-1 h-[650px] md:h-auto min-h-[500px] w-full rounded-2xl"
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{
        backgroundImage: `radial-gradient(rgba(30, 41, 59, 0.4) 1px, transparent 1px)`,
        backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
        backgroundPosition: backgroundPosition,
      }}
    >
      {/* HUD Info bar */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Layout: <strong className="text-sky-400 uppercase">{workflow.layout}</strong></span>
          <span className="text-slate-600">|</span>
          <span>Zoom: <strong className="text-indigo-400">{Math.round(zoom * 100)}%</strong></span>
        </div>
        {isSimulating && (
          <div className="bg-emerald-950/40 border border-emerald-500/20 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-mono text-emerald-300 flex items-center gap-2">
            <Play className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            <span>Đang chạy mô phỏng gói tin...</span>
          </div>
        )}
      </div>

      {/* Action floating buttons */}
      <div className="absolute bottom-4 left-4 z-10 flex gap-2">
        <button
          id="btn_toggle_fullscreen"
          onClick={toggleFullscreen}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/30 text-white rounded-lg transition-all shadow-lg shadow-indigo-950/50 cursor-pointer flex items-center justify-center gap-1.5"
          title={isFullscreen ? "Thoát toàn màn hình (ESC)" : "Phóng to toàn màn hình"}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-4.5 h-4.5 text-white" />
              <span className="text-[11px] font-sans font-bold px-0.5">Thoát</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-4.5 h-4.5 text-white" />
              <span className="text-[11px] font-sans font-bold px-0.5">Toàn màn hình</span>
            </>
          )}
        </button>
        <button
          id="btn_zoom_in"
          onClick={() => setZoom(z => Math.min(1.8, z + 0.1))}
          className="p-2.5 bg-slate-900/95 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg transition-all shadow-lg shadow-slate-950/50 cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4.5 h-4.5" />
        </button>
        <button
          id="btn_zoom_out"
          onClick={() => setZoom(z => Math.max(0.4, z - 0.1))}
          className="p-2.5 bg-slate-900/95 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg transition-all shadow-lg shadow-slate-950/50 cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4.5 h-4.5" />
        </button>
        <button
          id="btn_center_canvas"
          onClick={centerWorkspace}
          className="p-2.5 bg-slate-900/95 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg transition-all shadow-lg shadow-slate-950/50 cursor-pointer"
          title="Căn giữa sơ đồ (Center Canvas)"
        >
          <Maximize className="w-4.5 h-4.5" />
        </button>
        <button
          id="btn_reset_view"
          onClick={() => {
            setZoom(0.9);
            setPan({ x: 50, y: 30 });
          }}
          className="p-2.5 bg-slate-900/95 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg transition-all shadow-lg shadow-slate-950/50 cursor-pointer"
          title="Reset vị trí sơ đồ"
        >
          <RotateCcw className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* SVG Canvas and Node Renderer Wrapper */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          transition: isPanning ? "none" : "transform 0.1s cubic-bezier(0.1, 0.8, 0.2, 1)",
        }}
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        <svg className="absolute top-0 left-0 w-[2400px] h-[2000px] overflow-visible pointer-events-auto">
          {/* Defined Arrow Head Markers */}
          <defs>
            <marker
              id="arrow-default"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
            </marker>
            <marker
              id="arrow-success"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#10B981" />
            </marker>
            <marker
              id="arrow-error"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#EF4444" />
            </marker>
            <marker
              id="arrow-active"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38BDF8" className="animate-pulse" />
            </marker>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Draw Connection Edges */}
          {workflow.edges.map((edge, index) => {
            const fromPos = nodeCoords[edge.from];
            const toPos = nodeCoords[edge.to];
            if (!fromPos || !toPos) return null;

            // Offset to start/end from node border rather than exact center top-left
            const startX = fromPos.x + 105; // half card width (210/2)
            const startY = fromPos.y + 45;  // half card height (90/2)
            const endX = toPos.x + 105;
            const endY = toPos.y + 45;

            // Logic to calculate elegant S-Bezier paths
            const dx = Math.abs(endX - startX);
            const dy = Math.abs(endY - startY);
            let d = "";

            if (workflow.layout === "vertical") {
              const controlY = startY + dy * 0.5;
              d = `M ${startX} ${startY} C ${startX} ${controlY}, ${endX} ${controlY}, ${endX} ${endY}`;
            } else {
              // Horizontal logic
              const controlX = startX + dx * 0.5;
              d = `M ${startX} ${startY} C ${controlX} ${startY}, ${controlX} ${endY}, ${endX} ${endY}`;
            }

            // Connection Styles
            let strokeColor = "#334155"; // slate-700
            let strokeDash = "none";
            let markerId = "arrow-default";

            if (edge.type === "success") {
              strokeColor = "#10B981"; // emerald-500
              markerId = "arrow-success";
            } else if (edge.type === "error") {
              strokeColor = "#EF4444"; // red-500
              markerId = "arrow-error";
            } else if (edge.type === "dashed") {
              strokeDash = "6,4";
              strokeColor = "#64748B"; // slate-500
            }

            // Highlighting connection during simulation step
            const isConnectionActiveInSim =
              isSimulating &&
              activeSimStep !== null &&
              workflow.edges.indexOf(edge) === activeSimStep;

            if (isConnectionActiveInSim) {
              strokeColor = "#0EA5E9"; // sky-500
              markerId = "arrow-active";
            }

            return (
              <g key={`edge-${edge.from}-${edge.to}-${index}`}>
                {/* Background thicker hover zone */}
                <path
                  d={d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={20}
                  className="cursor-pointer hover:stroke-slate-500/10 transition-colors pointer-events-auto"
                />

                {/* Main line path */}
                <path
                  d={d}
                  fill="none"
                  stroke={strokeColor}
                  className="transition-colors duration-300"
                  strokeWidth={isConnectionActiveInSim ? 3.5 : 1.75}
                  strokeDasharray={strokeDash}
                  markerEnd={`url(#${markerId})`}
                  {...(isConnectionActiveInSim ? { filter: "url(#glow)" } : {})}
                />

                {/* Animated Pulsing Ball on Connection */}
                {isConnectionActiveInSim && (
                  <circle r="5" fill="#38bdf8" filter="url(#glow)">
                    <animateMotion dur="1s" repeatCount="indefinite" path={d} />
                  </circle>
                )}

                {/* Solid signal flowing dots for default active pipelines */}
                {edge.type === "success" && !isSimulating && (
                  <circle r="3" fill="#10B981" opacity="0.8">
                    <animateMotion dur="2.5s" repeatCount="indefinite" path={d} />
                  </circle>
                )}

                {/* Draw Small Label in the middle of Connection Line */}
                {edge.label && (
                  <foreignObject
                    x={(startX + endX) / 2 - 80}
                    y={(startY + endY) / 2 - 12}
                    width={160}
                    height={28}
                    className="overflow-visible select-none pointer-events-none"
                  >
                    <div className="flex justify-center items-center w-full h-full">
                      <span className="px-2 py-0.5 rounded-full bg-slate-950/90 border border-slate-800/80 text-[10px] font-mono tracking-tight text-slate-400 font-medium leading-none max-w-full truncate shadow shadow-black/80">
                        {edge.label}
                      </span>
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          })}
        </svg>

        {/* Render Drag-and-Drop Interactive Cards */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {processedNodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const nodeX = node.x ?? 0;
            const nodeY = node.y ?? 0;

            // Highlight node during simulation step
            let isNodeActiveInSim = false;
            if (isSimulating && activeSimStep !== null) {
              const currentSimEdge = workflow.edges[activeSimStep];
              if (currentSimEdge) {
                // We highlight the from/to nodes currently processing
                isNodeActiveInSim = currentSimEdge.from === node.id || currentSimEdge.to === node.id;
              }
            }

            const { border, bg, shadow, accentText, badgeColor, statusGlow } = getNodeColorClasses(
              node.type,
              isNodeActiveInSim ? "processing" : node.status
            );

            return (
              <div
                key={node.id}
                style={{
                  position: "absolute",
                  left: nodeX,
                  top: nodeY,
                  width: "210px",
                  height: "90px",
                }}
                className="pointer-events-auto"
              >
                <div
                  id={`node_${node.id}`}
                  onMouseDown={(e) => handleNodeDragStart(e, node.id, nodeX, nodeY)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNode(node);
                  }}
                  className={`node-card group relative w-full h-full flex flex-col justify-between p-3 rounded-xl border ${border} ${bg} ${shadow} ${statusGlow} ${
                    isSelected ? "ring-2 ring-indigo-500 scale-[1.03] border-indigo-500/80 shadow-indigo-950/30" : "hover:border-slate-500/50 hover:scale-[1.01]"
                  } transition-all cursor-grab active:cursor-grabbing`}
                >
                  {/* Top segment */}
                  <div className="flex justify-between items-start gap-1.5 w-full">
                    <div className="flex items-center gap-2 truncate">
                      <div className={`flex items-center justify-center p-1.5 rounded-lg ${badgeColor} shrink-0`}>
                        {getNodeIcon(node.type)}
                      </div>
                      <h4 className="text-xs font-semibold tracking-wide text-slate-100 font-sans truncate leading-tight group-hover:text-white">
                        {node.label}
                      </h4>
                    </div>

                    {/* Status Badge */}
                    <span className="shrink-0 flex items-center">
                      {isNodeActiveInSim || node.status === "processing" ? (
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
                        </span>
                      ) : node.status === "success" ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : node.status === "error" ? (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-600 block"></span>
                      )}
                    </span>
                  </div>

                  {/* Bottom metrics / parameters or details summary */}
                  <div className="flex flex-col gap-0.5 mt-1 pointer-events-none">
                    {node.details && node.details.length > 0 ? (
                      <div className="flex flex-wrap gap-1 leading-none">
                        {node.details.slice(0, 2).map((detail, dIdx) => (
                          <span
                            key={dIdx}
                            className="inline-block px-1.5 py-0.5 rounded bg-slate-950/40 text-[9px] font-mono font-medium text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap max-w-[180px]"
                          >
                            {detail}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[9px] font-mono text-slate-500">No parameters</div>
                    )}
                  </div>

                  {/* Tiny identifier pin */}
                  <div className="absolute right-2 bottom-1 text-[8px] font-mono text-slate-600/60 leading-none">
                    {node.id}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
