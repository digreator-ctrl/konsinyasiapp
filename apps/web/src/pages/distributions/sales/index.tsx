// Distribution Sales Pages (Jalur B: Request/Assign)
import React from "react";
import { useTable, useForm } from "@refinedev/antd";
import { useShow, useCustomMutation } from "@refinedev/core";
import { useNotification } from "@refinedev/core";
import { List, Create, Show, ShowButton } from "@refinedev/antd";
import { Table, Form, Input, Select, InputNumber, Space, Tag, Descriptions, Button, Modal } from "antd";
import { Plus, Trash2, Check, X } from "lucide-react";

export const DistributionSalesList: React.FC = () => {
  const { tableProps } = useTable({ resource: "distributions", meta: { query: { channel: "sales" } }, syncWithLocation: true });
  return (
    <List title="Distribusi Sales (Internal)">
      <Table {...tableProps} rowKey="id" size="middle">
        <Table.Column dataIndex="recipient_name" title="Sales" render={(v) => v || "-"} />
        <Table.Column dataIndex="method" title="Metode" render={(m) => (
          <Tag color={m === "request_by_sales" ? "cyan" : "geekblue"}>{m === "request_by_sales" ? "Request Sales" : "Assign Admin"}</Tag>
        )} />
        <Table.Column dataIndex="total_amount" title="Total" render={(v) => `Rp ${v?.toLocaleString("id-ID")}`} />
        <Table.Column dataIndex="status" title="Status" render={(s) => {
          const colors: Record<string, string> = { pending_approval: "orange", approved: "green", rejected: "red" };
          return <Tag color={colors[s] || "default"}>{s}</Tag>;
        }} />
        <Table.Column title="Aksi" render={(_, record: any) => <ShowButton hideText size="small" recordItemId={record.id} />} />
      </Table>
    </List>
  );
};

export const DistributionSalesCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: "distributions" });
  return (
    <Create saveButtonProps={saveButtonProps} title="Buat Distribusi Sales">
      <Form {...formProps} layout="vertical" initialValues={{ channel: "sales", method: "request_by_sales", items: [{}] }}>
        <Form.Item name="channel" hidden><Input /></Form.Item>
        <Form.Item label="Metode" name="method" rules={[{ required: true }]}>
          <Select options={[{ label: "Request by Sales (Sales Ajukan)", value: "request_by_sales" }, { label: "Assign by Admin (Admin Tugaskan)", value: "assign_by_admin" }]} />
        </Form.Item>
        <Form.Item label="ID Sales" name="recipient_id" rules={[{ required: true }]}><Input placeholder="ID Sales" /></Form.Item>
        <Form.Item label="Nama Sales" name="recipient_name"><Input placeholder="Nama Sales" /></Form.Item>
        <Form.List name="items">
          {(fields, { add, remove }) => (<>
            {fields.map((field) => (
              <Space key={field.key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                <Form.Item {...field} name={[field.name, "product_id"]} label="Produk" rules={[{ required: true }]}><Input placeholder="ID Produk" style={{ width: 200 }} /></Form.Item>
                <Form.Item {...field} name={[field.name, "batch_id"]} label="Batch" rules={[{ required: true }]}><Input placeholder="ID Batch" style={{ width: 200 }} /></Form.Item>
                <Form.Item {...field} name={[field.name, "quantity"]} label="Jumlah" rules={[{ required: true }]}><InputNumber min={1} style={{ width: 100 }} /></Form.Item>
                <Form.Item {...field} name={[field.name, "price"]} label="Harga" rules={[{ required: true }]}><InputNumber min={0} style={{ width: 150 }} /></Form.Item>
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

export const DistributionSalesShow: React.FC = () => {
  const { queryResult } = useShow({ resource: "distributions" });
  const record = queryResult?.data?.data;
  return (
    <Show title="Detail Distribusi Sales">
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="Sales">{record?.recipient_name || record?.recipient_id}</Descriptions.Item>
        <Descriptions.Item label="Metode"><Tag>{record?.method === "request_by_sales" ? "Request Sales" : "Assign Admin"}</Tag></Descriptions.Item>
        <Descriptions.Item label="Total">Rp {record?.total_amount?.toLocaleString("id-ID")}</Descriptions.Item>
        <Descriptions.Item label="Status"><Tag color={record?.status === "approved" ? "green" : record?.status === "rejected" ? "red" : "orange"}>{record?.status}</Tag></Descriptions.Item>
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
