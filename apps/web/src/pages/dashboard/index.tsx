// ============================================================
// Dashboard Page — Metric cards, charts, activity
// ============================================================

import React from "react";
import { useCustom, useGetIdentity } from "@refinedev/core";
import { Row, Col, Card, Statistic, Typography, Table, Tag, Space, Spin } from "antd";
import {
  Package,
  Truck,
  RotateCcw,
  Handshake,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

const { Title, Text } = Typography;

export const DashboardPage: React.FC = () => {
  const { data: identity } = useGetIdentity<any>();
  const { data: metricsData, isLoading } = useCustom({
    url: "/reports/dashboard",
    method: "get",
  });

  const metrics = metricsData?.data || {
    total_stock: 0,
    distributed_stock: 0,
    returned_stock: 0,
    active_consignments: 0,
    expiring_soon: 0,
  };

  const metricCards = [
    {
      title: "Total Stok Gudang",
      value: metrics.total_stock,
      icon: <Package size={24} />,
      color: "primary",
      suffix: "unit",
    },
    {
      title: "Stok Terdistribusi",
      value: metrics.distributed_stock,
      icon: <Truck size={24} />,
      color: "accent",
      suffix: "unit",
    },
    {
      title: "Konsinyasi Aktif",
      value: metrics.active_consignments,
      icon: <Handshake size={24} />,
      color: "warning",
      suffix: "toko",
    },
    {
      title: "Stok Retur",
      value: metrics.returned_stock,
      icon: <RotateCcw size={24} />,
      color: "danger",
      suffix: "unit",
    },
  ];

  return (
    <div style={{ padding: "0 4px" }}>
      {/* Welcome Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, color: "#F1F5F9" }}>
          Selamat Datang, {identity?.name || "User"} 👋
        </Title>
        <Text style={{ color: "#94A3B8" }}>
          {identity?.tenant?.name || "KonsinyasiApp"} — Ringkasan hari ini
        </Text>
      </div>

      {/* Metric Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {metricCards.map((card, index) => (
          <Col xs={12} sm={12} md={6} key={index}>
            <div className={`metric-card ${card.color}`}>
              <div className={`metric-icon ${card.color}`}>{card.icon}</div>
              <div className="metric-value">
                {isLoading ? <Spin size="small" /> : card.value.toLocaleString("id-ID")}
              </div>
              <div className="metric-label">{card.title}</div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Expiring Warning */}
      {metrics.expiring_soon > 0 && (
        <Card
          style={{
            marginBottom: 24,
            background: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            borderRadius: 10,
          }}
        >
          <Space>
            <AlertTriangle size={20} style={{ color: "#F59E0B" }} />
            <Text style={{ color: "#FCD34D", fontWeight: 600 }}>
              {metrics.expiring_soon} batch produk mendekati tanggal kadaluarsa (7 hari ke depan)
            </Text>
          </Space>
        </Card>
      )}

      {/* Quick Stats Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <TrendingUp size={16} style={{ color: "#818CF8" }} />
                <span>Aktivitas Terbaru</span>
              </Space>
            }
            style={{ borderRadius: 10, height: "100%" }}
          >
            <div style={{ color: "#94A3B8", textAlign: "center", padding: 40 }}>
              <Package size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
              <div>Data aktivitas akan muncul setelah transaksi pertama</div>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <AlertTriangle size={16} style={{ color: "#F59E0B" }} />
                <span>Produk Mendekati Expired</span>
              </Space>
            }
            style={{ borderRadius: 10, height: "100%" }}
          >
            <div style={{ color: "#94A3B8", textAlign: "center", padding: 40 }}>
              <Package size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
              <div>Belum ada produk mendekati kadaluarsa</div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
