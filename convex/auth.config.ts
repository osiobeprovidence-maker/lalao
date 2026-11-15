export default {
  providers: [
    {
      domain: "https://securetoken.google.com/uselalaoapp",
      applicationID: "uselalaoapp",
    },
    {
      domain: "https://securetoken.google.com/uselalaoapp-preview",
      applicationID: "uselalaoapp-preview",
    },
    {
      // Playsole issues OIDC tokens from this issuer. Convex verifies each
      // token's signature, issuer and audience before exposing auth identity.
      domain: "https://one.playsole.xyz",
      applicationID: "lalao",
    },
  ],
};
