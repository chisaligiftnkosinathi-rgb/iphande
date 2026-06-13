export const PROVINCES = [
    { label: "Eastern Cape", value: "eastern_cape" },
    { label: "Free State", value: "free_state" },
    { label: "Gauteng", value: "gauteng" },
    { label: "KwaZulu-Natal", value: "kwazulu_natal" },
    { label: "Limpopo", value: "limpopo" },
    { label: "Mpumalanga", value: "mpumalanga" },
    { label: "Northern Cape", value: "northern_cape" },
    { label: "North West", value: "north_west" },
    { label: "Western Cape", value: "western_cape" },
];

export const TOWNS_BY_PROVINCE: Record<string, { label: string, value: string }[]> = {
    eastern_cape: [
        { label: "Gqeberha (Port Elizabeth)", value: "gqeberha" },
        { label: "East London", value: "east_london" },
        { label: "Mthatha", value: "mthatha" },
        { label: "Makhanda (Grahamstown)", value: "makhanda" },
        { label: "Qonce (King William's Town)", value: "qonce" },
    ],
    free_state: [
        { label: "Bloemfontein", value: "bloemfontein" },
        { label: "Welkom", value: "welkom" },
        { label: "Botshabelo", value: "botshabelo" },
        { label: "Kroonstad", value: "kroonstad" },
        { label: "Sasolburg", value: "sasolburg" },
    ],
    gauteng: [
        { label: "Johannesburg", value: "johannesburg" },
        { label: "Pretoria", value: "pretoria" },
        { label: "Ekurhuleni (East Rand)", value: "ekurhuleni" },
        { label: "Soweto", value: "soweto" },
        { label: "Midrand", value: "midrand" },
        { label: "Centurion", value: "centurion" },
        { label: "Krugersdorp", value: "krugersdorp" },
    ],
    kwazulu_natal: [
        { label: "Durban", value: "durban" },
        { label: "Pietermaritzburg", value: "pietermaritzburg" },
        { label: "Richards Bay", value: "richards_bay" },
        { label: "Newcastle", value: "newcastle" },
        { label: "Empangeni", value: "empangeni" },
    ],
    limpopo: [
        { label: "Polokwane", value: "polokwane" },
        { label: "Thohoyandou", value: "thohoyandou" },
        { label: "Tzaneen", value: "tzaneen" },
        { label: "Mokopane", value: "mokopane" },
        { label: "Bela-Bela", value: "bela_bela" },
    ],
    mpumalanga: [
        { label: "Mbombela (Nelspruit)", value: "mbombela" },
        { label: "eMalahleni (Witbank)", value: "emalahleni" },
        { label: "Middelburg", value: "middelburg" },
        { label: "Secunda", value: "secunda" },
        { label: "Ermelo", value: "ermelo" },
    ],
    northern_cape: [
        { label: "Kimberley", value: "kimberley" },
        { label: "Upington", value: "upington" },
        { label: "Kuruman", value: "kuruman" },
        { label: "De Aar", value: "de_aar" },
        { label: "Springbok", value: "springbok" },
    ],
    north_west: [
        { label: "Rustenburg", value: "rustenburg" },
        { label: "Mahikeng", value: "mahikeng" },
        { label: "Klerksdorp", value: "klerksdorp" },
        { label: "Potchefstroom", value: "potchefstroom" },
        { label: "Brits", value: "brits" },
    ],
    western_cape: [
        { label: "Cape Town", value: "cape_town" },
        { label: "Stellenbosch", value: "stellenbosch" },
        { label: "Paarl", value: "paarl" },
        { label: "George", value: "george" },
        { label: "Worcester", value: "worcester" },
    ]
};

export const ARCHETYPES = [
    { label: "Hair & Beauty", value: "hair_beauty" },
    { label: "Mechanic / Auto", value: "mechanic_auto" },
    { label: "Transport & Delivery", value: "transport_delivery" },
    { label: "Food & Catering", value: "food_catering" },
    { label: "Construction & Trades", value: "construction_trades" },
    { label: "Tech & Digital", value: "tech_digital" },
    { label: "Education & Training", value: "education_training" },
    { label: "Retail & Trading", value: "retail_trading" },
    { label: "Events & Media", value: "events_media" },
    { label: "Home Services", value: "home_services" },
];
