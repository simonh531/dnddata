const fs = require("fs");
const axios = require("axios");
const HTMLParser = require("html-to-json-parser");
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
  const fileName = "brute";
  const response = await axios.get(`http://spheres5e.wikidot.com/${fileName}`);
  const body = response.data.match(/<body[\w\W]+<\/body>/)[0];
  const sanitized = body.replace(/&\w+?;/g, "");
  const result = await HTMLParser.default(sanitized);
  const pageContent = findId(result, "page-content");

  if (pageContent?.content) {
    const name = "brute";
    const sphereId = toID(name);
    const features: Record<string, Feature> = {};
    const modifiers: Record<string, Modifier> = {};
    const talents: Record<string, Talent> = {};

    const manhandle = await scrapeTalentList(
      pageContent.content,
      "manhandle talents",
      "manhandle",
      modifiers,
      talents,
      "CONSECRATION",
      "CONSECRATION"
    );

    const motif = await scrapeTalentList(
      pageContent.content,
      "motif talents",
      "motif",
      modifiers,
      talents,
      "MOTIF",
      "MOTIF"
    );

    const word = await scrapeTalentList(
      pageContent.content,
      "word talents",
      "word",
      modifiers,
      talents,
      "WORD",
      "WORD"
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
      "fate advanced talents",
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
        freeCategoryIds: [["CONSECRATION", "MOTIF", "WORD"]],
        actionIds: ["CONSECRATION", "MOTIF", "WORD"],
        categoryIds: [
          manhandle.id,
          motif.id,
          word.id,
          basicTalents.id,
          advancedTalents.id,
        ],
      })
    );
    fs.writeFileSync(
      `categories/${fileName}.json`,
      JSON.stringify({
        [manhandle.id]: manhandle,
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
        CONSECRATION: {
          id: "CONSECRATION",
          name: "consecration",
          text: await getTitleText(pageContent.content, "consecration"),
        },
        MOTIF: {
          id: "MOTIF",
          name: "motif",
          text: await getTitleText(pageContent.content, "motif"),
        },
        WORD: {
          id: "WORD",
          name: "word",
          text: await getTitleText(pageContent.content, "word"),
        },
      })
    );
  }
}
