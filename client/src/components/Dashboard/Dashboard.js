import './Dashboard.scss';
import React, { useState, useEffect } from 'react';
import { useAuthHeader, useAuthUser } from 'react-auth-kit';
import WinLossCount from './WinLossCount';

// Icons
import { FaPlus } from "react-icons/fa6";
import { IoRefreshOutline } from "react-icons/io5";

export default function Dashboard({ socket }) {
  console.log("rendering dashboard component");

  const auth = useAuthUser();
  const authHeader = useAuthHeader();
  const [userStats, setUserStats] = useState({ wins: "loading", losses: "loading" });
  const [gameList, setGameList] = useState([]);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);


  //mostly finished stuff

  function showInstructionsDialog() {
    let dialog = document.getElementById("instructions-dialog");
    dialog.showModal();
  }

  function hideInstructionsDialog() {
    let dialog = document.getElementById("instructions-dialog");
    dialog.close();
  }

  async function createGame() {
    try {
      let result = await fetch(process.env.REACT_APP_BACKEND_URL + "gwent/createGame", {
        headers: { "Authorization": authHeader().split(" ")[1] }
      });
      if (result.status == 200) {
        console.log("game created successfully. connecting to socket.io game room...");
        socket.connect();
        setWaitingForOpponent(true);
        await fetchGameList();
      }
    } catch (error) {
      console.log(error);
    }
  }

  function joinGame(opponentName) {
    const test = async () => {
      try {
        let result = await fetch(process.env.REACT_APP_BACKEND_URL + "gwent/joinGame/" + opponentName, {
          headers: { "Authorization": authHeader().split(" ")[1] }
        });
        if (result.status == 200) {
          console.log("game joined. connecting to socket.io game room...");
          socket.connect();
        }
      } catch (error) {
        console.log(error);
      }
    }
    return test;
  }

  function createGamesTable() {
    let gameRows = [];
    for (let game of gameList) {
      gameRows.push(
        <tr key={game[0]}>
          <td>{game[0]}</td>
          <td>{game[1] ? game[1] : !waitingForOpponent ? <button className={`primary-button`} onClick={joinGame(game[0])}>Join Game</button> : "Waiting for Opponent"}</td>
          <td>{game[1] ? "Game in Progress" : "Waiting for players..."}</td>
        </tr>
      );
    }

    return (
      <table>
        <thead><tr><th>Player One</th><th>Player Two</th><th>Status</th></tr></thead>
        <tbody>{gameRows}</tbody>
      </table>
    );
  }

  //temporary - for testing only
  async function resetGames() {
    console.log("resetting games");
    try {
      let result = await fetch(process.env.REACT_APP_BACKEND_URL + "gwent/resetGames", {
        headers: { "Authorization": authHeader().split(" ")[1] }
      });
      if (result.status == 200) {
        console.log("games reset successfully. disconnecting from socket.io");
        setWaitingForOpponent(false);
        socket.disconnect();
        await fetchGameList();
      }
    } catch (error) {
      console.log(error);
    }
  }



  //fully finished stuff

  async function fetchUserData() {
    try {
      let result = await fetch(process.env.REACT_APP_BACKEND_URL + "userStats", {
        headers: { "Authorization": authHeader().split(" ")[1] }
      });
      result = await result.json();
      setUserStats(result);
    } catch (error) {
      console.log(error);
    }
  }

  async function fetchGameList() {
    console.log("fetching game list");
    try {
      let result = await fetch(process.env.REACT_APP_BACKEND_URL + "gwent/getGameList", {
        headers: { "Authorization": authHeader().split(" ")[1] }
      });
      result = await result.json();
      setGameList(result);
    } catch (error) {
      console.log(error);
    }
  }

  async function checkUserHasGameInProgress() {
    try {
      let result = await fetch(process.env.REACT_APP_BACKEND_URL + "gwent/checkUserHasGameInProgress", {
        headers: { "Authorization": authHeader().split(" ")[1] }
      });
      result = await result.json();
      console.log("inprogress result: " + result.inProgress);
      if (result.inProgress){
        socket.connect();
        setWaitingForOpponent(true);
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    fetchUserData();
    fetchGameList();
    checkUserHasGameInProgress();
  }, []);

  return (
    <div className="dashboard">
      <h1 className={`screen-heading`}> Dashboard / Lobby </h1>

      <dialog id="instructions-dialog">
        <h2>Gwent</h2>
        <h4>The Unofficial Instructions Guide</h4>

        <h6>Introduction</h6>
        <p>Gwent is a 2-player card game that pits two armies against each other on the field of battle.</p>
        <p>Each player takes turns placing one card on the battlefield at a time. At the end of each round, the players total the strength of all Unit Cards on their respective sides of the battlefield. The player with a higher total wins that round. First player to win two rounds wins the match.</p>

        <h6>Building a Deck</h6>
        <p>To play, each player must prepare a deck consisting of the following:</p>
        <ul>
          <li>1 Leader Card only</li>
          <li>22 Unit Cards minimum</li>
          <li>10 Special Cards maximum</li>
        </ul>

        <h6>Faction Overview</h6>
        <p>Northern Realms (Fleur): Jack of all trades, master of none. This deck has a good mix of Tight Bond and Spy cards to give your opponent some trouble, or are Siege units more to your liking? Well, you’re in luck because the Northern Realms deck can specialize in siege warfare. Draw an additional card from your deck whenever you win a round.</p>
        <p>Monsters (Scratches): Overwhelm you opponent with the sheer numbers that come in the Monsters deck. With a large amount of Muster cards in this deck you will be able to mobilize your forces against the enemy with the playing of a single card. Be wary of Biting Frost as one may cripple your Close Quarter units. One random Unit Card stays after each round.</p>
        <p>Nilfgaard (Sun): Like the Northern Realm deck Nilfgaard also has a good mix of Tight Bond and Spy cards while also throwing in a fair amount of Medic cards to raise the dead. Nilfgaard also has a certain leader that is able to cancel out your opponents leader if that is something that is holding you back. Win whenever there is a draw</p>
        <p>Scoia’tael (Arrows): Do you often have trouble deciding between Close Quarters and Ranged Combat units? Then this deck is for you! With a focus on Agile cards you will be able to play either row with ease. Elves and Dwarves make up the core of this deck and with them come a solid amount of Medic and Muster cards as well. Overall, a very customizable deck. You decide who goes first at the start of a battle.</p>
        <p>Skellige (Ship): Shrooms dude, this newest deck is all about the shrooms. While this deck only has two leader cards it boasts some of the strongest base unit cards in the entire game although most are only able to be played once certain prerequisites have been met. With a mix of Tight Bond and Muster cards you will be able to devastate your opponent. Two random cards are summoned from the discard pile at the start of the third round. *See Special Condition Card Pairs for more about the prerequisites for some of the cards in this deck.</p>

        <h6>Types of Cards</h6>
        <p>Leader Cards: Both players will have a single leader card within their deck. These cards have no attack value. Leaders will have a special ability that may be used once per match*. *A few leaders will have a passive ability that cannot be used but will remain active throughout the match.</p>
        <p>Unit Cards: This is your main attack force. Use these cards to bolster your attack score to win the round. There are two different kinds of unit cards – Base and Hero. Many unit cards have special abilities that will be listed below.</p>
        <p>Hero Units: Cannot be affected by special cards or abilities, What you see is what you get. Has gold or silver banner.</p>
        <p>Special Condition Card Pairs</p>
        <p>Cow and Bovine Defense Force (All): BDF can only be played if Cow was played in the previous round.</p>
        <p>Berserker and Transformed Vildkaarl (Skellige): Berserker becomes TV when the Mardroeme Card or ability is used. It will remain in its transformed mode for the remainder of the match.</p>
        <p>Young Berserker and Transformed Young Vildkaarl (Skellige): Young Berserker becomes TYV when the Mardroeme Card or ability is used. It will remain in its transformed mode for the remainder of the match.</p>
        <p>Kambi and Hemdall (Skellige): Hemdall can only be played if Kambi was played in the previous round. Even though Heimdall is a Hero Unit he may be played twice in a match if Kambi is resurrected in the second round.</p>

        <p>Special Card Abilities</p>
        <p>Muster (Two Helmets): Go through your deck, find any cards with the same name or unit type (Vampire, Crone, etc.) as this card and play them all immediately.</p>
        <p>Cerys and Clan Drummond Shield Maiden (Skellige): Cerys will summon CDSM but CDSM will not summon Cerys or other CDSM.</p>
        <p>Spy (Eye): Place on your opponent’s battlefield (counts towards your opponent’s total) and draw 2 cards from your deck.</p>
        <p>Agile (Arrows or Bow and Sword): Place on either the Close Combat or Ranged Combat row. Cannot be moved once placed.</p>
        <p>Medic (Heart and Plus): Look through your discard pile and choose 1 Unit Card (no Heroes or Special Cards). Play it instantly.</p>
        <p>Tight Bond (Hands): Place next to a card with the same name to double the strength of both cards.</p>
        <p>Morale Boost (Plus): Adds +1 to all units on the row (excluding itself).</p>
        <p>Scorch (Skull with Horns): Affects this card’s row on the opponent’s side of the battlefield only. If the opponent has a total strength of 10 or higher on that row, kill that row’s strongest card(s).</p>
        <p>Clan Dimun Pirate (Plain Skull) (Skellige): Has special scorch that destroys highest value card on entire board. Has possibility to Scorch self, dangerous to use.</p>
        <p>Commander’s Horn (Horn): Doubles the strength of all Unit Cards on this card’s row, unless there is already a card affecting this row.</p>
        <p>Counterpart Summon (Moose): Allows for a stronger card to be instantly summoned at the start of the following round.</p>
        <p>Transformable (Bear): Special Ability of Berserker cards that allows them to be transformed with the application of the Mardroeme card or ability.</p>
        <p>Mardroeme (Mushroom): Special ability of Ermion to transform Young Berserker cards on the field.</p>
        <p>Special Cards: These Cards do not have any attack Value but they can still strongly influence the direction in which the match will go. There are two groups of special cards to draw from when building a deck: Utility and Weather.</p>
        <p>Utility Cards: These cards have a range of effects including destroying your opponents strongest cards to increasing the values of your own cards to causing a transformation that turn warriors into bears.</p>
        <p>Commanders Horn: Place on a combat row. Doubles the strength of all Unit Cards in that row. Limited to 1 per row.</p>
        <p>Decoy: Replace 1 of your Unit Cards on the battlefield with the Decoy card. Return that Unit Card to your hand. The Decoy remains on the battlefield wherever the Unit Card was before the swap. Its strength value is 0. You cannot use a Decoy to replace Hero Cards or Special Cards but consider using with units that have the Medic, Spy, or Scorch abilities.</p>
        <p>Scorch: Discard after playing. Kills the strongest card(s) on the battlefield for both players - so if there’s a tie, this kills all cards of that strength on both sides.</p>
        <p>Mardroeme (Skellige): Combine with Berserkers or Young Berserkers to activate their Transformable abilities.</p>
        <p>Weather Cards: These cards can be used to cripple the attack value of your opponent but beware, Their effect takes place on both sides.</p>
        <p>Biting Frost: Reduces all Close Quarter units on the field to 1.</p>
        <p>Impenetrable Fog: Reduces all Ranged units on the field to 1.</p>
        <p>Torrential Rain: Reduces all Siege units on the field to 1.</p>
        <p>Skellige Storm: Reduces all Ranged and Siege units on the field to 1.</p>
        <p>Clear Weather: Clears all weather effects on the field.</p>

        <p>Playing the Game</p>
        <p>Starting the Game: Once decks have been built players will start by drawing 10 cards. Both players will then be able to replace two cards in their hand and redraw from the deck. These two cards will be shuffled back into their deck to possibly draw later. Players will then flip a coin to decide who will play first*. Players will then alternate first turn each round. *Scoia’tael deck will decide who goes first.</p>
        <p>Taking Turns and Finishing a Round: Players will take turns playing one card from their hand at a time or using their Leader Ability until both players pass. When one player passes they must sit out for the remainder of that round. The other player may continue playing cards from their hand until they are satisfied in which case they will pass and conclude the round*. The attack values will then be added up on each side of the battlefield and the player with the lower value will lose a Gem Counter. In the case of a tie both players will lose a counter**. Cards will then be added each players graveyard. Players are then able to each draw a new card from their deck to start the following round***. Once a player has lost both of their Gem Counters they will have lost the match. *A player may wish to sacrifice a round in order to conserve the cards in their hand. This game can often be a war of attrition. **Nilfgaard decks win in the case of a tie. ***Northern Realm decks draw two cards if they win the previous round.</p>
        <p>Credits http://wpc.4d7d.edgecastcdn.net/004D7D/media/THE%20WITCHER%203/Pdf/GwentManuals/en-Manual-Gwent-ONLINE.pdf</p>
        <p>Design: Damien Monnier</p>
        <p>Additional Design: Rafał Jaki</p>
        <p>Card Design: Fernando Forero, Przemysław Juszczyk, Karolina Oksiędzka, Dan Marian Voinescu</p>
        <p>Artwork: Jim Daly, Bartłomiej Gaweł, Bernard Kowalczuk, Lea Leonowicz, John Liew, Marek Madej, Sławomir Maniak, Jan Marek, Alicja Użarowska, Monika Zawistowska</p>
        <p>Special Thanks: Marcin Cierpicki, Travis Currit, Paweł Kapała, Ashley Ann Karas, Robert Malinowski, Karolina Stachyra, Joanna Wieliczko</p>
        <p>DTP: Przemysław Juszczyk, Michał Krawczyk, Paulina Łukiewska, Karolina Oksiędzka</p>
        <p>Updated Version: u/tehdubya</p>

        <button className={`primary-button`} onClick={hideInstructionsDialog}>Close</button>
      </dialog>

      <div className={`container`}>
        <div className={`sidebar`}>
          <h2> Hello, {auth().username}!</h2>
          <div className='wins-and-losses'>
            <h5>Latest stats</h5>
            <WinLossCount label="Wins" count={userStats.wins} />
            <WinLossCount label="Losses" count={userStats.losses} />
          </div>
        </div>

        <div className='main-window'>
          <div className="games-in-progress">
            <div>
              <h3> Games in progress </h3>
              <button className={`icon-button`} onClick={fetchGameList}><IoRefreshOutline />Refresh list</button>
            </div>
            <button className={`primary-button`} onClick={createGame}><FaPlus />Create Game</button>
          </div>

          {createGamesTable()}
          <button className={`primary-button`} onClick={showInstructionsDialog}>Instructions</button>
          <button className={`secondary-button`} onClick={resetGames}>Reset</button>
        </div>
      </div>
    </div>
  );
}