// Distribution & Sales Performance Report
import React from "react";
import { useCustom } from "@refinedev/core";
import { List } from "@refinedev/antd";
import { Card, Table, Empty, Space, Typography } from "antd";
import { BarChart3, TrendingUp } from "lucide-react";

const { Text } = Typography;

export const DistributionReport: React.FC = () => {
  const { data, isLoading } = useCustom({ url: "/reports/sales-performance", method: "get" });
  const performance = data?.data || [];

  return (
    <List title="Laporan Distribusi & Kinerja Sales">
      <Card title={<Space><TrendingUp size={16} style={{ color: "#22C55E" }} /><span>Kinerja Sales</span></Space>} style={{ borderRadius: 10 }}>
        {Array.isArray(performance) && performance.length > 0 ? (
          <Table dataSource={performance} rowKey="sales_id" size="middle" loading={isLoading}>
            <Table.Column dataIndex="sales_id" title="Sales ID" />
            <Table.Column dataIndex="total_distributions" title="Total Distribusi" />
            <Table.Column dataIndex="total_amount" title="Total Nilai" render={(v) => `Rp ${v?.toLocaleString("id-ID")}`} />
          </Table>
        ) : (
          <Empty description="Belum ada data kinerja sales" />
        )}
      </Card>
    </List>
  );
};
