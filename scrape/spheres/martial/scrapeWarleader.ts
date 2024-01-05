const fs = require("fs");
const axios = require("axios");
const HTMLParser = require("html-to-json-parser");
const { JSONToHTML } = require("html-to-json-parser");
const { NodeHtmlMarkdown } = require("node-html-markdown");
import {
  findId,
  getTextFromIndex,
  getTitleText,
  scrapeTalentList,
  Feature,
  Modifier,
  Talent,
  sphere,
  toID,
} from "../../utils";

const nhm = new NodeHtmlMarkdown(
  /* options (optional) */ {},
  /* customTransformers (optional) */ undefined,
  /* customCodeBlockTranslators (optional) */ undefined
);

export default async function main() {
  const fileName = "warleader";
  const response = await axios.get(`http://spheres5e.wikidot.com/${fileName}`);
  const body = response.data.match(/<body[\w\W]+<\/body>/)[0];
  const sanitized = body.replace(/&\w+?;/g, "");
  const result = await HTMLParser.default(sanitized);
  const pageContent = findId(result, "page-content");

  if (pageContent?.content) {
    const name = "warleader";
    const sphereId = toID(name);
    const features: Record<string, Feature> = {};
    const modifiers: Record<string, Modifier> = {};
    const talents: Record<string, Talent> = {};

    const tactic = await scrapeTalentList(
      pageContent.content,
      "tactic talents",
      "tactic",
      modifiers,
      talents,
      "TACTICS",
      "TACTIC"
    );

    const shout = await scrapeTalentList(
      pageContent.content,
      "shout talents",
      "shout",
      modifiers,
      talents,
      "SHOUTS",
      "SHOUT"
    );

    const basicTalents = await scrapeTalentList(
      pageContent.content,
      "other talents",
      "basic",
      features,
      talents
    );

    const advancedTalents = await scrapeTalentList(
      pageContent.content,
      "warleader advanced talents",
      "advanced",
      features,
      talents
    );

    const aggressiveFlanking = "aggressive flanking (tactic)";
    const aggressiveFlankingId = toID(aggressiveFlanking);
    talents[aggressiveFlankingId] = {
      id: aggressiveFlankingId,
      name: aggressiveFlanking,
      categoryId: "TACTIC",
      modifierIds: [aggressiveFlankingId],
    };
    modifiers[aggressiveFlankingId] = {
      id: aggressiveFlankingId,
      type: "TACTIC",
      name: aggressiveFlanking,
      text: await getTitleText(pageContent.content, "aggressive flanking"),
      modifyId: "TACTICS",
    };

    const fierceShout = "fierce shout (shout)";
    const fierceShoutId = toID(fierceShout);
    talents[fierceShoutId] = {
      id: fierceShoutId,
      name: fierceShout,
      categoryId: "SHOUT",
      modifierIds: [fierceShoutId],
    };
    modifiers[fierceShoutId] = {
      id: fierceShoutId,
      type: "SHOUT",
      name: fierceShout,
      text: await getTitleText(pageContent.content, "fierce shout"),
      modifyId: "SHOUTS",
    };

    fs.writeFileSync(
      `spheres/${fileName}.json`,
      JSON.stringify({
        ...sphere,
        id: sphereId,
        name,
        text: await getTextFromIndex(pageContent.content, 7),
        actionIds: ["TACTICS", "SHOUTS"],
        modifierIds: [aggressiveFlankingId, fierceShoutId],
        categoryIds: [tactic.id, shout.id, basicTalents.id, advancedTalents.id],
      })
    );
    fs.writeFileSync(
      "categories/warleader.json",
      JSON.stringify({
        [tactic.id]: tactic,
        [shout.id]: shout,
        [basicTalents.id]: basicTalents,
        [advancedTalents.id]: advancedTalents,
      })
    );
    fs.writeFileSync(`talents/${fileName}.json`, JSON.stringify(talents));
    fs.writeFileSync(`modifiers/${fileName}.json`, JSON.stringify(modifiers));
    fs.writeFileSync(`features/${fileName}.json`, JSON.stringify(features));

    fs.writeFileSync(
      `actions/${fileName}.json`,
      JSON.stringify({
        TACTICS: {
          id: "TACTICS",
          name: "tactics",
          text: (
            await getTitleText(pageContent.content, "tactics", "h4")
          ).replace("the following tactic:", "Aggressive Flanking."),
        },
        SHOUTS: {
          id: "SHOUTS",
          name: "shouts",
          text: (
            await getTitleText(pageContent.content, "shouts", "h4")
          ).replace("the following shout:", "Fierce Shout."),
        },
      })
    );
  }
}
