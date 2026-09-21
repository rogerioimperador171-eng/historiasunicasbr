import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

import type { CreatePixResponse } from "@/lib/propix";

const title = "Finalize sua doação via Pix | Histórias Únicas";
const description =
  "Copie o código Pix ou escaneie o QR Code para concluir sua doação à campanha do Kauê. Confirmação automática em segundos.";

export const Route = createFileRoute("/pagamento")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600;700&display=swap",
      },
      { rel: "stylesheet", href: "/css/pagamento.css" },
    ],
  }),
  component: PagamentoPage;
});

type Donation = { amount: number; nome: string };

function formatBRL(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function readDonation(): Donation | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  let amount = Number(params.get("amount"));
  let nome = params.get("nome") ?? "";

  if (!amount || amount < 5) {
    try {
      const stored = window.sessionStorage.getItem("hu_donation");
      if (stored) {
        const parsed = JSON.parse(stored) as { amount?: number; nome?: string };
        if (parsed.amount) amount = Number(parsed.amount);
        if (!nome && parsed.nome) nome = parsed.nome;
      }
    } catch {
      /* ignora */
    }
  }

  if (!amount || amount < 5) return null;
  return { amount: Math.round(amount * 100) / 100, nome: nome.trim() || "Doador Anonimo" };
}

