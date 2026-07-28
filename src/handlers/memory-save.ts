import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { now } from "../clock.js";
import { resetFlow, safeText, state } from "../domain.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";

registerMainMenuItem({ label: "🧠 Remember", data: "memory:save", order: 10 });
const composer = new Composer<Ctx>();

composer.callbackQuery("memory:save", async (ctx) => {
  await ctx.answerCallbackQuery();
  const s = state(ctx);
  s.step = "memory_content";
  s.draft = {};
  await ctx.reply("What would you like me to remember? Send one short note.");
});

composer.callbackQuery(["memory:private", "memory:shared"], async (ctx) => {
  await ctx.answerCallbackQuery();
  const s = state(ctx);
  if (s.step !== "memory_privacy" || !s.draft?.content) {
    await ctx.reply("That memory step has expired. Tap Remember and try again.");
    return;
  }
  const privacy = ctx.callbackQuery.data === "memory:shared" ? "shared" : "private";
  s.memories!.push({ id: `memory-${now().getTime()}-${s.memories!.length + 1}`, content: s.draft.content, privacy, type: "note", timestamp: now().toISOString() });
  resetFlow(ctx);
  await ctx.editMessageText(`Got it — I saved that as a ${privacy} memory.`);
});

composer.on("message:text", async (ctx, next) => {
  const s = state(ctx);
  if (s.step !== "memory_content") return next();
  const content = safeText(ctx.message.text);
  if (!content) {
    await ctx.reply("Send a note between 1 and 800 characters so I can save it.");
    return;
  }
  s.draft = { content };
  s.step = "memory_privacy";
  await ctx.reply("Who can see it?", { reply_markup: inlineKeyboard([[inlineButton("Private", "memory:private"), inlineButton("Shared", "memory:shared")]]) });
});

export default composer;
