# E-Raport Web

Frontend internal untuk backend e-raport.

## Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- React Query
- Axios
- React Hook Form + Zod

## Setup
1. Copy env:
   ```bash
   cp .env.example .env.local
   ```
2. Isi API key dan base URL backend.
3. Jalankan:
   ```bash
   npm install
   npm run dev
   ```

## Flow sekarang
- `/login`: login dan simpan JWT ke localStorage
- `/students`: list + pagination + CRUD basic
- `/classes`: list + pagination + CRUD basic
- `/grades`: placeholder
- `/reports`: placeholder
