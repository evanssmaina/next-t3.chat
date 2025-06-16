import type { Appearance } from "@clerk/types";

export const getClerkComponentAppearance = (): Appearance => ({
  variables: {
    colorBackground: "#0A0A0A",
  },
  elements: {
    navbar: { display: "none" },
    navbarMobileMenuRow: { display: "none !important" },
    rootBox: {
      width: "100%",
      height: "100%",
    },
    cardBox: {
      display: "block",
      width: "100%",
      height: "100%",
      boxShadow: "none",
    },

    pageScrollBox: {
      padding: "0 !important",
    },
    header: {
      display: "none",
    },
    profileSection: {
      borderTop: "none",
      borderBottom: "1px solid #e0e0e0",
    },
    page: {
      padding: "0 5px",
    },
    // selectButton__role: {
    //   visibility: isRbacEnabled ? "visible" : "hidden",
    // },
    // formFieldRow__role: {
    //   visibility: isRbacEnabled ? "visible" : "hidden",
    // },
  },
});
