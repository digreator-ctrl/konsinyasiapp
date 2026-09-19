// User Management Pages
import React from "react";
import { useTable, useForm } from "@refinedev/antd";
import { List, Create, Edit, EditButton, DeleteButton } from "@refinedev/antd";
import { Table, Form, Input, Select, Space, Tag } from "antd";

export const UserList: React.FC = () => {
  const { tableProps } = useTable({ resource: "users", syncWithLocation: true });
  return (
    <List title="Manajemen Pengguna" resource="settings-users">
      <Table {...tableProps} rowKey="id" size="middle">
        <Table.Column dataIndex="name" title="Nama" sorter />
        <Table.Column dataIndex="email" title="Email" />
        <Table.Column dataIndex="status" title="Status" render={(s) => <Tag color={s === "active" ? "green" : "red"}>{s === "active" ? "Aktif" : "Nonaktif"}</Tag>} />
        <Table.Column title="Aksi" render={(_, record: any) => (
          <Space>
            <EditButton hideText size="small" recordItemId={record.id} resource="settings-users" />
            <DeleteButton hideText size="small" recordItemId={record.id} resource="settings-users" />
          </Space>
        )} />
      </Table>
    </List>
  );
};

export const UserCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: "users" });
  return (
    <Create saveButtonProps={saveButtonProps} title="Tambah Pengguna" resource="settings-users">
      <Form {...formProps} layout="vertical">
        <Form.Item label="Nama" name="name" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item label="Email" name="email" rules={[{ required: true, type: "email" }]}><Input /></Form.Item>
        <Form.Item label="Password" name="password" rules={[{ required: true, min: 8 }]}><Input.Password /></Form.Item>
        <Form.Item label="Telepon" name="phone"><Input /></Form.Item>
      </Form>
    </Create>
  );
};

export const UserEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: "users" });
  return (
    <Edit saveButtonProps={saveButtonProps} title="Edit Pengguna" resource="settings-users">
      <Form {...formProps} layout="vertical">
        <Form.Item label="Nama" name="name" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item label="Email" name="email" rules={[{ required: true, type: "email" }]}><Input /></Form.Item>
        <Form.Item label="Telepon" name="phone"><Input /></Form.Item>
        <Form.Item label="Status" name="status"><Select options={[{ label: "Aktif", value: "active" }, { label: "Nonaktif", value: "inactive" }, { label: "Ditangguhkan", value: "suspended" }]} /></Form.Item>
      </Form>
    </Edit>
  );
};
