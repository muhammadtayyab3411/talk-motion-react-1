import loginReducer from "./features/loginSlice";
import serverReducer from "./features/serverSlice";
import deviceReducer from "./features/deviceSlice";
import userReducer from "./features/userSlice";
import modelReducer from "./features/modelSlice";
import trainerSlice from "./features/trainerSlice";
import speechSlice from "./features/speechSlice";
import converterSlice from "./features/converterSlice";

const rootReducer = {
  login: loginReducer,
  server: serverReducer,
  device: deviceReducer,
  user: userReducer,
  model: modelReducer,
  trainer: trainerSlice,
  speech: speechSlice,
  converter: converterSlice,
};

export default rootReducer;
