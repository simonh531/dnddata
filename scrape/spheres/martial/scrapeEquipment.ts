const fs = require("fs");
const axios = require("axios");
const HTMLParser = require("html-to-json-parser");
const { NodeHtmlMarkdown } = require("node-html-markdown");
import {
  findId,
  Feature,
  getTextFromIndex,
  scrapeTalentList,
  sphere,
  toID,
  Talent,
} from "../../utils";

const nhm = new NodeHtmlMarkdown(
  /* options (optional) */ {},
  /* customTransformers (optional) */ undefined,
  /* customCodeBlockTranslators (optional) */ undefined
);

export default async function main() {
  const fileName = "equipment";
  const response = await axios.get(`http://spheres5e.wikidot.com/${fileName}`);
  const body = response.data.match(/<body[\w\W]+<\/body>/)[0];
  const sanitized = body.replace(/&\w+?;/g, "");
  const result = await HTMLParser.default(sanitized);
  const pageContent = findId(result, "page-content");

  if (pageContent?.content) {
    const name = "equipment";
    const sphereId = toID(name);
    const features: Record<string, Feature> = {};
    const talents: Record<string, Talent> = {};

    const discipline = await scrapeTalentList(
      pageContent.content,
      "discipline talents",
      "discipline",
      features,
      talents
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
      "equipment legendary talents",
      "legendary",
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
        freeCategoryIds: [["DISCIPLINE", "BASIC", "LEGENDARY"]],
        categoryIds: [discipline.id, basicTalents.id, advancedTalents.id],
      })
    );
    fs.writeFileSync(
      `categories/${fileName}.json`,
      JSON.stringify({
        [discipline.id]: discipline,
        [basicTalents.id]: basicTalents,
        [advancedTalents.id]: advancedTalents,
      })
    );
    fs.writeFileSync(`talents/${fileName}.json`, JSON.stringify(talents));
    fs.writeFileSync(`features/${fileName}.json`, JSON.stringify(features));
  }
}
