# Perbaikan RBAC: Matriks Hak Akses Sesuai Resource

## Masalah

Pada **Pengaturan > Peran & Hak Akses > Edit Role**, matriks menampilkan **semua `RESOURCES` × semua `ACTIONS`**, sehingga muncul centang yang tidak masuk akal seperti Dashboard + Tambah/Ubah/Hapus/Setujui/Detail/Ekspor. Dashboard seharusnya hanya `list` (Lihat).

Akar masalah:

- `apps/web/src/pages/settings/roles.tsx:96-110` (Create) dan `:169-183` (Edit) melakukan iterasi `Object.values(RESOURCES) × Object.values(ACTIONS)` tanpa filter.
- `apps/api/src/routes/auth.ts:22-27` — seeder sistem memberi owner/admin **semua aksi untuk semua resource** (`allResources × allActions`).
- Beberapa aksi memang tidak pernah dipakai: `rebuild` `dashboard` hanya `list`; `warehouse` hanya `list`; `stock_entries` hanya list/show/create; `export` belum ada endpoint-nya.
- Resource yatim `sales_team` ada di `RESOURCES` tetapi tidak dipakai enforcement (halaman Tim Sales sebenarnya memakai izin `distribution_sales:list`).
- Celah penegakan: `apps/api/src/routes/reports.ts:17` (`/dashboard`) dan `apps/api/src/routes/tenants.ts:16,26` (GET/PUT) tidak punya `requirePermission`.

## Keputusan (disetujui)

1. **Sumber kebenaran tunggal** berupa peta `RESOURCE_ACTIONS` di paket `@konsinyasi/shared`, dipakai oleh UI matriks, seeder, dan validasi backend.
2. **Hapus resource yatim `sales_team`** dari `RESOURCES` dan `resourceLabels`.
3. **`export` tidak ditampilkan** di matriks karena belum ada endpoint ekspor. Konstanta `ACTIONS.EXPORT` tetap dipertahankan untuk kebutuhan mendatang.
4. **Backend menolak** kombinasi resource/action yang tidak valid pada POST/PUT role (HTTP 400).
5. **Tambah penegakan yang hilang**:
   - `GET /reports/dashboard` → `dashboard:list`
   - `GET /tenants` → `settings_company:list`; `PUT /tenants` → `settings_company:edit`
6. **Perbaiki pemetaan menu** di `accessControlProvider`: `reports-stock` dan `reports-distribution` → resource `reports` (saat ini tidak terpetakan sehingga submenu Laporan bisa tersembunyi untuk non-owner).

## Peta aksi final (berdasarkan pemakaian backend)

| Resource | Aksi yang berlaku |
| --- | --- |
| `dashboard` | list |
| `producers` | list, show, create, edit, delete |
| `products` | list, show, create, edit, delete |
| `stores` | list, show, create, edit, delete |
| `stock_entries` | list, show, create |
| `warehouse` | list |
| `distribution_agent` | list, show, create, approve |
| `distribution_sales` | list, show, create, approve |
| `consignments` | list, show, create, edit |
| `return_agent` | list, show, create, approve |
| `return_sales` | list, show, create, approve |
| `reports` | list |
| `settings_company` | list, edit |
| `settings_users` | list, show, create, edit, delete |
| `settings_roles` | list, show, create, edit, delete |

Kolom matriks yang akan tampil (union): Lihat, Detail, Tambah, Ubah, Hapus, Setujui. Dashboard hanya punya checkbox di kolom "Lihat"; sel lainnya dirender `–` (abu-abu, non-interaktif).

## Langkah Implementasi

### 1. `packages/shared/src/constants/index.ts`
- Hapus `SALES_TEAM` dari `RESOURCES`.
- Tambah peta dan helper:
  - `export const RESOURCE_ACTIONS: Record<ResourceName, readonly ActionName[]> = { ... }` sesuai tabel di atas.
  - `export function actionsForResource(resource: string): readonly string[]`
  - `export function isActionAllowedForResource(resource: string, action: string): boolean`
- Pastikan ikut ter-export lewat `packages/shared/src/index.ts` (sudah `export * from "./constants"`).

### 2. `apps/api/src/routes/auth.ts` — seeder sistem
- Ubah `getDefaultPermissions` (baris 18-53) agar owner/admin memakai `RESOURCES × RESOURCE_ACTIONS[resource]`, bukan `allResources × allActions`.
- Blok `DefaultRole.SALES` sudah valid terhadap peta; verifikasi tidak ada aksi yang dibuang (dashboard:list, stores:list/show/create, distribution_sales:list/show/create/approve, consignments:list/show/create/edit, return_sales:list/show/create, products:list/show).

