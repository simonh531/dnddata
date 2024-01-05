import alteration from "./alteration.json";
import conjuration from "./conjuration.json";
import creation from "./creation.json";
import dark from "./dark.json";
import destruction from "./destruction.json";
import enhancement from "./enhancement.json";
import fate from "./fate.json";
import illusion from "./illusion.json";

import warleader from "./warleader.json";

import incanter from "./incanter.json";
import mageknight from "./mageknight.json";
import prodigy from "./prodigy.json";
import conscript from "./conscript.json";

const actions = {
  ...alteration,
  ...conjuration,
  ...creation,
  ...dark,
  ...destruction,
  ...enhancement,
  ...fate,
  ...illusion,

  ...warleader,

  ...incanter,
  ...mageknight,
  ...prodigy,
  ...conscript,
};

export default actions;
