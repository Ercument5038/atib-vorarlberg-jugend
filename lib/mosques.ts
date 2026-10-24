// ATIB-Moscheen in Vorarlberg.
// Adressen laut Islam-Landkarte (islam-landkarte.at), Stand 24.10.2026; Reuthe nur aus älterer Quelle belegt.
// x/y sind Kartenkoordinaten (640 × 984,7) passend zu public/data/vorarlberg-relief.json.

export type DistrictKey = "bregenz" | "dornbirn" | "feldkirch" | "bludenz";

export type Mosque = {
  id: string;
  town: string;
  address: string;
  postalCode: string;
  district: DistrictKey;
  x: number;
  y: number;
  // Optional ergänzen, sobald bestätigt: Foto unter /public/images, Öffnungszeiten, Telefon
  image?: string;
  openingHours?: { de: string; tr: string };
  phone?: string;
};

export const MAP_SIZE = { width: 640, height: 984.7 };

export const mosques: Mosque[] = [
  { id: "hoerbranz", town: "Hörbranz", address: "Lochauer Straße 2", postalCode: "6912", district: "bregenz", x: 201.5, y: 76.9 },
  { id: "bregenz", town: "Bregenz", address: "Vorklostergasse 58", postalCode: "6900", district: "bregenz", x: 194.0, y: 141.5 },
  { id: "hard", town: "Hard", address: "Eschlestraße 14", postalCode: "6971", district: "bregenz", x: 165.0, y: 157.0 },
  { id: "hoechst", town: "Höchst", address: "Landstraße 64", postalCode: "6973", district: "bregenz", x: 105.7, y: 186.7 },
  { id: "reuthe", town: "Reuthe", address: "Reuthe 60a", postalCode: "6870", district: "bregenz", x: 330.2, y: 301.6 },
  { id: "dornbirn", town: "Dornbirn", address: "Quellengasse 4", postalCode: "6850", district: "dornbirn", x: 203.0, y: 240.7 },
  { id: "lustenau", town: "Lustenau", address: "Tavernhofstraße 17", postalCode: "6890", district: "dornbirn", x: 126.5, y: 236.2 },
  { id: "hohenems", town: "Hohenems", address: "Robert-Koch-Straße 18a", postalCode: "6845", district: "dornbirn", x: 143.8, y: 310.0 },
  { id: "rankweil", town: "Rankweil", address: "Schweizer Straße 111", postalCode: "6830", district: "feldkirch", x: 74.1, y: 409.9 },
  { id: "maeder", town: "Mäder", address: "Schlössleweg 1", postalCode: "6841", district: "feldkirch", x: 100.0, y: 328.5 },
  { id: "frastanz", town: "Frastanz", address: "Feldkircher Straße 4", postalCode: "6820", district: "feldkirch", x: 105.2, y: 487.0 },
  { id: "bludenz", town: "Bludenz", address: "Austraße 2", postalCode: "6700", district: "bludenz", x: 266.3, y: 575.4 },
  { id: "nenzing", town: "Nenzing", address: "Austraße 10", postalCode: "6710", district: "bludenz", x: 178.6, y: 529.0 },
];

export const districts: DistrictKey[] = ["bregenz", "dornbirn", "feldkirch", "bludenz"];
