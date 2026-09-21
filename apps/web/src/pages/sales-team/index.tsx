// Sales Team Page — users holding the "sales" role
import React from "react";
import { useCustom } from "@refinedev/core";
import { List } from "@refinedev/antd";
import { Table, Tag, Typography } from "antd";
import { UserPlus } from "lucide-react";
import { Link } from "react-router";

const { Text } = Typography;

export const SalesTeamPage: React.FC = () => {
  const { data, isLoading } = useCustom({ url: "/distributions/sales-team", method: "get" });
  const sales: any[] = Array.isArray(data?.data) ? (data?.data as any[]) : [];

  return (
    <List
      title="Tim Sales"
      headerButtons={
        <Link to="/settings/users/create">
          <Tag icon={<UserPlus size={14} />} color="blue" style={{ padding: "6px 12px", cursor: "pointer" }}>
            Tambah Sales
          </Tag>
        </Link>
      }
    >
      <Table
        dataSource={sales}
        rowKey="id"
        size="middle"
        loading={isLoading}
        pagination={false}
      >
        <Table.Column dataIndex="name" title="Nama" render={(v) => <Text strong>{v}</Text>} />
        <Table.Column dataIndex="email" title="Email" />
        <Table.Column dataIndex="phone" title="Telepon" render={(v) => v || "-"} />
        <Table.Column
          dataIndex="status"
          title="Status"
          render={(s) => <Tag color={s === "active" ? "green" : "red"}>{s === "active" ? "Aktif" : "Nonaktif"}</Tag>}
        />
      </Table>
    </List>
  );
};
