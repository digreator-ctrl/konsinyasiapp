// Roles & Permissions (RBAC) Pages
import React from "react";
import { useTable, useForm } from "@refinedev/antd";
import { List, Create, Edit, EditButton, DeleteButton } from "@refinedev/antd";
import { Table, Form, Input, Space, Tag, Checkbox, Card, Typography, Divider } from "antd";
import { RESOURCES, ACTIONS } from "@konsinyasi/shared";

const { Text } = Typography;

const resourceLabels: Record<string, string> = {
  dashboard: "Dashboard",
  producers: "Data Produsen",
  products: "Data Barang",
  sales_team: "Tim Sales",
  stores: "Data Toko",
  stock_entries: "Stok Masuk",
  warehouse: "Stok Gudang",
  distribution_agent: "Distribusi Agen",
  distribution_sales: "Distribusi Sales",
  consignments: "Konsinyasi",
  return_agent: "Retur Agen",
  return_sales: "Retur Sales",
  reports: "Laporan",
  settings_company: "Pengaturan Usaha",
  settings_users: "Pengguna",
  settings_roles: "Role & Hak Akses",
};

const actionLabels: Record<string, string> = {
  list: "Lihat",
  show: "Detail",
  create: "Tambah",
  edit: "Ubah",
  delete: "Hapus",
  approve: "Setujui",
  export: "Ekspor",
};

export const RoleList: React.FC = () => {
  const { tableProps } = useTable({ resource: "roles", syncWithLocation: true });
  return (
    <List title="Peran & Hak Akses (RBAC)" resource="settings-roles">
      <Table {...tableProps} rowKey="id" size="middle">
        <Table.Column dataIndex="name" title="Nama Role" render={(v) => <Text strong style={{ textTransform: "capitalize" }}>{v}</Text>} />
        <Table.Column dataIndex="description" title="Deskripsi" render={(v) => v || "-"} />
        <Table.Column dataIndex="is_system" title="Tipe" render={(v) => <Tag color={v ? "purple" : "default"}>{v ? "Sistem" : "Custom"}</Tag>} />
        <Table.Column title="Aksi" render={(_, record: any) => (
          <Space>
            <EditButton hideText size="small" recordItemId={record.id} resource="settings-roles" />
            {!record.is_system && <DeleteButton hideText size="small" recordItemId={record.id} resource="settings-roles" />}
          </Space>
        )} />
      </Table>
    </List>
  );
};

export const RoleCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: "roles" });
  const [permissions, setPermissions] = React.useState<Record<string, Record<string, boolean>>>({});

  const handlePermissionChange = (resource: string, action: string, checked: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [resource]: { ...(prev[resource] || {}), [action]: checked },
    }));
  };

  const handleFinish = (values: any) => {
    const permList = Object.entries(permissions).flatMap(([resource, actions]) =>
      Object.entries(actions).filter(([_, allowed]) => allowed).map(([action]) => ({ resource, action, allowed: true }))
    );
    formProps.onFinish?.({ ...values, permissions: permList });
  };

  return (
    <Create saveButtonProps={saveButtonProps} title="Buat Role Baru" resource="settings-roles">
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Form.Item label="Nama Role" name="name" rules={[{ required: true }]}><Input placeholder="Contoh: Kepala Gudang" /></Form.Item>
        <Form.Item label="Deskripsi" name="description"><Input.TextArea rows={2} /></Form.Item>

        <Divider>Matriks Hak Akses</Divider>
        <Card size="small" style={{ borderRadius: 10, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 8, color: "#94A3B8", borderBottom: "1px solid rgba(148,163,184,0.12)" }}>Resource</th>
                {Object.values(ACTIONS).map((action) => (
                  <th key={action} style={{ textAlign: "center", padding: 8, color: "#94A3B8", borderBottom: "1px solid rgba(148,163,184,0.12)", fontSize: 12 }}>
                    {actionLabels[action] || action}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.values(RESOURCES).map((resource) => (
                <tr key={resource}>
                  <td style={{ padding: 8, borderBottom: "1px solid rgba(148,163,184,0.06)" }}>
                    <Text>{resourceLabels[resource] || resource}</Text>
                  </td>
                  {Object.values(ACTIONS).map((action) => (
                    <td key={action} style={{ textAlign: "center", padding: 8, borderBottom: "1px solid rgba(148,163,184,0.06)" }}>
                      <Checkbox
                        checked={permissions[resource]?.[action] || false}
                        onChange={(e) => handlePermissionChange(resource, action, e.target.checked)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Form>
    </Create>
  );
};

export const RoleEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm({ resource: "roles" });
  const record = queryResult?.data?.data;
  const [permissions, setPermissions] = React.useState<Record<string, Record<string, boolean>>>({});

  React.useEffect(() => {
    if (record?.permissions) {
      const permMap: Record<string, Record<string, boolean>> = {};
      for (const p of record.permissions) {
        if (!permMap[p.resource]) permMap[p.resource] = {};
        permMap[p.resource][p.action] = p.allowed;
      }
      setPermissions(permMap);
    }
  }, [record]);

  const handlePermissionChange = (resource: string, action: string, checked: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [resource]: { ...(prev[resource] || {}), [action]: checked },
    }));
  };

  const handleFinish = (values: any) => {
    const permList = Object.entries(permissions).flatMap(([resource, actions]) =>
      Object.entries(actions).filter(([_, allowed]) => allowed).map(([action]) => ({ resource, action, allowed: true }))
    );
    formProps.onFinish?.({ ...values, permissions: permList });
  };

  return (
    <Edit saveButtonProps={saveButtonProps} title="Edit Role" resource="settings-roles">
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Form.Item label="Nama Role" name="name" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item label="Deskripsi" name="description"><Input.TextArea rows={2} /></Form.Item>

        <Divider>Matriks Hak Akses</Divider>
        <Card size="small" style={{ borderRadius: 10, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 8, color: "#94A3B8", borderBottom: "1px solid rgba(148,163,184,0.12)" }}>Resource</th>
                {Object.values(ACTIONS).map((action) => (
                  <th key={action} style={{ textAlign: "center", padding: 8, color: "#94A3B8", borderBottom: "1px solid rgba(148,163,184,0.12)", fontSize: 12 }}>
                    {actionLabels[action] || action}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.values(RESOURCES).map((resource) => (
                <tr key={resource}>
                  <td style={{ padding: 8, borderBottom: "1px solid rgba(148,163,184,0.06)" }}>
                    <Text>{resourceLabels[resource] || resource}</Text>
                  </td>
                  {Object.values(ACTIONS).map((action) => (
                    <td key={action} style={{ textAlign: "center", padding: 8, borderBottom: "1px solid rgba(148,163,184,0.06)" }}>
                      <Checkbox
                        checked={permissions[resource]?.[action] || false}
                        onChange={(e) => handlePermissionChange(resource, action, e.target.checked)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Form>
    </Edit>
  );
};
