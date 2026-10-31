import {
  accountTypeLabels,
  formatCount,
  unavailableReasonLabels,
  verificationSourceLabels,
} from "@/lib/instagram/labels";
import type { InstagramSnapshotView } from "@/lib/instagram/view-data";
import styles from "./metric-verification.module.css";

// Métricas consultadas pela API, com a origem sempre visível. Métrica que a
// API não entregou aparece como indisponível, com o motivo, nunca como número.

function Metric({
  label,
  value,
  reason,
  declared,
}: {
  label: string;
  value: number | null;
  reason?: string;
  declared?: number | null;
}) {
  const formatted = formatCount(value);
  return (
    <div>
      <dt>{label}</dt>
      {formatted ? (
        <dd>
          <strong>{formatted}</strong>
        </dd>
      ) : (
        <dd className={styles.unavailable}>
          Indisponível
          <small>{unavailableReasonLabels[reason ?? "no_data"] ?? unavailableReasonLabels.no_data}</small>
        </dd>
      )}
      {typeof declared === "number" && (
        <dd className={styles.declared}>
          {verificationSourceLabels.manual}: {declared.toLocaleString("pt-BR")}
        </dd>
      )}
    </div>
  );
}

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

const dateTime = (value: string) =>
  new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export function InstagramMetricsSummary({
  snapshot,
  accountType,
  declaredHandle,
  declaredFollowers,
}: {
  snapshot: InstagramSnapshotView;
  accountType: string | null;
  declaredHandle?: string | null;
  declaredFollowers?: number | null;
}) {
  const handleMismatch =
    declaredHandle &&
    declaredHandle.replace(/^@/, "").toLowerCase() !== snapshot.username.toLowerCase();
  const storiesReason = snapshot.unavailable.stories;

  return (
    <div className={styles.summary}>
      <p className={styles.source}>
        <span className={styles.apiBadge}>{verificationSourceLabels.api}</span>
        <span>
          @{snapshot.username}
          {accountType ? ` · ${accountTypeLabels[accountType.toUpperCase()] ?? accountType}` : ""}
          {" · "}consultado em {dateTime(snapshot.fetchedAt)}
        </span>
      </p>
      {handleMismatch && (
        <p className={styles.warning} role="note">
          A conta conectada (@{snapshot.username}) é diferente da informada no
          cadastro (@{declaredHandle?.replace(/^@/, "")}).
        </p>
      )}
      <dl className={styles.metrics}>
        <Metric
          label="Seguidores"
          value={snapshot.followersCount}
          reason={snapshot.unavailable.followers_count}
          declared={declaredFollowers}
        />
        <Metric
          label="Visualizações (28 dias)"
          value={snapshot.accountViews}
          reason={snapshot.unavailable.account_views}
        />
        <Metric
          label="Contas alcançadas (28 dias)"
          value={snapshot.accountReach}
          reason={snapshot.unavailable.account_reach}
        />
      </dl>

      <h4 className={styles.subheading}>Stories ativos no momento da consulta</h4>
      {storiesReason ? (
        <p className={styles.unavailable}>
          Indisponível. {unavailableReasonLabels[storiesReason] ?? unavailableReasonLabels.error}
        </p>
      ) : snapshot.stories.length === 0 ? (
        <p className={styles.hint}>
          Nenhum Story ativo. O Instagram só informa as métricas de um Story
          nas 24 horas em que ele fica no ar.
        </p>
      ) : (
        <ul className={styles.stories}>
          {snapshot.stories.map((story) => (
            <li key={story.mediaId}>
              <span>
                {story.postedAt ? dateTime(story.postedAt) : "Data não informada"}
                {story.permalink && (
                  <>
                    {" · "}
                    <a href={story.permalink} target="_blank" rel="noopener noreferrer">
                      Abrir
                    </a>
                  </>
                )}
              </span>
              {(["views", "reach"] as const).map((metric) => (
                <span key={metric}>
                  {metric === "views" ? "Visualizações" : "Contas alcançadas"}:{" "}
                  {formatCount(story[metric]) ?? (
                    <span className={styles.unavailable}>
                      indisponível ({lowerFirst(
                        unavailableReasonLabels[story.unavailable[metric] ?? "no_data"] ??
                          unavailableReasonLabels.no_data,
                      )})
                    </span>
                  )}
                </span>
              ))}
            </li>
          ))}
        </ul>
      )}
      <p className={styles.hint}>
        Segundo a Meta, os números podem ter até 48 horas de atraso.
      </p>
    </div>
  );
}