### 3. `apps/api/src/routes/roles.ts` — validasi
- Pada `POST /` (baris 71-82) dan `PUT /:id` (baris 105-118), sebelum insert: validasi tiap entri dengan `isActionAllowedForResource(perm.resource, perm.action)`.
- Bila ada yang tidak valid, kembalikan `400` `{ success: false, error: "Hak akses tidak valid: <resource>:<action>" }` dan jangan menulis apa pun.
- Dedupe entri berdasarkan `resource:action` agar tidak ada baris ganda.
- Impor helper dari `@konsinyasi/shared`.

### 4. Penegakan yang hilang
- `apps/api/src/routes/reports.ts:17`: tambah middleware `requirePermission("dashboard", "list")` pada `reports.get("/dashboard", ...)`.
- `apps/api/src/routes/tenants.ts`: tambah `requirePermission("settings_company", "list")` pada `GET /` dan `requirePermission("settings_company", "edit")` pada `PUT /`.
- Pastikan owner tetap lolos (middleware sudah bypass untuk role `owner`).

### 5. `apps/web/src/pages/settings/roles.tsx` — UI matriks
- Impor `actionsForResource` (dan `RESOURCE_ACTIONS` bila perlu).
- Hitung `actionColumns` = union aksi dari seluruh resource, urut sesuai urutan `ACTIONS`.
- Header tabel memakai `actionColumns` (bukan `Object.values(ACTIONS)`).
- Baris: untuk tiap `resource`, untuk tiap `actionColumn`:
  - jika `isActionAllowedForResource(resource, action)` → render `Checkbox` seperti sekarang;
  - selain itu → render teks `–` berwarna redup (tanpa `Checkbox`).
- Hapus baris `sales_team` dari `resourceLabels`.
- `RoleEdit` (`React.useEffect` baris 124-133): saat menyusun `permMap` dari `record.permissions`, **abaikan** entri yang tidak lolos `isActionAllowedForResource` agar data lama/bogus tidak ikut dimuat.
- `handleFinish` (Create baris 69-74, Edit baris 142-147): filter `permList` hanya untuk kombinasi yang lolos `isActionAllowedForResource` sebelum dikirim (pertahanan ganda).

### 6. `apps/web/src/providers/accessControlProvider.ts` — pemetaan
- Tambah di `resourceMap`: `"reports-stock": "reports"`, `"reports-distribution": "reports"`.
- Verifikasi item menu induk (`master-data`, `inventory`, `distribution`, `returns`, `settings`, `reports`) tidak ikut dinilai `can`; bila ikut dan bermasalah, tambahkan pemetaan grup yang sesuai (uji pada langkah validasi).

### 7. (Opsional, di luar wajib) Pembersihan data lama
- Baris `role_permissions` owner/admin lama tetap berisi kombinasi tidak valid. Karena owner bypass pengecekan dan aksi bogus tidak dipakai route mana pun, ini tidak berdampak. Baris akan otomatis bersih saat role tersebut disimpan ulang lewat UI. Tidak perlu migrasi.

## Validasi

1. `pnpm typecheck` (turbo) dan `pnpm lint` harus lolos.
2. Jalankan aplikasi, login sebagai owner:
   - Buka **Edit Role → Admin**: Dashboard hanya punya checkbox "Lihat" tercentang; kolom lain `–`. Tidak ada kolom "Ekspor".
   - Baris Warehouse hanya "Lihat"; Stok Masuk hanya Lihat/Detail/Tambah; Produsen lengkap sampai Hapus.
3. Simpan role Admin, lalu buka ulang: hasil simpan tetap benar (tidak muncul kembali centang bogus).
4. Uji API: `POST /roles` dengan `{ resource: "dashboard", action: "create" }` → 400. Dengan `{ resource: "dashboard", action: "list" }` → 201.
5. Login sebagai role non-owner (mis. Sales) hasil seeder: Dashboard tampil, menu Laporan/profil usaha sesuai izin, `GET /reports/dashboard` dan `GET /tenants` mengembalikan 403 bila izin tidak ada.
6. Pastikan halaman Dashboard tetap memuat metrik untuk admin/sales (dashboard:list tersedia).

## Definisi Selesai

- Tidak ada lagi checkbox aksi yang tidak relevan (khususnya pada Dashboard) di UI Edit/Create Role.
- Seeder role sistem hanya menghasilkan kombinasi resource:action yang valid.
- Backend menolak kombinasi tidak valid dan menegakkan izin pada endpoint `/reports/dashboard` serta `/tenants`.
- Typecheck & lint lolos.

## Di Luar Cakupan

- Implementasi fitur ekspor laporan (aksi `export` belum ditegakkan).
- Migrasi/backfill data `role_permissions` lama (ditangani otomatis saat role disimpan ulang).
- Penambahan endpoint `sales-team` (resource dihapus; akses Tim Sales tetap lewat `distribution_sales:list`).
