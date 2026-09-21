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
import type * as cloudinary from "../cloudinary.js";
import type * as community from "../community.js";
import type * as moderation from "../moderation.js";
import type * as pages from "../pages.js";
import type * as platformSettings from "../platformSettings.js";
import type * as push from "../push.js";
import type * as pushActions from "../pushActions.js";
import type * as reports from "../reports.js";
import type * as search from "../search.js";
import type * as shop from "../shop.js";
import type * as social from "../social.js";
import type * as subscriptions from "../subscriptions.js";
import type * as topics from "../topics.js";
import type * as users from "../users.js";
import type * as wallet from "../wallet.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  cloudinary: typeof cloudinary;
  community: typeof community;
  moderation: typeof moderation;
  pages: typeof pages;
  platformSettings: typeof platformSettings;
  push: typeof push;
  pushActions: typeof pushActions;
  reports: typeof reports;
  search: typeof search;
  shop: typeof shop;
  social: typeof social;
  subscriptions: typeof subscriptions;
  topics: typeof topics;
  users: typeof users;
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
