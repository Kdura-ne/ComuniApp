"use client";

import { useCallback, useEffect, useState } from "react";

import ConfirmDialog from "./ConfirmDialog";

async function readResponse(response) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.error || "Não foi possível concluir a operação.");
    error.status = response.status;
    throw error;
  }

  return payload;
}

function formatDate(value) {
  if (!value) return "Ainda não acessou";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

export default function AdminAccountPanel({
  admin,
  initialAccounts = [],
  onAdminUpdated,
  onUnauthorized,
}) {
  const [email, setEmail] = useState(admin.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountBusy, setAccountBusy] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [accountSuccess, setAccountSuccess] = useState("");
  const [accounts, setAccounts] = useState(initialAccounts);
  const [accountsLoading, setAccountsLoading] = useState(
    admin.role === "owner" && initialAccounts.length === 0,
  );
  const [accountsError, setAccountsError] = useState("");
  const [accountsSuccess, setAccountsSuccess] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [managerPassword, setManagerPassword] = useState("");
  const [managerConfirm, setManagerConfirm] = useState("");
  const [managerBusy, setManagerBusy] = useState(false);
  const [managerError, setManagerError] = useState("");
  const [managerSuccess, setManagerSuccess] = useState("");
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivateBusy, setDeactivateBusy] = useState(false);

  useEffect(() => {
    setEmail(admin.email);
  }, [admin.email]);

  const loadAccounts = useCallback(async ({ signal, showLoading = true } = {}) => {
    if (admin.role !== "owner" || admin.mustChangePassword) return;

    if (showLoading) setAccountsLoading(true);
    setAccountsError("");

    try {
      const result = await readResponse(
        await fetch("/api/admin/accounts", { cache: "no-store", signal }),
      );

      if (!signal?.aborted) setAccounts(result.accounts || []);
    } catch (error) {
      if (signal?.aborted || error.name === "AbortError") return;
      if (error.status === 401) onUnauthorized(error);
      else setAccountsError(error.message);
    } finally {
      if (!signal?.aborted) setAccountsLoading(false);
    }
  }, [admin.mustChangePassword, admin.role, onUnauthorized]);

  useEffect(() => {
    if (admin.role !== "owner" || admin.mustChangePassword) return undefined;

    const controller = new AbortController();
    void loadAccounts({
      signal: controller.signal,
      showLoading: initialAccounts.length === 0,
    });

    return () => controller.abort();
  }, [admin.mustChangePassword, admin.role, initialAccounts.length, loadAccounts]);

  async function updateAccount(event) {
    event.preventDefault();
    setAccountError("");
    setAccountSuccess("");

    if (newPassword !== confirmPassword) {
      setAccountError("A confirmação da nova senha não confere.");
      return;
    }

    setAccountBusy(true);

    try {
      const result = await readResponse(
        await fetch("/api/admin/account", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, currentPassword, newPassword }),
        }),
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setAccountSuccess("Dados de acesso atualizados com segurança.");
      onAdminUpdated(result.admin);
      setAccounts((items) =>
        items.map((item) => (item.id === result.admin.id ? result.admin : item)),
      );
    } catch (error) {
      if (error.status === 401) onUnauthorized(error);
      else setAccountError(error.message);
    } finally {
      setAccountBusy(false);
    }
  }

  async function createManager(event) {
    event.preventDefault();
    setManagerError("");
    setManagerSuccess("");
    setAccountsSuccess("");

    if (managerPassword !== managerConfirm) {
      setManagerError("A confirmação da senha temporária não confere.");
      return;
    }

    setManagerBusy(true);

    try {
      const result = await readResponse(
        await fetch("/api/admin/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: managerEmail, password: managerPassword }),
        }),
      );

      setAccounts((items) => [
        ...items.filter((item) => item.id !== result.account.id),
        result.account,
      ]);
      setManagerEmail("");
      setManagerPassword("");
      setManagerConfirm("");
      setManagerSuccess("Gestor cadastrado. Ele deverá trocar a senha no primeiro acesso.");
    } catch (error) {
      if (error.status === 401) onUnauthorized(error);
      else setManagerError(error.message);
    } finally {
      setManagerBusy(false);
    }
  }

  async function deactivateManager() {
    if (!deactivateTarget) return;

    const target = deactivateTarget;
    setDeactivateBusy(true);
    setAccountsError("");
    setAccountsSuccess("");

    try {
      await readResponse(
        await fetch(`/api/admin/accounts/${encodeURIComponent(target.id)}`, {
          method: "DELETE",
        }),
      );

      setAccounts((items) => items.filter((item) => item.id !== target.id));
      setAccountsSuccess(`O acesso de ${target.email} foi desativado.`);
      setDeactivateTarget(null);
    } catch (error) {
      setDeactivateTarget(null);
      if (error.status === 401) onUnauthorized(error);
      else setAccountsError(error.message);
    } finally {
      setDeactivateBusy(false);
    }
  }

  const inputClass =
    "mt-1.5 w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-[#3a9e72] focus:ring-4 focus:ring-[#3a9e72]/10";

  return (
    <section aria-labelledby="account-title" className="space-y-5">
      <div>
        <h2 id="account-title" className="font-display text-xl font-black text-slate-950">
          Conta e acessos
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Atualize seu login e, se for proprietário, cadastre acessos individuais para gestores.
        </p>
      </div>

      {admin.mustChangePassword ? (
        <div role="alert" className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-950">
          <p className="font-black">Proteja o acesso inicial</p>
          <p className="mt-1 text-sm font-semibold leading-relaxed">
            Troque a senha temporária antes de continuar usando o painel. Você também pode substituir o e-mail padrão agora.
          </p>
        </div>
      ) : null}

      <form onSubmit={updateAccount} className="rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h3 className="font-display text-lg font-black text-slate-950">Meu login</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-extrabold uppercase tracking-wide text-slate-500 sm:col-span-2">
            E-mail de acesso
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" className={inputClass} />
          </label>
          <label className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
            Senha atual
            <input type="password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" className={inputClass} />
          </label>
          <label className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
            Nova senha {admin.mustChangePassword ? "(obrigatória)" : "(opcional)"}
            <input type="password" required={admin.mustChangePassword} minLength={12} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" className={inputClass} placeholder="Mínimo de 12 caracteres" />
          </label>
          <label className="text-xs font-extrabold uppercase tracking-wide text-slate-500 sm:col-start-2">
            Confirmar nova senha
            <input type="password" required={Boolean(newPassword)} minLength={12} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" className={inputClass} />
          </label>
        </div>
        {accountError ? <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">{accountError}</p> : null}
        {accountSuccess ? <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-800">{accountSuccess}</p> : null}
        <button type="submit" disabled={accountBusy} className="mt-4 w-full rounded-xl bg-[#3a9e72] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#2f855f] disabled:cursor-wait disabled:bg-slate-300 sm:w-auto">
          {accountBusy ? "Salvando…" : "Salvar meu login"}
        </button>
      </form>

      {admin.role === "owner" ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <form onSubmit={createManager} className="rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h3 className="font-display text-lg font-black text-slate-950">Cadastrar gestor</h3>
            <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">Crie uma conta individual. O gestor poderá cuidar das denúncias e serviços, mas não cadastrar outros gestores.</p>
            <div className="mt-4 space-y-4">
              <label className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">
                E-mail do gestor
                <input type="email" required value={managerEmail} onChange={(event) => setManagerEmail(event.target.value)} autoComplete="off" className={inputClass} />
              </label>
              <label className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">
                Senha temporária
                <input type="password" required minLength={12} value={managerPassword} onChange={(event) => setManagerPassword(event.target.value)} autoComplete="new-password" className={inputClass} placeholder="Mínimo de 12 caracteres" />
              </label>
              <label className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">
                Confirmar senha temporária
                <input type="password" required minLength={12} value={managerConfirm} onChange={(event) => setManagerConfirm(event.target.value)} autoComplete="new-password" className={inputClass} />
              </label>
            </div>
            {managerError ? <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">{managerError}</p> : null}
            {managerSuccess ? <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-800">{managerSuccess}</p> : null}
            <button type="submit" disabled={managerBusy} className="mt-4 w-full rounded-xl bg-[#1a2e23] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#294737] disabled:cursor-wait disabled:bg-slate-300">
              {managerBusy ? "Cadastrando…" : "Cadastrar gestor"}
            </button>
          </form>

          <section aria-labelledby="admins-title" className="rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h3 id="admins-title" className="font-display text-lg font-black text-slate-950">Acessos cadastrados</h3>
            {accountsSuccess ? (
              <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-800">
                {accountsSuccess}
              </p>
            ) : null}
            {accountsError ? (
              <div role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-900">
                <p>{accountsError}</p>
                <button
                  type="button"
                  onClick={() => void loadAccounts({ showLoading: accounts.length === 0 })}
                  className="mt-2 text-xs font-black text-amber-950 underline underline-offset-2"
                >
                  Tentar carregar novamente
                </button>
              </div>
            ) : null}
            {accountsLoading ? (
              <p className="mt-4 text-sm font-semibold text-slate-400">Carregando acessos…</p>
            ) : accounts.length ? (
              <ul className="mt-4 space-y-3">
                {accounts.map((account) => (
                  <li key={account.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 break-all text-sm font-extrabold text-slate-800">{account.email}</p>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase text-[#287a59] ring-1 ring-slate-200">{account.role === "owner" ? "Proprietário" : "Gestor"}</span>
                        {account.role === "manager" ? (
                          <button
                            type="button"
                            onClick={() => {
                              setAccountsError("");
                              setAccountsSuccess("");
                              setDeactivateTarget(account);
                            }}
                            className="rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-[11px] font-extrabold text-red-600 transition hover:border-red-300 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                            aria-label={`Desativar acesso de ${account.email}`}
                          >
                            Desativar
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] font-semibold text-slate-500">Último acesso: {formatDate(account.lastLoginAt)}</p>
                    {account.mustChangePassword ? <p className="mt-1 text-[11px] font-bold text-amber-700">Troca de senha pendente</p> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm font-semibold text-slate-400">Nenhum acesso cadastrado.</p>
            )}
          </section>
        </div>
      ) : (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm font-semibold text-brand-900">
          Novos gestores são cadastrados pelo proprietário da comunidade.
        </div>
      )}

      {deactivateTarget ? (
        <ConfirmDialog
          title="Desativar acesso?"
          description={`O gestor ${deactivateTarget.email} será desconectado e não poderá mais entrar. O histórico administrativo será preservado.`}
          confirmLabel="Desativar acesso"
          busyLabel="Desativando…"
          busy={deactivateBusy}
          onCancel={() => setDeactivateTarget(null)}
          onConfirm={deactivateManager}
        />
      ) : null}
    </section>
  );
}
