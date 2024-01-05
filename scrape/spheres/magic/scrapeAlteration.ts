const fs = require("fs");
const axios = require("axios");
const HTMLParser = require("html-to-json-parser");
const { NodeHtmlMarkdown } = require("node-html-markdown");
import {
  findId,
  toID,
  getTextFromIndex,
  getTitleText,
  scrapeTalentList,
  Feature,
  Modifier,
  Talent,
  sphere,
} from "../../utils";

const nhm = new NodeHtmlMarkdown(
  /* options (optional) */ {},
  /* customTransformers (optional) */ undefined,
  /* customCodeBlockTranslators (optional) */ undefined
);

export default async function main() {
  const fileName = "alteration";
  const response = await axios.get(`http://spheres5e.wikidot.com/${fileName}`);
  const body = response.data.match(/<body[\w\W]+<\/body>/)[0];
  const sanitized = body.replace(/&\w+?;/g, "");
  const result = await HTMLParser.default(sanitized);
  const pageContent = findId(result, "page-content");

  if (pageContent?.content) {
    const name = "alteration";
    const sphereId = toID(name);
    const features: Record<string, Feature> = {};
    const modifiers: Record<string, Modifier> = {};
    const talents: Record<string, Talent> = {};

    const genotype = await scrapeTalentList(
      pageContent.content,
      "genotype talents",
      "genotype",
      modifiers,
      talents,
      "SHAPESHIFT",
      "GENOTYPE"
    );

    const trait = await scrapeTalentList(
      pageContent.content,
      "trait talents",
      "trait",
      modifiers,
      talents,
      "SHAPESHIFT",
      "TRAIT"
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
      "alteration advanced talents",
      "advanced",
      features,
      talents
    );

    fs.writeFileSync(
      `spheres/${fileName}.json`,
      JSON.stringify({
        ...sphere,
        id: sphereId,
        name,
        text: await getTextFromIndex(pageContent.content, 7),
        freeCategoryIds: [["GENOTYPE"]],
        actionIds: ["SHAPESHIFT"],
        categoryIds: [
          genotype.id,
          trait.id,
          basicTalents.id,
          advancedTalents.id,
        ],
      })
    );
    fs.writeFileSync(
      `categories/${fileName}.json`,
      JSON.stringify({
        [genotype.id]: genotype,
        [trait.id]: trait,
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
        SHAPESHIFT: {
          id: "SHAPESHIFT",
          name: "shapeshift",
          text: await getTitleText(pageContent.content, "shapeshift"),
        },
      })
    );
  }
}
