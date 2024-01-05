const fs = require("fs");
const axios = require("axios");
const HTMLParser = require("html-to-json-parser");
const { NodeHtmlMarkdown } = require("node-html-markdown");
import {
  toID,
  findId,
  findType,
  createClassFeature,
  featureArrayToObject,
  getFeatures,
  getTextFromIndex,
  getHitDice,
  getSkillCount,
  createClassAction,
} from "../utils";

const nhm = new NodeHtmlMarkdown(
  /* options (optional) */ {},
  /* customTransformers (optional) */ undefined,
  /* customCodeBlockTranslators (optional) */ undefined
);

export default async function main() {
  const response = await axios.get("http://spheres5e.wikidot.com/incanter");
  const body = response.data.match(/<body[\w\W]+<\/body>/)[0];
  const sanitized = body.replace(/&\w+?;/g, "");
  const result = await HTMLParser.default(sanitized);
  const pageContent = findId(result, "page-content");
  if (pageContent && pageContent.content) {
    const talentIds = getFeatures(pageContent, [
      "spherecasting",
      "-",
      "—",
      "ability score improvement",
      "magic specialization feature",
    ]);
    talentIds[0].push("SPELL_POOL");

    fs.writeFileSync(
      "characterClasses/incanter.json",
      JSON.stringify({
        id: "INCANTER",
        name: "incanter",
        text: await getTextFromIndex(pageContent.content, 3),
        hitDice: getHitDice(sanitized),
        skillCount: getSkillCount(sanitized),
        talentRate: 1,
        spellPoints: 1,
        talentIds,
      })
    );

    const [magicalPotencyTalent, magicalPotency] = await createClassFeature(
      pageContent.content,
      "magical potency"
    );
    const [magicSpecializationTalent, magicSpecialization] =
      await createClassFeature(pageContent.content, "magic specialization");
    const [arcaneProtectionTalent, arcaneProtection] = await createClassFeature(
      pageContent.content,
      "arcane protection"
    );
    const [magicalFlexibilityTalent, magicalFlexibility] =
      await createClassAction(pageContent.content, "magical flexibility");
    const [masterOfmagicTalent, masterOfmagic] = await createClassFeature(
      pageContent.content,
      "master of magic"
    );
    fs.writeFileSync(
      "actions/incanter.json",
      JSON.stringify({
        [magicalFlexibility.id]: magicalFlexibility,
      })
    );
    fs.writeFileSync(
      "features/incanter.json",
      JSON.stringify({
        [magicalPotency.id]: magicalPotency,
        [magicSpecialization.id]: magicSpecialization,
        [arcaneProtection.id]: arcaneProtection,
        [masterOfmagic.id]: masterOfmagic,
      })
    );
    fs.writeFileSync(
      "talents/incanter.json",
      JSON.stringify({
        [magicalPotencyTalent.id]: magicalPotencyTalent,
        [magicSpecializationTalent.id]: magicSpecializationTalent,
        [magicalFlexibilityTalent.id]: magicalFlexibilityTalent,
        [arcaneProtectionTalent.id]: arcaneProtectionTalent,
        [masterOfmagicTalent.id]: masterOfmagicTalent,
      })
    );
  }
}
