import type { Ctx } from "./bot.js";

export type Privacy = "private" | "shared";
export type Model = "Boop Balanced" | "Boop Focused";

export interface MemoryItem {
  id: string;
  content: string;
  privacy: Privacy;
  type: "note";
  timestamp: string;
}

export interface ReminderItem {
  id: string;
  content: string;
  scheduledAt: number;
  timezone: string;
  memoryId?: string;
}

interface Turn { role: "user" | "assistant"; text: string; }

export interface BoopState {
  step?: "memory_content" | "memory_privacy" | "reminder_content" | "reminder_time" | "reminder_timezone" | "system_prompt" | "idle";
  draft?: { content?: string; time?: string };
  user?: { telegramId: number; locale: string };
  conversation?: { history: Turn[]; model: Model; systemPrompt: string };
  memories?: MemoryItem[];
  reminders?: ReminderItem[];
  riskyRequest?: string;
}

export type BoopCtx = Ctx & { session: BoopState };

export function state(ctx: Ctx): BoopState {
  const result = ctx.session as BoopState;
  result.user ??= { telegramId: ctx.from?.id ?? 0, locale: ctx.from?.language_code ?? "en" };
  result.conversation ??= { history: [], model: "Boop Balanced", systemPrompt: "Be helpful, accurate, and concise." };
  result.memories ??= [];
  result.reminders ??= [];
  result.step ??= "idle";
  return result;
}

export function resetFlow(ctx: Ctx): void {
  const s = state(ctx);
  s.step = "idle";
  s.draft = undefined;
}

export function rememberTurn(ctx: Ctx, role: Turn["role"], text: string): void {
  const history = state(ctx).conversation!.history;
  history.push({ role, text });
  if (history.length > 12) history.splice(0, history.length - 12);
}

export function safeText(text: string, maximum = 800): string | undefined {
  const trimmed = text.trim();
  return trimmed.length > 0 && trimmed.length <= maximum ? trimmed : undefined;
}
