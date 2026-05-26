export type NodeType =
  | "service"
  | "database"
  | "gateway"
  | "queue"
  | "worker"
  | "user"
  | "external_api"
  | "condition"
  | "step";

export type NodeStatus = "success" | "processing" | "error" | "idle";

export type EdgeType = "default" | "success" | "error" | "dashed" | "bidirectional";

export interface WorkflowNode {
  id: string;
  label: string;
  type: NodeType;
  status: NodeStatus;
  details?: string[];
  x?: number;
  y?: number;
}

export interface WorkflowEdge {
  from: string;
  to: string;
  label?: string;
  type?: EdgeType;
}

export interface WorkflowData {
  title: string;
  description?: string;
  layout: "horizontal" | "vertical" | "custom";
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export const WORKFLOW_TEMPLATES: Record<string, WorkflowData> = {
  microservices: {
    title: "Microservices System Design & Cache Invalidation",
    description: "Kiến trúc microservice chuẩn hóa: Client gọi qua API Gateway, xác thực phiên bằng Redis, xử lý logic thanh toán và ghi nhật ký thông điệp qua RabbitMQ.",
    layout: "horizontal",
    nodes: [
      { id: "client", label: "User Browser / Mobile App", type: "user", status: "success", details: ["React SPA Client", "HTTPS & WSS", "User Actions"], x: 80, y: 220 },
      { id: "gateway", label: "API Kong Gateway", type: "gateway", status: "processing", details: ["Reverse Proxy", "Port 443", "Rate Limiting: 100/s"], x: 300, y: 220 },
      { id: "auth_service", label: "Auth Microservice", type: "service", status: "success", details: ["Node.js / Express", "JWT Verification"], x: 550, y: 100 },
      { id: "redis_cache", label: "Redis Session Store", type: "database", status: "success", details: ["In-Memory DB", "TTL: 1 hour", "Session Caching"], x: 800, y: 100 },
      { id: "order_service", label: "Order Microservice", type: "service", status: "idle", details: ["Golang Service", "Port 8081", "gRPC Protocol"], x: 550, y: 340 },
      { id: "postgres_db", label: "Postgres Master DB", type: "database", status: "idle", details: ["Transactional Log", "ACID Compliant", "Orders Table"], x: 800, y: 340 }
    ],
    edges: [
      { from: "client", to: "gateway", label: "HTTPS Web Request", type: "default" },
      { from: "gateway", to: "auth_service", label: "Verify JWT token", type: "default" },
      { from: "auth_service", to: "redis_cache", label: "Query session key", type: "success" },
      { from: "gateway", to: "order_service", label: "Route payload", type: "dashed" },
      { from: "order_service", to: "postgres_db", label: "Write transactional statement", type: "default" }
    ]
  },
  cicd_pipeline: {
    title: "Production CI/CD Data Pipeline (GitOps)",
    description: "Luồng tự động hóa DevOps từ khi dev push code, chạy kiểm thử tự động, build và scan mã độc Docker Container, sau đó tự nâng cấp phiên bản trong Kubernetes.",
    layout: "horizontal",
    nodes: [
      { id: "git_push", label: "Git Push Event", type: "user", status: "success", details: ["Webhook Trigger", "Branch: main", "Author: Admin"], x: 80, y: 220 },
      { id: "lint_test", label: "Linting & Unit Tests", type: "step", status: "success", details: ["Jest / ESLint", "Code Cov > 85%", "Runs in 1.5m"], x: 280, y: 220 },
      { id: "security_scan", label: "SonarQube & Trivy Scan", type: "condition", status: "processing", details: ["Vulnerability scan", "Critical level: 0"], x: 480, y: 220 },
      { id: "docker_build", label: "Docker Build & Push", type: "worker", status: "idle", details: ["Buildx multi-arch", "Push registry.gcr.io"], x: 700, y: 130 },
      { id: "rollback_alert", label: "Notify Dev Team", type: "external_api", status: "error", details: ["Slack Webhook", "Error Logs"], x: 700, y: 310 },
      { id: "k8s_deploy", label: "Argocd GitOps Sync", type: "service", status: "idle", details: ["Kubernetes Cluster", "Helmsman Deploy", "Rolling Update"], x: 920, y: 130 }
    ],
    edges: [
      { from: "git_push", to: "lint_test", label: "Trigger CI Hook", type: "success" },
      { from: "lint_test", to: "security_scan", label: "Tests Passed", type: "default" },
      { from: "security_scan", to: "docker_build", label: "Passed Sec Scan", type: "success" },
      { from: "security_scan", to: "rollback_alert", label: "Vulnerabilities Found", type: "error" },
      { from: "docker_build", to: "k8s_deploy", label: "Trigger Target Sync", type: "dashed" }
    ]
  },
  data_pipeline: {
    title: "Real-time Event Ingestion & Big Data Pipeline",
    description: "Luồng xử lý dữ liệu lớn (Big Data). Dữ liệu hành vi người dùng được gửi tới Apache Kafka, phân tích xử lý thời gian thực qua Spark, rẽ nhánh lưu trữ Hadoop và ElasticSearch.",
    layout: "vertical",
    nodes: [
      { id: "events", label: "High Vol User Traffic", type: "user", status: "processing", details: ["12,000 requests/sec", "JSON pay load"], x: 300, y: 60 },
      { id: "kafka", label: "Kafka Broker Queue", type: "queue", status: "processing", details: ["Retention: 7 days", "3 Partitions"], x: 300, y: 180 },
      { id: "spark", label: "Apache Spark Streaming", type: "worker", status: "success", details: ["Window Size: 5s", "Anonymizing logs"], x: 300, y: 300 },
      { id: "mongo", label: "MongoDB Audit Store", type: "database", status: "success", details: ["Unstructured raw logs", "BSON indexes"], x: 120, y: 440 },
      { id: "elastic", label: "ElasticSearch Analytical DB", type: "database", status: "success", details: ["Full text index", "Kibana analytics dashboard"], x: 480, y: 440 }
    ],
    edges: [
      { from: "events", to: "kafka", label: "gRPC Streaming Ingest", type: "default" },
      { from: "kafka", to: "spark", label: "Consuming payloads", type: "success" },
      { from: "spark", to: "mongo", label: "Write unstructured", type: "dashed" },
      { from: "spark", to: "elastic", label: "Index text features", type: "success" }
    ]
  }
};
