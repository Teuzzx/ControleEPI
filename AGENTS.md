# figma-make-app

React + Vite + Tailwind CSS project running inside Figma Make.

## Development Server

A Vite development server is **already running** on `$PORT` (default 8443). You don't need to start it manually.

- Preview URL: The user can access the running app through the preview panel
- Hot reload: Changes to source files are reflected immediately

## Project Structure

This is the canonical project structure. Start with task-relevant files below. Only follow imports or inspect other files when required, when a documented path is missing, or when the repository contradicts this guide.

- `src/main.tsx` - React entrypoint; imports `src/index.css` and mounts `src/App.tsx` into the `#root` element
- `src/App.tsx` - Primary application component and the usual starting point for UI work
- `src/index.css` - Global CSS entrypoint and Tailwind CSS v4 import
- `index.html` - Vite HTML shell containing the `#root` element and loading `src/main.tsx`
- `package.json` - Project dependencies and the Vite build, development, preview, and formatting scripts
- `vite.config.ts` - Vite configuration with React, Tailwind CSS v4, and Figma Make plugins plus the `@` alias for `src`
- `.mise.toml` - Toolchain versions for Node.js and pnpm

## Dependencies

- Runtime: React 19 and React DOM 19
- Styling: Tailwind CSS v4 with the `@tailwindcss/vite` plugin
- Build tooling: Vite 8, TypeScript 5.7, and `@vitejs/plugin-react`
- Formatting: oxfmt

## Styling

This project uses **Tailwind CSS v4** through the `@tailwindcss/vite` plugin configured in `vite.config.ts`. `src/index.css` imports Tailwind with `@import 'tailwindcss';`. Use Tailwind utility classes directly in JSX and put global CSS or Tailwind v4 theme customization in `src/index.css`. This scaffold does not need a Tailwind config file or PostCSS config.

`src/main.tsx` imports `src/index.css`, so global font wiring belongs in `src/index.css`. Keep CSS `@import` statements first, then add any `@font-face` rules and font-family defaults there.

## Code quality

- Use double quotes for strings containing apostrophes (`"We're here to help"`), or escape them in single-quoted strings. An unescaped apostrophe in a single-quoted string breaks the build.
- Ensure JSX tags are closed and braces are balanced.
- Export components as default exports.

## Supabase (banco de dados)

- O usuário quer que TODAS as alterações de SQL editor sejam aplicadas automaticamente pelo agente (ele não roda nada no painel do Supabase).
- O Access Token da conta Supabase está no `.env` local (variável `SUPABASE_ACCESS_TOKEN`). O `.env` é gitignored — nunca commitar o token.
- Projeto matriz: `lqbfejbnnpukwiipwfxy` (URL: https://lqbfejbnnpukwiipwfxy.supabase.co).
- Para aplicar SQL: `powershell -File scripts/run-supabase-sql.ps1 -File supabase/migrations/XXXX_nome.sql` (ou `-Query "..."` para consultas avulsas).
- Sempre que criar/alterar uma migration, aplicar NO banco da matriz com esse script (as funções `app_*` do schema `public` vivem no banco da matriz).
- Histórico de migrations aplicadas: 0000 (users seed), 0001 (segurança matriz), 0002 (filiais), 0003 (mobile), 0004 (notificações), 0005 (gestão de usuários), 0006 (fix segurança guards `coalesce(app_session_role(),'')`).
- Filiais têm o próprio projeto Supabase, sem RLS (0002); a matriz acessa o banco de cada filial com a URL/chave anon gravada em `companies`.
