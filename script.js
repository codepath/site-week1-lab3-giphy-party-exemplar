// Global Constants
// const apiKey = "MY_API_KEY"
const apiKey = "2gwEwML1OubskH4ocLiVxaRREB8Ktc7v"
const pageSize = 9

const GIPHY_API_BASE_URL = `http://api.giphy.com/v1/gifs/search`

const state = {
  apiPage: 0,
  searchTerm: "",
}

const isDefined = (item) => typeof item !== "undefined" && item !== null

// Page Elements
const searchForm = document.getElementById("search-form")
const searchInput = document.getElementById("search-input")
const resultsEl = document.getElementById("results")
const showMoreBtn = document.getElementById("show-more-button")

const createGiphyEndpointUrl = (searchTerm, numResults, offset = 0) =>
  `${GIPHY_API_BASE_URL}?q=${searchTerm}&limit=${numResults}&offset=${offset}&api_key=${apiKey}`

/**
 * Update the DOM to display results from the Giphy API query.
 *
 * @param {Object} results - An array of results containing each item
 *                           returned by the response from the Giphy API.
 *
 */
function displayResults(results) {
  // YOUR CODE HERE
  let gifsHTMLString = ""
  for (let gif of results) {
    gifsHTMLString += generateGifHTML(gif?.images?.original?.url ?? "")
  }

  resultsEl.innerHTML += gifsHTMLString
}

/** Render div element for a single GIF. */
function generateGifHTML(url) {
  return `
    <div class="gif">
        <img src="${url}" />
    </div>
`
}

/**
 * Make the actual `fetch` request to the Giphy API
 * and appropriately handle the response.
 *
 * @param {String} searchTerm - The user input text used as the search query
 *
 */
async function getGiphyApiResults(searchTerm) {
  // YOUR CODE HERE
  const offset = state.apiPage * pageSize
  const response = await fetch(createGiphyEndpointUrl(searchTerm, pageSize, offset))
  const jsonResponse = await response.json()
  return jsonResponse.data
}

/**
 * The function responsible for handling all form submission events.
 *
 * @param {SubmitEvent} event - The SubmitEvent triggered when submitting the form
 *
 */
async function handleFormSubmit(event) {
  // YOUR CODE HERE
  event.preventDefault()
  // reset results display section
  resultsEl.innerHTML = ""
  // handle state changes
  state.apiPage = 0
  state.searchTerm = searchInput.value
  const results = await getGiphyApiResults(state.searchTerm)
  displayResults(results)
  searchInput.value = ""
  state.apiPage += 1
  showMoreBtn?.classList?.remove?.("hidden")
}

// searchForm.addEventListener("submit", handleFormSubmit)

/**
 * Handle fetching the next set of results from the Giphy API
 * using the same search term from the previous query.
 *
 * @param {MouseEvent} event - The 'click' MouseEvent triggered by clicking the 'Show more' button
 *
 */
async function handleShowMore(event) {
  // YOUR CODE HERE
  const results = await getGiphyApiResults(state.searchTerm)
  displayResults(results)
  // currentApiPage++
  state.apiPage += 1
}

window.onload = function () {
  // YOUR CODE HERE
  searchForm.addEventListener("submit", handleFormSubmit)
  // Add any event handlers here
  showMoreBtn.addEventListener("click", handleShowMore)
}
