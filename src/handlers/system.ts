import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { resetFlow, safeText, state } from "../domain.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";

registerMainMenuItem({ label: "Instructions", data: "system:show", order: 50 });
const composer = new Composer<Ctx>();
const controls = inlineKeyboard([[inlineButton("Change", "system:set"), inlineButton("Reset", "system:reset")], [inlineButton("⬅️ Menu", "menu:main")]]);

composer.callbackQuery("system:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(`My current instructions are:\n\n${state(ctx).conversation!.systemPrompt}`, { reply_markup: controls });
});
composer.callbackQuery("system:set", async (ctx) => {
  await ctx.answerCallbackQuery();
  state(ctx).step = "system_prompt";
  await ctx.reply("Send the instructions you’d like me to follow.");
});
composer.callbackQuery("system:reset", async (ctx) => {
  await ctx.answerCallbackQuery();
  state(ctx).conversation!.systemPrompt = "Be helpful, accurate, and concise.";
  await ctx.editMessageText("I reset my instructions to the default.", { reply_markup: controls });
});
composer.on("message:text", async (ctx, next) => {
  const s = state(ctx);
  if (s.step !== "system_prompt") return next();
  const prompt = safeText(ctx.message.text, 800);
  if (!prompt) { await ctx.reply("Send instructions between 1 and 800 characters."); return; }
  s.conversation!.systemPrompt = prompt;
  resetFlow(ctx);
  await ctx.reply("Got it — I’ll use those instructions in this chat.");
});

export default composer;
