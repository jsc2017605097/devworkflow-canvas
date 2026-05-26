import React, { useState } from "react";
import { Sparkles, ArrowRight, Loader, HelpCircle, AlertCircle, RefreshCw, Copy, Check, FileCode, CheckSquare } from "lucide-react";

interface AiAssistantProps {
  onGenerateSuccess: (generatedJson: any) => void;
  onShowNotification: (message: string, type: "success" | "error" | "info") => void;
}

const QUICK_PROMPTS = [
  {
    tag: "E-Commerce Payment",
    prompt: "Hệ thống checkout mua hàng: API Gateway -> Auth Service -> Cart Service -> Condition check số dư -> Gọi Billing Service tích hợp VNPay API -> Gửi email biên lai"
  },
  {
    tag: "High Load Analytics",
    prompt: "Pipeline IoT Big Data: Thiết bị đẩy dữ liệu -> Nginx Ingress gateway -> Apache Kafka queue -> Spark Streaming xử lý phân tích -> Lưu ElasticSearch để vẽ Kibana dashboard"
  },
  {
    tag: "Auth & OAuth Login",
    prompt: "Luồng đăng nhập OAuth Google: Client -> Gateway -> Auth Service -> Gọi Google API -> Xác thực xong lưu session vào Redis -> Khởi tạo giỏ hàng cho User trong Postgres"
  },
  {
    tag: "Redis Cache Aside",
    prompt: "Hệ thống cache-aside: Client đọc -> Service rẽ nhánh -> Kiểm tra Redis có hit không? Nếu miss -> Đọc Postgres Master -> Ghi ngược lại Redis và trả về Client"
  }
];

