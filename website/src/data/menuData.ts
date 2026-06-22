export type SpiceLevel = "mild" | "medium" | "hot";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  spiceLevel: SpiceLevel;
  category: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string;
  items: MenuItem[];
}

export const menuCategories: MenuCategory[] = [
  {
    id: "patties",
    name: "Jamaican Patties",
    description: "Flaky, golden pastries filled with savory goodness",
    items: [
      {
        id: "beef-patty",
        name: "Beef Patty",
        description: "Classic Jamaican beef patty with seasoned ground beef",
        price: 3.99,
        image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80",
        spiceLevel: "medium",
        category: "patties",
      },
      {
        id: "chicken-patty",
        name: "Chicken Patty",
        description: "Tender chicken filling with Caribbean spices",
        price: 3.99,
        image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80",
        spiceLevel: "mild",
        category: "patties",
      },
      {
        id: "veggie-patty",
        name: "Veggie Patty",
        description: "Seasoned vegetables in a flaky crust",
        price: 3.49,
        image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80",
        spiceLevel: "mild",
        category: "patties",
      },
      {
        id: "coco-bread",
        name: "Coco Bread",
        description: "Soft, slightly sweet Jamaican bread",
        price: 1.99,
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80",
        spiceLevel: "mild",
        category: "patties",
      },
    ],
  },
  {
    id: "chicken",
    name: "Chicken",
    description: "Authentic Jamaican chicken dishes",
    items: [
      {
        id: "jerk-chicken",
        name: "Jerk Chicken",
        description: "Authentic jerk chicken marinated in our signature blend of Jamaican spices",
        price: 14.99,
        image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&q=80",
        spiceLevel: "hot",
        category: "chicken",
      },
      {
        id: "curry-chicken",
        name: "Curry Chicken",
        description: "Tender chicken slow-cooked in rich Jamaican curry",
        price: 13.99,
        image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80",
        spiceLevel: "medium",
        category: "chicken",
      },
      {
        id: "brown-stew-chicken",
        name: "Brown Stew Chicken",
        description: "Classic Jamaican brown stew chicken in savory gravy",
        price: 13.99,
        image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&q=80",
        spiceLevel: "mild",
        category: "chicken",
      },
      {
        id: "fried-chicken",
        name: "Fried Chicken",
        description: "Crispy fried chicken seasoned with island spices",
        price: 12.99,
        image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&q=80",
        spiceLevel: "mild",
        category: "chicken",
      },
    ],
  },
  {
    id: "oxtail",
    name: "Oxtail",
    description: "Slow-cooked, fall-off-the-bone tender",
    items: [
      {
        id: "oxtail-dinner",
        name: "Oxtail Dinner",
        description: "Tender, slow-cooked oxtail in rich brown gravy with butter beans",
        price: 18.99,
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80",
        spiceLevel: "mild",
        category: "oxtail",
      },
      {
        id: "oxtail-large",
        name: "Oxtail (Large)",
        description: "Extra portion of our famous oxtail with all the fixings",
        price: 24.99,
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80",
        spiceLevel: "mild",
        category: "oxtail",
      },
    ],
  },
  {
    id: "curry-goat",
    name: "Curry Goat",
    description: "Traditional Jamaican curry goat",
    items: [
      {
        id: "curry-goat-dinner",
        name: "Curry Goat Dinner",
        description: "Traditional Jamaican curry goat, seasoned and slow-cooked to perfection",
        price: 17.99,
        image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80",
        spiceLevel: "medium",
        category: "curry-goat",
      },
      {
        id: "curry-goat-large",
        name: "Curry Goat (Large)",
        description: "Extra portion of our authentic curry goat",
        price: 23.99,
        image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80",
        spiceLevel: "medium",
        category: "curry-goat",
      },
    ],
  },
  {
    id: "seafood",
    name: "Seafood",
    description: "Fresh catches prepared island style",
    items: [
      {
        id: "escovitch-fish",
        name: "Escovitch Fish",
        description: "Crispy fried fish topped with pickled vegetables and scotch bonnet peppers",
        price: 15.99,
        image: "https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=400&q=80",
        spiceLevel: "hot",
        category: "seafood",
      },
      {
        id: "jerk-shrimp",
        name: "Jerk Shrimp",
        description: "Succulent shrimp marinated in jerk seasoning",
        price: 16.99,
        image: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&q=80",
        spiceLevel: "hot",
        category: "seafood",
      },
      {
        id: "fish-chips",
        name: "Fish & Chips",
        description: "Crispy battered fish served with fries",
        price: 13.99,
        image: "https://images.unsplash.com/photo-1579208030886-b937da0925dc?w=400&q=80",
        spiceLevel: "mild",
        category: "seafood",
      },
    ],
  },
  {
    id: "steak",
    name: "Steak & Pork",
    description: "Hearty meat dishes",
    items: [
      {
        id: "pepper-steak",
        name: "Pepper Steak",
        description: "Tender steak strips with bell peppers in savory brown sauce",
        price: 16.99,
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
        spiceLevel: "mild",
        category: "steak",
      },
      {
        id: "jerk-pork",
        name: "Jerk Pork",
        description: "Slow-roasted pork marinated in authentic jerk spices",
        price: 15.99,
        image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&q=80",
        spiceLevel: "hot",
        category: "steak",
      },
    ],
  },
  {
    id: "sides",
    name: "Sides",
    description: "Perfect accompaniments",
    items: [
      {
        id: "rice-peas",
        name: "Rice & Peas",
        description: "Traditional Jamaican rice cooked with coconut milk and kidney beans",
        price: 4.99,
        image: "https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=400&q=80",
        spiceLevel: "mild",
        category: "sides",
      },
      {
        id: "fried-plantains",
        name: "Fried Plantains",
        description: "Sweet, caramelized fried plantains",
        price: 4.99,
        image: "https://images.unsplash.com/photo-1528751014936-863e6e7a319c?w=400&q=80",
        spiceLevel: "mild",
        category: "sides",
      },
      {
        id: "cabbage",
        name: "Steamed Cabbage",
        description: "Seasoned steamed cabbage with carrots",
        price: 3.99,
        image: "https://images.unsplash.com/photo-1515543904279-3c4e0b3c8dd9?w=400&q=80",
        spiceLevel: "mild",
        category: "sides",
      },
      {
        id: "festival",
        name: "Festival",
        description: "Sweet fried dumplings",
        price: 2.99,
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80",
        spiceLevel: "mild",
        category: "sides",
      },
    ],
  },
  {
    id: "drinks",
    name: "Drinks",
    description: "Refreshing Caribbean beverages",
    items: [
      {
        id: "sorrel",
        name: "Sorrel",
        description: "Traditional Jamaican hibiscus drink",
        price: 3.99,
        image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80",
        spiceLevel: "mild",
        category: "drinks",
      },
      {
        id: "ginger-beer",
        name: "Ginger Beer",
        description: "Spicy Jamaican ginger beer",
        price: 2.99,
        image: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400&q=80",
        spiceLevel: "medium",
        category: "drinks",
      },
      {
        id: "ting",
        name: "Ting",
        description: "Jamaican grapefruit soda",
        price: 2.49,
        image: "https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=400&q=80",
        spiceLevel: "mild",
        category: "drinks",
      },
    ],
  },
];
