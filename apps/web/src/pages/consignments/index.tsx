// Consignment Pages (Sales → Toko)
import React from "react";
import { useTable, useForm, useSelect } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { List, Create, Show, ShowButton } from "@refinedev/antd";
import { Table, Form, Input, InputNumber, Space, Tag, Descriptions, Button, Select } from "antd";
import { Plus, Trash2 } from "lucide-react";
import { ConsignmentStockPicker, SalesSelect } from "../../components/pickers";

export const ConsignmentList: React.FC = () => {
  const { tableProps } = useTable({ resource: "consignments", syncWithLocation: true });
  return (
    <List title="Konsinyasi Toko">
      <Table {...tableProps} rowKey="id" size="middle">
        <Table.Column dataIndex="store_id" title="Toko" />
        <Table.Column dataIndex="sales_id" title="Sales" />
        <Table.Column dataIndex="consignment_date" title="Tanggal" />
        <Table.Column dataIndex="status" title="Status" render={(s) => {
          const colors: Record<string, string> = { active: "green", completed: "blue", expired: "red", returned: "orange" };
          return <Tag color={colors[s] || "default"}>{s === "active" ? "Aktif" : s === "completed" ? "Selesai" : s === "expired" ? "Expired" : "Dikembalikan"}</Tag>;
        }} />
        <Table.Column title="Aksi" render={(_, record: any) => <ShowButton hideText size="small" recordItemId={record.id} />} />
      </Table>
    </List>
  );
};

export const ConsignmentCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: "consignments" });
  const { selectProps: storeSelectProps } = useSelect({
    resource: "stores",
    optionLabel: "name",
    optionValue: "id",
    pagination: { pageSize: 200 },
  });

  return (
    <Create saveButtonProps={saveButtonProps} title="Titipkan Barang ke Toko">
      <Form {...formProps} layout="vertical" initialValues={{ items: [{}], create_visit: true }}>
        <Form.Item name="create_visit" hidden><Input /></Form.Item>
        <Form.Item label="Toko" name="store_id" rules={[{ required: true, message: "Pilih toko" }]}>
          <Select {...storeSelectProps} showSearch optionFilterProp="label" placeholder="Pilih toko" />
        </Form.Item>
        <SalesSelect name="sales_id" nameField="sales_name" label="Sales (opsional)" required={false} />
        <Form.Item label="Tanggal Konsinyasi" name="consignment_date" rules={[{ required: true }]}><Input type="date" /></Form.Item>
        <Form.List name="items">
          {(fields, { add, remove }) => (<>
            {fields.map((field) => (
              <Space key={field.key} style={{ display: "flex", marginBottom: 8, flexWrap: "wrap" }} align="baseline">
                <ConsignmentStockPicker fieldName={field.name} />
                <Form.Item {...field} name={[field.name, "quantity_consigned"]} label="Qty Titip" rules={[{ required: true }]}><InputNumber min={1} style={{ width: 100 }} /></Form.Item>
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

export const ConsignmentShow: React.FC = () => {
  const { queryResult } = useShow({ resource: "consignments" });
  const record = queryResult?.data?.data;
  return (
    <Show title="Detail Konsinyasi">
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="Toko">{record?.store?.name || record?.store_id}</Descriptions.Item>
        <Descriptions.Item label="Tanggal">{record?.consignment_date}</Descriptions.Item>
        <Descriptions.Item label="Status"><Tag color={record?.status === "active" ? "green" : "blue"}>{record?.status}</Tag></Descriptions.Item>
      </Descriptions>
      {record?.items && (
        <Table dataSource={record.items} rowKey="id" size="small" style={{ marginTop: 16 }} pagination={false}>
          <Table.Column dataIndex="product_name" title="Produk" />
          <Table.Column dataIndex="quantity_consigned" title="Qty Titip" />
          <Table.Column dataIndex="quantity_sold" title="Qty Terjual" />
          <Table.Column dataIndex="quantity_returned" title="Qty Retur" />
          <Table.Column title="Sisa" render={(_, r: any) => r.quantity_consigned - r.quantity_sold - r.quantity_returned} />
          <Table.Column dataIndex="price" title="Harga" render={(v) => `Rp ${v?.toLocaleString("id-ID")}`} />
        </Table>
      )}
    </Show>
  );
};
