import incanter from "./incanter.json";
import mageknight from "./mageknight.json";
import prodigy from "./prodigy.json";
import conscript from "./conscript.json";
import drawbackBoon from "./drawbackBoon.json";

import alteration from "./alteration.json";
import conjuration from "./conjuration.json";
import creation from "./creation.json";
import dark from "./dark.json";
import destruction from "./destruction.json";
import enhancement from "./enhancement.json";
import fate from "./fate.json";
import illusion from "./illusion.json";

import equipment from "./equipment.json";
import warleader from "./warleader.json";

const talents: Record<
  string,
  {
    id: string;
    name: string;
    featureIds?: string[];
    actionIds?: string[];
    bonusActionIds?: string[];
    reactionIds?: string[];
    modifierIds?: string[];
    categoryId?: string;
  }
> = {
  ...incanter,
  ...mageknight,
  ...prodigy,
  ...conscript,

  ...drawbackBoon,

  ...alteration,
  ...conjuration,
  ...creation,
  ...dark,
  ...destruction,
  ...enhancement,
  ...fate,
  ...illusion,

  ...warleader,

  ...equipment,
};

export default talents;
