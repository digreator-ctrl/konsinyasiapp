// ============================================================
// Register Page — Create account + tenant
// ============================================================

import React from "react";
import { useRegister } from "@refinedev/core";
import { Form, Input, Button, Typography, Divider, message } from "antd";
import { User, Mail, Lock, Building2, UserPlus } from "lucide-react";
import { Link } from "react-router";

const { Text } = Typography;

export const RegisterPage: React.FC = () => {
  const { mutate: register, isPending } = useRegister();

  const onFinish = (values: any) => {
    register(values, {
      onError: (error) => {
        message.error(error?.message || "Registrasi gagal");
      },
    });
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">K</div>
        </div>
        <h1 className="auth-title">Buat Akun Baru</h1>
        <p className="auth-subtitle">Daftarkan unit usaha Anda di KonsinyasiApp</p>

        <Form layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
          <Form.Item
            name="name"
            label={<span style={{ color: "#94A3B8" }}>Nama Lengkap</span>}
            rules={[{ required: true, message: "Nama wajib diisi" }]}
          >
            <Input
              prefix={<User size={16} style={{ color: "#64748B" }} />}
              placeholder="Nama lengkap Anda"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label={<span style={{ color: "#94A3B8" }}>Email</span>}
            rules={[
              { required: true, message: "Email wajib diisi" },
              { type: "email", message: "Format email tidak valid" },
            ]}
          >
            <Input
              prefix={<Mail size={16} style={{ color: "#64748B" }} />}
              placeholder="nama@perusahaan.com"
            />
          </Form.Item>

          <Form.Item
            name="tenant_name"
            label={<span style={{ color: "#94A3B8" }}>Nama Unit Usaha</span>}
            rules={[{ required: true, message: "Nama unit usaha wajib diisi" }]}
          >
            <Input
              prefix={<Building2 size={16} style={{ color: "#64748B" }} />}
              placeholder="PT. Contoh Sukses Makmur"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span style={{ color: "#94A3B8" }}>Password</span>}
            rules={[
              { required: true, message: "Password wajib diisi" },
              { min: 8, message: "Password minimal 8 karakter" },
            ]}
          >
            <Input.Password
              prefix={<Lock size={16} style={{ color: "#64748B" }} />}
              placeholder="Minimal 8 karakter"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={isPending}
              block
              icon={<UserPlus size={16} />}
              style={{
                height: 48,
                fontSize: 15,
                fontWeight: 600,
                background: "linear-gradient(135deg, #4F46E5, #6366F1)",
                border: "none",
                borderRadius: 10,
              }}
            >
              Daftar & Mulai
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ borderColor: "rgba(148, 163, 184, 0.12)" }}>
          <Text style={{ color: "#64748B", fontSize: 12 }}>atau</Text>
        </Divider>

        <div style={{ textAlign: "center" }}>
          <Text style={{ color: "#94A3B8" }}>
            Sudah punya akun?{" "}
            <Link to="/login" style={{ color: "#818CF8", fontWeight: 600 }}>
              Masuk
            </Link>
          </Text>
        </div>
      </div>
    </div>
  );
};
