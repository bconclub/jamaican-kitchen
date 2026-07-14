export type SpiceLevel = "mild" | "medium" | "hot";

export interface PortionSize {
  id: string;
  name: string;
  serves: string;
  price: number;
}

export interface CateringItem {
  id: string;
  name: string;
  description: string;
  image: string;
  spiceLevel: SpiceLevel;
  portions: PortionSize[];
}

export interface CateringCategory {
  id: string;
  name: string;
  description: string;
  items: CateringItem[];
}

export const cateringCategories: CateringCategory[] = [
  {
    id: "entrees",
    name: "Main Entrées",
    description: "Authentic Jamaican main dishes for your event",
    items: [
      {
        id: "jerk-chicken-catering",
        name: "Jerk Chicken",
        description: "Authentic jerk chicken marinated in our signature blend of Jamaican spices",
        image: "/catering/mains__jerk-chicken.webp",
        spiceLevel: "hot",
        portions: [
          { id: "sm", name: "Small Tray", serves: "8-10 people", price: 79.99 },
          { id: "md", name: "Medium Tray", serves: "15-20 people", price: 139.99 },
          { id: "lg", name: "Large Tray", serves: "25-30 people", price: 199.99 },
        ],
      },
      {
        id: "curry-chicken-catering",
        name: "Curry Chicken",
        description: "Tender chicken slow-cooked in rich Jamaican curry sauce",
        image: "/catering/mains__curry-chicken.webp",
        spiceLevel: "medium",
        portions: [
          { id: "sm", name: "Small Tray", serves: "8-10 people", price: 74.99 },
          { id: "md", name: "Medium Tray", serves: "15-20 people", price: 129.99 },
          { id: "lg", name: "Large Tray", serves: "25-30 people", price: 189.99 },
        ],
      },
      {
        id: "brown-stew-chicken-catering",
        name: "Brown Stew Chicken",
        description: "Classic Jamaican brown stew chicken in savory gravy",
        image: "/catering/mains__brown-stew-chicken.webp",
        spiceLevel: "mild",
        portions: [
          { id: "sm", name: "Small Tray", serves: "8-10 people", price: 74.99 },
          { id: "md", name: "Medium Tray", serves: "15-20 people", price: 129.99 },
          { id: "lg", name: "Large Tray", serves: "25-30 people", price: 189.99 },
        ],
      },
      {
        id: "oxtail-catering",
        name: "Oxtail",
        description: "Tender, slow-cooked oxtail in rich brown gravy with butter beans",
        image: "/catering/mains__oxtail.webp",
        spiceLevel: "mild",
        portions: [
          { id: "sm", name: "Small Tray", serves: "8-10 people", price: 149.99 },
          { id: "md", name: "Medium Tray", serves: "15-20 people", price: 269.99 },
          { id: "lg", name: "Large Tray", serves: "25-30 people", price: 389.99 },
        ],
      },
      {
        id: "curry-goat-catering",
        name: "Curry Goat",
        description: "Traditional Jamaican curry goat, seasoned and slow-cooked to perfection",
        image: "/catering/mains__curry-goat.webp",
        spiceLevel: "medium",
        portions: [
          { id: "sm", name: "Small Tray", serves: "8-10 people", price: 139.99 },
          { id: "md", name: "Medium Tray", serves: "15-20 people", price: 249.99 },
          { id: "lg", name: "Large Tray", serves: "25-30 people", price: 359.99 },
        ],
      },
      {
        id: "jerk-pork-catering",
        name: "Jerk Pork",
        description: "Slow-roasted pork marinated in authentic jerk spices",
        image: "/catering/mains__jerk-pork.webp",
        spiceLevel: "hot",
        portions: [
          { id: "sm", name: "Small Tray", serves: "8-10 people", price: 89.99 },
          { id: "md", name: "Medium Tray", serves: "15-20 people", price: 159.99 },
          { id: "lg", name: "Large Tray", serves: "25-30 people", price: 229.99 },
        ],
      },
    ],
  },
  {
    id: "seafood",
    name: "Seafood",
    description: "Fresh catches prepared island style",
    items: [
      {
        id: "escovitch-fish-catering",
        name: "Escovitch Fish",
        description: "Crispy fried fish topped with pickled vegetables and scotch bonnet peppers",
        image: "/catering/mains__escovitch-whiting-fish.webp",
        spiceLevel: "hot",
        portions: [
          { id: "sm", name: "Small Tray", serves: "8-10 people", price: 99.99 },
          { id: "md", name: "Medium Tray", serves: "15-20 people", price: 179.99 },
          { id: "lg", name: "Large Tray", serves: "25-30 people", price: 259.99 },
        ],
      },
      {
        id: "jerk-shrimp-catering",
        name: "Jerk Shrimp",
        description: "Succulent shrimp marinated in jerk seasoning",
        image: "/catering/mains__jerk-shrimp.webp",
        spiceLevel: "hot",
        portions: [
          { id: "sm", name: "Small Tray", serves: "8-10 people", price: 119.99 },
          { id: "md", name: "Medium Tray", serves: "15-20 people", price: 219.99 },
          { id: "lg", name: "Large Tray", serves: "25-30 people", price: 319.99 },
        ],
      },
    ],
  },
  {
    id: "sides",
    name: "Sides",
    description: "Perfect accompaniments for your feast",
    items: [
      {
        id: "rice-peas-catering",
        name: "Rice & Peas",
        description: "Traditional Jamaican rice cooked with coconut milk and kidney beans",
        image: "/catering/sides__rice-and-beans.webp",
        spiceLevel: "mild",
        portions: [
          { id: "sm", name: "Small Tray", serves: "10-12 people", price: 34.99 },
          { id: "md", name: "Medium Tray", serves: "20-25 people", price: 59.99 },
          { id: "lg", name: "Large Tray", serves: "35-40 people", price: 89.99 },
        ],
      },
      {
        id: "fried-plantains-catering",
        name: "Fried Plantains",
        description: "Sweet, caramelized fried plantains",
        image: "/catering/sides__fried-plantains.webp",
        spiceLevel: "mild",
        portions: [
          { id: "sm", name: "Small Tray", serves: "10-12 people", price: 29.99 },
          { id: "md", name: "Medium Tray", serves: "20-25 people", price: 49.99 },
          { id: "lg", name: "Large Tray", serves: "35-40 people", price: 74.99 },
        ],
      },
      {
        id: "steamed-cabbage-catering",
        name: "Steamed Cabbage",
        description: "Seasoned steamed cabbage with carrots",
        image: "/catering/sides__steamed-vegetables.webp",
        spiceLevel: "mild",
        portions: [
          { id: "sm", name: "Small Tray", serves: "10-12 people", price: 24.99 },
          { id: "md", name: "Medium Tray", serves: "20-25 people", price: 44.99 },
          { id: "lg", name: "Large Tray", serves: "35-40 people", price: 64.99 },
        ],
      },
      {
        id: "festival-catering",
        name: "Festival",
        description: "Sweet fried dumplings - 24 pieces per order",
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80",
        spiceLevel: "mild",
        portions: [
          { id: "sm", name: "2 Dozen", serves: "8-10 people", price: 24.99 },
          { id: "md", name: "4 Dozen", serves: "15-20 people", price: 44.99 },
          { id: "lg", name: "6 Dozen", serves: "25-30 people", price: 64.99 },
        ],
      },
    ],
  },
  {
    id: "patties",
    name: "Jamaican Patties",
    description: "Flaky, golden pastries perfect for appetizers",
    items: [
      {
        id: "beef-patty-catering",
        name: "Beef Patties",
        description: "Classic Jamaican beef patties with seasoned ground beef",
        image: "/catering/patties__regular-patties.webp",
        spiceLevel: "medium",
        portions: [
          { id: "sm", name: "1 Dozen", serves: "6-8 people", price: 39.99 },
          { id: "md", name: "2 Dozen", serves: "12-16 people", price: 74.99 },
          { id: "lg", name: "4 Dozen", serves: "24-32 people", price: 139.99 },
        ],
      },
      {
        id: "chicken-patty-catering",
        name: "Chicken Patties",
        description: "Tender chicken filling with Caribbean spices",
        image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80",
        spiceLevel: "mild",
        portions: [
          { id: "sm", name: "1 Dozen", serves: "6-8 people", price: 39.99 },
          { id: "md", name: "2 Dozen", serves: "12-16 people", price: 74.99 },
          { id: "lg", name: "4 Dozen", serves: "24-32 people", price: 139.99 },
        ],
      },
      {
        id: "veggie-patty-catering",
        name: "Veggie Patties",
        description: "Seasoned vegetables in a flaky crust",
        image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80",
        spiceLevel: "mild",
        portions: [
          { id: "sm", name: "1 Dozen", serves: "6-8 people", price: 34.99 },
          { id: "md", name: "2 Dozen", serves: "12-16 people", price: 64.99 },
          { id: "lg", name: "4 Dozen", serves: "24-32 people", price: 119.99 },
        ],
      },
    ],
  },
  {
    id: "beverages",
    name: "Beverages",
    description: "Refreshing Caribbean drinks for your event",
    items: [
      {
        id: "sorrel-catering",
        name: "Sorrel",
        description: "Traditional Jamaican hibiscus drink",
        image: "/catering/drinks__sorrel.webp",
        spiceLevel: "mild",
        portions: [
          { id: "sm", name: "1 Gallon", serves: "10-12 people", price: 24.99 },
          { id: "md", name: "2.5 Gallon", serves: "25-30 people", price: 54.99 },
          { id: "lg", name: "5 Gallon", serves: "50-60 people", price: 99.99 },
        ],
      },
      {
        id: "ginger-beer-catering",
        name: "Ginger Beer",
        description: "Spicy Jamaican ginger beer",
        image: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400&q=80",
        spiceLevel: "medium",
        portions: [
          { id: "sm", name: "1 Gallon", serves: "10-12 people", price: 19.99 },
          { id: "md", name: "2.5 Gallon", serves: "25-30 people", price: 44.99 },
          { id: "lg", name: "5 Gallon", serves: "50-60 people", price: 79.99 },
        ],
      },
    ],
  },
];

export const eventTypes = [
  "Corporate Event",
  "Wedding Reception",
  "Birthday Party",
  "Graduation Party",
  "Family Reunion",
  "Office Lunch",
  "Holiday Party",
  "Other",
];
