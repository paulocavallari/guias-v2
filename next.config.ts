import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Desabilita a pré-geração estática de páginas que dependem de variáveis de ambiente runtime (Supabase).
  // Isso garante que todas as páginas sejam renderizadas no servidor sob demanda (SSR).
  output: 'standalone',
};

export default nextConfig;
