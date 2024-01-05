const fs = require("fs");
const axios = require("axios");
const HTMLParser = require("html-to-json-parser");
const { NodeHtmlMarkdown } = require("node-html-markdown");
import {
  findId,
  createClassFeature,
  createClassAction,
  getTextFromIndex,
  getHitDice,
  getSkillCount,
  getFeatures,
} from "../utils";

const nhm = new NodeHtmlMarkdown(
  /* options (optional) */ {},
  /* customTransformers (optional) */ undefined,
  /* customCodeBlockTranslators (optional) */ undefined
);
export default async function main() {
  const response = await axios.get("http://spheres5e.wikidot.com/conscript");
  const body: string = response.data.match(/<body[\w\W]+<\/body>/)[0];
  const sanitized = body.replace(/&\w+?;/g, "");
  const result = await HTMLParser.default(sanitized);
  const pageContent = findId(result, "page-content");
  if (pageContent && pageContent.content) {
    const talentIds = getFeatures(pageContent, [
      "martial training",
      "-",
      "—",
      "ability score improvement",
      "combat specialization feature",
    ]);
    talentIds[0].push("MARTIAL_FOCUS");

    fs.writeFileSync(
      "characterClasses/conscript.json",
      JSON.stringify({
        id: "CONSCRIPT",
        name: "conscript",
        text: await getTextFromIndex(pageContent.content, 3),
        hitDice: getHitDice(sanitized),
        skillCount: getSkillCount(sanitized),
        talentRate: 1,
        spellPoints: 0,
        talentIds,
      })
    );

    const [secondWindTalent, secondWind] = await createClassAction(
      pageContent.content,
      "second wind"
    );
    const [combatSpecializationTalent, combatSpecialization] =
      await createClassFeature(pageContent.content, "combat specialization");
    const [martialFlexibilityTalent, martialFlexibility] =
      await createClassAction(pageContent.content, "martial flexibility");
    const [masterOfCombatTalent, masterOfCombat] = await createClassFeature(
      pageContent.content,
      "master of combat"
    );
    fs.writeFileSync(
      "actions/conscript.json",
      JSON.stringify({
        [secondWind.id]: secondWind,
        [martialFlexibility.id]: martialFlexibility,
      })
    );
    fs.writeFileSync(
      "features/conscript.json",
      JSON.stringify({
        [combatSpecialization.id]: combatSpecialization,
        [masterOfCombat.id]: masterOfCombat,
      })
    );
    fs.writeFileSync(
      "talents/conscript.json",
      JSON.stringify({
        [secondWindTalent.id]: secondWindTalent,
        [combatSpecializationTalent.id]: combatSpecializationTalent,
        [martialFlexibilityTalent.id]: martialFlexibilityTalent,
        [masterOfCombatTalent.id]: masterOfCombatTalent,
      })
    );
  }
}
