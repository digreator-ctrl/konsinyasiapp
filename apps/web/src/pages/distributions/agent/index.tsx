// Distribution Agent Pages (Jalur A: Beli Putus)
import React from "react";
import { useTable, useForm } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { List, Create, Show, ShowButton } from "@refinedev/antd";
import { Table, Form, Input, InputNumber, Space, Tag, Descriptions, Button } from "antd";
import { Plus, Trash2 } from "lucide-react";
import { WarehouseBatchPicker } from "../../../components/pickers";

export const DistributionAgentList: React.FC = () => {
  const { tableProps } = useTable({ resource: "distributions", meta: { query: { channel: "agent" } }, syncWithLocation: true });
  return (
    <List title="Penjualan Agen (Beli Putus)">
      <Table {...tableProps} rowKey="id" size="middle">
        <Table.Column dataIndex="recipient_name" title="Agen" render={(v) => v || "-"} />
        <Table.Column dataIndex="total_amount" title="Total" render={(v) => `Rp ${v?.toLocaleString("id-ID")}`} />
        <Table.Column dataIndex="status" title="Status" render={(s) => {
          const colors: Record<string, string> = { draft: "default", pending_approval: "orange", approved: "green", rejected: "red", delivered: "blue" };
          return <Tag color={colors[s] || "default"}>{s}</Tag>;
        }} />
        <Table.Column dataIndex="created_at" title="Tanggal" render={(v) => v?.split("T")[0]} />
        <Table.Column title="Aksi" render={(_, record: any) => <ShowButton hideText size="small" recordItemId={record.id} />} />
      </Table>
    </List>
  );
};

export const DistributionAgentCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: "distributions" });
  return (
    <Create saveButtonProps={saveButtonProps} title="Buat Order Agen">
      <Form {...formProps} layout="vertical" initialValues={{ channel: "agent", items: [{}] }}>
        <Form.Item name="channel" hidden><Input /></Form.Item>
        <Form.Item label="Nama Agen" name="recipient_name" rules={[{ required: true, message: "Nama agen wajib diisi" }]}>
          <Input placeholder="Nama agen / toko pembeli" />
        </Form.Item>
        <Form.List name="items">
          {(fields, { add, remove }) => (<>
            {fields.map((field) => (
              <Space key={field.key} style={{ display: "flex", marginBottom: 8, flexWrap: "wrap" }} align="baseline">
                <WarehouseBatchPicker fieldName={field.name} />
                <Form.Item {...field} name={[field.name, "quantity"]} label="Jumlah" rules={[{ required: true }]}><InputNumber min={1} style={{ width: 100 }} /></Form.Item>
                <Form.Item {...field} name={[field.name, "price"]} label="Harga" rules={[{ required: true }]}>
                  <InputNumber<number> min={0} style={{ width: 150 }} />
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

export const DistributionAgentShow: React.FC = () => {
  const { queryResult } = useShow({ resource: "distributions" });
  const record = queryResult?.data?.data;
  return (
    <Show title="Detail Order Agen">
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="Agen">{record?.recipient_name || record?.recipient_id}</Descriptions.Item>
        <Descriptions.Item label="Total">Rp {record?.total_amount?.toLocaleString("id-ID")}</Descriptions.Item>
        <Descriptions.Item label="Status"><Tag>{record?.status}</Tag></Descriptions.Item>
        <Descriptions.Item label="Catatan">{record?.notes || "-"}</Descriptions.Item>
      </Descriptions>
      {record?.items && (
        <Table dataSource={record.items} rowKey="id" size="small" style={{ marginTop: 16 }} pagination={false}>
          <Table.Column dataIndex="product_name" title="Produk" />
          <Table.Column dataIndex="quantity" title="Jumlah" />
          <Table.Column dataIndex="price" title="Harga" render={(v) => `Rp ${v?.toLocaleString("id-ID")}`} />
          <Table.Column dataIndex="subtotal" title="Subtotal" render={(v) => `Rp ${v?.toLocaleString("id-ID")}`} />
        </Table>
      )}
    </Show>
  );
};
