// Return Sales/Toko Pages
import React from "react";
import { useTable, useForm } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { List, Create, Show, ShowButton } from "@refinedev/antd";
import { Table, Form, Input, Select, InputNumber, Space, Tag, Descriptions, Button } from "antd";
import { Plus, Trash2 } from "lucide-react";
import { ProductSelect } from "../../../components/pickers";

export const ReturnSalesList: React.FC = () => {
  const { tableProps } = useTable({ resource: "returns", meta: { query: { source: "sales" } }, syncWithLocation: true });
  return (
    <List title="Retur Sales / Toko">
      <Table {...tableProps} rowKey="id" size="middle">
        <Table.Column dataIndex="source" title="Sumber" render={(s) => <Tag>{s === "sales" ? "Sales" : "Toko"}</Tag>} />
        <Table.Column dataIndex="source_id" title="ID Sumber" />
        <Table.Column dataIndex="return_date" title="Tanggal" />
        <Table.Column dataIndex="status" title="Status" render={(s) => {
          const colors: Record<string, string> = { submitted: "orange", verified: "blue", processed: "green", rejected: "red" };
          return <Tag color={colors[s]}>{s === "submitted" ? "Diajukan" : s === "verified" ? "Diverifikasi" : s === "processed" ? "Diproses" : "Ditolak"}</Tag>;
        }} />
        <Table.Column title="Aksi" render={(_, record: any) => <ShowButton hideText size="small" recordItemId={record.id} />} />
      </Table>
    </List>
  );
};

export const ReturnSalesCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: "returns" });
  return (
    <Create saveButtonProps={saveButtonProps} title="Buat Retur Sales/Toko">
      <Form {...formProps} layout="vertical" initialValues={{ source: "sales", items: [{}] }}>
        <Form.Item label="Sumber Retur" name="source" rules={[{ required: true }]}>
          <Select options={[{ label: "Sales", value: "sales" }, { label: "Toko", value: "store" }]} />
        </Form.Item>
        <Form.Item label="ID Sales/Toko" name="source_id" rules={[{ required: true }]}><Input placeholder="ID Sales atau Toko" /></Form.Item>
        <Form.Item label="Tanggal Retur" name="return_date" rules={[{ required: true }]}><Input type="date" /></Form.Item>
        <Form.List name="items">
          {(fields, { add, remove }) => (<>
            {fields.map((field) => (
              <Space key={field.key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                <ProductSelect fieldName={field.name} />
                <Form.Item {...field} name={[field.name, "quantity"]} label="Qty" rules={[{ required: true }]}><InputNumber min={1} style={{ width: 80 }} /></Form.Item>
                <Form.Item {...field} name={[field.name, "reason"]} label="Alasan" rules={[{ required: true }]}>
                  <Select style={{ width: 200 }} options={[
                    { label: "Cacat Produksi", value: "defect_production" },
                    { label: "Cacat Pengiriman", value: "defect_shipping" },
                    { label: "Kadaluarsa", value: "expired" },
                    { label: "Tidak Terjual", value: "unsold" },
                  ]} />
                </Form.Item>
                {fields.length > 1 && <Button type="text" danger icon={<Trash2 size={14} />} onClick={() => remove(field.name)} />}
              </Space>
            ))}
            <Button type="dashed" onClick={() => add()} block icon={<Plus size={14} />}>Tambah Item</Button>
          </>)}
        </Form.List>
        <Form.Item label="Catatan" name="notes" style={{ marginTop: 16 }}><Input.TextArea rows={2} /></Form.Item>
      </Form>
    </Create>
  );
};

export const ReturnSalesShow: React.FC = () => {
  const { queryResult } = useShow({ resource: "returns" });
  const record = queryResult?.data?.data;
  const reasonLabels: Record<string, string> = { defect_production: "Cacat Produksi", defect_shipping: "Cacat Pengiriman", expired: "Kadaluarsa", unsold: "Tidak Terjual" };
  return (
    <Show title="Detail Retur Sales/Toko">
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="Sumber">{record?.source}</Descriptions.Item>
        <Descriptions.Item label="ID">{record?.source_id}</Descriptions.Item>
        <Descriptions.Item label="Tanggal">{record?.return_date}</Descriptions.Item>
        <Descriptions.Item label="Status"><Tag>{record?.status}</Tag></Descriptions.Item>
      </Descriptions>
      {record?.items && (
        <Table dataSource={record.items} rowKey="id" size="small" style={{ marginTop: 16 }} pagination={false}>
          <Table.Column dataIndex="product_name" title="Produk" />
          <Table.Column dataIndex="quantity" title="Qty" />
          <Table.Column dataIndex="reason" title="Alasan" render={(r) => reasonLabels[r] || r} />
        </Table>
      )}
    </Show>
  );
};
