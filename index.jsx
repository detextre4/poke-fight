// * STYLES
const Wrapper = styled.div`
  --size: 220px;
  
  min-height: 100vh;
  background-image: linear-gradient(#ffffff 1.1rem, #ccc 1.2rem);
  background-size: 100% 1.2rem;

  &.finished {
    display: grid;
    place-content: center;
  }

  * {
    padding: 0;
    margin: 0;
    box-sizing: border-box;
    font-family: Fantasy;
  }

  h2 {
    text-align: center;
    margin-bottom: 14px;
  }
`,
  Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--size)), 1fr));
  place-items: center;
  gap: 40px;`,
  Pokeball = styled.div`
--primary: #f71b1b;
--accent: #000;
--bg: #f7f7f7;
--br: 50%;

  position: relative;
  width: var(--size);
  height: var(--size);
  background: var(--bg);
  box-shadow: 2px 2px 6px 2px rgba(0, 0, 0, .4);
  display: grid;
  place-items: center;
  font-size: 25px;
  font-weight: bold;
  border-radius: var(--br);
  isolation: isolate;
  transition: all var(--animationDuration) ease;

  &.deleted {
    translate: 0 -100px;
    opacity: 0;
  }

  &:before, &:after { pointer-events: none }

  &:before {
    position: absolute;
    content: "";
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 25px;
    font-weight: bold;
    border: 4px solid var(--accent);

    background: linear-gradient(to bottom left, var(--primary), var(--primary) 49%, var(--accent) 49%, var(--accent) 50.5%, var(--bg) 50.5%);
    top: 0;
    right: 0;
    border-radius: var(--br);
    transition: all 0.5s;
  }

  &:hover:before, &.opened:before {
    width: 20%;
    height: 20%;
    border-radius: 0 var(--br) 0 100%;

    background: linear-gradient(to bottom left, var(--primary), var(--primary) 72%, var(--accent) 72%, var(--accent) 70%, var(--bg) 70%);
    transition: all 0.5s;
  }

  &:after {
    content: "";
    position: absolute;
    inset: 0;
    margin: auto;
    width: 40px;
    height: 40px;
    background: var(--bg);
    border: 4px solid var(--accent);
    border-radius: 50%;
    z-index: 1;
    transition: all var(--animationDuration);
  }
  &:hover:after, &.opened:after {
    opacity: 0;
    translate: -70px 70px;
    scale: .5;
  }

  * {
    z-index: -1;
    pointer-events: none;
    user-select: none;
  }
  &:hover * { pointer-events: all }

  .pokemon {
    width: 60%;
    object-fit: cover;
    cursor: grab;
  }

  .pokemon-element-type {
    position: absolute;
    object-fit: cover;
    top: 5%;
    width: 50px;
    height: 50px;
  }

  h5 {
    position: absolute;
    bottom: 10%;
    pointer-events: none;
  }

  .health-bar {
    position: absolute;
    right: 10%;
    width: 20px;
    height: 50%;
  }
