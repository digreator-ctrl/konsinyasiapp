// ============================================================
// Producers CRUD Pages
// ============================================================

import React from "react";
import { useTable, useForm } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { List, Create, Edit, Show, EditButton, ShowButton, DeleteButton } from "@refinedev/antd";
import { Table, Form, Input, Select, Space, Typography, Tag, Descriptions } from "antd";
import { Factory } from "lucide-react";

const { Text } = Typography;

export const ProducerList: React.FC = () => {
  const { tableProps } = useTable({ resource: "producers", syncWithLocation: true });

  return (
    <List title="Data Produsen" headerButtons={({ defaultButtons }) => defaultButtons}>
      <Table {...tableProps} rowKey="id" size="middle">
        <Table.Column dataIndex="name" title="Nama Produsen" sorter />
        <Table.Column
          dataIndex="type"
          title="Jenis"
          render={(type) => (
            <Tag color={type === "internal" ? "blue" : "orange"}>
              {type === "internal" ? "Internal" : "Eksternal"}
            </Tag>
          )}
        />
        <Table.Column dataIndex="contact_person" title="Kontak" />
        <Table.Column dataIndex="phone" title="Telepon" />
        <Table.Column
          title="Aksi"
          render={(_, record: any) => (
            <Space>
              <ShowButton hideText size="small" recordItemId={record.id} />
              <EditButton hideText size="small" recordItemId={record.id} />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};

export const ProducerCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: "producers" });

  return (
    <Create saveButtonProps={saveButtonProps} title="Tambah Produsen">
      <Form {...formProps} layout="vertical">
        <Form.Item label="Nama Produsen" name="name" rules={[{ required: true }]}>
          <Input placeholder="Masukkan nama produsen" />
        </Form.Item>
        <Form.Item label="Jenis Produsen" name="type" rules={[{ required: true }]} initialValue="internal">
          <Select options={[
            { label: "Internal (Produksi Sendiri)", value: "internal" },
            { label: "Eksternal (Supplier)", value: "third_party" },
          ]} />
        </Form.Item>
        <Form.Item label="Alamat" name="address">
          <Input.TextArea rows={2} placeholder="Alamat produsen" />
        </Form.Item>
        <Form.Item label="Contact Person" name="contact_person">
          <Input placeholder="Nama kontak" />
        </Form.Item>
        <Form.Item label="Telepon" name="phone">
          <Input placeholder="08xx-xxxx-xxxx" />
        </Form.Item>
        <Form.Item label="Email" name="email">
          <Input placeholder="email@produsen.com" />
        </Form.Item>
        <Form.Item label="Catatan" name="notes">
          <Input.TextArea rows={3} placeholder="Catatan tambahan" />
        </Form.Item>
      </Form>
    </Create>
  );
};

export const ProducerEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: "producers" });

  return (
    <Edit saveButtonProps={saveButtonProps} title="Edit Produsen">
      <Form {...formProps} layout="vertical">
        <Form.Item label="Nama Produsen" name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Jenis Produsen" name="type" rules={[{ required: true }]}>
          <Select options={[
            { label: "Internal (Produksi Sendiri)", value: "internal" },
            { label: "Pihak Ketiga (Supplier)", value: "third_party" },
          ]} />
        </Form.Item>
        <Form.Item label="Alamat" name="address"><Input.TextArea rows={2} /></Form.Item>
        <Form.Item label="Contact Person" name="contact_person"><Input /></Form.Item>
        <Form.Item label="Telepon" name="phone"><Input /></Form.Item>
        <Form.Item label="Email" name="email"><Input /></Form.Item>
        <Form.Item label="Catatan" name="notes"><Input.TextArea rows={3} /></Form.Item>
      </Form>
    </Edit>
  );
};

export const ProducerShow: React.FC = () => {
  const { queryResult } = useShow({ resource: "producers" });
  const record = queryResult?.data?.data;

  return (
    <Show title="Detail Produsen">
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="Nama">{record?.name}</Descriptions.Item>
        <Descriptions.Item label="Jenis">
          <Tag color={record?.type === "internal" ? "blue" : "orange"}>
            {record?.type === "internal" ? "Internal" : "Pihak Ketiga"}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Alamat">{record?.address || "-"}</Descriptions.Item>
        <Descriptions.Item label="Contact Person">{record?.contact_person || "-"}</Descriptions.Item>
        <Descriptions.Item label="Telepon">{record?.phone || "-"}</Descriptions.Item>
        <Descriptions.Item label="Email">{record?.email || "-"}</Descriptions.Item>
        <Descriptions.Item label="Catatan">{record?.notes || "-"}</Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
