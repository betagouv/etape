export type Inline = string | { readonly strong: string };

const b = (text: string): Inline => ({ strong: text });

export type Block =
  | { readonly kind: "paragraph"; readonly text: readonly Inline[] }
  | { readonly kind: "list"; readonly items: readonly string[] }
  | {
      readonly kind: "address";
      readonly title: string;
      readonly name?: string;
      readonly lines: readonly string[];
    }
  | {
      readonly kind: "subsection";
      readonly title: string;
      readonly blocks: readonly Block[];
    };

export type LegalSection = {
  readonly id: string;
  readonly title: string;
  readonly blocks: readonly Block[];
};

export const MENTIONS_LEGALES_TITLE = "Mentions légales";

export const MENTIONS_LEGALES_DESCRIPTION =
  "ETAPE est le système d'information national mis à disposition du réseau Transitions Pro afin de gérer les dispositifs de transition professionnelle et les parcours des bénéficiaires.";

export const MENTIONS_LEGALES: readonly LegalSection[] = [
  {
    id: "presentation",
    title: "Présentation de la plateforme",
    blocks: [
      {
        kind: "paragraph",
        text: [
          b("ETAPE"),
          " est le système d'information national mis à disposition du réseau ",
          b("Transitions Pro"),
          " afin de gérer les dispositifs de transition professionnelle et les parcours des bénéficiaires.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "La plateforme est utilisée par les associations régionales ",
          b("Transitions Pro"),
          ", leurs collaborateurs ainsi que les partenaires habilités, dans le cadre de leurs missions.",
        ],
      },
    ],
  },
  {
    id: "gouvernance",
    title: "Gouvernance de la plateforme",
    blocks: [
      {
        kind: "paragraph",
        text: ["La gouvernance d'ETAPE repose sur trois acteurs complémentaires."],
      },
      {
        kind: "subsection",
        title: "France compétences",
        blocks: [
          {
            kind: "paragraph",
            text: [
              b("France compétences"),
              " est le maître d'ouvrage du système d'information ETAPE.",
            ],
          },
          { kind: "paragraph", text: ["À ce titre, France compétences :"] },
          {
            kind: "list",
            items: [
              "définit les orientations stratégiques du système d'information ;",
              "finance son développement et sa maintenance ;",
              "assure la gouvernance nationale de la plateforme ;",
              "valide les évolutions majeures ;",
              "veille à la cohérence du système d'information avec les politiques publiques de la formation professionnelle.",
            ],
          },
        ],
      },
      {
        kind: "subsection",
        title: "Certif Pro",
        blocks: [
          {
            kind: "paragraph",
            text: [
              b("Certif Pro"),
              ", association nationale tête de réseau des associations Transitions Pro, participe à la définition des besoins métiers.",
            ],
          },
          { kind: "paragraph", text: ["À ce titre, Certif Pro :"] },
          {
            kind: "list",
            items: [
              "représente les associations Transitions Pro ;",
              "recueille et priorise les besoins fonctionnels ;",
              "participe aux instances de gouvernance du projet ;",
              "accompagne le déploiement des évolutions auprès du réseau.",
            ],
          },
        ],
      },
      {
        kind: "subsection",
        title: "Ordésoft",
        blocks: [
          {
            kind: "paragraph",
            text: [
              "La société ",
              b("Ordésoft"),
              " est titulaire du marché de conception, de développement, de maintenance et d'exploitation applicative de la plateforme ETAPE.",
            ],
          },
          { kind: "paragraph", text: ["À ce titre, Ordésoft :"] },
          {
            kind: "list",
            items: [
              "développe les nouvelles fonctionnalités ;",
              "assure la maintenance corrective, préventive et évolutive ;",
              "garantit le maintien en conditions opérationnelles de la plateforme ;",
              "assure l'assistance technique conformément aux engagements contractuels.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "editeur",
    title: "Éditeur",
    blocks: [
      {
        kind: "paragraph",
        text: ["Le présent site est édité dans le cadre du système d'information national ETAPE."],
      },
      {
        kind: "paragraph",
        text: [
          "La responsabilité éditoriale est assurée conjointement par ",
          b("France compétences"),
          ", maître d'ouvrage du système d'information, et ",
          b("Certif Pro"),
          ", tête de réseau des associations Transitions Pro.",
        ],
      },
      { kind: "paragraph", text: ["Les coordonnées administratives sont les suivantes :"] },
      {
        kind: "address",
        title: "France compétences",
        lines: ["Immeuble Canopy", "6 rue du Général Audran", "92400 Courbevoie"],
      },
      {
        kind: "address",
        title: "Certif Pro",
        lines: ["2 ter boulevard Saint-Martin", "75498 Paris Cedex 10"],
      },
    ],
  },
  {
    id: "direction-publication",
    title: "Direction de la publication",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Le directeur de la publication est le représentant légal de France compétences ou toute personne qu'il désigne.",
        ],
      },
    ],
  },
  {
    id: "realisation",
    title: "Réalisation de la plateforme",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "La conception, le développement, la maintenance et l'exploitation applicative de la plateforme sont assurés par :",
        ],
      },
      {
        kind: "address",
        title: "Ordésoft",
        lines: ["33 rue Colbert", "33000 Bordeaux"],
      },
    ],
  },
  {
    id: "hebergement",
    title: "Hébergement",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "La plateforme ",
          b("ETAPE"),
          " est hébergée par ",
          b("Cegedim"),
          ", dans le cadre d'un contrat d'hébergement assurant la disponibilité, la sécurité et la confidentialité des données.",
        ],
      },
      {
        kind: "address",
        title: "Hébergeur",
        name: "Cegedim",
        lines: ["137 rue d'Aguesseau", "92100 Boulogne-Billancourt", "France"],
      },
      {
        kind: "paragraph",
        text: [
          "L'hébergement est réalisé dans des centres de données situés en France ou dans l'Union européenne, conformément aux exigences contractuelles et aux réglementations applicables en matière de protection des données personnelles.",
        ],
      },
    ],
  },
  {
    id: "propriete-intellectuelle",
    title: "Propriété intellectuelle",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "L'ensemble des éléments composant la plateforme ETAPE, notamment les textes, bases de données, développements logiciels, interfaces, graphismes, logos, documents et contenus, est protégé par les dispositions du Code de la propriété intellectuelle.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Toute reproduction, représentation, adaptation, diffusion ou exploitation, totale ou partielle, sans autorisation préalable des titulaires des droits, est interdite, sauf dans les cas prévus par la législation en vigueur.",
        ],
      },
    ],
  },
  {
    id: "donnees-personnelles",
    title: "Protection des données personnelles",
    blocks: [
      {
        kind: "paragraph",
        text: ["Les traitements de données réalisés dans ETAPE sont mis en œuvre conformément :"],
      },
      {
        kind: "list",
        items: [
          "au Règlement (UE) 2016/679 (RGPD) ;",
          "à la loi n°78-17 du 6 janvier 1978 modifiée.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Les données sont collectées uniquement pour assurer la gestion des dispositifs de transition professionnelle et le fonctionnement du système d'information national ETAPE.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Chaque organisme utilisateur demeure responsable des traitements qu'il met en œuvre dans le cadre de ses missions.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Les personnes concernées disposent d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et, lorsque la réglementation le permet, d'un droit à la portabilité de leurs données.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Les modalités d'exercice de ces droits sont précisées dans la Politique de confidentialité de la plateforme.",
        ],
      },
    ],
  },
  {
    id: "cookies",
    title: "Cookies",
    blocks: [
      {
        kind: "paragraph",
        text: ["La plateforme utilise les cookies strictement nécessaires à son fonctionnement."],
      },
      {
        kind: "paragraph",
        text: [
          "Des cookies de mesure d'audience ou de personnalisation peuvent également être déposés, conformément à la réglementation en vigueur et, lorsque cela est requis, après recueil du consentement de l'utilisateur.",
        ],
      },
    ],
  },
  {
    id: "responsabilite",
    title: "Responsabilité",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "France compétences, Certif Pro et Ordésoft mettent tout en œuvre afin d'assurer la disponibilité, la sécurité et la fiabilité de la plateforme ETAPE.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Toutefois, ils ne peuvent garantir l'absence d'interruption de service, d'anomalie technique ou d'erreur.",
        ],
      },
      { kind: "paragraph", text: ["Ils ne sauraient être tenus responsables :"] },
      {
        kind: "list",
        items: [
          "des interruptions temporaires liées à la maintenance ;",
          "des conséquences résultant d'une utilisation non conforme de la plateforme ;",
          "des dommages indirects pouvant résulter de l'utilisation du service.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Les utilisateurs demeurent responsables de la confidentialité de leurs identifiants de connexion et de l'utilisation qui en est faite.",
        ],
      },
    ],
  },
  {
    id: "liens-hypertextes",
    title: "Liens hypertextes",
    blocks: [
      {
        kind: "paragraph",
        text: ["La plateforme peut proposer des liens vers des sites externes."],
      },
      {
        kind: "paragraph",
        text: [
          "France compétences, Certif Pro et Ordésoft ne peuvent être tenus responsables du contenu ou du fonctionnement de ces sites tiers.",
        ],
      },
    ],
  },
  {
    id: "droit-applicable",
    title: "Droit applicable",
    blocks: [
      {
        kind: "paragraph",
        text: ["Les présentes mentions légales sont régies par le droit français."],
      },
      {
        kind: "paragraph",
        text: [
          "Tout litige relatif à leur interprétation ou à leur exécution relève de la compétence des juridictions françaises.",
        ],
      },
    ],
  },
  {
    id: "contact",
    title: "Contact",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Pour toute question relative au fonctionnement de la plateforme ETAPE, les utilisateurs peuvent contacter leur association régionale Transitions Pro ou le support de la plateforme selon les modalités mises à leur disposition.",
        ],
      },
    ],
  },
];
