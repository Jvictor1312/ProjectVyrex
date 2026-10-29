"use client";

import { useActionState, useEffect, useState } from "react";
import {
  assignCreatorResponsiblesAction,
  forwardCreatorAction,
  recordContactEventAction,
  recordFinalDecisionAction,
  requestCorrectionsAction,
  reviewSocialAccountAction,
  reviewStoryEvidenceAction,
  sendCreatorMessageAction,
} from "@/app/actions/internal";
import type { FormState } from "@/lib/validation/auth";
import styles from "@/app/interno/internal-detail.module.css";

const emptyState: FormState = { message: "", success: false };

function Feedback({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <p
      className={state.success ? "form-message success" : "form-message error"}
      role="status"
      aria-live="polite"
    >
      {state.message}
    </p>
  );
}

function Submit({
  pending,
  children,
}: {
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <button className="button button-dark" type="submit" disabled={pending}>
      {pending ? "Salvando..." : children}
    </button>
  );
}

// O bloco continua na tela depois do encaminhamento (a situação muda e o
// botão some), para a confirmação aparecer em vez de o bloco sumir.
export function RecruiterControls({
  creatorId,
  canForward,
}: {
  creatorId: string;
  canForward: boolean;
}) {
  const [noteState, noteAction, notePending] = useActionState(
    recordContactEventAction,
    emptyState,
  );
  const [forwardState, forwardAction, forwardPending] = useActionState(
    forwardCreatorAction,
    emptyState,
  );

  return (
    <section className={styles.actionSection}>
      <h2>Triagem</h2>
      <form action={noteAction} className="internal-action-form">
        <input type="hidden" name="targetCreator" value={creatorId} />
        <input type="hidden" name="channel" value="other" />
        <label className="field">
          <span>Observação interna</span>
          <textarea name="summary" rows={3} maxLength={3000} required />
        </label>
        <Feedback state={noteState} />
        <Submit pending={notePending}>Registrar observação</Submit>
      </form>
      <form action={forwardAction} className="internal-inline-form">
        <input type="hidden" name="targetCreator" value={creatorId} />
        <Feedback state={forwardState} />
        {canForward ? (
          <Submit pending={forwardPending}>Encaminhar para validação</Submit>
        ) : (
          !forwardState.success && (
            <p className="field-hint">
              O encaminhamento para validação fica disponível enquanto o
              cadastro aguarda análise.
            </p>
          )
        )}
      </form>
    </section>
  );
}

export function RelationshipControls({ creatorId }: { creatorId: string }) {
  const [contactState, contactAction, contactPending] = useActionState(
    recordContactEventAction,
    emptyState,
  );
  const [messageState, messageAction, messagePending] = useActionState(
    sendCreatorMessageAction,
    emptyState,
  );
  const [correctionState, correctionAction, correctionPending] = useActionState(
    requestCorrectionsAction,
    emptyState,
  );

  return (
    <section className={styles.actionSection}>
      <h2>Relacionamento</h2>
      <form action={contactAction} className="internal-action-form">
        <input type="hidden" name="targetCreator" value={creatorId} />
        <label className="field">
          <span>Canal do contato</span>
          <select name="channel" defaultValue="platform">
            <option value="platform">Plataforma</option>
            <option value="email">E-mail</option>
            <option value="phone">Telefone</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="other">Outro</option>
          </select>
        </label>
        <label className="field">
          <span>Resumo do contato</span>
          <textarea name="summary" rows={3} maxLength={3000} required />
        </label>
        <label className="check-field">
          <input type="checkbox" name="visibleToCreator" />
          <span>Compartilhar este registro com o criador</span>
        </label>
        <Feedback state={contactState} />
        <Submit pending={contactPending}>Registrar contato</Submit>
      </form>
      <form action={messageAction} className="internal-action-form">
        <input type="hidden" name="targetCreator" value={creatorId} />
        <label className="field">
          <span>Mensagem ao criador</span>
          <textarea name="body" rows={3} maxLength={3000} required />
        </label>
        <Feedback state={messageState} />
        <Submit pending={messagePending}>Enviar mensagem</Submit>
      </form>
      <form
        action={correctionAction}
        className={`internal-action-form critical-action ${styles.criticalAction}`}
      >
        <input type="hidden" name="targetCreator" value={creatorId} />
        <label className="field">
          <span>O que precisa ser corrigido?</span>
          <textarea name="reason" rows={3} maxLength={2000} required />
        </label>
        <Feedback state={correctionState} />
        <Submit pending={correctionPending}>Solicitar correção</Submit>
      </form>
    </section>
  );
}

