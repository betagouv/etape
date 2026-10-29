// Styles du PDF de résultats.
//
// react-pdf a son propre moteur de mise en page (sous-ensemble flexbox) et ne
// lit pas les variables CSS de `packages/ui/src/styles/globals.css` : les
// couleurs utiles y sont reprises en dur. Document en une colonne — pas une
// réplique de la grille de cartes de l'écran — mais habillé des couleurs de
// marque (bandeau, tags de catégorie), reprises des mêmes tokens que
// `CategorieTag.tsx` pour rester cohérent avec l'écran.

import { StyleSheet } from "@react-pdf/renderer";

import type { Categorie } from "../domain/types";
import { PDF_FONT_FAMILY, PDF_HEADING_FONT_FAMILY } from "./fonts";

// Sous-ensemble de `packages/ui/src/styles/globals.css` (thème clair —
// un PDF ne suit pas le thème sombre de l'app).
const COLORS = {
  foreground: "#0a0a0a", // --foreground
  secondary: "#404040", // --content-secondary
  muted: "#525252", // --muted-foreground
  primary: "#134e4a", // --primary / --content-accent
  primaryForeground: "#fafafa", // --primary-foreground
  border: "#d3e2e0", // --border
  white: "#ffffff",
  bannerSubtitle: "#eef4f2", // --secondary
};

/** Couleur d'accent par catégorie — les mêmes tokens que `CategorieTag.tsx`. */
export const CATEGORIE_COLORS: Record<Categorie, string> = {
  interlocuteur: "#1e40af", // --info-text
  outil: "#4c1d95", // --violet-text
  dispositif: "#9a3412", // --warning-text
};

/** Couleur d'accent du résultat prioritaire, posé sur `primary`. */
export const ON_PRIMARY_COLOR = COLORS.primaryForeground;

export const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: PDF_FONT_FAMILY,
    fontSize: 10,
    lineHeight: 1.4,
    color: COLORS.foreground,
    paddingVertical: 40,
    paddingHorizontal: 48,
  },
  banner: {
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 24,
  },
  bannerTitle: {
    fontFamily: PDF_HEADING_FONT_FAMILY,
    fontSize: 18,
    fontWeight: 600,
    letterSpacing: -0.45, // -0.025em, l'approche des titres du kit
    color: COLORS.white,
  },
  bannerSubtitle: {
    marginTop: 10,
    fontSize: 10,
    color: COLORS.bannerSubtitle,
  },
  sectionTitle: {
    fontFamily: PDF_HEADING_FONT_FAMILY,
    fontSize: 16,
    fontWeight: 600,
    letterSpacing: -0.4, // -0.025em
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  /** Titre de section qui suit une autre section (pas de `View` de section : voir le document). */
  sectionTitleSpaced: {
    marginTop: 20,
  },
  recapRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  recapQuestion: {
    flex: 1,
    color: COLORS.secondary,
  },
  recapAnswer: {
    flex: 1,
    fontWeight: 600,
  },
  resultat: {
    marginBottom: 12,
    paddingLeft: 10,
    borderLeftWidth: 3,
  },
  resultatPrioritaire: {
    paddingVertical: 10,
    paddingRight: 12,
    borderRadius: 4,
    borderLeftColor: COLORS.primary,
    backgroundColor: COLORS.primary,
    color: COLORS.primaryForeground,
  },
  categorieRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 3,
  },
  categorieDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  categorieLabel: {
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  resultatNom: {
    fontSize: 11,
    fontWeight: 700,
  },
  resultatDescription: {
    marginTop: 2,
    color: COLORS.secondary,
  },
  resultatUrl: {
    marginTop: 3,
    color: COLORS.primary,
  },
});
