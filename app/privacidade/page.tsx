'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, EyeOff } from 'lucide-react';

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#000000] text-[#FFFFFF] font-sans pb-20 selection:bg-[#FFE600]/20 selection:text-white">
      <div className="max-w-2xl mx-auto px-6 pt-12 flex flex-col gap-8">
        
        {/* Back Link */}
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#A1A1AA] hover:text-[#FFE600] transition-colors bg-[#0F0F0F] border border-[#222225] px-4 py-2.5 rounded-full">
            <ArrowLeft size={14} /> Voltar para o início
          </Link>
        </div>

        {/* Header */}
        <header className="border-b border-[#222225] pb-6 flex flex-col gap-2">
          <div className="w-10 h-10 rounded-xl bg-[#FFE600]/10 flex items-center justify-center border border-[#FFE600]/20 text-[#FFE600] mb-2">
            <ShieldCheck size={20} />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">
            Política de <span className="text-[#FFE600]">Privacidade</span>
          </h1>
          <p className="text-[#A1A1AA] text-xs font-bold uppercase tracking-wider">Compromisso com a Proteção de Seus Dados</p>
        </header>

        {/* Core items info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#0F0F0F] border border-[#222225] p-4 rounded-2xl flex gap-3">
            <Lock className="text-[#FFE600] shrink-0" size={20} />
            <div>
              <h4 className="text-white text-xs font-black uppercase tracking-wider mb-1">Criptografia Ativa</h4>
              <p className="text-[#A1A1AA] text-xs leading-relaxed">Suas senhas são hasheadas via criptografia assimétrica de alta segurança.</p>
            </div>
          </div>
          <div className="bg-[#0F0F0F] border border-[#222225] p-4 rounded-2xl flex gap-3">
            <EyeOff className="text-[#FFE600] shrink-0" size={20} />
            <div>
              <h4 className="text-white text-xs font-black uppercase tracking-wider mb-1">Isolamento via RLS</h4>
              <p className="text-[#A1A1AA] text-xs leading-relaxed">Suas fotos e treinos são isolados por chaves lógicas de Row Level Security.</p>
            </div>
          </div>
        </div>

        {/* Policy Blocks */}
        <main className="flex flex-col gap-6 text-sm text-[#A1A1AA] leading-relaxed font-medium">
          
          <div className="space-y-2">
            <h3 className="text-white font-black text-sm uppercase tracking-wider">Como Protegemos Seus Dados</h3>
            <p>O AresFit emprega medidas de segurança rigorosas de nível corporativo. Todo o tráfego da aplicação é protegido por chaves criptográficas seguras através do protocolo HTTPS/TLS. A base de dados utiliza Row Level Security (RLS) nativa no Supabase, garantindo que nem mesmo requisições diretas via API consigam ler dados de outros atletas sem autorização lógica expressa.</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-white font-black text-sm uppercase tracking-wider">Uso de Cookies e Sessões</h3>
            <p>Nossa política de cookies é minimalista e estritamente funcional. Não utilizamos cookies de rastreamento comportamental de terceiros (como pixels de publicidade invasivos). Os únicos cookies mapeados e salvos localmente são os cookies de autenticação criptografados JWT (JSON Web Tokens), absolutamente obrigatórios para manter você conectado com segurança no aplicativo.</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-white font-black text-sm uppercase tracking-wider">Transferência Internacional de Dados</h3>
            <p>Como o AresFit utiliza fornecedores globais líderes de computação em nuvem para seu ecossistema, os dados coletados são hospedados de forma segura em servidores gerenciados pelo Supabase localizados em datacenters mantidos pela Amazon Web Services (AWS). Esta transferência internacional é totalmente regulamentada pelos mecanismos de proteção de dados exigidos por lei.</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-white font-black text-sm uppercase tracking-wider">Como Exercer seus Direitos</h3>
            <p>Você é o único proprietário dos seus dados fisiológicos e cadastrais. Caso precise de esclarecimentos, relatórios de portabilidade em formato legível (JSON/CSV) ou queira manifestar revogação de consentimento técnico, envie um e-mail diretamente para nossa ouvidoria em <span className="text-white font-mono font-bold">privacidade@aresfit.app</span>. Sua requisição será analisada e respondida em tempo ágil.</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-white font-black text-sm uppercase tracking-wider">Alterações Técnicas nesta Política</h3>
            <p>Reservamos o direito de atualizar este documento técnico de privacidade à medida que novas ferramentas operacionais de dados forem adicionadas ao ecossistema. Sempre que houver uma alteração estrutural nas finalidades de uso, você receberá um alerta direto no painel da aplicação para renovação do consentimento.</p>
          </div>

        </main>

        {/* Footer update */}
        <footer className="border-t border-[#222225] pt-4 mt-6 text-center">
          <p className="text-[#555558] text-[10px] font-black uppercase tracking-widest">Última atualização da política: 28 de maio de 2026</p>
        </footer>

      </div>
    </div>
  );
}