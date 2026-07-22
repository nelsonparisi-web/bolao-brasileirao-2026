"use client";

import { BolaoProvider } from "@/components/bolao-context";
import { Header } from "@/components/header";
import { Metrics } from "@/components/metrics";
import { Sidebar } from "@/components/sidebar";
import { GuessesBoard } from "@/components/guesses-board";
import { ResultsBoard } from "@/components/results-board";
import { Ranking } from "@/components/ranking";
import { PaymentsBoard } from "@/components/payments-board";
import { RankingSummary } from "@/components/ranking-summary";

const sectionClass = "w-full min-w-0 max-w-full scroll-mt-24";

export default function Home() {
  return (
    <BolaoProvider>
      <div
        className="min-h-screen overflow-x-hidden"
        style={{
          background: `
            linear-gradient(135deg, rgba(8, 127, 91, 0.08), transparent 38%),
            radial-gradient(circle at 90% 8%, rgba(196, 139, 24, 0.16), transparent 26%),
            #f6f7f4
          `,
        }}
      >
        <Header />
        <main className="mx-auto w-full max-w-[1440px] overflow-x-hidden px-2 pb-3 sm:px-3 lg:px-4 xl:px-6">
          <Metrics />
          <section className="grid w-full max-w-full min-w-0 grid-cols-1 gap-2 sm:gap-3">
            <aside id="jogos" className={sectionClass}>
              <Sidebar />
            </aside>
            <section id="ranking" className={sectionClass}>
              <RankingSummary />
            </section>
            <section id="palpites" className={sectionClass}>
              <GuessesBoard />
            </section>
            <section id="resultados" className={sectionClass}>
              <ResultsBoard />
            </section>
            <section id="ranking-completo" className={sectionClass}>
              <Ranking />
            </section>
            <section id="financeiro" className={sectionClass}>
              <PaymentsBoard />
            </section>
          </section>
        </main>
      </div>
    </BolaoProvider>
  );
}