function PagamentoPage() {
  const [donation, setDonation] = useState<Donation | null>(null);
  const [pix, setPix] = useState<CreatePixResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const generate = useCallback(async (data: Donation) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/public/pix/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: data.amount,
          payerName: data.nome,
          description: "Doacao campanha Kaue - Historias Unicas",
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body?.error ?? "Não conseguimos gerar seu Pix agora. Tente novamente.");
        return;
      }
      setPix(body as CreatePixResponse);
    } catch {
      setError("Sem conexão com o servidor. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const data = readDonation();
    setDonation(data);
    if (!data) {
      setLoading(false);
      setError("Não encontramos os dados da sua doação. Volte e escolha o valor novamente.");
      return;
    }
    void generate(data);
  }, [generate]);

  useEffect(() => {
    if (!pix?.transactionId || paid) return;
    const check = async () => {
      try {
        const response = await fetch("/api/public/pix/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactionId: pix.transactionId }),
        });
        if (!response.ok) return;
        const body = (await response.json()) as { paid?: boolean };
        if (body.paid) {
          setPaid(true);
          if (pollRef.current) clearInterval(pollRef.current);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch {
        /* tenta de novo no próximo ciclo */
      }
    };
    pollRef.current = setInterval(check, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pix?.transactionId, paid]);

  const copy = async () => {
    if (!pix?.copyPaste) return;
    try {
      await navigator.clipboard.writeText(pix.copyPaste);
    } catch {
      const area = document.createElement("textarea");
      area.value = pix.copyPaste;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      document.body.removeChild(area);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2600);
  };

  return (
    <div className="pg-page">
      <div className="pg-hero">
        <img src="/images/logonova.png" alt="Histórias Únicas" className="pg-hero-logo" />
        <div className="pg-badge">
          <span className="pg-badge-dot" />
          Doação de
          <span className="pg-badge-amount">{formatBRL(donation?.amount ?? 0)}</span>
        </div>
        <h1 className="pg-hero-title">
          {paid ? (
            <>
              Doação <em>confirmada!</em>
            </>
          ) : (
            <>
              Quase <em>lá!</em>
            </>
          )}
        </h1>
      </div>

      <div className="pg-wrap">
        {loading && (
          <div className="pg-card">
            <div className="pg-center">
              <div className="pg-spinner" />
              <p>Gerando seu Pix com muito carinho…</p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="pg-card">
            <div className="pg-center">
              <div className="pg-error">{error}</div>
              {donation ? (
                <button className="pg-btn-outline" onClick={() => void generate(donation)}>
                  Tentar novamente
                </button>
              ) : (
                <a className="pg-btn-outline" href="/">
                  Voltar para a campanha
                </a>
              )}
            </div>
          </div>
        )}

        {paid && (
          <div className="pg-success">
            <div className="pg-success-check">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2>Pagamento aprovado</h2>
            <p>
              Recebemos sua doação de {formatBRL(donation?.amount ?? 0)}. Muito obrigado por ajudar o Kauê a
              respirar com segurança 💙
            </p>
            <a className="pg-btn-outline" href="/">
              Voltar para a campanha
            </a>
          </div>
        )}

        {!loading && !error && pix && !paid && (
          <>
            <div className="pg-card">
              <div className="pg-card-head">
                <div className="pg-card-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                </div>
                <h2 className="pg-card-title">Copie o código Pix</h2>
              </div>
              <div className="pg-card-body">
                <div className="pg-code-box">
                  <div className="pg-code-label">Pix copia e cola</div>
                  <div className="pg-code-value">{pix.copyPaste}</div>
                </div>
                <button className={`pg-copy-btn${copied ? " copied" : ""}`} onClick={() => void copy()}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  {copied ? "CÓDIGO COPIADO!" : "COPIAR CÓDIGO PIX"}
                </button>
              </div>
            </div>

            <div className="pg-card">
              <div className="pg-card-head">
                <div className="pg-card-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <path d="M8 21h8M12 17v4" />
                  </svg>
                </div>
                <h2 className="pg-card-title">Finalize no seu banco</h2>
              </div>
              <div className="pg-card-body pg-steps">
                <div className="pg-step">
                  <div className="pg-step-num">1</div>
                  <div>
                    <div className="pg-step-label">Passo 1</div>
                    <div className="pg-step-text">
                      Abra o app ou site do seu <strong>banco</strong>
                    </div>
                  </div>
                </div>
                <div className="pg-step">
                  <div className="pg-step-num">2</div>
                  <div>
                    <div className="pg-step-label">Passo 2</div>
                    <div className="pg-step-text">
                      Vá em <strong>Pix → Pagar → Colar chave</strong> e cole o código copiado
                    </div>
                  </div>
                </div>
                <div className="pg-step">
                  <div className="pg-step-num">3</div>
                  <div>
                    <div className="pg-step-label">Passo 3</div>
                    <div className="pg-step-text">
                      Confira o valor e <strong>confirme o pagamento</strong> — a confirmação aparece aqui
                      automaticamente
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {pix.qrcodeUrl && (
              <div className="pg-card">
                <div className="pg-card-head">
                  <div className="pg-card-icon gold">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <path d="M14 14h3v3h-3zM19 19h2M19 14h2v2" />
                    </svg>
                  </div>
                  <h2 className="pg-card-title">Ou escaneie o QR Code</h2>
                </div>
                <div className="pg-card-body">
                  <p className="pg-qr-hint">Use a câmera do celular para escanear e pagar diretamente</p>
                  <div className="pg-qr-frame">
                    <img src={pix.qrcodeUrl} alt="QR Code Pix da doação" />
                  </div>
                </div>
              </div>
            )}

            <div className="pg-status">
              <span className="pg-status-dot" />
              Aguardando pagamento… a confirmação é automática
            </div>

            <div className="pg-secure">
              <div className="pg-secure-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                </svg>
              </div>
              <div>
                <strong>Pagamento 100% seguro</strong>
                <span>Verificado pela plataforma Histórias Únicas</span>
              </div>
              <div className="pg-secure-timer">⏱ 24h</div>
            </div>

            <div className="pg-receiver">
              <div className="pg-receiver-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="4" y="3" width="16" height="18" rx="2" />
                  <path d="M8 11h8" />
                </svg>
              </div>
              <div>
                <strong>PROPIXBR LTDA</strong>
                <p>
                  BASS PAGO INSTITUICAO DE PAGAMENTO LTDA
                  <br />
                  CNPJ: 65.474.453/0001-03
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className={`pg-toast${copied ? " show" : ""}`}>Código Pix copiado! Cole no seu banco 💙</div>
    </div>
  );
}
