import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { state } from "../domain.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";

registerMainMenuItem({ label: "New chat", data: "conversation:new", order: 30 });
const composer = new Composer<Ctx>();
composer.callbackQuery("conversation:new", async (ctx) => {
  await ctx.answerCallbackQuery();
  state(ctx).conversation!.history = [];
  await ctx.editMessageText("Starting fresh. What would you like to explore?", { reply_markup: inlineKeyboard([[inlineButton("⬅️ Menu", "menu:main")]]) });
});

export default composer;
