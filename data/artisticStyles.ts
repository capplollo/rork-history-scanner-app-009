export interface ArtisticStyle {
  id: string;
  title: string;
  period: string;
  description: string;
  keyCharacteristics: string[];
  famousArtists: string[];
  famousWorks: string[];
  image: string;
  gradient: [string, string];
}

export const artisticStyles: ArtisticStyle[] = [
  {
    id: "classical",
    title: "Classical",
    period: "5th - 4th century BCE",
    description: "Classical art represents the pinnacle of ancient Greek and Roman artistic achievement, emphasizing harmony, proportion, and idealized beauty. This style sought to capture the perfect human form and express noble ideals through sculpture, architecture, and painting.",
    keyCharacteristics: [
      "Idealized human forms with perfect proportions",
      "Mathematical precision in composition",
      "Emphasis on balance and symmetry",
      "Use of contrapposto in sculpture",
      "Architectural orders (Doric, Ionic, Corinthian)",
      "Mythological and heroic themes"
    ],
    famousArtists: [
      "Phidias",
      "Praxiteles",
      "Polykleitos",
      "Myron",
      "Lysippos"
    ],
    famousWorks: [
      "Parthenon Sculptures",
      "Venus de Milo",
      "Discobolus",
      "Apollo Belvedere",
      "Lacoön and His Sons"
    ],
    image: "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400",
    gradient: ["#4f46e5", "#7c3aed"]
  },
  {
    id: "medieval-gothic",
    title: "Medieval / Gothic",
    period: "5th - 15th century CE",
    description: "Medieval and Gothic art emerged from the Christian tradition, characterized by spiritual themes, elaborate ornamentation, and architectural innovations. Gothic style particularly emphasized verticality, light, and the divine connection between earth and heaven.",
    keyCharacteristics: [
      "Religious and spiritual themes",
      "Pointed arches and ribbed vaults",
      "Flying buttresses in architecture",
      "Stained glass windows",
      "Illuminated manuscripts",
      "Symbolic rather than naturalistic representation"
    ],
    famousArtists: [
      "Giotto di Bondone",
      "Duccio di Buoninsegna",
      "Simone Martini",
      "Jean Pucelle",
      "Master of the Book of Hours"
    ],
    famousWorks: [
      "Notre-Dame Cathedral",
      "Chartres Cathedral",
      "Book of Kells",
      "Scrovegni Chapel frescoes",
      "Sainte-Chapelle"
    ],
    image: "https://images.unsplash.com/photo-1520637736862-4d197d17c90a?w=400",
    gradient: ["#059669", "#10b981"]
  },
  {
    id: "renaissance",
    title: "Renaissance",
    period: "14th - 17th century",
    description: "The Renaissance marked a rebirth of classical learning and artistic innovation. Artists developed new techniques like linear perspective and chiaroscuro, while exploring humanist themes and the natural world with unprecedented realism and emotional depth.",
    keyCharacteristics: [
      "Linear perspective and realistic proportions",
      "Chiaroscuro (light and shadow)",
      "Sfumato technique",
      "Humanist themes and individualism",
      "Classical mythology and Christian subjects",
      "Oil painting techniques"
    ],
    famousArtists: [
      "Leonardo da Vinci",
      "Michelangelo Buonarroti",
      "Raphael Sanzio",
      "Sandro Botticelli",
      "Donatello"
    ],
    famousWorks: [
      "Mona Lisa",
      "The Last Supper",
      "Sistine Chapel Ceiling",
      "The Birth of Venus",
      "David (Michelangelo)"
    ],
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
    gradient: ["#dc2626", "#f87171"]
  },
  {
    id: "baroque",
    title: "Baroque",
    period: "17th - 18th century",
    description: "Baroque art emerged as a dramatic, emotional response to the Protestant Reformation. Characterized by dynamic movement, rich colors, and theatrical lighting, it aimed to evoke strong emotional responses and demonstrate the power and glory of the Catholic Church.",
    keyCharacteristics: [
      "Dramatic lighting and strong contrasts",
      "Dynamic movement and energy",
      "Rich, warm color palettes",
      "Emotional intensity and theatricality",
      "Ornate decoration and grandeur",
      "Trompe-l'œil effects"
    ],
    famousArtists: [
      "Caravaggio",
      "Peter Paul Rubens",
      "Gian Lorenzo Bernini",
      "Rembrandt van Rijn",
      "Diego Velázquez"
    ],
    famousWorks: [
      "The Calling of St. Matthew",
      "The Descent from the Cross",
      "Ecstasy of Saint Teresa",
      "The Night Watch",
      "Las Meninas"
    ],
    image: "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400",
    gradient: ["#7c2d12", "#dc2626"]
  },
  {
    id: "neoclassicism",
    title: "Neoclassicism",
    period: "18th - 19th century",
    description: "Neoclassicism emerged as a reaction against the ornate Baroque and Rococo styles, drawing inspiration from ancient Greek and Roman art. It emphasized moral virtue, civic duty, and rational thought through clean lines, noble subjects, and classical themes.",
    keyCharacteristics: [
      "Clean, precise lines and forms",
      "Moral and heroic themes",
      "Classical subject matter",
      "Restrained emotion and dignity",
      "Balanced compositions",
      "Muted, harmonious colors"
    ],
    famousArtists: [
      "Jacques-Louis David",
      "Jean-Auguste-Dominique Ingres",
      "Antonio Canova",
      "Angelica Kauffman",
      "Benjamin West"
    ],
    famousWorks: [
      "The Oath of the Horatii",
      "Napoleon Crossing the Alps",
      "The Grande Odalisque",
      "Psyche Revived by Cupid's Kiss",
      "The Death of General Wolfe"
    ],
    image: "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400",
    gradient: ["#1e40af", "#3b82f6"]
  },
  {
    id: "romanticism",
    title: "Romanticism",
    period: "Late 18th - 19th century",
    description: "Romanticism emphasized emotion, imagination, and individualism over the rational ideals of Neoclassicism. Artists explored themes of nature, the sublime, exotic cultures, and intense human emotions, often with dramatic and expressive techniques.",
    keyCharacteristics: [
      "Emphasis on emotion and feeling",
      "Dramatic and expressive brushwork",
      "Exotic and orientalist themes",
      "Sublime landscapes and nature",
      "Individual expression and creativity",
      "Rich, vibrant colors"
    ],
    famousArtists: [
      "Eugène Delacroix",
      "Théodore Géricault",
      "Caspar David Friedrich",
      "J.M.W. Turner",
      "Francisco Goya"
    ],
    famousWorks: [
      "Liberty Leading the People",
      "The Raft of the Medusa",
      "Wanderer above the Sea of Fog",
      "The Fighting Temeraire",
      "The Third of May 1808"
    ],
    image: "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=400",
    gradient: ["#be123c", "#f43f5e"]
  },
  {
    id: "impressionism",
    title: "Impressionism",
    period: "1860s - 1880s",
    description: "Impressionism revolutionized art by capturing fleeting moments and the effects of light and atmosphere. Artists painted outdoors (en plein air) with loose brushstrokes and pure colors, focusing on the impression of a scene rather than precise details.",
    keyCharacteristics: [
      "Loose, visible brushstrokes",
      "Pure, unmixed colors",
      "Emphasis on light and its effects",
      "Outdoor painting (en plein air)",
      "Everyday subjects and scenes",
      "Capture of fleeting moments"
    ],
    famousArtists: [
      "Claude Monet",
      "Pierre-Auguste Renoir",
      "Edgar Degas",
      "Camille Pissarro",
      "Berthe Morisot"
    ],
    famousWorks: [
      "Water Lilies series",
      "Impression, Sunrise",
      "Luncheon of the Boating Party",
      "The Dance Class",
      "The Cradle"
    ],
    image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400",
    gradient: ["#0891b2", "#06b6d4"]
  },
  {
    id: "modernism",
    title: "Modernism",
    period: "Late 19th - mid 20th century",
    description: "Modernism broke away from traditional artistic conventions, embracing experimentation and innovation. Artists explored new forms, techniques, and concepts, often reflecting the rapid changes of industrial society and challenging established norms.",
    keyCharacteristics: [
      "Rejection of traditional forms",
      "Experimentation with new techniques",
      "Geometric and abstract elements",
      "Industrial and urban themes",
      "Fragmentation and multiple perspectives",
      "Bold use of color and form"
    ],
    famousArtists: [
      "Pablo Picasso",
      "Henri Matisse",
      "Wassily Kandinsky",
      "Paul Cézanne",
      "Georges Braque"
    ],
    famousWorks: [
      "Les Demoiselles d'Avignon",
      "The Dance",
      "Composition VII",
      "Mont Sainte-Victoire series",
      "Violin and Candlestick"
    ],
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
    gradient: ["#7c3aed", "#a855f7"]
  },
  {
    id: "abstract-expressionism",
    title: "Abstract Expressionism",
    period: "1940s - 1960s",
    description: "Abstract Expressionism emerged in post-war America as the first major American art movement. It emphasized spontaneous, automatic, or subconscious creation, with artists expressing emotions and ideas through abstract forms, colors, and gestural brushwork.",
    keyCharacteristics: [
      "Large-scale canvases",
      "Abstract, non-representational forms",
      "Gestural and expressive brushwork",
      "Emphasis on the act of painting",
      "Emotional and psychological content",
      "Bold colors and dynamic compositions"
    ],
    famousArtists: [
      "Jackson Pollock",
      "Mark Rothko",
      "Willem de Kooning",
      "Barnett Newman",
      "Helen Frankenthaler"
    ],
    famousWorks: [
      "No. 1, 1950 (Lavender Mist)",
      "Orange, Red, Yellow",
      "Woman I",
      "Vir Heroicus Sublimis",
      "Mountains and Sea"
    ],
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
    gradient: ["#ea580c", "#fb923c"]
  },
  {
    id: "contemporary-conceptual",
    title: "Contemporary / Conceptual",
    period: "1960s - Present",
    description: "Contemporary and Conceptual art prioritizes ideas and concepts over traditional aesthetic concerns. Artists use diverse media and approaches to address social, political, and philosophical issues, often challenging the very definition of art itself.",
    keyCharacteristics: [
      "Emphasis on ideas over aesthetics",
      "Use of diverse media and materials",
      "Social and political commentary",
      "Interactive and participatory elements",
      "Questioning of art institutions",
      "Global and multicultural perspectives"
    ],
    famousArtists: [
      "Andy Warhol",
      "Damien Hirst",
      "Ai Weiwei",
      "Banksy",
      "Yayoi Kusama"
    ],
    famousWorks: [
      "Campbell's Soup Cans",
      "The Physical Impossibility of Death",
      "Dropping a Han Dynasty Urn",
      "Girl with Balloon",
      "Infinity Rooms"
    ],
    image: "https://images.unsplash.com/photo-1549813069-f95e44d7f498?w=400",
    gradient: ["#059669", "#34d399"]
  }
];