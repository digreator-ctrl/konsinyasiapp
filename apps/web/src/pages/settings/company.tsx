// Company Settings Page
import React from "react";
import { useCustom } from "@refinedev/core";
import { List } from "@refinedev/antd";
import { Card, Form, Input, Button, message, Spin } from "antd";
import { Building2, Save } from "lucide-react";

export const CompanySettings: React.FC = () => {
  const { data, isLoading } = useCustom({ url: "/tenants", method: "get" });
  const tenant = data?.data;

  const onFinish = async (values: any) => {
    try {
      await fetch("/api/tenants", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values), credentials: "include" });
      message.success("Profil usaha berhasil diperbarui");
    } catch { message.error("Gagal memperbarui profil usaha"); }
  };

  if (isLoading) return <Spin />;

  return (
    <List title="Profil Usaha">
      <Card style={{ borderRadius: 10, maxWidth: 600 }}>
        <Form layout="vertical" onFinish={onFinish} initialValues={tenant || {}}>
          <Form.Item label="Nama Usaha" name="name" rules={[{ required: true }]}><Input prefix={<Building2 size={16} style={{ color: "#64748B" }} />} /></Form.Item>
          <Form.Item label="Alamat" name="address"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item label="Telepon" name="phone"><Input /></Form.Item>
          <Form.Item label="Email" name="email"><Input /></Form.Item>
          <Form.Item label="NPWP" name="npwp"><Input /></Form.Item>
          <Button type="primary" htmlType="submit" icon={<Save size={14} />} style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)", border: "none" }}>Simpan</Button>
        </Form>
      </Card>
    </List>
  );
};
