import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { state } from "../domain.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";

registerMainMenuItem({ label: "Model", data: "model:show", order: 40 });
const composer = new Composer<Ctx>();
const modelKeyboard = inlineKeyboard([[inlineButton("Balanced", "model:set:balanced"), inlineButton("Focused", "model:set:focused")], [inlineButton("⬅️ Menu", "menu:main")]]);

composer.callbackQuery("model:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(`You’re using ${state(ctx).conversation!.model}. Pick a style any time.`, { reply_markup: modelKeyboard });
});

composer.callbackQuery(/^model:set:(balanced|focused)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const model = ctx.match[1] === "focused" ? "Boop Focused" : "Boop Balanced";
  state(ctx).conversation!.model = model;
  await ctx.editMessageText(`You’re now using ${model}.`, { reply_markup: modelKeyboard });
});

export default composer;
