"use client";

import Link from "next/link";
import { APP_VERSION, APP_VERSION_DATE, currency } from "@/lib/data";

export default function ManualPage() {
  return (
    <div className="min-h-screen px-3 py-5 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-5 overflow-hidden rounded-[1.4rem] border border-indigo-300/20 bg-gradient-to-br from-[#080f20] via-[#172554] to-[#4338ca] p-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.28)]">
          <Link href="/" className="mb-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-sm font-bold text-white ring-1 ring-white/20 hover:bg-white/25">
            &larr; Voltar ao Bolão
          </Link>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
            Ajuda atualizada · {APP_VERSION} · {APP_VERSION_DATE}
          </p>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Manual do Bolão Brasileirão 2026</h1>
          <p className="mt-2 text-sm text-white/85">Cadastro, palpites, pontuação, ranking, financeiro e administração.</p>
        </header>

        <div className="space-y-4">
          <Section title="1. Como participar">
            <ol className="list-inside list-decimal space-y-2 text-sm">
              <li>Clique em <strong>Participar</strong> no cabeçalho.</li>
              <li>Informe nome, celular com DDD, e-mail válido e uma senha de pelo menos 6 caracteres.</li>
              <li>Clique em <strong>Cadastrar</strong> e, se solicitado, confirme o cadastro pelo e-mail recebido.</li>
              <li>Depois do login, você poderá registrar seus palpites.</li>
            </ol>
          </Section>

          <Section title="2. Login e recuperação de senha">
            <ol className="list-inside list-decimal space-y-2 text-sm">
              <li>Clique em <strong>Entrar</strong> e informe seu e-mail e sua senha.</li>
              <li>Ao entrar, o box de palpites seleciona automaticamente o seu próprio usuário.</li>
              <li>Se esquecer a senha, clique em <strong>Esqueci a senha</strong> e siga o link enviado ao seu e-mail.</li>
              <li>O link de recuperação é temporário; use sempre a mensagem mais recente recebida.</li>
            </ol>
          </Section>

          <Section title="3. Como registrar palpites">
            <ol className="list-inside list-decimal space-y-2 text-sm">
              <li>Escolha a rodada no filtro do box <strong>Palpites</strong>.</li>
              <li>Digite os dois placares previstos e clique em <strong>Salvar</strong>.</li>
              <li>Você pode alterar o palpite enquanto a partida estiver liberada.</li>
              <li>Jogos agendados e jogos adiados com data futura podem receber palpites.</li>
              <li>Somente o participante autenticado pode incluir ou alterar os próprios palpites.</li>
            </ol>
            <Notice>
              <strong>Prazo:</strong> cada palpite é bloqueado exatamente 1 hora antes do horário cadastrado para o jogo.
            </Notice>
          </Section>

          <Section title="4. Ver os palpites dos participantes">
            <p className="text-sm">
              Use o filtro <strong>Participante</strong> para consultar os palpites de outra pessoa. Os campos ficam travados em modo somente leitura. Ao voltar para o seu nome, seus campos tornam-se editáveis, respeitando o prazo de 1 hora.
            </p>
          </Section>

          <Section title="5. Pontuação atual">
            <div className="space-y-3">
              <Score points="5" title="Placar exato" description="Acertou o placar completo da partida." tone="bg-[#06b6d4] text-[#082f49]" />
              <Score points="2" title="Vencedor ou empate" description="Acertou quem venceu ou que houve empate, sem acertar o placar exato." tone="bg-[#3157d5] text-white" />
              <Score points="0" title="Resultado incorreto" description="Não acertou o vencedor, o empate nem o placar exato." tone="bg-slate-500 text-white" />
            </div>
            <Notice>
              A pontuação considera o resultado oficial cadastrado para cada partida do Brasileirão.
            </Notice>
          </Section>

          <Section title="6. Ranking e desempates">
            <div className="space-y-2 text-sm">
              <p>O ranking soma os pontos de todos os jogos com resultado cadastrado e é atualizado automaticamente.</p>
              <p>Os três primeiros aparecem no pódio logo abaixo do cabeçalho. O ranking completo fica no final da página.</p>
              <p>Quando houver participantes com a mesma pontuação, eles permanecem empatados até que novos resultados alterem a classificação.</p>
            </div>
          </Section>

          <Section title="7. Valor, premiação e doação">
            <div className="space-y-2 text-sm">
              <p><strong>Inscrição atual:</strong> {currency.format(100)} por participante.</p>
              <p><strong>Doação beneficente:</strong> 20% do total arrecadado.</p>
              <ul className="list-inside list-disc text-muted-foreground">
                <li>1º lugar: 50% do total arrecadado</li>
                <li>2º lugar: 20% do total arrecadado</li>
                <li>3º lugar: 10% do total arrecadado</li>
              </ul>
              <p>Em caso de empate na faixa de premiação, o valor correspondente é dividido entre os participantes empatados.</p>
              <p>A chave Pix e os valores podem ser atualizados pelo administrador e devem ser conferidos no aplicativo.</p>
            </div>
          </Section>

          <Section title="8. Resumo financeiro">
            <p className="text-sm">
              O painel mostra valor previsto, recebido, pendente, quantidade de participantes, premiação projetada e doação. O administrador registra ou remove pagamentos no módulo financeiro.
            </p>
          </Section>

          <Section title="9. Jogos e rodadas">
            <div className="space-y-2 text-sm">
              <p>O bolão contém os jogos futuros e as partidas pendentes do Brasileirão 2026.</p>
              <p>Partidas da rodada 21 que foram adiadas permanecem disponíveis enquanto a data cadastrada respeitar o prazo de bloqueio.</p>
              <p>Jogos suspensos, cancelados, ao vivo ou encerrados não aceitam novos palpites.</p>
              <p>Os horários são apresentados no horário de Brasília.</p>
            </div>
          </Section>

          <Section title="10. Funções do administrador">
            <ul className="list-inside list-disc space-y-2 text-sm">
              <li>Consultar, renomear e excluir perfis de participantes.</li>
              <li>Registrar e remover pagamentos.</li>
              <li>Atualizar data, estádio, status e resultados dos jogos.</li>
              <li>Alterar inscrição, percentual de doação, prazo de bloqueio e chave Pix.</li>
              <li>Usar quatro modelos de WhatsApp: convite, palpites pendentes, liderança e faixa de premiação.</li>
            </ul>
          </Section>

          <Section title="11. Exportação e privacidade">
            <div className="space-y-2 text-sm">
              <p>O participante pode exportar seus próprios palpites pelo botão <strong>Exportar CSV</strong>.</p>
              <p>Os palpites dos demais podem ser consultados, mas nunca alterados. Cada gravação é vinculada ao usuário autenticado.</p>
            </div>
          </Section>

          <Section title="12. Suporte">
            <p className="text-sm">
              Em caso de dúvida sobre cadastro, senha, pagamento, jogo ou resultado, fale com o administrador do bolão pelo canal de contato informado no convite.
            </p>
          </Section>
        </div>

        <footer className="mt-8 border-t border-line pt-6 text-center text-xs text-muted-foreground">
          <p>Bolão Beneficente do Brasileirão 2026</p>
          <p className="mt-1">Boa sorte a todos!</p>
        </footer>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-indigo-100 bg-white/90 p-4 shadow-[0_14px_42px_rgba(30,41,59,0.08)] backdrop-blur-md">
      <h2 className="mb-3 text-base font-black text-foreground">{title}</h2>
      <div className="text-foreground">{children}</div>
    </section>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return <div className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-950">{children}</div>;
}

function Score({ points, title, description, tone }: { points: string; title: string; description: string; tone: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-secondary p-3">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black ${tone}`}>{points}</span>
      <div>
        <p className="text-sm font-black">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
