"use client";

import { BolaoProvider } from "@/components/bolao-context";
import { Header } from "@/components/header";
import { Metrics } from "@/components/metrics";
import { GuessesBoard } from "@/components/guesses-board";
import { ResultsBoard } from "@/components/results-board";
import { Ranking } from "@/components/ranking";
import { AdminPanel } from "@/components/admin-panel";

export default function Home() {
  return (
    <BolaoProvider>
      <div className="min-h-screen overflow-x-hidden bg-[#f6f7f4]">
        <Header />
        <main className="mx-auto grid w-full max-w-[1440px] gap-3 px-2 pb-6 sm:px-3 lg:px-4 xl:px-6">
          <Metrics />
          <section id="administracao" className="scroll-mt-3"><AdminPanel /></section>
          <section id="palpites" className="scroll-mt-3"><GuessesBoard /></section>
          <section id="resultados" className="scroll-mt-3"><ResultsBoard /></section>
          <section id="ranking-completo" className="scroll-mt-3"><Ranking /></section>
        </main>
      </div>
    </BolaoProvider>
  );
}
