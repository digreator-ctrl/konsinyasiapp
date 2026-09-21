// User Management Pages
import React, { useEffect, useState } from "react";
import { useTable, useForm, useSelect } from "@refinedev/antd";
import { useParsed } from "@refinedev/core";
import { List, Create, Edit, EditButton, DeleteButton, SaveButton } from "@refinedev/antd";
import { Table, Form, Input, Select, Space, Tag, Row, Col, Steps, Button, Grid } from "antd";

const AddressFormItems: React.FC<{ initialData?: any }> = ({ initialData }) => {
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
  return (
    <List title="Manajemen Pengguna" resource="settings-users">
      <Table {...tableProps} rowKey="id" size="middle">
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
        <Table.Column title="Aksi" render={(_, record: any) => (
          <Space>
            <EditButton hideText size="small" recordItemId={record.id} resource="settings-users" />
            <DeleteButton hideText size="small" recordItemId={record.id} resource="settings-users" />
          </Space>
        )} />
      </Table>
    </List>
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
