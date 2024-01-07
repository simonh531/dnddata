import alteration from "./alteration.json";
import conjuration from "./conjuration.json";
import creation from "./creation.json";
import dark from "./dark.json";
import destruction from "./destruction.json";
import enhancement from "./enhancement.json";
import fate from "./fate.json";
import illusion from "./illusion.json";

import warleader from "./warleader.json";

const modifiers = {
  ...alteration,
  ...conjuration,
  ...creation,
  ...dark,
  ...destruction,
  ...enhancement,
  ...fate,
  ...illusion,

  ...warleader,
};

export default modifiers;
