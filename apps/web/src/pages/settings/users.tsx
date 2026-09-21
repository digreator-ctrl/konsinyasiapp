// User Management Pages
import React, { useEffect, useState } from "react";
import { useTable, useForm, useSelect } from "@refinedev/antd";
import { useParsed, useShow } from "@refinedev/core";
import { List, Create, Edit, Show, EditButton, DeleteButton, SaveButton } from "@refinedev/antd";
import { Table, Form, Input, Select, Space, Tag, Row, Col, Steps, Button, Grid, Badge, Card, Avatar, Typography, Divider } from "antd";
import { useNavigate } from "react-router";
import { Mail, Phone, MapPin, Calendar, Briefcase, User } from "lucide-react";

const { Text, Title } = Typography;

export const AddressFormItems: React.FC<{ initialData?: any }> = ({ initialData }) => {
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);

  const [provinceId, setProvinceId] = useState<string | null>(null);
  const [cityId, setCityId] = useState<string | null>(null);
  const [districtId, setDistrictId] = useState<string | null>(null);

  const form = Form.useFormInstance();

  useEffect(() => {
    fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json")
      .then((res) => res.json())
      .then((data) => {
        const sorted = data.sort((a: any, b: any) => a.name.localeCompare(b.name));
        setProvinces(sorted);
        if (initialData?.province) {
          const found = data.find((p: any) => p.name === initialData.province);
          if (found) setProvinceId(found.id);
        }
      });
  }, [initialData?.province]);

  useEffect(() => {
    if (provinceId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`)
        .then((res) => res.json())
        .then((data) => {
          const sorted = data.sort((a: any, b: any) => a.name.localeCompare(b.name));
          setCities(sorted);
          if (initialData?.city) {
            const found = data.find((c: any) => c.name === initialData.city);
            if (found) setCityId(found.id);
          }
        });
    } else {
      setCities([]);
    }
  }, [provinceId, initialData?.city]);

  useEffect(() => {
    if (cityId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${cityId}.json`)
        .then((res) => res.json())
        .then((data) => {
          const sorted = data.sort((a: any, b: any) => a.name.localeCompare(b.name));
          setDistricts(sorted);
          if (initialData?.district) {
            const found = data.find((d: any) => d.name === initialData.district);
            if (found) setDistrictId(found.id);
          }
        });
    } else {
      setDistricts([]);
    }
  }, [cityId, initialData?.district]);

  useEffect(() => {
    if (districtId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${districtId}.json`)
        .then((res) => res.json())
        .then((data) => {
          const sorted = data.sort((a: any, b: any) => a.name.localeCompare(b.name));
          setVillages(sorted);
        });
    } else {
      setVillages([]);
    }
  }, [districtId]);

  return (
    <>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item label="Provinsi" name="province">
            <Select
              placeholder="Pilih Provinsi"
              showSearch
              optionFilterProp="label"
              options={provinces.map((p) => ({ label: p.name, value: p.name, id: p.id }))}
              onChange={(_, opt: any) => {
                setProvinceId(opt.id);
                form.setFieldsValue({ city: undefined, district: undefined, village: undefined });
                setCityId(null);
                setDistrictId(null);
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Kabupaten / Kota" name="city">
            <Select
              placeholder="Pilih Kabupaten / Kota"
              showSearch
              optionFilterProp="label"
              disabled={!provinceId}
              options={cities.map((c) => ({ label: c.name, value: c.name, id: c.id }))}
              onChange={(_, opt: any) => {
                setCityId(opt.id);
                form.setFieldsValue({ district: undefined, village: undefined });
                setDistrictId(null);
              }}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item label="Kecamatan" name="district">
            <Select
              placeholder="Pilih Kecamatan"
              showSearch
              optionFilterProp="label"
              disabled={!cityId}
              options={districts.map((d) => ({ label: d.name, value: d.name, id: d.id }))}
              onChange={(_, opt: any) => {
                setDistrictId(opt.id);
                form.setFieldsValue({ village: undefined });
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Desa / Kelurahan" name="village">
            <Select
              placeholder="Pilih Desa / Kelurahan"
              showSearch
              optionFilterProp="label"
              disabled={!districtId}
              options={villages.map((v) => ({ label: v.name, value: v.name }))}
            />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item label="Alamat Lengkap" name="address">
        <Input.TextArea rows={3} placeholder="Nama jalan, nomor rumah, RT/RW, dsb." />
      </Form.Item>
      <Form.Item label="Link Google Maps" name="gmaps_url">
        <Input placeholder="https://goo.gl/maps/..." />
      </Form.Item>
    </>
  );
};

export const UserList: React.FC = () => {
  const { tableProps } = useTable({ resource: "users", syncWithLocation: true });
  const navigate = useNavigate();
  return (
    <List title="Manajemen Pengguna" resource="settings-users">
      <style>{`
        .clickable-row { cursor: pointer; transition: background-color 0.2s ease; }
        .clickable-row:hover > td { background-color: rgba(79, 70, 229, 0.08) !important; }
      `}</style>
      <Table
        {...tableProps}
        rowKey="id"
        size="middle"
        rowClassName={() => "clickable-row"}
        onRow={(record: any) => ({
          onClick: () => navigate(`/settings/users/show/${record.id}`),
        })}
      >
        <Table.Column dataIndex="name" title="Nama" sorter />
        <Table.Column dataIndex="email" title="Email" />
        <Table.Column 
          title="Role" 
          render={(_, record: any) => (
            <>
              {record.roles?.map((r: any) => (
                <Tag key={r.id} color="blue">{r.name}</Tag>
              ))}
            </>
          )} 
        />
        <Table.Column
          dataIndex="status"
          title="Status"
          render={(status: string) => (
            <Badge
              status={status === "active" ? "success" : status === "suspended" ? "warning" : "default"}
              text={status === "active" ? "Aktif" : status === "suspended" ? "Ditangguhkan" : "Nonaktif"}
            />
          )}
        />
      </Table>
    </List>
  );
};

export const UserShow: React.FC = () => {
  const { id } = useParsed();
  const { queryResult } = useShow({ resource: "users", id });
  const record = queryResult?.data?.data;

  const statusMap: Record<string, { status: "success" | "warning" | "default"; text: string }> = {
    active: { status: "success", text: "Aktif" },
    suspended: { status: "warning", text: "Ditangguhkan" },
    inactive: { status: "default", text: "Nonaktif" },
  };
  const st = statusMap[record?.status] || statusMap.inactive;

  return (
    <Show
      title="Detail Pengguna"
      resource="settings-users"
      headerButtons={({ defaultButtons }) => (
        <Space>
          <EditButton type="primary" style={{ boxShadow: 'none' }} resource="settings-users" />
          <DeleteButton type="primary" style={{ boxShadow: 'none' }} resource="settings-users" />
        </Space>
      )}
    >
      <Card bordered={false} style={{ boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
        {/* Header Profil (Nama, Status, Role) */}
        <div style={{ marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 8, marginTop: 0 }}>{record?.name || "-"}</Title>
          <Space size={16} align="center">
            <Badge status={st.status} text={<Text strong>{st.text}</Text>} />
            <div>
              {record?.roles?.length > 0
                ? record?.roles?.map((r: any) => <Tag key={r.id} color="blue" style={{ margin: 0 }}>{r.name}</Tag>)
                : <Text type="secondary">-</Text>}
            </div>
          </Space>
        </div>

        <Divider style={{ margin: '16px 0 24px 0' }} />

        {/* Detail Informasi */}
        <Title level={5} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Briefcase size={18} /> Informasi Kontak
        </Title>
        <Row gutter={[16, 24]}>
          <Col xs={24} sm={12}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Email</Text>
            <Space>
              <Mail size={16} style={{ color: '#9CA3AF' }} />
              <Text strong>{record?.email || "-"}</Text>
            </Space>
          </Col>
          <Col xs={24} sm={12}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Telepon</Text>
            <Space>
              <Phone size={16} style={{ color: '#9CA3AF' }} />
              <Text strong>{record?.phone || "-"}</Text>
            </Space>
          </Col>
        </Row>

        <Divider style={{ margin: '24px 0' }} />

        <Title level={5} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <MapPin size={18} /> Domisili & Alamat
        </Title>
        <Row gutter={[16, 24]}>
          <Col xs={24} sm={12}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Provinsi</Text>
            <Text strong>{record?.province || "-"}</Text>
          </Col>
          <Col xs={24} sm={12}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Kota / Kabupaten</Text>
            <Text strong>{record?.city || "-"}</Text>
          </Col>
          <Col xs={24} sm={12}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Kecamatan</Text>
            <Text strong>{record?.district || "-"}</Text>
          </Col>
          <Col xs={24} sm={12}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Desa / Kelurahan</Text>
            <Text strong>{record?.village || "-"}</Text>
          </Col>
          <Col xs={24}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Alamat Lengkap</Text>
            <Text strong>{record?.address || "-"}</Text>
          </Col>
          {record?.gmaps_url && (
            <Col xs={24}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Google Maps</Text>
              <a href={record.gmaps_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={14} /> Buka di Maps
              </a>
            </Col>
          )}
        </Row>

        <Divider style={{ margin: '24px 0' }} />
        
        <Row>
          <Col xs={24}>
            <Space style={{ color: '#9CA3AF' }}>
              <Calendar size={14} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Bergabung pada: {record?.created_at ? new Date(record.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>
    </Show>
  );
};

export const UserCreate: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const { formProps, saveButtonProps } = useForm({ resource: "users" });
  const { selectProps: roleSelectProps } = useSelect({ resource: "roles", optionLabel: "name", optionValue: "id" });
  
  // Filter out the 'owner' role and format options
  const filteredRoles = (roleSelectProps.options || []).filter(
    (o: any) => o.label?.toLowerCase() !== "owner"
  );
  
  const next = async () => {
    try {
      if (currentStep === 0) {
        await formProps.form?.validateFields(["name", "phone"]);
      } else if (currentStep === 1) {
        await formProps.form?.validateFields(["province", "city", "district", "village", "address", "gmaps_url"]);
      }
      setCurrentStep(currentStep + 1);
    } catch (error) {
      // Validation failed
    }
  };

  const prev = () => setCurrentStep(currentStep - 1);

  return (
    <Create 
      title="Tambah Pengguna" 
      resource="settings-users"
      footerButtons={
        <>
          {currentStep > 0 && <Button onClick={prev}>Sebelumnya</Button>}
          {currentStep < 2 && <Button type="primary" onClick={next}>Selanjutnya</Button>}
          {currentStep === 2 && <SaveButton {...saveButtonProps} />}
        </>
      }
    >
      <Steps
        current={currentStep}
        responsive={false}
        items={[
          { title: isMobile ? "" : "Data Pribadi" },
          { title: isMobile ? "" : "Domisili" },
          { title: isMobile ? "" : "Akses Login" }
        ]}
        style={{ marginBottom: 24 }}
      />

      <Form {...formProps} layout="vertical">
        <div style={{ display: currentStep === 0 ? "block" : "none" }}>
          <Form.Item label="Nama Lengkap" name="name" rules={[{ required: true, message: "Nama wajib diisi" }]}>
            <Input placeholder="Masukkan nama lengkap" />
          </Form.Item>
          <Form.Item 
            label="Nomor Telepon" 
            name="phone"
            rules={[
              { required: true, message: "Nomor telepon wajib diisi" },
              { pattern: /^[0-9]+$/, message: "Hanya boleh berisi angka" },
              { min: 11, message: "Minimal 11 digit" },
              { max: 15, message: "Maksimal 15 digit" }
            ]}
          >
            <Input placeholder="08xxxxxxxxxx" />
          </Form.Item>
        </div>

        <div style={{ display: currentStep === 1 ? "block" : "none" }}>
          <AddressFormItems />
        </div>

        <div style={{ display: currentStep === 2 ? "block" : "none" }}>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: "email", message: "Email valid wajib diisi" }]}>
            <Input placeholder="email@contoh.com" />
          </Form.Item>
          <Form.Item label="Password" name="password" rules={[{ required: true, min: 8, message: "Password minimal 8 karakter" }]}>
            <Input.Password placeholder="Masukkan password" />
          </Form.Item>
          <Form.Item label="Peran (Jabatan)" name="role_ids" rules={[{ required: true, message: "Pilih jabatan pengguna" }]}>
            <Select mode="multiple" maxCount={1} options={filteredRoles} placeholder="Pilih Peran" />
          </Form.Item>
        </div>
      </Form>
    </Create>
  );
};

export const UserEdit: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const { id } = useParsed();
  const { formProps, saveButtonProps, queryResult } = useForm({ 
    resource: "users",
    action: "edit",
    id: id
  });
  const { selectProps: roleSelectProps } = useSelect({ resource: "roles", optionLabel: "name", optionValue: "id" });
  
  const record = queryResult?.data?.data;
  const roles = record?.roles || [];
  const initialRoleId = roles.length > 0 ? roles[0].id : undefined;

  useEffect(() => {
    if (record && formProps.form) {
      formProps.form.setFieldsValue({
        name: record.name,
        email: record.email,
        phone: record.phone,
        status: record.status,
        role_ids: initialRoleId ? [initialRoleId] : undefined,
      });
    }
  }, [record, initialRoleId, formProps.form]);

  const filteredRoles = (roleSelectProps.options || []).filter(
    (o: any) => o.label?.toLowerCase() !== "owner"
  );

  const next = async () => {
    try {
      if (currentStep === 0) {
        await formProps.form?.validateFields(["name", "phone"]);
      } else if (currentStep === 1) {
        await formProps.form?.validateFields(["province", "city", "district", "village", "address", "gmaps_url"]);
      }
      setCurrentStep(currentStep + 1);
    } catch (error) {}
  };

  const prev = () => setCurrentStep(currentStep - 1);

  return (
    <Edit 
      title="Edit Pengguna" 
      resource="settings-users"
      footerButtons={
        <>
          {currentStep > 0 && <Button onClick={prev}>Sebelumnya</Button>}
          {currentStep < 2 && <Button type="primary" onClick={next}>Selanjutnya</Button>}
          {currentStep === 2 && <SaveButton {...saveButtonProps} />}
        </>
      }
    >
      <Steps
        current={currentStep}
        responsive={false}
        items={[
          { title: isMobile ? "" : "Data Pribadi" },
          { title: isMobile ? "" : "Domisili" },
          { title: isMobile ? "" : "Akses & Status" }
        ]}
        style={{ marginBottom: 24 }}
      />

      <Form {...formProps} layout="vertical">
        <div style={{ display: currentStep === 0 ? "block" : "none" }}>
          <Form.Item label="Nama Lengkap" name="name" rules={[{ required: true, message: "Nama wajib diisi" }]}><Input placeholder="Masukkan nama lengkap" /></Form.Item>
          <Form.Item 
            label="Nomor Telepon" 
            name="phone"
            rules={[
              { required: true, message: "Nomor telepon wajib diisi" },
              { pattern: /^[0-9]+$/, message: "Hanya boleh berisi angka" },
              { min: 11, message: "Minimal 11 digit" },
              { max: 15, message: "Maksimal 15 digit" }
            ]}
          >
            <Input placeholder="08xxxxxxxxxx" />
          </Form.Item>
        </div>

        <div style={{ display: currentStep === 1 ? "block" : "none" }}>
          <AddressFormItems initialData={record} />
        </div>

        <div style={{ display: currentStep === 2 ? "block" : "none" }}>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: "email", message: "Email valid wajib diisi" }]}><Input placeholder="email@contoh.com" /></Form.Item>
          <Form.Item label="Peran (Jabatan)" name="role_ids" initialValue={initialRoleId ? [initialRoleId] : undefined} rules={[{ required: true, message: "Pilih jabatan pengguna" }]}>
            <Select mode="multiple" maxCount={1} options={filteredRoles} placeholder="Pilih Peran" />
          </Form.Item>
          <Form.Item label="Status" name="status">
            <Select options={[
              { label: "Aktif", value: "active" }, 
              { label: "Nonaktif", value: "inactive" }, 
              { label: "Ditangguhkan", value: "suspended" }
            ]} />
          </Form.Item>
        </div>
      </Form>
    </Edit>
  );
};
