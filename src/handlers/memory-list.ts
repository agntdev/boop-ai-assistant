import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { state } from "../domain.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";

registerMainMenuItem({ label: "📚 Memories", data: "memory:list", order: 20 });
const composer = new Composer<Ctx>();

function keyboard() { return inlineKeyboard([[inlineButton("Private", "memory:list:private"), inlineButton("Shared", "memory:list:shared")], [inlineButton("⬅️ Menu", "menu:main")]]); }
function text(ctx: Ctx, privacy?: "private" | "shared") {
  const items = state(ctx).memories!.filter((item) => !privacy || item.privacy === privacy);
  if (!items.length) return privacy ? `No ${privacy} memories yet — tap Remember to add one.` : "No memories yet — tap Remember to add one.";
  return `${privacy ? `${privacy[0].toUpperCase()}${privacy.slice(1)} ` : ""}memories:\n\n${items.map((item, index) => `${index + 1}. ${item.content}`).join("\n")}`;
}

composer.callbackQuery("memory:list", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(text(ctx), { reply_markup: keyboard() });
});

composer.callbackQuery(/^memory:list:(private|shared)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const privacy = ctx.match[1] as "private" | "shared";
  await ctx.editMessageText(text(ctx, privacy), { reply_markup: keyboard() });
});

export default composer;