export function EvidenceReviewForm({ evidenceId }: { evidenceId: string }) {
  const [state, action, pending] = useActionState(
    reviewStoryEvidenceAction,
    emptyState,
  );
  return (
    <form
      action={action}
      className={`internal-review-form ${styles.reviewForm}`}
    >
      <input type="hidden" name="evidenceId" value={evidenceId} />
      <select
        name="decision"
        defaultValue="approved"
        aria-label="Resultado da evidência"
      >
        <option value="approved">Aprovar evidência</option>
        <option value="rejected">Rejeitar evidência</option>
        <option value="changes_requested">Solicitar correção</option>
      </select>
      <input
        name="reason"
        maxLength={2000}
        placeholder="Motivo se não aprovada"
        aria-label="Motivo da análise"
      />
      <Feedback state={state} />
      <Submit pending={pending}>Registrar análise</Submit>
    </form>
  );
}

export function SocialAccountReviewForm({ accountId }: { accountId: string }) {
  const [state, action, pending] = useActionState(
    reviewSocialAccountAction,
    emptyState,
  );
  return (
    <form
      action={action}
      className={`internal-review-form ${styles.reviewForm}`}
    >
      <input type="hidden" name="accountId" value={accountId} />
      <select
        name="decision"
        defaultValue="verified"
        aria-label="Resultado da rede social"
      >
        <option value="verified">Verificar perfil</option>
        <option value="rejected">Rejeitar perfil</option>
      </select>
      <input
        name="reason"
        maxLength={2000}
        placeholder="Motivo se rejeitado"
        aria-label="Motivo da verificação"
      />
      <Feedback state={state} />
      <Submit pending={pending}>Registrar resultado</Submit>
    </form>
  );
}

const decisionConfirmations: Record<string, string> = {
  approved: "Aprovar este cadastro como elegível?",
  rejected: "Rejeitar este cadastro? A justificativa vai para o criador.",
  changes_requested: "Pedir correções? O motivo vai para o criador.",
};

// Continua na tela depois da decisão (a situação muda e o formulário fecha),
// para a confirmação aparecer em vez de a seção sumir.
export function FinalDecisionForm({
  creatorId,
  open,
}: {
  creatorId: string;
  open: boolean;
}) {
  const [state, action, pending] = useActionState(
    recordFinalDecisionAction,
    emptyState,
  );
  // Confirmação dentro da página (a janela do navegador trava a tela).
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    if (state.message) setConfirming(null);
  }, [state]);

  if (!open) {
    return state.message ? (
      <Feedback state={state} />
    ) : (
      <p className="field-hint">
        A decisão final fica disponível quando o cadastro está aguardando
        análise, em análise ou com correção solicitada.
      </p>
    );
  }

  return (
    <form
      action={action}
      className={`internal-action-form ${styles.actionForm} ${styles.criticalAction}`}
    >
      <input type="hidden" name="targetCreator" value={creatorId} />
      <label className="field">
        <span>Decisão final</span>
        <select
          name="decision"
          defaultValue="approved"
          onChange={() => setConfirming(null)}
        >
          <option value="approved">Aprovar cadastro elegível</option>
          <option value="rejected">Rejeitar cadastro</option>
          <option value="changes_requested">Solicitar correções</option>
        </select>
      </label>
      <label className="field">
        <span>Justificativa</span>
        <textarea name="reason" rows={3} maxLength={2000} required />
      </label>
      <Feedback state={state} />
      {confirming ? (
        <div className={styles.confirmBox} role="alertdialog" aria-live="polite">
          <p>{decisionConfirmations[confirming]}</p>
          <div>
            <button
              className="button button-dark"
              type="submit"
              disabled={pending}
            >
              {pending ? "Salvando..." : "Confirmar"}
            </button>
            <button
              className="quiet-button"
              type="button"
              disabled={pending}
              onClick={() => setConfirming(null)}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          className="button button-dark"
          type="button"
          onClick={(event) => {
            const form = event.currentTarget.form;
            if (!form?.reportValidity()) return;
            setConfirming(String(new FormData(form).get("decision")));
          }}
        >
          Registrar decisão
        </button>
      )}
    </form>
  );
}

export function AssignmentForm({
  creatorId,
  recruiters,
  managers,
  currentRecruiter,
  currentManager,
}: {
  creatorId: string;
  recruiters: { id: string; name: string }[];
  managers: { id: string; name: string }[];
  currentRecruiter: string;
  currentManager: string;
}) {
  const [state, action, pending] = useActionState(
    assignCreatorResponsiblesAction,
    emptyState,
  );
  return (
    <form
      action={action}
      className={`internal-action-form ${styles.actionForm}`}
    >
      <input type="hidden" name="targetCreator" value={creatorId} />
      <label className="field">
        <span>Recrutador</span>
        <select name="recruiterId" defaultValue={currentRecruiter}>
          <option value="">Sem atribuição</option>
          {recruiters.map((person) => (
            <option value={person.id} key={person.id}>
              {person.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Gestor de relacionamento</span>
        <select name="relationshipManagerId" defaultValue={currentManager}>
          <option value="">Sem atribuição</option>
          {managers.map((person) => (
            <option value={person.id} key={person.id}>
              {person.name}
            </option>
          ))}
        </select>
      </label>
      <Feedback state={state} />
      <Submit pending={pending}>Salvar responsáveis</Submit>
    </form>
  );
}