`;

// * SCRIPT
State.init({
  pokemons: [],
  loading: true,
  splashLoaded: false,
  currentDrag: null,
});

// config constants
const API = "https://pokeapi.co/api/v2",
  LIMIT = props.limit,
  OFFSET = props.offset,
  animationDuration = 200;

// initial fetch to get all pokemons.
// the const `loading` is used to excecute once
function getPokemons() {
  if (!state.loading) return;

  setTimeout(() => State.update({ splashLoaded: true }), 2000);

  // fetch data based on `LIMIT` which corresponds to pokemons amount
  // and `OFFSET` which corresponds to index of complete collection from
  // which the data is brought
  asyncFetch(`${API}/pokemon?limit=${LIMIT}&offset=${OFFSET}`)
    .then(({ body }) => {
      let pokemons = [];

      for (const item of body.results) {
        const { body } = fetch(item.url);

        pokemons.push({
          name: body.name,
          image: body.sprites.other["official-artwork"].front_default,
          moves: body.moves?.map((item) => item.move.name),
          type: body.types[0].type.name,
          health: [1, 2, 3, 4],
        });
      }

      State.update({ pokemons: shuffleArray(pokemons), loading: false });
    })
    .catch((error) => console.error(error));
}
getPokemons();

/* Randomize array in-place using Durstenfeld shuffle algorithm */
function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

function getRandomInt(max) {
  const min = 0;
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min + 1) + min);
}

function onDragStart(pokemonIndex) {
  const pokemons = state.pokemons,
    pokemon = pokemons[state.currentDrag];

  // validate if current element exists
  if (pokemon) {
    pokemon.opened = false;
    pokemon.attack = null;
  }

  State.update({ pokemons, currentDrag: pokemonIndex });
}

function openPokeball(event, pokemonIndex) {
  // prevent vanilla events to can drop elements inside
  event.preventDefault();

  const pokemons = state.pokemons,
    pokemon = pokemons[pokemonIndex];

  if (pokemon.opened) return;

  pokemon.opened = true;
  State.update({ pokemons });
}

function closePokeball(pokemonIndex) {
  // prevent execution in other pokeballs than the objective
  if (state.currentDrag == pokemonIndex) return;

  const pokemons = state.pokemons,
    currentPokemon = pokemons[state.currentDrag],
    pokemon = pokemons[pokemonIndex];

  pokemon.opened = false;
  currentPokemon.attack = null;
  State.update({ pokemons });
}

function attack(pokemonIndex) {
  if (state.currentDrag == pokemonIndex) return;
  const pokemons = state.pokemons,
    currentPokemon = pokemons[state.currentDrag],
    pokemon = pokemons[pokemonIndex];

  // show attack dialog
  if (currentPokemon)
    currentPokemon.attack =
      currentPokemon.moves[getRandomInt(currentPokemon.moves.length)];

  // animation decrease helath
  pokemon.health[0] = 0;
  State.update({ pokemons });

  // decrease helath
  setTimeout(() => decreaseHealth(pokemons, pokemonIndex), animationDuration);
}

function decreaseHealth(pokemons, pokemonIndex) {
  const pokemon = pokemons[pokemonIndex];

  // delete pokemon if health goes too low.
  if (pokemon.health.length <= 1) return deletePokemon(pokemons, pokemonIndex);

  pokemon.health.shift();
  State.update({ pokemons });
}

function deletePokemon(pokemons, pokemonIndex) {
  const currentPokemon = pokemons[state.currentDrag],
    pokemon = pokemons[pokemonIndex];

  // clear attack dialog showed on pokemon
  currentPokemon.attack = null;

  // animation delete pokemon
  pokemon.deleted = true;
  State.update({ pokemons });

  // delete pokemon
  setTimeout(() => {
    pokemons.splice(pokemonIndex, 1);
    State.update({ pokemons });
  }, animationDuration);
}

// * TEMPLATE RENDER
const splashScreen = <Widget src="detextre4.near/widget/splash-screen" />,
  minigame = (
    <Wrapper className={state.pokemons.length > 1 ? "" : "finished"}>
      <h2>
        {/* validate if game is culminated */}
        {state.pokemons.length > 1
          ? "Drag pokemons to attack"
          : `${state.pokemons[0].name} won !!`}
      </h2>
      <Grid>
        {state.pokemons.map((pokemon, index) => (
          <Pokeball
            // pass classes and custom properties dynamically
            className={`${pokemon.deleted ? "deleted" : ""} ${
              pokemon.opened ? "opened" : ""
            }`}
            style={{ "--animationDuration": `${animationDuration}ms` }}
            onDrop={(_) => attack(index)}
            onDragOver={(event) => openPokeball(event, index)}
            onDragLeave={(_) => closePokeball(index)}
            onMouseLeave={(_) => closePokeball(index)}
          >
            {/* pokemon element type widget */}
            <Widget
              src="detextre4.near/widget/pokemon-element-types"
              props={{
                type: pokemon.type,
                alt: `type ${pokemon.type}`,
              }}
            />
            {/* health bar widget */}
            <Widget
              src="detextre4.near/widget/health-bar"
              props={{ healthBars: pokemon.health, bg: "#000" }}
            />
            <OverlayTrigger
              // show attack dialog when pokemon is attacking
              show={!!pokemon.attack}
              overlay={<Tooltip>{pokemon.attack}</Tooltip>}
              placement="top"
            >
              <img
                className="pokemon"
                src={pokemon.image}
                alt={`${pokemon.name}'s image`}
                onDragStart={(_) => onDragStart(index)}
              />
            </OverlayTrigger>
            <h5>{pokemon.name}</h5>
          </Pokeball>
        ))}
      </Grid>
    </Wrapper>
  );

// show splash page while data is loading
if (state.loading || !state.splashLoaded) return splashScreen;
return minigame;
