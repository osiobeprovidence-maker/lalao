/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as apiPartners from "../apiPartners.js";
import type * as cloudinary from "../cloudinary.js";
import type * as community from "../community.js";
import type * as cycles from "../cycles.js";
import type * as debug from "../debug.js";
import type * as ecommerce from "../ecommerce.js";
import type * as http from "../http.js";
import type * as market from "../market.js";
import type * as moderation from "../moderation.js";
import type * as mux from "../mux.js";
import type * as muxInternal from "../muxInternal.js";
import type * as pageEvents from "../pageEvents.js";
import type * as pages from "../pages.js";
import type * as platformSettings from "../platformSettings.js";
import type * as push from "../push.js";
import type * as pushActions from "../pushActions.js";
import type * as rallies from "../rallies.js";
import type * as recommendations from "../recommendations.js";
import type * as reports from "../reports.js";
import type * as roomy from "../roomy.js";
import type * as search from "../search.js";
import type * as shop from "../shop.js";
import type * as social from "../social.js";
import type * as subscriptions from "../subscriptions.js";
import type * as topics from "../topics.js";
import type * as users from "../users.js";
import type * as vtu_ng from "../vtu_ng.js";
import type * as wallet from "../wallet.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  apiPartners: typeof apiPartners;
  cloudinary: typeof cloudinary;
  community: typeof community;
  cycles: typeof cycles;
  debug: typeof debug;
  ecommerce: typeof ecommerce;
  http: typeof http;
  market: typeof market;
  moderation: typeof moderation;
  mux: typeof mux;
  muxInternal: typeof muxInternal;
  pageEvents: typeof pageEvents;
  pages: typeof pages;
  platformSettings: typeof platformSettings;
  push: typeof push;
  pushActions: typeof pushActions;
  rallies: typeof rallies;
  recommendations: typeof recommendations;
  reports: typeof reports;
  roomy: typeof roomy;
  search: typeof search;
  shop: typeof shop;
  social: typeof social;
  subscriptions: typeof subscriptions;
  topics: typeof topics;
  users: typeof users;
  vtu_ng: typeof vtu_ng;
  wallet: typeof wallet;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
