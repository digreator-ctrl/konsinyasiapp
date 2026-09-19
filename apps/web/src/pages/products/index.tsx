// Products CRUD Pages
import React from "react";
import { useTable, useForm } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { List, Create, Edit, Show, EditButton, ShowButton, DeleteButton } from "@refinedev/antd";
import { Table, Form, Input, Select, Space, Tag, Descriptions, InputNumber, Divider } from "antd";

export const ProductList: React.FC = () => {
  const { tableProps } = useTable({ resource: "products", syncWithLocation: true });
  return (
    <List title="Data Barang / Katalog">
      <Table {...tableProps} rowKey="id" size="middle">
        <Table.Column dataIndex="name" title="Nama Produk" sorter />
        <Table.Column dataIndex="variation" title="Variasi" render={(v) => v || "-"} />
        <Table.Column dataIndex="source" title="Sumber" render={(s) => (
          <Tag color={s === "own_production" ? "blue" : "purple"}>{s === "own_production" ? "Produksi Sendiri" : "Titipan"}</Tag>
        )} />
        <Table.Column dataIndex="is_active" title="Status" render={(v) => (
          <Tag color={v ? "green" : "default"}>{v ? "Aktif" : "Nonaktif"}</Tag>
        )} />
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

export const ProductCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: "products" });
  return (
    <Create saveButtonProps={saveButtonProps} title="Tambah Produk">
      <Form {...formProps} layout="vertical">
        <Form.Item label="Nama Produk" name="name" rules={[{ required: true }]}><Input placeholder="Nama produk" /></Form.Item>
        <Form.Item label="Sumber Produk" name="source" rules={[{ required: true }]} initialValue="own_production">
          <Select options={[{ label: "Produksi Sendiri", value: "own_production" }, { label: "Titipan (Konsinyasi)", value: "consigned" }]} />
        </Form.Item>
        <Form.Item label="Variasi" name="variation"><Input placeholder="Contoh: Rasa Coklat, Ukuran L" /></Form.Item>
        <Form.Item label="Deskripsi" name="description"><Input.TextArea rows={3} /></Form.Item>
        <Divider>Harga</Divider>
        <Form.List name="prices" initialValue={[{ price_type: "production", price: 0 }, { price_type: "agent", price: 0 }, { price_type: "sales", price: 0 }]}>
          {(fields) => fields.map((field) => (
            <Space key={field.key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
              <Form.Item {...field} name={[field.name, "price_type"]} label="Tipe">
                <Select style={{ width: 180 }} disabled options={[{ label: "Harga Produksi", value: "production" }, { label: "Harga Agen", value: "agent" }, { label: "Harga Sales", value: "sales" }]} />
              </Form.Item>
              <Form.Item {...field} name={[field.name, "price"]} label="Harga (Rp)" rules={[{ required: true }]}>
                <InputNumber style={{ width: 200 }} min={0} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")} parser={(v) => Number(v ? v.replace(/\./g, "") : 0)} />
              </Form.Item>
            </Space>
          ))}
        </Form.List>
      </Form>
    </Create>
  );
};

export const ProductEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: "products" });
  return (
    <Edit saveButtonProps={saveButtonProps} title="Edit Produk">
      <Form {...formProps} layout="vertical">
        <Form.Item label="Nama Produk" name="name" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item label="Sumber Produk" name="source" rules={[{ required: true }]}>
          <Select options={[{ label: "Produksi Sendiri", value: "own_production" }, { label: "Titipan", value: "consigned" }]} />
        </Form.Item>
        <Form.Item label="Variasi" name="variation"><Input /></Form.Item>
        <Form.Item label="Deskripsi" name="description"><Input.TextArea rows={3} /></Form.Item>
        <Form.Item label="Aktif" name="is_active" valuePropName="checked"><Select options={[{ label: "Aktif", value: true }, { label: "Nonaktif", value: false }]} /></Form.Item>
      </Form>
    </Edit>
  );
};

export const ProductShow: React.FC = () => {
  const { queryResult } = useShow({ resource: "products" });
  const record = queryResult?.data?.data;
  return (
    <Show title="Detail Produk">
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="Nama Produk">{record?.name}</Descriptions.Item>
        <Descriptions.Item label="Sumber"><Tag color={record?.source === "own_production" ? "blue" : "purple"}>{record?.source === "own_production" ? "Produksi Sendiri" : "Titipan"}</Tag></Descriptions.Item>
        <Descriptions.Item label="Variasi">{record?.variation || "-"}</Descriptions.Item>
        <Descriptions.Item label="Deskripsi">{record?.description || "-"}</Descriptions.Item>
        <Descriptions.Item label="Status"><Tag color={record?.is_active ? "green" : "default"}>{record?.is_active ? "Aktif" : "Nonaktif"}</Tag></Descriptions.Item>
      </Descriptions>
      {record?.prices && (
        <Descriptions bordered column={1} size="small" title="Harga" style={{ marginTop: 16 }}>
          {record.prices.map((p: any) => (
            <Descriptions.Item key={p.price_type} label={p.price_type === "production" ? "Harga Produksi" : p.price_type === "agent" ? "Harga Agen" : "Harga Sales"}>
              Rp {p.price?.toLocaleString("id-ID")}
            </Descriptions.Item>
          ))}
        </Descriptions>
      )}
    </Show>
  );
};
