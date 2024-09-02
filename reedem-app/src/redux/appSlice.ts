import { createSlice, PayloadAction, AnyAction } from "@reduxjs/toolkit";

import { SelfieEntity } from "../types";
import { API_URL } from "../constants";

// Constants
const SYNC_STATE_REQUEST = "SYNC_STATE_REQUEST";
const SYNC_STATE_COMMIT = "SYNC_STATE_COMMIT";
const SYNC_STATE_ROLLBACK = "SYNC_STATE_ROLLBACK";

// Actions
export const sendStateAction = (data: SelfieEntity) => ({
  type: SYNC_STATE_REQUEST,
  payload: data,
  meta: {
    offline: {
      effect: { url: `${API_URL}/content`, method: "POST", json: data },
      commit: { type: SYNC_STATE_COMMIT, payload: { id: data.id } },
      rollback: { type: SYNC_STATE_ROLLBACK, payload: { id: data.id } }
    }
  }
});


interface AppState {
  toSync: SelfieEntity[];
}

const initialState: AppState = { toSync: [] };

export const appReducer = (
  state: AppState = initialState,
  action: AnyAction
) => {
  switch (action.type) {
    default:
      return state;
  }
};

/// OLD
// const initialState: AppState = { toSync: [] };

// export const counterSlice = createSlice({
//   name: "data",
//   initialState,
//   reducers: {
//     add: (state, action: PayloadAction<SelfieEntity>) => {
//       state.toSync = [...state.toSync, action.payload];
//     },
//     remove: (state, action: PayloadAction<SelfieEntity>) => {
//       state.toSync = state.toSync.filter((i) => i.id !== action.payload.id);
//     },
//   },
// });

// // Action creators are generated for each case reducer function
// export const { add, remove } = counterSlice.actions;

// export default counterSlice.reducer;
