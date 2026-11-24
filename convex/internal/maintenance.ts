import { ConvexError } from "convex/values";
import { internalQuery } from "../_generated/server";

export const MAINTENANCE_KEY = "maintenance";
export const MAINTENANCE_ERROR_CODE = "MAINTENANCE_MODE_ACTIVE";

/**
 * Returns true when the deployment is in maintenance mode.
 *
 * Reads the dedicated `maintenanceState` table (a protected location that is
 * never present in maintenance-cleared import archives such as the filtered
 * hybrid import). Fail-closed semantics everywhere:
 *   - read error of any kind     -> true (maintenance active)
 *   - absent row                 -> true (maintenance active)
 *   - row value "true"           -> true
 * Disable only by writing value "false". This guarantees no unprotected
 * interval during provider-side table restores/imports.
 */
export async function isMaintenanceModeActive(ctx: { db: any }): Promise<boolean> {
  try {
    const record = await ctx.db
      .query("maintenanceState")
      .withIndex("by_key", (q: any) => q.eq("key", MAINTENANCE_KEY))
      .first();

    if (!record) return true; // absent state -> fail closed

    const raw: unknown = record.value;
    if (raw === true) return true;
    if (typeof raw !== "string") return true;

    try {
      const parsed = JSON.parse(raw);
      if (parsed === false) return false;
      return true; // anything other than explicit false -> fail closed
    } catch {
      return raw.trim().toLowerCase() !== "false";
    }
  } catch {
    return true; // fail closed: state cannot be determined -> treat as active
  }
}

/**
 * Internal, privileged read of the lock for use from actions (actions cannot
 * access `ctx.db` directly). Actions call
 * `ctx.runQuery(internal.internal.maintenance.assertMaintenanceOff, {})` as
 * their first statement. Throws ConvexError with code MAINTENANCE_MODE_ACTIVE
 * when the deployment is in maintenance mode; returns { maintenanceMode: false }
 * otherwise.
 */
export const assertMaintenanceOff = internalQuery({
  args: {},
  handler: async (ctx) => {
    await requireMaintenanceOff(ctx);
    return { maintenanceMode: false };
  },
});

/**
 * Throws if the deployment is in maintenance mode.
 * Call as the first line of every user-facing mutation that changes data.
 * Does nothing when the deployment is not in maintenance mode.
 */
export async function requireMaintenanceOff(ctx: { db: any }): Promise<void> {
  if (await isMaintenanceModeActive(ctx)) {
    throw new ConvexError(
      `${MAINTENANCE_ERROR_CODE}: Lalao is undergoing scheduled maintenance. Please try again shortly.`
    );
  }
}
