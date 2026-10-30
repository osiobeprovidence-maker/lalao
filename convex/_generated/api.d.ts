/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adActions from "../adActions.js";
import type * as admin from "../admin.js";
import type * as ads from "../ads.js";
import type * as apiPartners from "../apiPartners.js";
import type * as bachs from "../bachs.js";
import type * as beta from "../beta.js";
import type * as callActions from "../callActions.js";
import type * as calls from "../calls.js";
import type * as cleanPages from "../cleanPages.js";
import type * as cloudinary from "../cloudinary.js";
import type * as clubkonnect from "../clubkonnect.js";
import type * as community from "../community.js";
import type * as creators from "../creators.js";
import type * as cryptoWallets from "../cryptoWallets.js";
import type * as cycles from "../cycles.js";
import type * as debug from "../debug.js";
import type * as ecommerce from "../ecommerce.js";
import type * as emails from "../emails.js";
import type * as groupAccess from "../groupAccess.js";
import type * as groups from "../groups.js";
import type * as http from "../http.js";
import type * as internal_platformSettingsDefaults from "../internal/platformSettingsDefaults.js";
import type * as lib_authIdentity from "../lib/authIdentity.js";
import type * as lib_authLinkPolicy from "../lib/authLinkPolicy.js";
import type * as lib_bachsWebhookSignature from "../lib/bachsWebhookSignature.js";
import type * as lib_recentSearchShadowRevision from "../lib/recentSearchShadowRevision.js";
import type * as lib_supabaseAdminRest from "../lib/supabaseAdminRest.js";
import type * as market from "../market.js";
import type * as migrations from "../migrations.js";
import type * as moderation from "../moderation.js";
import type * as mux from "../mux.js";
import type * as muxInternal from "../muxInternal.js";
import type * as pageEvents from "../pageEvents.js";
import type * as pages from "../pages.js";
import type * as payments from "../payments.js";
import type * as platformSettings from "../platformSettings.js";
import type * as playsole from "../playsole.js";
import type * as plum from "../plum.js";
import type * as push from "../push.js";
import type * as pushActions from "../pushActions.js";
import type * as rallies from "../rallies.js";
import type * as recommendationEngine from "../recommendationEngine.js";
import type * as recommendations from "../recommendations.js";
import type * as reports from "../reports.js";
import type * as rewards from "../rewards.js";
import type * as roomy from "../roomy.js";
import type * as search from "../search.js";
import type * as shop from "../shop.js";
import type * as smokeRewards from "../smokeRewards.js";
import type * as social from "../social.js";
import type * as sounds from "../sounds.js";
import type * as subscriptions from "../subscriptions.js";
import type * as topicKeywords from "../topicKeywords.js";
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
  adActions: typeof adActions;
  admin: typeof admin;
  ads: typeof ads;
  apiPartners: typeof apiPartners;
  bachs: typeof bachs;
  beta: typeof beta;
  callActions: typeof callActions;
  calls: typeof calls;
  cleanPages: typeof cleanPages;
  cloudinary: typeof cloudinary;
  clubkonnect: typeof clubkonnect;
  community: typeof community;
  creators: typeof creators;
  cryptoWallets: typeof cryptoWallets;
  cycles: typeof cycles;
  debug: typeof debug;
  ecommerce: typeof ecommerce;
  emails: typeof emails;
  groupAccess: typeof groupAccess;
  groups: typeof groups;
  http: typeof http;
  "internal/platformSettingsDefaults": typeof internal_platformSettingsDefaults;
  "lib/authIdentity": typeof lib_authIdentity;
  "lib/authLinkPolicy": typeof lib_authLinkPolicy;
  "lib/bachsWebhookSignature": typeof lib_bachsWebhookSignature;
  "lib/recentSearchShadowRevision": typeof lib_recentSearchShadowRevision;
  "lib/supabaseAdminRest": typeof lib_supabaseAdminRest;
  market: typeof market;
  migrations: typeof migrations;
  moderation: typeof moderation;
  mux: typeof mux;
  muxInternal: typeof muxInternal;
  pageEvents: typeof pageEvents;
  pages: typeof pages;
  payments: typeof payments;
  platformSettings: typeof platformSettings;
  playsole: typeof playsole;
  plum: typeof plum;
  push: typeof push;
  pushActions: typeof pushActions;
  rallies: typeof rallies;
  recommendationEngine: typeof recommendationEngine;
  recommendations: typeof recommendations;
  reports: typeof reports;
  rewards: typeof rewards;
  roomy: typeof roomy;
  search: typeof search;
  shop: typeof shop;
  smokeRewards: typeof smokeRewards;
  social: typeof social;
  sounds: typeof sounds;
  subscriptions: typeof subscriptions;
  topicKeywords: typeof topicKeywords;
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
