import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { now } from "../clock.js";
import { resetFlow, safeText, state } from "../domain.js";
import { registerMainMenuItem } from "../toolkit/index.js";

registerMainMenuItem({ label: "⏰ Reminder", data: "reminder:create", order: 60 });
const composer = new Composer<Ctx>();

function parseTime(value: string): number | undefined {
  const input = value.trim();
  const clock = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})$/.exec(input);
  if (!clock) return undefined;
  const date = new Date(`${clock[1]}T${clock[2]}:${clock[3]}:00Z`);
  return Number.isNaN(date.getTime()) || date.getTime() <= now().getTime() ? undefined : date.getTime();
}

async function scheduleWorkerReminder(ctx: Ctx, at: number, text: string): Promise<boolean> {
  const env = (ctx as Ctx & { env?: { CHAT_DO?: { get(id: unknown): { fetch(url: string, init: RequestInit): Promise<Response> }; idFromName(name: string): unknown } } }).env;
  if (!env?.CHAT_DO || !ctx.chat) return true;
  try {
    const stub = env.CHAT_DO.get(env.CHAT_DO.idFromName(`chat:${ctx.chat.id}`));
    await stub.fetch("https://do/remind", { method: "POST", body: JSON.stringify({ at, chatId: ctx.chat.id, text: `Reminder: ${text}` }) });
    return true;
  } catch { return false; }
}

composer.callbackQuery("reminder:create", async (ctx) => {
  await ctx.answerCallbackQuery();
  const s = state(ctx); s.step = "reminder_content"; s.draft = {};
  await ctx.reply("What should I remind you about?");
});

composer.on("message:text", async (ctx, next) => {
  const s = state(ctx);
  if (!s.step?.startsWith("reminder_")) return next();
  if (s.step === "reminder_content") {
    const content = safeText(ctx.message.text, 500);
    if (!content) { await ctx.reply("Send a reminder between 1 and 500 characters."); return; }
    s.draft = { content }; s.step = "reminder_time";
    await ctx.reply("When should I send it? Use UTC time like 2026-08-01 14:30.");
    return;
  }
  if (s.step === "reminder_time") {
    if (!parseTime(ctx.message.text)) { await ctx.reply("I couldn’t read that time. Use UTC time like 2026-08-01 14:30."); return; }
    s.draft = { ...s.draft, time: ctx.message.text.trim() }; s.step = "reminder_timezone";
    await ctx.reply("Which timezone should I use? Send an IANA name like Europe/London, or tap nothing and send UTC.");
    return;
  }
  const timezone = safeText(ctx.message.text, 80);
  if (!timezone || (timezone !== "UTC" && !Intl.supportedValuesOf("timeZone").includes(timezone))) { await ctx.reply("I couldn’t find that timezone. Try one like Europe/London or UTC."); return; }
  const when = s.draft?.time ?? "";
  const at = parseTime(when)!;
  const content = s.draft?.content!;
  if (!(await scheduleWorkerReminder(ctx, at, content))) { await ctx.reply("I couldn’t schedule that reminder just now. Please try again."); return; }
  s.reminders!.push({ id: `reminder-${at}-${s.reminders!.length + 1}`, content, scheduledAt: at, timezone });
  resetFlow(ctx);
  await ctx.reply(`All set — I’ll remind you about “${content}” at ${when} ${timezone}.`);
});

export default composer;
