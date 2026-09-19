// Sales Team CRUD Pages
import React from "react";
import { useTable, useForm } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { List, Create, Edit, Show, EditButton, ShowButton, DeleteButton } from "@refinedev/antd";
import { Table, Form, Input, Select, Space, Tag, Descriptions } from "antd";

export const SalesTeamList: React.FC = () => {
  const { tableProps } = useTable({ resource: "users", meta: { query: { role: "sales" } }, syncWithLocation: true });
  return (
    <List title="Tim Sales" resource="sales-team">
      <Table {...tableProps} rowKey="id" size="middle">
        <Table.Column dataIndex="name" title="Nama Sales" sorter />
        <Table.Column dataIndex="email" title="Email" />
        <Table.Column dataIndex="phone" title="Telepon" render={(v) => v || "-"} />
        <Table.Column dataIndex="status" title="Status" render={(s) => <Tag color={s === "active" ? "green" : "red"}>{s === "active" ? "Aktif" : "Nonaktif"}</Tag>} />
        <Table.Column title="Aksi" render={(_, record: any) => (
          <Space>
            <ShowButton hideText size="small" recordItemId={record.id} resource="sales-team" />
            <EditButton hideText size="small" recordItemId={record.id} resource="sales-team" />
          </Space>
        )} />
      </Table>
    </List>
  );
};

export const SalesTeamCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: "users" });
  return (
    <Create saveButtonProps={saveButtonProps} title="Tambah Sales" resource="sales-team">
      <Form {...formProps} layout="vertical">
        <Form.Item label="Nama" name="name" rules={[{ required: true }]}><Input placeholder="Nama lengkap sales" /></Form.Item>
        <Form.Item label="Email" name="email" rules={[{ required: true, type: "email" }]}><Input placeholder="email@contoh.com" /></Form.Item>
        <Form.Item label="Password" name="password" rules={[{ required: true, min: 8 }]}><Input.Password placeholder="Minimal 8 karakter" /></Form.Item>
        <Form.Item label="Telepon" name="phone"><Input placeholder="08xx-xxxx-xxxx" /></Form.Item>
      </Form>
    </Create>
  );
};

export const SalesTeamEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: "users" });
  return (
    <Edit saveButtonProps={saveButtonProps} title="Edit Sales" resource="sales-team">
      <Form {...formProps} layout="vertical">
        <Form.Item label="Nama" name="name" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item label="Email" name="email" rules={[{ required: true, type: "email" }]}><Input /></Form.Item>
        <Form.Item label="Telepon" name="phone"><Input /></Form.Item>
        <Form.Item label="Status" name="status"><Select options={[{ label: "Aktif", value: "active" }, { label: "Nonaktif", value: "inactive" }]} /></Form.Item>
      </Form>
    </Edit>
  );
};

export const SalesTeamShow: React.FC = () => {
  const { queryResult } = useShow({ resource: "users" });
  const record = queryResult?.data?.data;
  return (
    <Show title="Detail Sales" resource="sales-team">
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="Nama">{record?.name}</Descriptions.Item>
        <Descriptions.Item label="Email">{record?.email}</Descriptions.Item>
        <Descriptions.Item label="Telepon">{record?.phone || "-"}</Descriptions.Item>
        <Descriptions.Item label="Status"><Tag color={record?.status === "active" ? "green" : "red"}>{record?.status}</Tag></Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
