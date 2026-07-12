import { Prisma } from "@prisma/client";

export const depots: Prisma.DepotCreateInput[] = [
  {
    name: "Boyson Town",
    status: 0,
    location: "Miami Central",
  },
  {
    name: "Reilly Factory",
    status: 0,
    location: "Palisades",
  },
  {
    name: "Eerie Industrial",
    status: 0,
    location: "Errie Indiana",
  },
  {
    name: "Feline Central",
    status: 0,
    location: "Central hub2",
  },
  {
    name: "Chocolate Factory2",
    status: 0,
    location: "Charlie Estate",
  },
  {
    name: "Avon Nera Farm",
    status: 1,
    location: "Central Pacific Coast",
  },
  {
    name: "Atlanta Dyson",
    status: 0,
    location: "East side Street",
  },
  {
    name: "Central Boise",
    status: 2,
    location: "Idaho central",
  },
  {
    name: "Ganemede farm",
    status: 0,
    location: "Missouri East",
  },
  {
    name: "Parklane South",
    status: 0,
    location: "Seattle West",
  },
  {
    name: "Reed factory",
    status: 0,
    location: "San Diego south",
  },
  {
    name: "Quebec Tower",
    status: 0,
    location: "Monterri ray",
  },
  {
    name: "Wasteland Central",
    status: 0,
    location: "Florida West",
  },
  {
    name: "Dakota East farm",
    status: 0,
    location: "North Dakota",
  },
  {
    name: "Lake central industrial",
    status: 0,
    location: "Michigan central",
  },
  {
    name: "Iowa fieldland",
    status: 0,
    location: "Mesopotamia",
  },
  {
    name: "Calgary North Co.",
    status: 0,
    location: "Nevada central",
  },
  {
    name: "St Ives factory",
    status: 1,
    location: "Skid Row 5",
  },
  {
    name: "Oklahoma North",
    status: 0,
    location: "Chapple lane street",
  },
];
