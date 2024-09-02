import { configureStore } from '@reduxjs/toolkit'
import { StoreEnhancer } from '@reduxjs/toolkit';
import { offline } from '@redux-offline/redux-offline';
import offlineConfig from '@redux-offline/redux-offline/lib/defaults';

import { appReducer } from "./appSlice";

export default configureStore({
  reducer: { data: appReducer },
  enhancers: [offline(offlineConfig) as StoreEnhancer]
})

// import { createStore } from 'redux';
// import { offline } from '@redux-offline/redux-offline';
// import offlineConfig from '@redux-offline/redux-offline/lib/defaults';
// import { appReducer } from "./appSlice";

// const reducer = { data: appReducer };

// const store = createStore(reducer, offline(offlineConfig));

// export default store;
