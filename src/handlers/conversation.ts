import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { rememberTurn, state } from "../domain.js";
import { confirmKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();
const risky = /\b(delete|transfer|purchase|pay|send money|password|private key|medical dosage)\b/i;

interface SearchReply { AbstractText?: string; AbstractURL?: string; Heading?: string; RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>; }

async function search(query: string): Promise<{ summary: string; sources: Array<{ name: string; url: string }> }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1500);
  try {
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`, { signal: controller.signal });
    if (!response.ok) return { summary: "", sources: [] };
    const data = await response.json() as SearchReply;
    const sources: Array<{ name: string; url: string }> = [];
    if (data.AbstractURL) sources.push({ name: data.Heading || "DuckDuckGo result", url: data.AbstractURL });
    for (const topic of data.RelatedTopics ?? []) if (topic.FirstURL && sources.length < 3) sources.push({ name: topic.Text?.slice(0, 80) || "Related result", url: topic.FirstURL });
    return { summary: data.AbstractText ?? "", sources };
  } catch { return { summary: "", sources: [] }; } finally { clearTimeout(timer); }
}

async function answer(ctx: Ctx, question: string): Promise<void> {
  const s = state(ctx); rememberTurn(ctx, "user", question);
  const result = await search(question);
  if (!result.sources.length) {
    const text = "I couldn’t find a useful web result for that. Try adding a little more detail.";
    rememberTurn(ctx, "assistant", text); await ctx.reply(text); return;
  }
  const intro = result.summary || "Here’s what I found:";
  const text = `${intro}\n\nSources:\n${result.sources.map((source, i) => `${i + 1}. ${source.name} — ${source.url}`).join("\n")}`;
  rememberTurn(ctx, "assistant", text); await ctx.reply(text);
}

composer.callbackQuery("risk:approve", async (ctx) => {
  await ctx.answerCallbackQuery();
  const request = state(ctx).riskyRequest;
  state(ctx).riskyRequest = undefined;
  if (!request) { await ctx.reply("There’s no pending action to approve."); return; }
  await ctx.editMessageText("Thanks — I’ll answer that request now.");
  await answer(ctx, request);
});
composer.callbackQuery("risk:deny", async (ctx) => {
  await ctx.answerCallbackQuery(); state(ctx).riskyRequest = undefined;
  await ctx.editMessageText("Okay — I won’t act on that request.");
});
composer.on("message:text", async (ctx, next) => {
  const text = ctx.message.text.trim();
  if (!text || text.startsWith("/")) return next();
  if (state(ctx).step !== "idle") return next();
  // A lone opaque token is more likely a typo than a question; let the friendly
  // global fallback suggest help instead of sending a meaningless web search.
  if (!/[?]/.test(text) && text.split(/\s+/).length === 1) return next();
  if (risky.test(text)) {
    state(ctx).riskyRequest = text;
    await ctx.reply("This could have a real-world impact. Do you want me to continue?", { reply_markup: confirmKeyboard("risk", { yes: "Continue", no: "Cancel" }) });
    return;
  }
  await answer(ctx, text);
});
export default composer;
