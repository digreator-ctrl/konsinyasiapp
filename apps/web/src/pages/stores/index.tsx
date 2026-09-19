// Stores CRUD Pages
import React from "react";
import { useTable, useForm } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { List, Create, Edit, Show, EditButton, ShowButton, DeleteButton } from "@refinedev/antd";
import { Table, Form, Input, Space, Tag, Descriptions } from "antd";

export const StoreList: React.FC = () => {
  const { tableProps } = useTable({ resource: "stores", syncWithLocation: true });
  return (
    <List title="Data Toko / Outlet">
      <Table {...tableProps} rowKey="id" size="middle">
        <Table.Column dataIndex="name" title="Nama Toko" sorter />
        <Table.Column dataIndex="owner_name" title="Pemilik" render={(v) => v || "-"} />
        <Table.Column dataIndex="area" title="Area" render={(v) => v || "-"} />
        <Table.Column dataIndex="phone" title="Telepon" render={(v) => v || "-"} />
        <Table.Column dataIndex="is_active" title="Status" render={(v) => <Tag color={v ? "green" : "default"}>{v ? "Aktif" : "Nonaktif"}</Tag>} />
        <Table.Column title="Aksi" render={(_, record: any) => (
          <Space>
            <ShowButton hideText size="small" recordItemId={record.id} />
            <EditButton hideText size="small" recordItemId={record.id} />
            <DeleteButton hideText size="small" recordItemId={record.id} />
          </Space>
        )} />
      </Table>
    </List>
  );
};

export const StoreCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: "stores" });
  return (
    <Create saveButtonProps={saveButtonProps} title="Tambah Toko">
      <Form {...formProps} layout="vertical">
        <Form.Item label="Nama Toko" name="name" rules={[{ required: true }]}><Input placeholder="Nama toko" /></Form.Item>
        <Form.Item label="Pemilik Toko" name="owner_name"><Input placeholder="Nama pemilik" /></Form.Item>
        <Form.Item label="Alamat" name="address"><Input.TextArea rows={2} placeholder="Alamat lengkap" /></Form.Item>
        <Form.Item label="Area/Wilayah" name="area"><Input placeholder="Contoh: Jakarta Selatan" /></Form.Item>
        <Form.Item label="Telepon" name="phone"><Input placeholder="08xx-xxxx-xxxx" /></Form.Item>
      </Form>
    </Create>
  );
};

export const StoreEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: "stores" });
  return (
    <Edit saveButtonProps={saveButtonProps} title="Edit Toko">
      <Form {...formProps} layout="vertical">
        <Form.Item label="Nama Toko" name="name" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item label="Pemilik" name="owner_name"><Input /></Form.Item>
        <Form.Item label="Alamat" name="address"><Input.TextArea rows={2} /></Form.Item>
        <Form.Item label="Area" name="area"><Input /></Form.Item>
        <Form.Item label="Telepon" name="phone"><Input /></Form.Item>
      </Form>
    </Edit>
  );
};

export const StoreShow: React.FC = () => {
  const { queryResult } = useShow({ resource: "stores" });
  const record = queryResult?.data?.data;
  return (
    <Show title="Detail Toko">
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="Nama Toko">{record?.name}</Descriptions.Item>
        <Descriptions.Item label="Pemilik">{record?.owner_name || "-"}</Descriptions.Item>
        <Descriptions.Item label="Alamat">{record?.address || "-"}</Descriptions.Item>
        <Descriptions.Item label="Area">{record?.area || "-"}</Descriptions.Item>
        <Descriptions.Item label="Telepon">{record?.phone || "-"}</Descriptions.Item>
        <Descriptions.Item label="Status"><Tag color={record?.is_active ? "green" : "default"}>{record?.is_active ? "Aktif" : "Nonaktif"}</Tag></Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
