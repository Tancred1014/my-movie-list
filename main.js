//#region Parameters
const countPerPage = 12;
const apiMovies = "https://webdev.alphacamp.io/api/movies";
const apiImage = "https://webdev.alphacamp.io/posters/";
//#endregion

//#region View Items
const loadingSpinner = document.querySelector(".loading-spinner");
const movieList = document.querySelector("#movieList");
const moviePagination = document.querySelector("#moviePagination");
const movieModal = document.querySelector("#movieModal");
const movieModalLabel = document.querySelector("#movieModalLabel");
const movieModalImage = document.querySelector(".modal-poster-img");
const movieModalInfo = document.querySelector(".modal-poster-info");

const searchBox = document.querySelector("#inputSearchBox");
const buttonHome = document.querySelector("#buttonHome");
const buttonFavorite = document.querySelector("#buttonFavorite");
const navbarList = document.querySelector("#navbarList");
const buttonDisplayCard = document.querySelector("#buttonDisplayCard");
const buttonDisplayList = document.querySelector("#buttonDisplayList");
//#endregion

const ENUM_DISPLAY_MODE = Object.freeze({ "CARD": 1, "LIST": 2 });

let dataMovies = null;
let dataFavoriteMovies = null;

let moviePages = [];
let indexCrtPage = 0;
let displayMode = ENUM_DISPLAY_MODE.CARD;

function setIsShowElement(element, isAcitve) {
  const display = isAcitve ? "block" : "none";
  element.style.display = display;
  Array.from(element.children).forEach((child) => {
    child.style.display = display;
  });
}

function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

function createMoviePaginationHTML(pageLength) {
  if (pageLength < 1) pageLength = 1;

  let items = "";
  const pagePrev = `
        <li class="page-item disabled" data-page-item-info="${"prev"}">
            <button class="page-link" aria-label="Previous"><span>&laquo;</span></button>
        </li>
    `;
  const pageNext = `
        <li class="page-item disabled" data-page-item-info="${"next"}">
            <button class="page-link" aria-label="Next"><span>&raquo;</span></button>
        </li>
    `;
  for (let i = 0; i < pageLength; i++) {
    items += `
        <li class="page-item" data-page-item-info="${i}">
            <button class="page-link">${i + 1}</button>
        </li>`;
  }
  return `${pagePrev}${items}${pageNext}`;
}

function createModalMovieInfoHTML(movie) {
  return `
      <p>Release Date: ${movie["release_date"]}</p>
      <p>${movie["description"]}</p>
    `;
}

function getIsMovieFavorite(movie) {
  return movie["isFavorite"] ?? false;
}

function setMovieFavorite(movie, isFavorite) {
  movie["isFavorite"] = isFavorite;
}

function getFavoriteMovies() {
  return dataMovies.filter((movie) => getIsMovieFavorite(movie));
}

function setEventPageFavorite() {
  buttonFavorite.addEventListener("click", () => {
    dataFavoriteMovies = getFavoriteMovies();
    displayMovies(dataFavoriteMovies, 0);
    refreshNavbarList(buttonFavorite);
  });
}

function setEventPageHome() {
  buttonHome.addEventListener("click", (event) => {
    displayMovies(dataMovies, 0);
    refreshNavbarList(buttonHome);
  });
}

function refreshNavbarList(target) {
  const items = navbarList.querySelectorAll(".nav-link");
  items.forEach((item) => item.classList.remove("active"));
  target.querySelector(".nav-link").classList.add("active");
}

function setEventSearch() {
  const form = searchBox.closest("form");
  form.addEventListener("submit", (event) => {
    const key = searchBox.value.trim().toLowerCase();
    if (key) {
      const movies = dataMovies.filter((movie) => movie["title"].toLowerCase().includes(key));
      displayMovies(movies, 0);
    }
    event.preventDefault();
  });
}

function setEventMoviePagination() {
  const isValidClasses = (classList) => {
    const invalid = ["disabled", "active"];
    return !(invalid.some((item) => classList.contains(item)));
  };

  moviePagination.addEventListener("click", (event) => {
    const target = event.target.closest(".page-item");
    if (target && isValidClasses(target.classList)) {
      const pageItemInfo = target.getAttribute("data-page-item-info");
      const pageIndex = getCurrentPageIndex();

      switch (pageItemInfo) {
        case "prev": setCurrentPageIndex(pageIndex - 1); break;
        case "next": setCurrentPageIndex(pageIndex + 1); break;
        default: setCurrentPageIndex(parseInt(pageItemInfo));
      }
      refreshMovieList();
    }
    event.preventDefault();
  });
}

function setEventMovieModal() {
  movieModal.addEventListener("show.bs.modal", (event) => {
    const div = event.relatedTarget.closest(".movie-item");
    const id = parseInt(div.getAttribute("data-movie-id"));
    const data = dataMovies.find((dataMovie) => dataMovie["id"] === id);
    movieModalLabel.innerText = data["title"];
    movieModalImage.setAttribute("src", `${apiImage}${data["image"]}`);
    movieModalInfo.innerHTML = createModalMovieInfoHTML(data);
  });
}

function setEventDisplayMode() {
  buttonDisplayCard.addEventListener("click", () => {
    if (displayMode !== ENUM_DISPLAY_MODE.CARD) {
      displayMode = ENUM_DISPLAY_MODE.CARD;
      refreshMovieList();
    }
  });

  buttonDisplayList.addEventListener("click", () => {
    if (displayMode !== ENUM_DISPLAY_MODE.LIST) {
      displayMode = ENUM_DISPLAY_MODE.LIST;
      refreshMovieList();
    }
  });
}

function waitForSeconds(seconds) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 1000 * seconds);
  });
}

