// ============================================================
// Login Page — Premium dark glassmorphism design
// ============================================================

import React from "react";
import { useLogin } from "@refinedev/core";
import { Form, Input, Button, Typography, Divider, message } from "antd";
import { Mail, Lock, LogIn } from "lucide-react";
import { Link } from "react-router";

const { Title, Text } = Typography;

export const LoginPage: React.FC = () => {
  const { mutate: login, isPending } = useLogin();

  const onFinish = (values: { email: string; password: string }) => {
    login(values, {
      onError: (error) => {
        message.error(error?.message || "Login gagal");
      },
    });
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">K</div>
        </div>
        <h1 className="auth-title">Selamat Datang</h1>
        <p className="auth-subtitle">Masuk ke KonsinyasiApp untuk melanjutkan</p>

        <Form layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
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
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span style={{ color: "#94A3B8" }}>Password</span>}
            rules={[{ required: true, message: "Password wajib diisi" }]}
          >
            <Input.Password
              prefix={<Lock size={16} style={{ color: "#64748B" }} />}
              placeholder="Masukkan password"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={isPending}
              block
              icon={<LogIn size={16} />}
              style={{
                height: 48,
                fontSize: 15,
                fontWeight: 600,
                background: "linear-gradient(135deg, #4F46E5, #6366F1)",
                border: "none",
                borderRadius: 10,
              }}
            >
              Masuk
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ borderColor: "rgba(148, 163, 184, 0.12)" }}>
          <Text style={{ color: "#64748B", fontSize: 12 }}>atau</Text>
        </Divider>

        <div style={{ textAlign: "center" }}>
          <Text style={{ color: "#94A3B8" }}>
            Belum punya akun?{" "}
            <Link to="/register" style={{ color: "#818CF8", fontWeight: 600 }}>
              Daftar Sekarang
            </Link>
          </Text>
        </div>
      </div>
    </div>
  );
};
