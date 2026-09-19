// Warehouse Page — Real-time stock monitoring
import React from "react";
import { useCustom } from "@refinedev/core";
import { List } from "@refinedev/antd";
import { Table, Card, Row, Col, Tag, Statistic, Space, Typography } from "antd";
import { Warehouse as WarehouseIcon, Package, AlertTriangle, Archive } from "lucide-react";

const { Text } = Typography;

export const WarehousePage: React.FC = () => {
  const { data: stockData, isLoading } = useCustom({ url: "/warehouse", method: "get" });
  const { data: expiringData } = useCustom({ url: "/warehouse/expiring", method: "get" });

  const stockList = stockData?.data || [];
  const expiringList = expiringData?.data || [];

  const totalCurrent = Array.isArray(stockList) ? stockList.reduce((sum: number, item: any) => sum + (item.total_current || 0), 0) : 0;
  const totalSku = Array.isArray(stockList) ? stockList.length : 0;

  return (
    <List title="Stok Gudang (Real-time)">
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={8}>
          <div className="metric-card primary">
            <div className="metric-icon primary"><Archive size={20} /></div>
            <div className="metric-value">{totalCurrent.toLocaleString("id-ID")}</div>
            <div className="metric-label">Total Unit</div>
          </div>
        </Col>
        <Col xs={8}>
          <div className="metric-card accent">
            <div className="metric-icon accent"><Package size={20} /></div>
            <div className="metric-value">{totalSku}</div>
            <div className="metric-label">Total SKU</div>
          </div>
        </Col>
        <Col xs={8}>
          <div className="metric-card warning">
            <div className="metric-icon warning"><AlertTriangle size={20} /></div>
            <div className="metric-value">{Array.isArray(expiringList) ? expiringList.length : 0}</div>
            <div className="metric-label">Mendekati Expired</div>
          </div>
        </Col>
      </Row>

      <Table dataSource={Array.isArray(stockList) ? stockList : []} rowKey="product_id" size="middle" loading={isLoading}>
        <Table.Column dataIndex="product_name" title="Produk" />
        <Table.Column dataIndex="product_source" title="Sumber" render={(s) => <Tag color={s === "own_production" ? "blue" : "purple"}>{s === "own_production" ? "Sendiri" : "Titipan"}</Tag>} />
        <Table.Column dataIndex="total_initial" title="Total Awal" render={(v) => v?.toLocaleString("id-ID")} />
        <Table.Column dataIndex="total_current" title="Stok Saat Ini" render={(v) => <Text strong style={{ color: v > 0 ? "#22C55E" : "#EF4444" }}>{v?.toLocaleString("id-ID")}</Text>} />
        <Table.Column dataIndex="batch_count" title="Jumlah Batch" />
      </Table>
    </List>
  );
};
