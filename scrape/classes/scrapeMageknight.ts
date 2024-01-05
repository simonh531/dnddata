const fs = require("fs");
const axios = require("axios");
const HTMLParser = require("html-to-json-parser");
const { NodeHtmlMarkdown } = require("node-html-markdown");
import {
  findId,
  createClassFeature,
  getTextFromIndex,
  getHitDice,
  getSkillCount,
  getFeatures,
  featureArrayToObject,
  createClassBonusAction,
  createClassAction,
} from "../utils";

const nhm = new NodeHtmlMarkdown(
  /* options (optional) */ {},
  /* customTransformers (optional) */ undefined,
  /* customCodeBlockTranslators (optional) */ undefined
);

export default async function main() {
  const response = await axios.get("http://spheres5e.wikidot.com/mageknight");
  const body = response.data.match(/<body[\w\W]+<\/body>/)[0];
  const sanitized = body.replace(/&\w+?;/g, "");
  const result = await HTMLParser.default(sanitized);
  const pageContent = findId(result, "page-content");
  if (pageContent && pageContent.content) {
    const talentIds = getFeatures(pageContent, [
      "-",
      "—",
      "spherecasting",
      "blended training",
      "path talent",
      "ability score improvement",
      "mageknight path feature",
    ]);

    talentIds[0].push("SPELL_POOL");

    fs.writeFileSync(
      "characterClasses/mageknight.json",
      JSON.stringify({
        id: "MAGEKNIGHT",
        name: "mageknight",
        text: await getTextFromIndex(pageContent.content, 3),
        hitDice: getHitDice(sanitized),
        skillCount: getSkillCount(sanitized),
        talentRate: 0.75,
        spellPoints: 0.5,
        talentIds,
      })
    );

    const [fightingStyleTalent, fightingStyle] = await createClassFeature(
      pageContent.content,
      "fighting style"
    );

    const [spellCombatTalent, spellCombat] = await createClassBonusAction(
      pageContent.content,
      "spell combat"
    );

    const [mageknightPathTalent, mageknightPath] = await createClassFeature(
      pageContent.content,
      "mageknight path"
    );

    const [stalwartTalent, stalwart] = await createClassFeature(
      pageContent.content,
      "stalwart"
    );

    const [spellCriticalTalent, spellCritical] = await createClassBonusAction(
      pageContent.content,
      "spell critical"
    );

    fs.writeFileSync(
      "actions/mageknight.json",
      JSON.stringify({
        [spellCombat.id]: spellCombat,
        [spellCritical.id]: spellCritical,
      })
    );
    fs.writeFileSync(
      "features/mageknight.json",
      JSON.stringify({
        [fightingStyle.id]: fightingStyle,
        [mageknightPath.id]: mageknightPath,
        [stalwart.id]: stalwart,
      })
    );
    fs.writeFileSync(
      "talents/mageknight.json",
      JSON.stringify({
        [fightingStyleTalent.id]: fightingStyleTalent,
        [spellCombatTalent.id]: spellCombatTalent,
        [mageknightPathTalent.id]: mageknightPathTalent,
        [stalwartTalent.id]: stalwartTalent,
        [spellCriticalTalent.id]: spellCriticalTalent,
      })
    );
  }
}
