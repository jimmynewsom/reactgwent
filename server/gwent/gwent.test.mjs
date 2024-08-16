import { cardMap, CardData, LeaderCardData, defaultDeck, validateDeck, Player, Gwent } from "./gwent.mjs";

/////card tests/////

//               CardData( name,             image_url,             type,  faction, strength, range, special, available, description)
const card = new CardData("Geralt of Rivia", "geralt_of_rivia.png", "hero", "neutral", "15", "close", "none", "1", "");

test('testing CardData constructor format: ', () => {
  expect(card).toEqual({name: "Geralt of Rivia", image_url: "geralt_of_rivia.png", type: "hero", faction: "neutral", strength: 15,
                        range: "close", special: "none", available: 1, description: ""});
});

//                     LeaderCardData( name,                      image_url,         faction,           desc, ability_description)
const leaderCard = new LeaderCardData("Foltest King of Temeria", "king_foltest.png", "Northern Realms", "censored",
  "Pick an Impenetrable Fog card from your deck and play it instantly.");

test('testing LeaderCardData constructor format: ', () => {
  expect(leaderCard).toEqual({name: "Foltest King of Temeria", image_url: "king_foltest.png", faction: "Northern Realms", desc: "censored",
    ability_description: "Pick an Impenetrable Fog card from your deck and play it instantly."});
});


/////deck/validation tests/////

const defaultValidation = validateDeck(defaultDeck);

test('testing validateDeck function for valid deck: ', () => {
  expect(defaultValidation).toEqual({isValid: true, unitCount: 22, heroCount: 0, specialCount: 8, totalCardCount: 30, totalUnitStrength: 84});
});



/////game tests/////
const p1 = new Player("player one"), p2 = new Player("player two");
const d1 = [], d2 = [];




const game = new Gwent(p1, p2, d1, d2);
