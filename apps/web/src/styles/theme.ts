// ============================================================
// KonsinyasiApp — Ant Design Theme Configuration
// Premium dark theme with custom token overrides
// ============================================================

import type { ThemeConfig } from "antd";

export const antdTheme: ThemeConfig = {
  token: {
    // Primary colors
    colorPrimary: "#4F46E5",
    colorInfo: "#3B82F6",
    colorSuccess: "#22C55E",
    colorWarning: "#F59E0B",
    colorError: "#EF4444",

    // Background
    colorBgBase: "#0F172A",
    colorBgContainer: "#1E293B",
    colorBgElevated: "#1E293B",
    colorBgLayout: "#0F172A",
    colorBgSpotlight: "#334155",

    // Text
    colorText: "#F1F5F9",
    colorTextSecondary: "#94A3B8",
    colorTextTertiary: "#64748B",
    colorTextQuaternary: "#475569",

    // Border
    colorBorder: "rgba(148, 163, 184, 0.12)",
    colorBorderSecondary: "rgba(148, 163, 184, 0.08)",

    // Shape
    borderRadius: 10,
    borderRadiusLG: 14,
    borderRadiusSM: 6,

    // Font
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 14,
    fontSizeHeading1: 28,
    fontSizeHeading2: 22,
    fontSizeHeading3: 18,

    // Sizing
    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,

    // Motion
    motionDurationFast: "0.1s",
    motionDurationMid: "0.2s",
    motionDurationSlow: "0.3s",

    // Misc
    wireframe: false,
  },
  components: {
    Layout: {
      siderBg: "#111827",
      headerBg: "#1E293B",
      bodyBg: "#0F172A",
      triggerBg: "#1F2937",
    },
    Menu: {
      darkItemBg: "#111827",
      darkItemSelectedBg: "rgba(79, 70, 229, 0.15)",
      darkItemSelectedColor: "#818CF8",
      darkItemColor: "#94A3B8",
      darkItemHoverColor: "#F1F5F9",
      darkItemHoverBg: "rgba(148, 163, 184, 0.06)",
      darkSubMenuItemBg: "#0D1117",
      itemBorderRadius: 8,
      itemMarginInline: 8,
      iconSize: 18,
    },
    Table: {
      headerBg: "#1E293B",
      headerColor: "#94A3B8",
      rowHoverBg: "rgba(79, 70, 229, 0.04)",
      borderColor: "rgba(148, 163, 184, 0.08)",
      headerBorderRadius: 10,
    },
    Card: {
      colorBgContainer: "#1E293B",
      colorBorderSecondary: "rgba(148, 163, 184, 0.08)",
    },
    Button: {
      primaryShadow: "0 2px 8px rgba(79, 70, 229, 0.3)",
      defaultBg: "#334155",
      defaultBorderColor: "rgba(148, 163, 184, 0.15)",
      defaultColor: "#F1F5F9",
    },
    Input: {
      colorBgContainer: "#1E293B",
      activeBorderColor: "#4F46E5",
      hoverBorderColor: "#4F46E5",
    },
    Select: {
      colorBgContainer: "#1E293B",
      optionSelectedBg: "rgba(79, 70, 229, 0.15)",
    },
    DatePicker: {
      colorBgContainer: "#1E293B",
    },
    Modal: {
      contentBg: "#1E293B",
      headerBg: "#1E293B",
    },
    Drawer: {
      colorBgElevated: "#1E293B",
    },
    Tag: {
      borderRadiusSM: 20,
    },
    Tabs: {
      itemSelectedColor: "#818CF8",
      inkBarColor: "#4F46E5",
    },
    Statistic: {
      contentFontSize: 28,
    },
    Badge: {
      dotSize: 8,
    },
    Breadcrumb: {
      separatorColor: "#475569",
      itemColor: "#64748B",
      lastItemColor: "#F1F5F9",
    },
  },
  algorithm: undefined, // We handle dark mode manually via tokens
};
