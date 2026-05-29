'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';

export default function TermosPage() {
  const secoes = [
    { id: 'identificacao', label: '1. Identificação' },
    { id: 'coleta', label: '2. Coleta de Dados' },
    { id: 'base-legal', label: '3. Base Legal' },
    { id: 'finalidade', label: '4. Finalidade' },
    { id: 'compartilhamento', label: '5. Compartilhamento' },
    { id: 'direitos', label: '6. Seus Direitos' },
    { id: 'retencao', label: '7. Retenção' },
    { id: 'contato', label: '8. Canal de Contato' }
  ];

  return (
    <div className="min-h-screen bg-[#000000] text-[#FFFFFF] font-sans pb-20 selection:bg-[#FFE600]/20 selection:text-white">
      <div className="max-w-2xl mx-auto px-6 pt-12 flex flex-col gap-8">
        
        {/* Top Link */}
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#A1A1AA] hover:text-[#FFE600] transition-colors bg-[#0F0F0F] border border-[#222225] px-4 py-2.5 rounded-full">
            <ArrowLeft size={14} /> Voltar para o início
          </Link>
        </div>

        {/* Header */}
        <header className="border-b border-[#222225] pb-6">
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">
            Termos de <span className="text-[#FFE600]">Uso</span>
          </h1>
          <p className="text-[#A1A1AA] text-xs font-bold uppercase tracking-wider mt-2">AresFit — Ecossistema de Performance</p>
        </header>

        {/* Índice de Navegação */}
        <nav className="bg-[#0F0F0F] border border-[#222225] rounded-3xl p-5 flex flex-col gap-2">
          <p className="text-[10px] font-black text-[#555558] uppercase tracking-widest mb-1">Índice dos Termos</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-[#A1A1AA]">
            {secoes.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="hover:text-[#FFE600] flex items-center gap-1 transition-colors">
                {s.label} <ArrowUpRight size={10} className="opacity-40" />
              </a>
            ))}
          </div>
        </nav>

        {/* Conteúdo Jurídico */}
        <main className="flex flex-col gap-8 text-sm text-[#A1A1AA] leading-relaxed font-medium">
          
          <section id="identificacao" className="scroll-mt-6">
            <h2 className="text-white text-base font-black uppercase tracking-widest mb-3 border-l-2 border-[#FFE600] pl-3">1. Identificação do Controlador</h2>
            <p>O ecossistema AresFit, acessível por meio de sua aplicação web e mobile, é controlado e operado pela diretoria técnica e jurídica interna da plataforma AresFit Proteção de Dados, com sede no Brasil, doravante denominada simplesmente "Controlador" nos parâmetros da LGPD (Lei nº 13.709/2018).</p>
          </section>

          <section id="coleta" className="scroll-mt-6">
            <h2 className="text-white text-base font-black uppercase tracking-widest mb-3 border-l-2 border-[#FFE600] pl-3">2. Escopo de Coleta de Dados</h2>
            <p className="mb-3">Para o estrito funcionamento do ecossistema de alta performance do AresFit, coletamos as seguintes categorias de informações:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs">
              <li><strong className="text-white">Dados cadastrais fundamentais:</strong> nome completo, endereço de correio eletrônico (email), nome de usuário único (username) e senhas transformadas em hash criptográfico criptografado de mão única.</li>
              <li><strong className="text-white">Dados fisiológicos e de saúde:</strong> histórico de pesagem corporal em quilogramas (kg), estatura em centímetros (cm), perímetros antropométricos (braço, cintura, ombro e perna).</li>
              <li><strong className="text-white">Métricas de performance física:</strong> rotinas de treinos, quantidade de séries efetuadas, contagem de repetições completadas, carga movida, notas subjetivas de cansaço (RPE/Rating) e fotografias temporais de progresso físico.</li>
              <li><strong className="text-white">Metadados técnicos obrigatórios:</strong> endereços IP de conexão, identificadores únicos de dispositivo, logs detalhados de horários de acesso e cookies essenciais de sessão.</li>
            </ul>
          </section>

          <section id="base-legal" className="scroll-mt-6">
            <h2 className="text-white text-base font-black uppercase tracking-widest mb-3 border-l-2 border-[#FFE600] pl-3">3. Base Legal para o Tratamento</h2>
            <p>Em total conformidade com o artigo 7º da Legislação nº 13.709/2018 (LGPD), fundamentamos o tratamento de dados nas seguintes bases legais: Execução de Contrato (para viabilizar o uso do app e suas fichas), Legítimo Interesse (para melhoria contínua da performance do sistema) e Consentimento Explicito e Inequívoco do titular, manifestado formalmente no ato de criação da conta.</p>
          </section>

          <section id="finalidade" className="scroll-mt-6">
            <h2 className="text-white text-base font-black uppercase tracking-widest mb-3 border-l-2 border-[#FFE600] pl-3">4. Finalidade do Tratamento</h2>
            <p>Os dados processados possuem como objetivos finais: a entrega precisa do software de monitoramento de exercícios, o cálculo automático de algoritmos analíticos estruturados (como detecção matemática de platô e assimetrias musculares), o envio de notificações push contextuais e a viabilização de canal direto e autorizado de chat e envio de dados entre os Alunos e seus respectivos Personal Trainers vinculados.</p>
          </section>

          <section id="compartilhamento" className="scroll-mt-6">
            <h2 className="text-white text-base font-black uppercase tracking-widest mb-3 border-l-2 border-[#FFE600] pl-3">5. Compartilhamento de Dados</h2>
            <p>O AresFit não realiza venda, cessão ou comércio de nenhuma informação pessoal. Seus dados são armazenados na infraestrutura isolada do Supabase (com servidores hospedados nos datacenters seguros da AWS). Informações transacionais e financeiras de pagamento são geridas de ponta a ponta de forma isolada e segura pelo gateway de pagamentos do Mercado Pago, transmitindo apenas o estritamente necessário para liquidação da assinatura.</p>
          </section>

          <section id="direitos" className="scroll-mt-6">
            <h2 className="text-white text-base font-black uppercase tracking-widest mb-3 border-l-2 border-[#FFE600] pl-3">6. Seus Direitos como Titular</h2>
            <p>A LGPD assegura a você uma série de prerrogativas fundamentais, as quais podem ser exercidas a qualquer momento direto no app: direito de confirmar a existência de processamento, livre acesso visual a todos os seus dados, retificação instantânea de medições incorretas, portabilidade de relatórios de treinos e o direito à eliminação definitiva ("Direito ao Esquecimento") de sua conta e histórico.</p>
          </section>

          <section id="retencao" className="scroll-mt-6">
            <h2 className="text-white text-base font-black uppercase tracking-widest mb-3 border-l-2 border-[#FFE600] pl-3">7. Retenção de Dados</h2>
            <p>Mantemos seus registros ativos exclusivamente enquanto perdurar sua conta no AresFit. Em caso de solicitação de exclusão, as informações cadastrais e dados fisiológicos históricos são apagados integralmente de nossos servidores de produção em um intervalo operacional de até 90 dias, prazo mantido para cumprimentos técnicos de backups resilientes e obrigações legais fiscais.</p>
          </section>

          <section id="contato" className="scroll-mt-6">
            <h2 className="text-white text-base font-black uppercase tracking-widest mb-3 border-l-2 border-[#FFE600] pl-3">8. Canal de Contato com o DPO</h2>
            <p>Para exercer qualquer prerrogativa técnica garantida por lei ou sanar dúvidas referentes a estes termos, você pode entrar em contato direto com o nosso Encarregado de Proteção de Dados (DPO) através do e-mail exclusivo de ouvidoria jurídica: <span className="text-white font-bold font-mono">privacidade@aresfit.app</span>.</p>
          </section>

        </main>

        {/* Footer legal */}
        <footer className="border-t border-[#222225] pt-4 mt-4 text-center">
          <p className="text-[#555558] text-[10px] font-black uppercase tracking-widest">Última atualização: 28 de maio de 2026</p>
        </footer>

      </div>
    </div>
  );
}