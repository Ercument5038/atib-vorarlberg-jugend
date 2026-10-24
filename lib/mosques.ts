// ATIB-Moscheen in Vorarlberg.
// Adressen laut Islam-Landkarte (islam-landkarte.at), Stand 24.10.2026; Reuthe nur aus älterer Quelle belegt.
// Öffnungszeiten, Telefon und Website laut Google Maps (Stand 24.10.2026); Hard 16 und Lustenau 17a laut Google Maps.
// Höchst, Reuthe, Rankweil, Mäder, Frastanz und Nenzing: Öffnungszeiten von Hido angegeben (wie Hard), nicht aus Google.
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
  // Optional ergänzen, sobald bestätigt: Foto unter /public/images, Öffnungszeiten, Telefon, Website
  image?: string;
  openingHours?: { de: string; tr: string };
  phone?: string;
  website?: string;
};

const ALWAYS_OPEN = { de: "Täglich 24 Stunden geöffnet", tr: "Her gün 24 saat açık" };
const daily = (hours: string) => ({ de: `Täglich ${hours}`, tr: `Her gün ${hours}` });
const lateWeekend = (open: string) => ({
  de: `So–Do ${open}–00:00, Fr–Sa ${open}–01:00`,
  tr: `Paz–Per ${open}–00:00, Cum–Cmt ${open}–01:00`,
});

export const MAP_SIZE = { width: 640, height: 984.7 };

export const mosques: Mosque[] = [
  { id: "hoerbranz", town: "Hörbranz", address: "Lochauer Straße 2", postalCode: "6912", district: "bregenz", x: 201.5, y: 76.9, openingHours: daily("10:00–23:00") },
  { id: "bregenz", town: "Bregenz", address: "Vorklostergasse 58", postalCode: "6900", district: "bregenz", x: 194.0, y: 141.5, openingHours: lateWeekend("06:00"), phone: "05574 43013", website: "https://atibbregenz.at" },
  { id: "hard", town: "Hard", address: "Eschlestraße 16", postalCode: "6971", district: "bregenz", x: 165.0, y: 157.0, openingHours: ALWAYS_OPEN },
  { id: "hoechst", town: "Höchst", address: "Landstraße 64", postalCode: "6973", district: "bregenz", x: 105.7, y: 186.7, openingHours: ALWAYS_OPEN },
  { id: "reuthe", town: "Reuthe", address: "Reuthe 60a", postalCode: "6870", district: "bregenz", x: 330.2, y: 301.6, openingHours: ALWAYS_OPEN },
  { id: "dornbirn", town: "Dornbirn", address: "Quellengasse 4", postalCode: "6850", district: "dornbirn", x: 203.0, y: 240.7, openingHours: daily("05:00–23:00") },
  { id: "lustenau", town: "Lustenau", address: "Tavernhofstraße 17a", postalCode: "6890", district: "dornbirn", x: 126.5, y: 236.2, openingHours: daily("06:00–22:00"), phone: "05577 86780", website: "https://kum.atiblustenau.at" },
  { id: "hohenems", town: "Hohenems", address: "Robert-Koch-Straße 18a", postalCode: "6845", district: "dornbirn", x: 143.8, y: 310.0, openingHours: daily("05:00–23:00"), phone: "05576 74978", website: "https://atib-hohenems.com" },
  { id: "rankweil", town: "Rankweil", address: "Schweizer Straße 111", postalCode: "6830", district: "feldkirch", x: 74.1, y: 409.9, openingHours: ALWAYS_OPEN },
  { id: "maeder", town: "Mäder", address: "Schlössleweg 1", postalCode: "6841", district: "feldkirch", x: 100.0, y: 328.5, openingHours: ALWAYS_OPEN },
  { id: "frastanz", town: "Frastanz", address: "Feldkircher Straße 4", postalCode: "6820", district: "feldkirch", x: 105.2, y: 487.0, openingHours: ALWAYS_OPEN },
  { id: "bludenz", town: "Bludenz", address: "Austraße 2", postalCode: "6700", district: "bludenz", x: 266.3, y: 575.4, openingHours: lateWeekend("05:00"), phone: "05552 66989" },
  { id: "nenzing", town: "Nenzing", address: "Austraße 10", postalCode: "6710", district: "bludenz", x: 178.6, y: 529.0, openingHours: ALWAYS_OPEN },
];

export const districts: DistrictKey[] = ["bregenz", "dornbirn", "feldkirch", "bludenz"];
