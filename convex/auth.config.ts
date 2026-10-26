export default {
  providers: [
    {
      domain: "https://securetoken.google.com/uselalaoapp",
      applicationID: "uselalaoapp",
    },
    {
      // Playsole issues OIDC tokens from this issuer. Convex verifies each
      // token's signature, issuer and audience before exposing auth identity.
      domain: "https://one.playsole.xyz",
      applicationID: "lalao",
    },
  ],
};
