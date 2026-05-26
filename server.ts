import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const isProduction =
  process.env.NODE_ENV === "production" ||
  /[\\/]dist[\\/]server\.cjs$/i.test(process.argv[1] ?? "");

const app = express();
const PORT = 3000;

// Parse JSON bodies
app.use(express.json());

// Initialize Google Gen AI Client on the server side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// AI Workflow Generation Endpoint
app.post("/api/workflow/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
      res.status(400).json({ error: "Yêu cầu cung cấp prompt mô tả workflow hệ thống của bạn." });
      return;
    }

    const systemInstruction = `
Bạn là một kỹ sư thiết kế hệ thống cao cấp. Nhiệm vụ của bạn là nhận yêu cầu mô tả hệ thống hoặc pipeline bằng tiếng Việt/tiếng Anh, và chuyển đổi nó thành một cấu trúc JSON workflow hoàn chỉnh và chính xác theo luật dưới đây.

Định dạng JSON kết quả PHẢI tuân thủ chính xác Schema sau:
{
  "title": "Tên trực quan ngắn gọn về workflow",
  "description": "Mô tả chi tiết nhưng súc tích về luồng xử lý hoặc kiến trúc hệ thống này",
  "layout": "horizontal", // Chỉ được chọn một trong ba: "horizontal", "vertical", hoặc "custom" (ưu tiên "horizontal" nếu luồng tuần tự dài, "vertical" nếu ngắn)
  "nodes": [
    {
      "id": "mã_độc_nhất_không_khoảng_trắng",
      "label": "Tên bước/Service (vd: 'Auth Gateway', 'Notification Worker')",
      "type": "service", // CHỈ ĐƯỢC CHỌN 1 TRONG: 'service', 'database', 'gateway', 'queue', 'worker', 'user', 'external_api', 'condition', 'step'
      "status": "success", // CHỈ ĐƯỢC CHỌN 1 TRONG: 'success', 'processing', 'error', 'idle'
      "details": ["Thông số 1", "Thông số 2", "Chi tiết thêm"], // Danh sách tối đa 3 chi tiết kỹ thuật
      "x": 100, // Tọa độ X tùy ý (nếu layout hoặc custom cần)
      "y": 100  // Tọa độ Y tùy ý
    }
  ],
  "edges": [
    {
      "from": "id_của_node_bắt_đầu",
      "to": "id_của_node_kết_thúc",
      "label": "Mô tả hành động/giao thức kết nối (vd: 'HTTP POST', 'Pub/Sub', 'gRPC link', 'SQL Query')",
      "type": "default" // CHỈ ĐƯỢC CHỌN 1 TRONG: 'default', 'success', 'error', 'dashed', 'bidirectional'
    }
  ]
}

Nguyên tắc thiết kế hệ thống đẹp:
- Node id nên ngắn gọn và rõ ràng như: 'user_browser', 'api_gateway', 'auth_db', 'kafka', 'elastic_search'.
- Luồng dữ liệu phải hợp lý từ trái qua phải (hoặc từ trên xuống dưới), tránh chồng chéo.
- Hãy thêm ít nhất 4-7 nodes cho các hệ thống phức tạp để thể hiện đúng tầm vóc của kiến trúc.
- Thông tin trong "details" nên chứa các thuật ngữ công nghệ thực tế (ví dụ: "Redis", "Port 6379", "MongoDB", "OAuth2", "Docker container", "Kubernetes Pod").
- Chỉ trả về ĐÚNG chuỗi JSON hợp lệ. Không viết thêm chữ giải thích markdown bên ngoài, không thêm tag \`\`\`json. Trả về String JSON trực tiếp.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Hãy chuyển đổi luồng / yêu cầu sau thành JSON workflow hoàn hảo. Yêu cầu: \n"${prompt}"`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const jsonText = response.text ? response.text.trim() : "";
    
    // Attempt parsing to make sure it's valid JSON
    try {
      const parsed = JSON.parse(jsonText);
      res.json(parsed);
    } catch (parseError) {
      console.error("Gemini output was invalid JSON:", jsonText);
      // Fallback clean extraction if it had ticks
      const cleanJsonText = jsonText.replace(/^```json/, "").replace(/```$/, "").trim();
      const parsedClean = JSON.parse(cleanJsonText);
      res.json(parsedClean);
    }

  } catch (error: any) {
    console.error("Lỗi khi sinh workflow AI:", error);
    res.status(500).json({ 
      error: "Không thể tự động sinh workflow bằng AI. Vui lòng kiểm tra lại prompt cấu hình hoặc khóa API của bạn.",
      details: error.message 
    });
  }
});

// Serve assets and setup Vite development server
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA routing logic
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[DevWorkflow Server] Đang chạy tại cổng http://localhost:${PORT}`);
  });
}

startServer();
