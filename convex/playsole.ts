import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Exchange Playsole One authorization code for tokens securely from the server,
 * protecting PLAYSOLE_CLIENT_SECRET if configured.
 */
export const exchangeAuthCode = action({
  args: {
    code: v.string(),
    codeVerifier: v.string(),
    redirectUri: v.string(),
  },
  handler: async (ctx, { code, codeVerifier, redirectUri }) => {
    const clientId = process.env.PLAYSOLE_CLIENT_ID || "lalao";
    const clientSecret = process.env.PLAYSOLE_CLIENT_SECRET;

    const bodyParams: Record<string, string> = {
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier,
    };

    if (clientSecret) {
      bodyParams.client_secret = clientSecret;
    }

    const tokenRes = await fetch("https://one.playsole.xyz/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(bodyParams).toString(),
    });

    if (!tokenRes.ok) {
      let errorDesc = "Failed to exchange authorization code.";
      try {
        const errJson = await tokenRes.json();
        errorDesc = errJson.error_description || errJson.error || errorDesc;
      } catch {
        // ignore
      }
      throw new Error(errorDesc);
    }

    const tokenData = await tokenRes.json();

    // Optionally fetch user profile with the fresh access token
    let userProfile: any = null;
    try {
      const userinfoRes = await fetch("https://one.playsole.xyz/userinfo", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });
      if (userinfoRes.ok) {
        userProfile = await userinfoRes.json();
      }
    } catch (e) {
      console.warn("Could not fetch userinfo in Convex action:", e);
    }

    return {
      tokens: tokenData,
      userProfile,
    };
  },
});