function loadMoviePosters() {
  const posters = document.querySelectorAll(".poster-img");
  const countPerRound = 3;
  const delayPerRound = 0.1;

  const delayLoadPosters = async () => {
    for (let i = 0, j = 1; i < posters.length; i++, j++) {
      if (j > countPerRound) {
        await waitForSeconds(delayPerRound);
        j = 1;
      }
      const element = posters[i];
      const dataSrc = element.getAttribute("data-src");
      element.setAttribute("src", dataSrc);
    }
  };
  delayLoadPosters();
}

function createButtonMovieHTML(movie) {
  const heart = getIsMovieFavorite(movie) ? "heart-pink " : "";

  if (displayMode === ENUM_DISPLAY_MODE.CARD) {
    return createBtnMovieCardHTML(movie, heart);
  }
  else {
    return createBtnMovieItemHTML(movie, heart);
  }
}

function createBtnMovieCardHTML(movie, heart) {
  const name = `<p class="card-text text-center">${movie["title"]}</p>`;

  return `
        <div class="card p-0 movie-item" data-movie-id="${movie["id"]}">
            <button class="btn bg-transparent border-0 poster-favorite pos-right-up"><i class="${heart}fa-solid fa-heart fa-2xl"></i></button>
            <img draggable="false" src="" data-src="${apiImage}${movie["image"]}" class="card-img-top poster-img" alt="Movie Image" />
            <div class="card-body">
                <div class="card-body d-flex justify-content-center align-items-center">${name}</div>
            </div>
            <div class="card-footer text-body-secondary">
                <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#movieModal">More</button>
            </div>
        </div>
    `;
}

function createBtnMovieItemHTML(movie, heart) {
  return `
        <div class="item-list movie-item" data-movie-id="${movie["id"]}">
            <hr>
                <div class="d-flex justify-content-between align-items-center">
                    <p>${movie["title"]}</p>
                    <div>
                        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#movieModal">More</button>
                        <button class="btn bg-transparent border-0 poster-favorite"><i class="${heart}fa-solid fa-heart fa-2xl"></i></button>
                    </div>
                </div>
        </div>
    `;
}

function isFirstPage() {
  if (moviePages.length > 0) {
    return getCurrentPageIndex() === 0;
  }
  return true;
}

function isLastPage() {
  if (moviePages.length > 0) {
    return getCurrentPageIndex() === moviePages.length - 1;
  }
  return true;
}

function getCurrentPage() {
  const index = getCurrentPageIndex();
  return moviePages[index];
}

function getCurrentPageIndex() {
  return indexCrtPage;
}

function setCurrentPageIndex(index) {
  if (moviePages.length > 0) {
    indexCrtPage = clamp(index, 0, moviePages.length - 1);
    return;
  }
  indexCrtPage = 0;
}

function setButtonPageState(item, state) {
  item.classList.add(state);
}

function refreshMoviePaginationState() {
  const items = document.querySelectorAll(".page-item");
  items.forEach((item) => {
    item.classList.remove("disabled", "active");
    const pageItemInfo = item.getAttribute("data-page-item-info");
    if (isNaN(pageItemInfo)) {
      if (pageItemInfo === "prev" && isFirstPage()) setButtonPageState(item, "disabled");
      if (pageItemInfo === "next" && isLastPage()) setButtonPageState(item, "disabled");
    }
    else {
      const indexPage = parseInt(pageItemInfo);
      if (indexPage === getCurrentPageIndex()) setButtonPageState(item, "active");
    }
  });
}

function refreshButtonAddFavoriteState(target, isActive) {
  const heart = target.children[0];
  heart.classList.remove("fa-solid", "heart-pink");
  const style = isActive ? ["fa-solid", "heart-pink"] : ["fa-solid"];
  heart.classList.add(...style);
}

function setEventAddFavorite() {
  movieList.addEventListener("click", (event) => {
    const btnAddFavorite = event.target.closest(".poster-favorite");
    if (btnAddFavorite) {
      const div = event.target.closest(".movie-item");
      const id = parseInt(div.getAttribute("data-movie-id"));
      const data = dataMovies.find((dataMovie) => dataMovie["id"] === id);
      const isFavorite = getIsMovieFavorite(data);
      setMovieFavorite(data, !isFavorite);
      refreshButtonAddFavoriteState(btnAddFavorite, getIsMovieFavorite(data));
    }
  });
}

function refreshMovieList() {
  let html = "";
  const movies = getCurrentPage() ?? [];
  const count = movies.length;
  for (let i = 0; i < count; i++) {
    html += createButtonMovieHTML(movies[i]);
  }
  movieList.innerHTML = html;
  setIsShowElement(loadingSpinner, false);
  loadMoviePosters();
  refreshMoviePaginationState();
  window.scrollTo({ top: 0, behavior: "instant" });
}

function loadDataMovies(onLoaded) {
  axios.get(apiMovies)
    .then((response) => {
      dataMovies = response.data["results"];
      if (onLoaded) onLoaded();
    })
    .catch((error) => console.log(error));
}

function displayMovies(movies, indexPage) {
  initPages(movies);
  setCurrentPageIndex(indexPage);
  refreshMovieList();
}

function initPages(movies) {
  moviePages = [];
  movies.forEach((movie, index) => {
    const indexPage = Math.floor(index / countPerPage);
    if (moviePages.length < indexPage + 1) moviePages.push([]);
    moviePages[indexPage].push(movie);
  });
  const pageLength = clamp(moviePages.length, 1, moviePages.length);
  moviePagination.innerHTML = createMoviePaginationHTML(pageLength);
}

setEventPageHome();
setEventPageFavorite();
setEventSearch();
setEventAddFavorite();
setEventMoviePagination();
setEventMovieModal();
setEventDisplayMode();

loadDataMovies(() => displayMovies(dataMovies, 0));