# Tapicería Automotriz by NOVO

Sitio web del taller **Tapicería Automotriz by NOVO**, especializado en tapicería automotriz en Mérida, Yucatán.

## Stack técnico

- [Next.js 15](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) (`@supabase/supabase-js`, `@supabase/ssr`)
- [ESLint](https://eslint.org/)

## Estructura del proyecto

```
/app          → Rutas y layouts (App Router)
/components   → Componentes reutilizables
/lib          → Utilidades y clientes de Supabase
/types        → Tipos de TypeScript
```

## Instalación

1. Clona el repositorio e instala dependencias:

```bash
npm install
```

2. Copia el archivo de variables de entorno y completa los valores desde tu proyecto de Supabase:

```bash
cp .env.local.example .env.local
```

Variables requeridas:

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública (anon) de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (solo servidor, no exponer al cliente) |

3. Inicia el servidor de desarrollo:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | Ejecutar ESLint |

## Licencia

Proyecto privado — Tapicería Automotriz by NOVO.
