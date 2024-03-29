const fs = require("fs");
import axios from "axios"
import { HTMLToJSON } from "html-to-json-parser";
const { JSONToHTML } = require("html-to-json-parser");
const { NodeHtmlMarkdown } = require("node-html-markdown");
import {
  findId,
  getTextFromIndex,
  getTitleText,
  scrapeTalentList,
  Feature,
  Modifier,
  sphereDefault,
  toID,
} from "../../utils";
import { Sphere, Talent } from "../../types";

const nhm = new NodeHtmlMarkdown(
  /* options (optional) */ {},
  /* customTransformers (optional) */ undefined,
  /* customCodeBlockTranslators (optional) */ undefined
);

export default async function main() {
  const fileName = "conjuration";
  const response = await axios.get(`http://spheres5e.wikidot.com/${fileName}`);
  const body = response.data.match(/<body[\w\W]+<\/body>/)[0];
  const sanitized = body.replace(/&\w+?;/g, "");
  const result = await HTMLToJSON(sanitized);
  if (typeof result === "string") return

  const pageContent = findId(result, "page-content");
  if (!pageContent?.content) return

  const name = "conjuration";
  const sphereId = toID(name);
  const features: Record<string, Feature> = {};
  const modifiers: Record<string, Modifier> = {};
  const talents: Record<string, Talent> = {};

  const summon = {
    id: "SUMMON",
    name: "summon",
    text: await getTitleText(pageContent.content, "summon"),
  }

  const base = await scrapeTalentList(
    pageContent.content,
    "conjuration basic talents",
    "base",
    modifiers,
    talents,
    {
      modifyId: summon.id,
      type: "BASE",
      requireIds: {
        actionIds: [summon.id]
      }
    }
  );

  const form = await scrapeTalentList(
    pageContent.content,
    "form talents",
    "form",
    modifiers,
    talents,
    {
      modifyId: summon.id,
      type: "FORM",
      requireIds: {
        actionIds: [summon.id]
      }
    }
  );

  const basicTalents = await scrapeTalentList(
    pageContent.content,
    "other talents",
    "basic",
    features,
    talents,
    {
      requireIds: {
        tags: ["conjuration"]
      }
    }
  );

  const advancedTalents = await scrapeTalentList(
    pageContent.content,
    "conjuration advanced talents",
    "advanced",
    features,
    talents,
    {
      requireIds: {
        tags: ["conjuration"]
      }
    }
  );

  const sphere: Sphere = {
    ...sphereDefault,
    id: sphereId,
    name,
    type: "MARTIAL",
    text: await getTextFromIndex(pageContent.content, 7),
    actionIds: ["SUMMON"],
    categoryIds: [base.id, form.id, basicTalents.id, advancedTalents.id],
  }

  fs.writeFileSync(
    `spheres/${fileName}.json`,
    JSON.stringify(sphere)
  );
  fs.writeFileSync(
    `categories/${fileName}.json`,
    JSON.stringify({
      [base.id]: base,
      [form.id]: form,
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
      SUMMON: summon,
    })
  );
}
