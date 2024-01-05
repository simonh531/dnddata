const fs = require("fs");
import axios from "axios";
import { NodeHtmlMarkdown } from "node-html-markdown";
import { JSONToHTML, HTMLToJSON, JSONType } from "html-to-json-parser";
import { DataHolder, toID, findId, Action } from "./utils";

const nhm = new NodeHtmlMarkdown(
  /* options (optional) */ {},
  /* customTransformers (optional) */ undefined,
  /* customCodeBlockTranslators (optional) */ undefined
);

export default async function main() {
  const response = await axios.get<string>(
    "http://spheres5e.wikidot.com/combat-actions"
  );
  const body = response.data.match(/<body[\w\W]+<\/body>/);
  if (body) {
    const sanitized = body[0].replace(/&\w+?;/g, "");
    const result = (await HTMLToJSON(sanitized)) as JSONType;
    const pageContent = findId(result, "page-content");
    if (pageContent?.content) {
      const actions: Record<string, Action> = {};
      const actionsList: DataHolder[] = [];
      let index = 4;
      let currentContent = pageContent.content[index];
      while (
        (typeof currentContent === "string" || currentContent.type !== "hr") &&
        index < pageContent.content.length
      ) {
        if (typeof currentContent !== "string" && currentContent.content) {
          if (currentContent.type === "h2") {
            const span = currentContent.content[0];
            if (typeof span !== "string" && span.content) {
              actionsList.push({
                name: span.content[0].toString(),
                content: [],
              });
            }
          } else if (actionsList.length) {
            actionsList[actionsList.length - 1].content.push(currentContent);
          }
        }
        index += 1;
        currentContent = pageContent.content[index];
      }

      await Promise.all(
        actionsList.map(async (action) => {
          actions[toID(action.name)] = {
            id: toID(action.name),
            name: action.name.toLowerCase(),
            text: await nhm.translate(
              (await JSONToHTML({
                type: "div",
                content: action.content,
              })) as string
            ),
          };
        })
      );

      fs.writeFileSync(`./actions/combat.json`, JSON.stringify(actions));
    }
  }
}
