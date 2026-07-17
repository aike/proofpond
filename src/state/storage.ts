/**
 * 進捗の永続化。localStorage への読み書きはこのモジュールに隔離する
 * (将来サーバ同期にする場合はここだけ差し替えればよい)。
 */

export interface ProblemProgress {
  /** 確認済みとしてチェックした知識ID */
  checkedKnowledgeIds: string[];
  /** 達成済み中間ゴールID(達成順) */
  completedSubgoalIds: string[];
  /** ヒント開示状況: subgoalId または "overall" → 開示済み最大レベル */
  revealedHints: Record<string, number>;
  /** 模範解答を開示した中間ゴールID */
  revealedSolutionIds: string[];
  /** 全中間ゴール達成時刻(ISO 8601) */
  completedAt?: string;
}

export interface AppState {
  version: 1;
  problems: Record<string, ProblemProgress>;
}

const KEY = "proofpond:v1";
const LOG_KEY = "proofpond:v1:log";
const LOG_LIMIT = 1000;

export const EMPTY_PROGRESS: ProblemProgress = {
  checkedKnowledgeIds: [],
  completedSubgoalIds: [],
  revealedHints: {},
  revealedSolutionIds: [],
};

export function initialState(): AppState {
  return { version: 1, problems: {} };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      // version 不一致・構造破損時は安全に初期化する
      if (parsed && parsed.version === 1 && typeof parsed.problems === "object") {
        // 旧データ(模範解答機能追加前)には revealedSolutionIds が無いので補完する
        for (const p of Object.values(parsed.problems)) {
          p.revealedSolutionIds ??= [];
        }
        return parsed;
      }
    }
  } catch {
    // 破損データは捨てて初期化
  }
  return initialState();
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // 容量超過・プライベートモード等では永続化を諦める(アプリは動き続ける)
  }
}

/**
 * アクションログ。将来の学習履歴分析・苦手分野推定(仕様8章)の素材として、
 * 「いつ・どのヒントを開いたか」等を時系列で蓄積しておく。
 */
export function appendActionLog(action: unknown): void {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    const log: unknown[] = raw ? (JSON.parse(raw) as unknown[]) : [];
    log.push({ at: new Date().toISOString(), action });
    localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(-LOG_LIMIT)));
  } catch {
    // ログは失われてもアプリ動作に影響しない
  }
}
