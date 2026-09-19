// Stock Entries Pages (Inbound)
import React from "react";
import { useTable, useForm } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { List, Create, Show, ShowButton } from "@refinedev/antd";
import { Table, Form, Input, Select, DatePicker, InputNumber, Space, Tag, Descriptions } from "antd";

export const StockEntryList: React.FC = () => {
  const { tableProps } = useTable({ resource: "stock-entries", syncWithLocation: true });
  return (
    <List title="Penerimaan Stok (Stok Masuk)">
      <Table {...tableProps} rowKey="id" size="middle">
        <Table.Column dataIndex="product_id" title="Produk" />
        <Table.Column dataIndex="source" title="Sumber" render={(s) => <Tag color={s === "own_production" ? "blue" : "purple"}>{s === "own_production" ? "Produksi Sendiri" : "Titipan"}</Tag>} />
        <Table.Column dataIndex="production_date" title="Tgl Produksi" />
        <Table.Column dataIndex="expiry_date" title="Tgl Kadaluarsa" />
        <Table.Column dataIndex="quantity" title="Jumlah" render={(v) => v?.toLocaleString("id-ID")} />
        <Table.Column dataIndex="production_cost" title="Harga Produksi" render={(v) => `Rp ${v?.toLocaleString("id-ID")}`} />
        <Table.Column title="Aksi" render={(_, record: any) => <ShowButton hideText size="small" recordItemId={record.id} />} />
      </Table>
    </List>
  );
};

export const StockEntryCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: "stock-entries" });
  return (
    <Create saveButtonProps={saveButtonProps} title="Catat Stok Masuk">
      <Form {...formProps} layout="vertical">
        <Form.Item label="Sumber Produk" name="source" rules={[{ required: true }]} initialValue="own_production">
          <Select options={[{ label: "Produksi Sendiri", value: "own_production" }, { label: "Titipan Produsen Lain", value: "consigned" }]} />
        </Form.Item>
        <Form.Item label="ID Produk" name="product_id" rules={[{ required: true }]}><Input placeholder="ID produk" /></Form.Item>
        <Form.Item label="ID Produsen" name="producer_id"><Input placeholder="ID produsen (opsional)" /></Form.Item>
        <Form.Item label="Periode Produksi" name="production_period"><Input placeholder="Contoh: Pagi, Siang (opsional)" /></Form.Item>
        <Form.Item label="Tanggal Produksi" name="production_date" rules={[{ required: true }]}><Input type="date" /></Form.Item>
        <Form.Item label="Tanggal Kadaluarsa" name="expiry_date" rules={[{ required: true }]}><Input type="date" /></Form.Item>
        <Form.Item label="Jumlah Stok" name="quantity" rules={[{ required: true }]}><InputNumber min={1} style={{ width: "100%" }} /></Form.Item>
        <Form.Item label="Harga Produksi (Rp)" name="production_cost" rules={[{ required: true }]}><InputNumber min={0} style={{ width: "100%" }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")} parser={(v) => Number(v ? v.replace(/\./g, "") : 0)} /></Form.Item>
        <Form.Item label="Catatan" name="notes"><Input.TextArea rows={2} /></Form.Item>
      </Form>
    </Create>
  );
};

export const StockEntryShow: React.FC = () => {
  const { queryResult } = useShow({ resource: "stock-entries" });
  const record = queryResult?.data?.data;
  return (
    <Show title="Detail Stok Masuk">
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="Sumber"><Tag color={record?.source === "own_production" ? "blue" : "purple"}>{record?.source === "own_production" ? "Produksi Sendiri" : "Titipan"}</Tag></Descriptions.Item>
        <Descriptions.Item label="Tanggal Produksi">{record?.production_date}</Descriptions.Item>
        <Descriptions.Item label="Tanggal Kadaluarsa">{record?.expiry_date}</Descriptions.Item>
        <Descriptions.Item label="Periode Produksi">{record?.production_period || "-"}</Descriptions.Item>
        <Descriptions.Item label="Jumlah">{record?.quantity?.toLocaleString("id-ID")} unit</Descriptions.Item>
        <Descriptions.Item label="Harga Produksi">Rp {record?.production_cost?.toLocaleString("id-ID")}</Descriptions.Item>
        <Descriptions.Item label="Catatan">{record?.notes || "-"}</Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
