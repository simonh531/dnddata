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
  const response = await axios.get("http://spheres5e.wikidot.com/prodigy");
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
      "prodigy’s calling feature",
    ]);

    talentIds[0].push("SPELL_POOL");

    fs.writeFileSync(
      "characterClasses/prodigy.json",
      JSON.stringify({
        id: "PRODIGY",
        name: "prodigy",
        text: await getTextFromIndex(pageContent.content, 3),
        hitDice: getHitDice(sanitized),
        skillCount: getSkillCount(sanitized),
        talentRate: 0.75,
        spellPoints: 0.5,
        talentIds,
      })
    );

    const [sequenceTalent, sequence] = await createClassFeature(
      pageContent.content,
      "sequence"
    );

    const [integratedTechniquesTalent, integratedTechniques] =
      await createClassFeature(pageContent.content, "integrated techniques");

    const [imbueSequenceTalent, imbueSequence] = await createClassFeature(
      pageContent.content,
      "imbue sequence"
    );

    const [prodigysCallingTalent, prodigysCalling] = await createClassFeature(
      pageContent.content,
      "prodigy's calling"
    );

    const [unbrokenSequenceTalent, unbrokenSequence] = await createClassFeature(
      pageContent.content,
      "unbroken sequence"
    );

    const [focusedSequenceTalent, focusedSequence] =
      await createClassBonusAction(pageContent.content, "focused sequence");

    const [steadySkillTalent, steadySkill] = await createClassFeature(
      pageContent.content,
      "steady skill"
    );

    const [flawlessSequenceTalent, flawlessSequence] = await createClassFeature(
      pageContent.content,
      "flawless sequence"
    );

    const [prodigiousSkillTalent, prodigiousSkill] = await createClassFeature(
      pageContent.content,
      "prodigious skill"
    );

    const [perfectedProdigyTalent, perfectedProdigy] = await createClassFeature(
      pageContent.content,
      "perfected prodigy"
    );

    fs.writeFileSync(
      "actions/prodigy.json",
      JSON.stringify({
        [focusedSequence.id]: focusedSequence,
      })
    );
    fs.writeFileSync(
      "features/prodigy.json",
      JSON.stringify({
        [sequence.id]: sequence,
        [integratedTechniques.id]: integratedTechniques,
        [imbueSequence.id]: imbueSequence,
        [prodigysCalling.id]: prodigysCalling,
        [unbrokenSequence.id]: unbrokenSequence,
        [steadySkill.id]: steadySkill,
        [flawlessSequence.id]: flawlessSequence,
        [prodigiousSkill.id]: prodigiousSkill,
        [perfectedProdigy.id]: perfectedProdigy,
      })
    );
    fs.writeFileSync(
      "talents/prodigy.json",
      JSON.stringify({
        [sequenceTalent.id]: sequenceTalent,
        [integratedTechniquesTalent.id]: integratedTechniquesTalent,
        [imbueSequenceTalent.id]: imbueSequenceTalent,
        [prodigysCallingTalent.id]: prodigysCallingTalent,
        [unbrokenSequenceTalent.id]: unbrokenSequenceTalent,
        [focusedSequenceTalent.id]: focusedSequenceTalent,
        [steadySkillTalent.id]: steadySkillTalent,
        [flawlessSequenceTalent.id]: flawlessSequenceTalent,
        [prodigiousSkillTalent.id]: prodigiousSkillTalent,
        [perfectedProdigyTalent.id]: perfectedProdigyTalent,
      })
    );
  }
}
