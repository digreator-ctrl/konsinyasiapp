// Stock Movement Report Page
import React from "react";
import { useCustom } from "@refinedev/core";
import { List } from "@refinedev/antd";
import { Card, Row, Col, Typography, Table, DatePicker, Space, Empty } from "antd";
import { BarChart3 } from "lucide-react";

const { Text } = Typography;

export const StockMovementReport: React.FC = () => {
  const { data, isLoading } = useCustom({ url: "/reports/stock-movement", method: "get" });
  const stockIn = data?.data?.stock_in || [];

  return (
    <List title="Laporan Pergerakan Stok">
      <Card style={{ marginBottom: 16, borderRadius: 10 }}>
        <Space>
          <Text style={{ color: "#94A3B8" }}>Filter Periode:</Text>
          <DatePicker.RangePicker style={{ width: 300 }} />
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title={<Space><BarChart3 size={16} style={{ color: "#818CF8" }} /><span>Stok Masuk per Tanggal</span></Space>} style={{ borderRadius: 10 }}>
            {Array.isArray(stockIn) && stockIn.length > 0 ? (
              <Table dataSource={stockIn} rowKey="date" size="small" pagination={false}>
                <Table.Column dataIndex="date" title="Tanggal Produksi" />
                <Table.Column dataIndex="total" title="Total Masuk" render={(v) => v?.toLocaleString("id-ID")} />
              </Table>
            ) : (
              <Empty description="Belum ada data pergerakan stok" />
            )}
          </Card>
        </Col>
      </Row>
    </List>
  );
};
