// ============================================================
// KonsinyasiApp — Reusable Form Pickers
// Product/Batch selection wired to warehouse & sales stock
// ============================================================

import React, { useState } from "react";
import { Form, Select } from "antd";
import { useSelect } from "@refinedev/antd";
import { useCustom } from "@refinedev/core";

/** Product + warehouse batch picker for `Form.List` rows. */
export const WarehouseBatchPicker: React.FC<{ fieldName: number }> = ({ fieldName }) => {
  const form = Form.useFormInstance();
  const [batches, setBatches] = useState<any[]>([]);

  const { selectProps: productSelectProps } = useSelect({
    resource: "products",
    optionLabel: "name",
    optionValue: "id",
    pagination: { pageSize: 200 },
  });

  const handleProductChange = async (productId: string) => {
    form.setFieldValue(["items", fieldName, "batch_id"], undefined);
    setBatches([]);
    if (!productId) return;
    try {
      const res = await fetch(`/api/products/${productId}/batches`, { credentials: "include" });
      const json = await res.json();
      setBatches(json.data || []);
    } catch {
      setBatches([]);
    }
  };

  return (
    <>
      <Form.Item name={[fieldName, "product_id"]} label="Produk" rules={[{ required: true }]}>
        <Select
          {...(productSelectProps as any)}
          showSearch
          optionFilterProp="label"
          style={{ width: 220 }}
          placeholder="Pilih produk"
          onChange={handleProductChange}
        />
      </Form.Item>
      <Form.Item name={[fieldName, "batch_id"]} label="Batch" rules={[{ required: true }]}>
        <Select
          style={{ width: 260 }}
          placeholder="Pilih batch"
          options={batches.map((b) => ({
            label: `Prod ${b.production_date} • Exp ${b.expiry_date} • ${b.current_quantity} unit`,
            value: b.id,
          }))}
        />
      </Form.Item>
    </>
  );
};

/** Product + batch picker limited to what the sales person currently carries. */
export const ConsignmentStockPicker: React.FC<{ fieldName: number }> = ({ fieldName }) => {
  const form = Form.useFormInstance();
  const [batches, setBatches] = useState<any[]>([]);
  const { data } = useCustom({ url: "/consignments/available-stock", method: "get" });

  const stock: any[] = Array.isArray(data?.data) ? (data?.data as any[]) : [];

  const productOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const row of stock) {
      if (!map.has(row.product_id)) map.set(row.product_id, row.product_name);
    }
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [stock]);

  const handleProductChange = async (productId: string) => {
    form.setFieldValue(["items", fieldName, "batch_id"], undefined);
    setBatches(stock.filter((s) => s.product_id === productId));
    if (!productId) return;
    try {
      const res = await fetch(`/api/products/${productId}`, { credentials: "include" });
      const json = await res.json();
      const salesPrice = (json.data?.prices || []).find((p: any) => p.price_type === "sales");
      if (salesPrice) {
        form.setFieldValue(["items", fieldName, "price"], salesPrice.price);
      }
    } catch {
      // Price remains manual when product detail cannot be loaded
    }
  };

  return (
    <>
      <Form.Item name={[fieldName, "product_id"]} label="Produk" rules={[{ required: true }]}>
        <Select
          showSearch
          optionFilterProp="label"
          style={{ width: 220 }}
          placeholder="Pilih produk"
          options={productOptions}
          onChange={handleProductChange}
        />
      </Form.Item>
      <Form.Item name={[fieldName, "batch_id"]} label="Batch" rules={[{ required: true }]}>
        <Select
          style={{ width: 260 }}
          placeholder="Pilih batch"
          options={batches.map((b) => ({
            label: `Exp ${b.expiry_date} • tersedia ${b.quantity} unit`,
            value: b.batch_id,
          }))}
        />
      </Form.Item>
    </>
  );
};

/** Sales person picker backed by the sales-team endpoint. */
export const SalesSelect: React.FC<{
  name?: string;
  nameField?: string;
  label?: string;
  required?: boolean;
}> = ({ name = "recipient_id", nameField = "recipient_name", label = "Sales", required = true }) => {
  const form = Form.useFormInstance();
  const { selectProps } = useSelect({
    resource: "distributions/sales-team",
    optionLabel: "name",
    optionValue: "id",
    pagination: { pageSize: 200 },
  });

  return (
    <Form.Item name={name} label={label} rules={required ? [{ required: true }] : undefined}>
      <Select
        {...(selectProps as any)}
        showSearch
        optionFilterProp="label"
        placeholder="Pilih sales"
        onChange={(value: string, option: any) => {
          form.setFieldValue(nameField, option?.label ?? undefined);
          void value;
        }}
      />
    </Form.Item>
  );
};

/** Product picker (master data) for return items. */
export const ProductSelect: React.FC<{ fieldName: number; required?: boolean }> = ({
  fieldName,
  required = true,
}) => {
  const { selectProps } = useSelect({
    resource: "products",
    optionLabel: "name",
    optionValue: "id",
    pagination: { pageSize: 200 },
  });

  return (
    <Form.Item
      name={[fieldName, "product_id"]}
      label="Produk"
      rules={required ? [{ required: true }] : undefined}
    >
      <Select
        {...(selectProps as any)}
        showSearch
        optionFilterProp="label"
        style={{ width: 220 }}
        placeholder="Pilih produk"
      />
    </Form.Item>
  );
};