export const AiAssistant: React.FC<AiAssistantProps> = ({
  onGenerateSuccess,
  onShowNotification,
}) => {
  const [activeTab, setActiveTab] = useState<"direct" | "external">("direct");
  
  // Direct AI States
  const [prompt, setPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // External AI Copy Prompt States
  const [externalSubject, setExternalSubject] = useState<string>("Hệ thống Microservice tải cao dùng gRPC và Redis Cache");
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [externalPasteArea, setExternalPasteArea] = useState<string>("");

  const systemInstructionsTemplate = (subjectName: string) => `Bạn là một chuyên gia thiết kế kiến trúc hệ thống cấp cao. Tôi muốn bạn vẽ thiết kế cho chủ đề: "${subjectName}".

Hãy chuyển đổi chủ đề hoặc đoạn mô tả trên thành cấu trúc JSON hợp lệ để render sơ đồ hệ thống. Hãy tuân thủ chính xác các quy tắc sau:

1. Định dạng JSON kết quả PHẢI tuân thủ chính xác Schema sau:
{
  "title": "Tên trực quan ngắn gọn về workflow",
  "description": "Mô tả chi tiết nhưng súc tích về luồng xử lý này",
  "layout": "horizontal", // Chỉ được chọn một trong ba: "horizontal", "vertical", hoặc "custom" (Ưu tiên horizontal)
  "nodes": [
    {
      "id": "mã_node_độc_nhất_không_khoảng_trắng_viết_thường",
      "label": "Tên bước/Service (vd: 'Auth Gateway', 'Redis Cache')",
      "type": "service", // Loại node, CHỈ ĐƯỢC CHỌN 1 TRONG: 'user', 'gateway', 'service', 'database', 'queue', 'worker', 'external_api', 'condition', 'step'
      "status": "success", // CHỈ ĐƯỢC CHỌN 1 TRONG: 'success', 'processing', 'error', 'idle'
      "details": ["Thông số 1", "Thông số 2"] // Mảng mô tả ngắn tối đa 3 chi tiết kỹ thuật
    }
  ],
  "edges": [
    {
      "from": "id_của_node_bắt_đầu",
      "to": "id_của_node_kết_thúc",
      "label": "Mô tả kết nối (vd: 'HTTP POST', 'gRPC link')",
      "type": "default" // CHỈ ĐƯỢC CHỌN 1 TRONG: 'default', 'success', 'error', 'dashed'
    }
  ]
}

2. Yêu cầu thiết kế:
- Các Node id nên ngắn gọn, không dấu và rõ ràng như: 'client_app', 'api_gateway', 'payment_api', 'orders_db'.
- Chỉ trả về ĐÚNG chuỗi JSON hợp lệ. Không viết thêm chữ giải thích bên ngoài, chỉ trả về chuỗi JSON thô để tôi copy-paste trực tiếp.`;

  const handleGenerate = async (targetPrompt = prompt) => {
    const activePrompt = targetPrompt.trim();
    if (!activePrompt) {
      onShowNotification("Vui lòng nhập mô tả hệ thống để AI sinh luồng xử lý nhé!", "info");
      return;
    }

    setLoading(true);
    setErrorText(null);
    onShowNotification("Đang phân tích cấu trúc hệ thống và sinh mã JSON...", "info");

    try {
      const res = await fetch("/api/workflow/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: activePrompt }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Lỗi HTTP ${res.status}`);
      }

      const flowData = await res.json();
      
      // Basic schema validator
      if (!flowData || !flowData.title || !Array.isArray(flowData.nodes)) {
        throw new Error("Mẫu JSON trả về từ AI không đúng định dạng chuẩn. Vui lòng bấm thử lại.");
      }

      onGenerateSuccess(flowData);
      onShowNotification("Sinh sơ đồ thiết kế hệ thống thành công!", "success");
      setPrompt(""); // Clear prompt on success
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "Đã xảy ra lỗi ngoài ý muốn khi phân tích luồng vẽ.");
      onShowNotification("Sinh sơ đồ AI thất bại. Hãy thử lại mô tả rõ ràng hơn.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPrompt = () => {
    const textToCopy = systemInstructionsTemplate(externalSubject || "Chủ đề kiến trúc hệ thống");
    navigator.clipboard.writeText(textToCopy);
    setCopiedPrompt(true);
    onShowNotification("Đã sao chép prompt hướng dẫn cho AI ngoài!", "success");
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleImportPastes = () => {
    const rawVal = externalPasteArea.trim();
    if (!rawVal) {
      onShowNotification("Vui lòng dán chuỗi JSON nhận được từ external AI của bạn.", "info");
      return;
    }

    try {
      // Clean JSON in case markdown block ticks exist
      const cleanJson = rawVal.replace(/^```json/, "").replace(/```$/, "").trim();
      const parsed = JSON.parse(cleanJson);

      if (!parsed.title || !Array.isArray(parsed.nodes)) {
        throw new Error("Mẫu JSON thiếu các thuộc tính bắt buộc (title, nodes).");
      }

      onGenerateSuccess(parsed);
      onShowNotification("Đã import cấu hình sơ đồ từ AI ngoài thành công!", "success");
      setExternalPasteArea("");
    } catch (e: any) {
      onShowNotification(`Lỗi định dạng JSON dán vào: ${e.message}`, "error");
    }
  };

  return (
    <div className="bg-[#111622] border border-indigo-500/20 rounded-2xl p-5 shadow-xl select-none">
      {/* Title & Brand */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg text-white">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5 font-sans leading-none">
              Trợ lý thiết kế luồng AI
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Sử dụng mô hình AI tích hợp trực tiếp hoặc lấy cấu trúc đúng rule từ các AI bên ngoài
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-[#07090e] border border-slate-800 p-1 rounded-xl self-start md:self-auto">
          <button
            id="tab_direct_ai"
            onClick={() => setActiveTab("direct")}
            className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "direct"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Vẽ Trực Tiếp (Gemini)
          </button>
          <button
            id="tab_external_ai"
            onClick={() => setActiveTab("external")}
            className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "external"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Dùng AI Ngoài (ChatGPT/Claude...)
          </button>
        </div>
      </div>

      {activeTab === "direct" ? (
        <>
          {/* Action form */}
          <div className="flex gap-2 relative mt-4">
            <input
              id="ai_system_prompt_input"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
              placeholder="Mô tả ví dụ: Luồng checkout giỏ hàng gọi qua VNPay và ghi Log vô DB..."
              className="flex-1 px-4 py-3 bg-[#0a0d14] rounded-xl border border-slate-800 focus:border-indigo-500 hover:border-slate-700 text-xs font-sans text-slate-100 placeholder-slate-500 transition focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  handleGenerate();
                }
              }}
            />
            <button
              id="btn_submit_ai_prompt"
              onClick={() => handleGenerate()}
              disabled={loading}
              className="px-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 border border-indigo-500 disabled:border-slate-800 text-white font-medium text-xs font-sans rounded-xl transition flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:cursor-not-allowed shadow-md shadow-indigo-950/20"
            >
              {loading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Vẽ Ngay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Diagnostics / API Feedback */}
          {errorText && (
            <div className="mt-3 p-3 rounded-lg bg-rose-950/20 border border-rose-500/10 text-[11px] font-mono text-rose-400 flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">Lỗi thiết kế:</span> {errorText}
                <button
                   id="btn_retry_ai_request"
                   onClick={() => handleGenerate()}
                   className="mt-1 text-slate-300 hover:text-white underline block hover:no-underline font-medium transition flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Thử lại yêu cầu
                </button>
              </div>
            </div>
          )}

          {/* Quick Prompts Hub */}
          <div className="mt-4">
            <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase font-mono block mb-2">
              Ý tưởng thiết kế nhanh cho Lập trình viên:
            </span>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((item, index) => (
                <button
                  key={index}
                  id={`quick_prompt_${index}`}
                  onClick={() => {
                    setPrompt(item.prompt);
                    handleGenerate(item.prompt);
                  }}
                  disabled={loading}
                  className="px-2.5 py-1 text-[11px] font-sans text-slate-300 hover:text-indigo-300 hover:bg-indigo-950/40 bg-slate-900/90 border border-slate-800/80 hover:border-indigo-500/30 rounded-lg transition-all text-left truncate max-w-full cursor-pointer"
                  title={item.prompt}
                >
                  ✨ {item.tag}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-4 pt-2 animate-fadeIn">
          {/* Step 1: Input Subject and Copy Prompt */}
          <div className="bg-[#0a0d14] border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-2 text-xs">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-950 text-indigo-400 font-mono font-bold shrink-0 mt-0.5">1</span>
              <div>
                <h4 className="font-semibold text-slate-200">Nhập tên chủ đề & Sao chép lệnh điều khiển AI (System Prompt)</h4>
                <p className="text-[10px] text-slate-400 mt-1">
                  Nhập tên luồng sơ đồ bạn muốn thiết kế vào ô dưới, hệ thống sẽ chèn tự động vào mẫu prompt quy chuẩn của trang web. Sau đó copy và paste sang chat của ChatGPT, Claude hay Gemini lớn!
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <input
                id="external_subject_input"
                type="text"
                value={externalSubject || ""}
                onChange={(e) => setExternalSubject(e.target.value)}
                placeholder="Ví dụ: Thiết kế hệ thống thanh toán qua VNPay, lưu Transaction DB, thông báo Telegram."
                className="w-full px-3.5 py-2.5 bg-[#07090e] rounded-lg border border-slate-800 focus:border-indigo-500 hover:border-slate-700 text-xs font-sans text-slate-100 placeholder-slate-500 transition focus:outline-none"
              />

              <button
                id="btn_copy_external_prompt"
                onClick={handleCopyPrompt}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500 rounded-lg text-xs font-semibold font-sans transition flex items-center justify-center gap-2 shadow cursor-pointer text-center"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Đã sao chép Prompt quy tắc vào Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Sao chép Prompt tối ưu hóa cho AI bên ngoài</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Step 2: Paste back JSON output */}
          <div className="bg-[#0a0d14] border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-2 text-xs">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-950 text-indigo-400 font-mono font-bold shrink-0 mt-0.5">2</span>
              <div>
                <h4 className="font-semibold text-slate-200">Dán kết quả JSON nhận được từ AI ngoài vào đây để Import</h4>
                <p className="text-[10px] text-slate-400 mt-1">
                  Copy toàn bộ khối JSON thô từ câu trả lời của ChatGPT/Claude/Gemini, dán vào ô bên dưới, rồi ấn nút "Dán & Vẽ" để render trực quan lập tức.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <textarea
                id="external_json_paste_area"
                value={externalPasteArea}
                onChange={(e) => setExternalPasteArea(e.target.value)}
                placeholder="Paste JSON thô từ AI ngoài vào đây... (Vd: { &quot;title&quot;: ... })"
                className="w-full h-24 p-2.5 bg-[#07090e] rounded-lg border border-slate-800 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              />

              <button
                id="btn_submit_external_json"
                onClick={handleImportPastes}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold font-sans transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
              >
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span>Dán JSON & Vẽ Sơ Đồ Hệ Thống</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

