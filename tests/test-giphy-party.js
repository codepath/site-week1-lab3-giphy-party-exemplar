// Core tests

const htmlDocumentString = `
<!DOCTYPE html>
<html>
  <head></head>
  <body></body>
</html>
`

const documentCache = {
  doc: null,
}

const createHtmlDocumentString = () => `
  <!DOCTYPE html>
  <html>
    <head>${document.querySelector("head").innerHTML}</head>
    <body>${document.querySelector("body").innerHTML}</body>
  </html>
`

const createHtmlDocumentShim = (html = createHtmlDocumentString()) => {
  if (!documentCache.doc) {
    documentCache.doc = new window.DOMParser().parseFromString(html, "text/html")
    // if (!documentCache.doc?.defaultView) {
    //   let newWindow
    //   let existingIframeEl = window.document.getElementById(constants.MICROWAVE_IFRAME_ID)
    //   if (!existingIframeEl) {
    //     const iframeEl = window.document.createElement("iframe")
    //     iframeEl.setAttribute("id", constants.MICROWAVE_IFRAME_ID)
    //     iframeEl.setAttribute("style", "display: none")
    //     window.document.body.appendChild(iframeEl)
    //     newWindow = iframeEl.contentWindow ?? iframeEl.contentDocument?.defaultView
    //   }

    //   const defaultView = newWindow ?? window

    //   Object.defineProperty(documentCache.doc, "defaultView", {
    //     value: defaultView,
    //   })
    // }
  }

  return documentCache.doc
}

const createResetFunction = (dummyDocument) => {
  // function reset() {
  //   dummyDocument.title = ""
  //   dummyDocument.head.innerHTML = `<meta charset="utf-8" />
  // <title>React Challenges</title>
  // <meta name="viewport" content="width=device-width,initial-scale=1" />`
  //   dummyDocument.body.innerHTML = "<main></main>"
  // }

  return reset
}

describe("New Giphy Party", () => {
  // UTILITIES
  const isDefined = (item) => typeof item !== "undefined" && item !== null

  const expect = chai.expect
  const test = it
  // const assert = chai.assert
  // const test = (...args) => it(...args)

  const sandbox = sinon.createSandbox()
  const chaiSandbox = chai.spy.sandbox()

  let getResultsSpy
  let displayResultsSpy
  let handleFormSubmitSpy
  let handleShowMeMoreClickSpy

  // flag to determine if we've subbed out the handleFormSubmit spy or not
  let hasSubbedListeners = false
  let listenerSubbedOut = null
  // let displayResultsStub

  function formSubmitPreventer(event) {
    event.preventDefault()
  }

  before(() => {
    createHtmlDocumentShim()
  })

  beforeEach(() => {
    const originalFetch = window.fetch
    const mockFetch = mockGlobalFetch(originalFetch)
    const fake = sandbox.fake(mockFetch)
    sandbox.replace(window, "fetch", fake)
    // sandbox.replace(window, "document", documentCache.doc)
    // window.document = documentCache.doc
  })

  beforeEach(function () {
    getResultsSpy = chaiSandbox.on(window, "getGiphyApiResults")
    // displayResultsSpy = chaiSandbox.on(window, "displayResults", mockDisplayResults)
    displayResultsSpy = chaiSandbox.on(window, "displayResults")
    handleShowMeMoreClickSpy = chaiSandbox.on(window, "handleShowMeMoreClick")
    handleFormSubmitSpy = chaiSandbox.on(window, "handleFormSubmit")
    // displayResultsStub = sandbox.fake(mockDisplayResults)

    const searchForm = document.querySelector("#search-form")
    const listeners = searchForm?.getEventListeners?.("submit")

    if (searchForm) {
      searchForm.addEventListener("submit", formSubmitPreventer)

      const submitListenerIdx = listeners.findIndex((fn) => fn.name === "handleFormSubmit")

      if (isDefined(submitListenerIdx) && submitListenerIdx > -1 && !hasSubbedListeners) {
        hasSubbedListeners = true
        searchForm.removeEventListener("submit", formSubmitPreventer)
        listenerSubbedOut = listeners[submitListenerIdx]
        searchForm.removeEventListener("submit", listeners[submitListenerIdx])
        searchForm.addEventListener("submit", window.handleFormSubmit)
        searchForm.addEventListener("submit", formSubmitPreventer)
      }
    }
  })

  afterEach(function () {
    const searchForm = document.getElementById("search-form")
    if (searchForm) {
      searchForm.removeEventListener("submit", formSubmitPreventer)

      if (hasSubbedListeners && listenerSubbedOut) {
        // searchForm.removeEventListener("submit", listeners[submitListenerIdx])
        searchForm.removeEventListener("submit", formSubmitPreventer)
        searchForm.removeEventListener("submit", window.handleFormSubmit)
        // handleFormSubmitSpy = newSubbedListener
        searchForm.addEventListener("submit", listenerSubbedOut)
        searchForm.addEventListener("submit", formSubmitPreventer)

        hasSubbedListeners = false
        listenerSubbedOut = null
      }
    }

    // handleFormSubmitSpy = null
    // chaiSandbox.restore()
    sandbox.restore()
    chaiSandbox.restore()
  })

  function assertHandleFormSubmitCalledWhenFormIsSubmitted(searchTerm = "__TEST__") {
    const searchForm = document.querySelector("#search-form")
    expect(searchForm, "Could not find a `form` element with the `id` of `search-form`").to.exist
    expect(searchForm).to.have.property("id", "search-form")
    expect(searchForm).to.have.property("children").with.lengthOf.at.least(2) // input and button children

    const searchButton = document.querySelector("form button[type='submit']")
    expect(
      searchButton,
      "The button inside the search form did not have `type` property set to `submit`"
    ).to.have.property("type", "submit")

    const searchInput = document.querySelector("form input#search-input")
    expect(searchInput, "Could not find an `input` element with the `id` of `search-input` inside the `search-form`.")
      .to.exist
    const originalSearchInputValue = searchInput?.value ?? ""

    try {
      searchInput.value = searchTerm

      searchButton.click()

      expect(
        handleFormSubmitSpy,
        "The `handleFormSubmit` function was not called when submitting the form."
      ).to.have.been.called.at.least(1)
    } catch (e) {
      if (e instanceof chai.AssertionError) {
        throw e
      } else {
        expect(e instanceof Error, `Submitting the form should not throw an error: ${String(e)}`).to.be.false
      }
    } finally {
      if (searchInput) searchInput.value = originalSearchInputValue ?? ""
    }
  }

  // function mockDisplayResults(mockResults) {
  //   if (Array.isArray(mockResults)) {
  //     const resultsArea = document.querySelector("#results")
  //     if (!resultsArea) return

  //     for (let i = 0; i < mockResults.length; i++) {
  //       resultsArea.innerHTML += `<div data-iter="${i}"><img /></div>`
  //     }
  //   }
  // }

  describe("Build a search form", () => {
    //
    test("The `index.html` file should have a semantic HTML form element with an `id` attribute of `search-form`", () => {
      const searchForm = document.querySelector("#search-form")
      expect(searchForm, "Could not find a `form` element with the `id` of `search-form`").to.exist

      expect(searchForm).to.have.property("id", "search-form")
    })

    test("Inside the search form should be an `input` element with an `id` attribute of `search-input` that is required", () => {
      const searchForm = document.querySelector("#search-form")
      expect(searchForm, "Could not find a `form` element with the `id` of `search-form`").to.exist

      const searchInput = document.querySelector("#search-form input")
      expect(searchInput, "Could not find an `input` element inside the search form").to.exist

      expect(searchInput, "The input element did not have an `id` of `search-input`").to.have.property(
        "id",
        "search-input"
      )
      expect(searchInput.getAttribute("required"), "The input element was not required").not.to.be.null
      expect(searchInput, "The input element was not required").to.have.property("required", true)
    })

    test("Inside the search form should be a `button` element with the `id` of `search-button`", () => {
      const searchForm = document.querySelector("#search-form")
      expect(searchForm, "Could not find a `form` element with the `id` of `search-form`").to.exist

      const searchButton = document.querySelector("#search-form button#search-button")
      expect(searchButton, "Could not find a `button` element with the `id` of `search-button`").to.exist
    })

    test("The `button` element inside the search form should have the `type` attribute set to `submit`.", () => {
      const searchForm = document.querySelector("#search-form")
      expect(searchForm, "Could not find a `form` element with the `id` of `search-form`").to.exist

      const searchButton = document.querySelector("#search-form button#search-button")
      expect(searchButton, "Could not find a `button` element with the `id` of `search-button`").to.exist

      expect(
        searchButton,
        "The button inside the search form did not have `type` property set to `submit`"
      ).to.have.property("type", "submit")
      expect(
        searchButton.getAttribute("type"),
        "The button inside the search form did not have `type` property set to `submit`"
      ).to.equal("submit")
    })
  })

  describe("Fetch data from the Giphy API when the form is submitted", () => {
    test("There should be a function called `handleFormSubmit` in the `script.js` file", () => {
      expect(handleFormSubmit, "Could not find a function named `handleFormSubmit").to.exist
      expect(handleFormSubmit instanceof Function, "Could not find a function named `handleFormSubmit").to.be.true
    })

    test("There should be a function called `getGiphyApiResults` in the `script.js` file", () => {
      expect(getGiphyApiResults, "Could not find a function named `getGiphyApiResults").to.exist
      expect(getGiphyApiResults instanceof Function).to.be.true
    })

    test("There should be a function called `displayResults` in the `script.js` file", () => {
      expect(displayResults, "Could not find a function named `displayResults").to.exist
      expect(displayResults instanceof Function).to.be.true
    })

    test("The `handleFormSubmit` function should be called when the form is submitted", async () => {
      const searchTerm = "__TEST__"

      assertHandleFormSubmitCalledWhenFormIsSubmitted(searchTerm)
    })

    test("The `getGiphyApiResults` function should be called when the form is submitted", async () => {
      const searchTerm = "__TEST__"

      assertHandleFormSubmitCalledWhenFormIsSubmitted(searchTerm)

      expect(
        getResultsSpy,
        "The `getGiphyApiResults` function was not called when the form was submitted"
      ).to.have.been.called.at.least(1)
    })

    test("The `getGiphyApiResults` function should use the native `fetch` function to make a request to the proper Giphy API endpoint", async () => {
      const searchTerm = "__TEST__"

      assertHandleFormSubmitCalledWhenFormIsSubmitted(searchTerm)

      expect(
        getResultsSpy,
        "The `getGiphyApiResults` function was not called when the form was submitted"
      ).to.have.been.called.at.least(1)

      // console.log(window.fetch)

      expect(
        window.fetch.called,
        "The `getGiphyApiResults` function did not use the native JS `fetch` function to make an API request"
      ).to.be.true

      const args = window.fetch.args

      const url = typeof args?.[0]?.[0] === "string" ? args?.[0]?.[0] : args?.[0]?.[0]?.url
      expect(
        url,
        "The Giphy API url passed to the `fetch` function did not contain the search term from the `input` element"
      ).to.include(searchTerm)
    })
  })

  describe("Properly display results from Giphy API requests", () => {
    //
    test("There should be an HTML element with an id attribute of `results` where Giphy API results should be displayed", () => {
      const resultsArea = document.querySelector("#results")
      expect(resultsArea, "Could not find an HTML element with the `id` of `results` on the page").to.exist
    })

    test("The `displayResults` function should be called when the Giphy API request is successful", async () => {
      const searchTerm = "__TEST__"

      const resultsArea = document.querySelector("#results")
      const originalResultsAreaHTML = resultsArea?.innerHTML

      const searchInput = document.querySelector("#search-input")
      const originalSearchInputValue = searchInput?.value ?? ""

      assertHandleFormSubmitCalledWhenFormIsSubmitted(searchTerm)

      try {
        if (searchInput) searchInput.value = searchTerm
        const formSubmitEvent = new SubmitEvent("submit")
        await window.handleFormSubmit(formSubmitEvent)
        expect(
          displayResultsSpy,
          "The `displayResults` function was not called for a successful Giphy API request."
        ).to.have.been.called.at.least(1)
      } catch (e) {
        if (e instanceof chai.AssertionError) {
          throw e
        } else {
          expect(e instanceof Error, `Submitting the form should not throw an error: ${String(e)}`).to.be.false
        }
      } finally {
        if (searchInput) searchInput.value = originalSearchInputValue ?? ""
        if (resultsArea) resultsArea.innerHTML = originalResultsAreaHTML ?? ""
      }
    })

    test("Submitting the form should populate the HTML element with an `id` of `results` with gifs using the response data", async () => {
      const resultsArea = document.querySelector("#results")
      expect(resultsArea, "Could not find an HTML element with the `id` of `results` on the page").to.exist
      const originalResultsAreaHTML = resultsArea?.innerHTML
      // const initialResultsChildrenNum = resultsArea?.getAttribute?.("children")?.length ?? 0
      const initialImageTagChildrenNum = resultsArea?.querySelectorAll?.("img")?.length ?? 0

      const searchTerm = "__TEST_WITH_DATA__"

      const searchInput = document.querySelector("#search-input")
      const originalSearchInputValue = searchInput?.value ?? ""

      // assertHandleFormSubmitCalledWhenFormIsSubmitted(searchTerm)

      // console.log(resultsArea.innerHTML)
      // console.log(resultsArea?.querySelectorAll?.("img").length)

      try {
        if (searchInput) searchInput.value = searchTerm
        const formSubmitEvent = new SubmitEvent("submit")
        await window.handleFormSubmit(formSubmitEvent)
        expect(
          displayResultsSpy,
          "The `displayResults` function was not called for a successful Giphy API request."
        ).to.have.been.called.at.least(1)

        // console.log(displayResultsSpy)

        // console.log(resultsArea.innerHTML)

        // console.log(resultsArea?.querySelectorAll?.("img"))

        // console.log(resultsArea.children)

        // expect(
        //   resultsArea,
        //   "No children found in the element with an `id` of `results` after a successful Giphy API request."
        // ).to.have.property("children")
        // const resultsChildrenNum = resultsArea?.getAttribute?.("children")?.length ?? 0
        // expect(
        //   resultsChildrenNum,
        //   "Did not find any additional children elements rendering gifs added inside the `results` element after a successful Giphy API request."
        // ).to.be.greaterThan(initialResultsChildrenNum)

        const finalImageTagChildrenNum = resultsArea?.querySelectorAll?.("img")?.length ?? 0
        expect(
          finalImageTagChildrenNum,
          "Did not find any child `img` elements with the `src` attribute set to the gif url added inside the `results` element after a successful Giphy API request."
        ).to.be.greaterThan(initialImageTagChildrenNum)
      } catch (e) {
        if (e instanceof chai.AssertionError) {
          throw e
        } else {
          expect(e instanceof Error, `Submitting the form should not throw an error: ${String(e)}`).to.be.false
        }
      } finally {
        if (searchInput) searchInput.value = originalSearchInputValue ?? ""
        if (resultsArea) resultsArea.innerHTML = originalResultsAreaHTML ?? ""
      }
    })
  })

  describe("Execute paginated queries with a 'Show More' button", () => {
    test("There should be a function called `handleShowMore` in the `script.js` file", () => {
      expect(window.handleShowMore, "Could not find a function named `handleShowMore`").to.exist
      expect(handleShowMore instanceof Function, "Could not find a function named `handleShowMore`").to.be.true
    })

    test("The 'Show More' button should be visible once results have been fetched", async () => {
      const resultsArea = document.querySelector("#results")
      expect(resultsArea, "Could not find an HTML element with the `id` of `results` on the page").to.exist
      const originalResultsAreaHTML = resultsArea?.innerHTML

      const searchInput = document.querySelector("#search-input")
      const originalSearchInputValue = searchInput?.value ?? ""

      // make fetch request
      const searchTerm = "__TEST_WITH_DATA__"

      try {
        assertHandleFormSubmitCalledWhenFormIsSubmitted(searchTerm)
        const formSubmitEvent = new SubmitEvent("submit")
        await window.handleFormSubmit(formSubmitEvent)
      } catch (e) {
        if (e instanceof chai.AssertionError) {
          throw e
        } else {
          expect(e instanceof Error, `Submitting the form should not throw an error: ${String(e)}`).to.be.false
        }
        // expect(e instanceof Error, `Submitting the form should not throw an error: ${String(e)}`).to.be.false
      } finally {
        if (searchInput) searchInput.value = originalSearchInputValue ?? ""
        if (resultsArea) resultsArea.innerHTML = originalResultsAreaHTML ?? ""
      }

      // expect it to be visible
      const showMoreButton = document.querySelector("button#show-more-button")
      expect(
        showMoreButton,
        "Could not find a `button` element with the `id` of `show-more-button` displayed after a successful Giphy API request."
      ).to.exist
    })

    test("Clicking the 'Show More' button should fetch the next page of results", async () => {
      const resultsArea = document.querySelector("#results")
      expect(resultsArea, "Could not find an HTML element with the `id` of `results` on the page").to.exist
      const originalResultsAreaHTML = resultsArea?.innerHTML

      const searchInput = document.querySelector("#search-input")
      const originalSearchInputValue = searchInput?.value ?? ""

      const searchTerm = "__TEST_WITH_DATA__"

      try {
        assertHandleFormSubmitCalledWhenFormIsSubmitted(searchTerm)
        const formSubmitEvent = new SubmitEvent("submit")
        await window.handleFormSubmit(formSubmitEvent)
      } catch (e) {
        if (e instanceof chai.AssertionError) {
          throw e
        } else {
          expect(e instanceof Error, `Submitting the form should not throw an error: ${String(e)}`).to.be.false
        }
      } finally {
        if (searchInput) searchInput.value = originalSearchInputValue ?? ""
        if (resultsArea) resultsArea.innerHTML = originalResultsAreaHTML ?? ""
      }

      const showMoreButton = document.querySelector("button#show-more-button")
      expect(
        showMoreButton,
        "Could not find a `button` element with the `id` of `show-more-button` after a successful Giphy API request."
      ).to.exist

      try {
        if (searchInput) searchInput.value = searchTerm

        showMoreButton.click()

        try {
          const moreButtonClickEvent = new MouseEvent("click")
          await window.handleShowMore(moreButtonClickEvent)
        } catch (e) {
          if (e instanceof chai.AssertionError) {
            throw e
          } else {
            expect(e instanceof Error, `Clicking the \`Show more\` button should not throw an error: ${String(e)}`).to
              .be.false
          }
        }
      } catch (e) {
        if (e instanceof chai.AssertionError) {
          throw e
        } else {
          expect(e instanceof Error, `Clicking the \`Show more\` button should not throw an error: ${String(e)}`).to.be
            .false
        }
      } finally {
        if (searchInput) searchInput.value = originalSearchInputValue ?? ""
        if (resultsArea) resultsArea.innerHTML = originalResultsAreaHTML ?? ""
      }

      try {
        const fetchArgs = window.fetch.args
        const url = typeof fetchArgs?.[0]?.[0] === "string" ? fetchArgs?.[0]?.[0] : fetchArgs?.[0]?.[0]?.url

        expect(
          url,
          "The Giphy API url passed to the `fetch` function did not contain the search term from the `input` element"
        ).to.include(searchTerm)

        const properUrl = new URL(url ?? "http://localhost")
        const urlSearchParams = new URLSearchParams(properUrl.search)

        const offset = urlSearchParams.has("offset") ? Number(urlSearchParams.get("offset")) : 0

        const mostRecentFetchArgs = fetchArgs?.[fetchArgs?.length - 1] ?? null
        const url2 =
          typeof mostRecentFetchArgs?.[0] === "string" ? mostRecentFetchArgs?.[0] : mostRecentFetchArgs?.[0]?.url

        const properUrl2 = new URL(url2 ?? "http://localhost")
        const urlSearchParams2 = new URLSearchParams(properUrl2.search)
        expect(
          urlSearchParams2.has("offset"),
          "The `handleShowMore` function didn't accurately paginate requests to the Giphy API."
        ).to.be.true
        const offset2 = urlSearchParams2.has("offset") ? Number(urlSearchParams2.get("offset")) : 0

        expect(offset2).to.be.greaterThan(offset)
      } catch (e) {
        throw e
      } finally {
        if (searchInput) searchInput.value = originalSearchInputValue ?? ""
        if (resultsArea) resultsArea.innerHTML = originalResultsAreaHTML ?? ""
      }
    })
  })
})

function mockGlobalFetch(wrappedFetch) {
  const mockFetch = async (...args) => {
    // using the standard url arg
    const urlOrFetchObject = args[0]
    if (typeof urlOrFetchObject === "string") {
      if (urlOrFetchObject.includes("giphy.com/v1/gifs/search")) {
        if (urlOrFetchObject.includes("__TEST__") || urlOrFetchObject.includes("__TEST_WITH_DATA__")) {
          const mockData = getMockData()
          return {
            json: async () => ({
              ...mockData.mockResponse,
              data: urlOrFetchObject.includes("__TEST_WITH_DATA__") ? mockData.mockResponse.data : [],
            }),
          }
        }
      }
    }

    // using the request object arg
    if (isDefined(urlOrFetchObject?.url) && typeof urlOrFetchObject?.url === "string") {
      if (urlOrFetchObject.url.includes("giphy.com/v1/gifs/search")) {
        if (urlOrFetchObject.url.includes("__TEST__") || urlOrFetchObject.url.includes("__TEST_WITH_DATA__")) {
          const mockData = getMockData()
          return {
            json: async () => ({
              ...mockData.mockResponse,
              data: urlOrFetchObject.includes("__TEST_WITH_DATA__") ? mockData.mockResponse.data : [],
            }),
          }
        }
      }
    }

    return wrappedFetch(...args)
  }

  return mockFetch
}

function getMockData() {
  const mockDataEntryBaseAttrsEmpty = {
    type: "",
    id: "",
    url: "",
    slug: "",
    bitly_gif_url: "",
    bitly_url: "",
    embed_url: "",
    username: "",
    source: "",
    title: "",
    rating: "",
    content_url: "",
    source_tld: "",
    source_post_url: "",
    is_sticker: 0,
    import_datetime: "",
    trending_datetime: "",
  }

  const imgKeys = {
    height: "264",
    width: "476",
    size: "532748",
    url: "",
    mp4_size: "105355",
    mp4: "",
    webp_size: "93478",
    webp: "",
    frames: "29",
    hash: "f4fb954190248a63474bdd20a4d7b588",
  }
  const mockDataEntryImageKeys = {
    original: {},
    downsized: {},
    downsized_large: {},
    downsized_medium: {},
    downsized_small: {},
    downsized_still: {},
    fixed_height: {},
    fixed_height_downsampled: {},
    fixed_height_small: {},
    fixed_height_small_still: {},
    fixed_height_still: {},
    fixed_width: {},
    fixed_width_downsampled: {},
    fixed_width_small: {},
    fixed_width_small_still: {},
    fixed_width_still: {},
    looping: {},
    original_still: {},
    original_mp4: {},
    preview: {},
    preview_gif: {},
    preview_webp: {},
    "480w_still": {},
  }

  const mockDataEntryUserEmpty = {
    avatar_url: "",
    banner_image: "",
    banner_url: "",
    profile_url: "",
    username: "",
    display_name: "",
    description: "",
    instagram_url: "",
    website_url: "",
    is_verified: true,
  }

  const mockDataEntryAnalyticsAttrsEmpty = {
    analytics_response_payload: "",
    analytics: {
      onload: {
        url: "",
      },
      onclick: {
        url: "",
      },
      onsent: {
        url: "",
      },
    },
  }

  // ACTUAL DATA

  const mockDataEntryBaseAttrs = {
    type: "gif",
    id: "l3fzM2wgd6TygHbYA",
    url: "https://giphy.com/gifs/pink-perfect-pnk-l3fzM2wgd6TygHbYA",
    slug: "pink-perfect-pnk-l3fzM2wgd6TygHbYA",
    bitly_gif_url: "http://gph.is/2v8Mwq0",
    bitly_url: "http://gph.is/2v8Mwq0",
    embed_url: "https://giphy.com/embed/l3fzM2wgd6TygHbYA",
    username: "pink",
    source: "https://www.youtube.com/watch?v=ocDlOD1Hw9k",
    title: "Test Fail GIF by P!NK",
    rating: "pg",
    content_url: "",
    source_tld: "www.youtube.com",
    source_post_url: "https://www.youtube.com/watch?v=ocDlOD1Hw9k",
    is_sticker: 0,
    import_datetime: "2017-08-21 22:10:38",
    trending_datetime: "2017-08-30 13:37:08",
  }

  const mockDataEntryUser = {
    avatar_url: "https://media1.giphy.com/avatars/pink/pjHjZPLkTxPd.jpg",
    banner_image: "https://media1.giphy.com/channel_assets/pink/QzxFuSlDZ5SL.jpg",
    banner_url: "https://media1.giphy.com/channel_assets/pink/QzxFuSlDZ5SL.jpg",
    profile_url: "https://giphy.com/pink/",
    username: "pink",
    display_name: "P!NK",
    description: "",
    instagram_url: "https://instagram.com/pink",
    website_url: "",
    is_verified: true,
  }

  // the mock data entry image keys filled in
  const mockDataEntryImages = {
    original: {
      height: "264",
      width: "476",
      size: "532748",
      url: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/giphy.gif?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=giphy.gif&ct=g",
      mp4_size: "105355",
      mp4: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/giphy.mp4?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=giphy.mp4&ct=g",
      webp_size: "93478",
      webp: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/giphy.webp?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=giphy.webp&ct=g",
      frames: "29",
      hash: "f4fb954190248a63474bdd20a4d7b588",
    },
    downsized: {
      height: "264",
      width: "476",
      size: "532748",
      url: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/giphy.gif?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=giphy.gif&ct=g",
    },
    downsized_large: {
      height: "264",
      width: "476",
      size: "532748",
      url: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/giphy.gif?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=giphy.gif&ct=g",
    },
    downsized_medium: {
      height: "264",
      width: "476",
      size: "532748",
      url: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/giphy.gif?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=giphy.gif&ct=g",
    },
    downsized_small: {
      height: "264",
      width: "476",
      mp4_size: "116105",
      mp4: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/giphy-downsized-small.mp4?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=giphy-downsized-small.mp4&ct=g",
    },
    downsized_still: {
      height: "264",
      width: "476",
      size: "532748",
      url: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/giphy_s.gif?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=giphy_s.gif&ct=g",
    },
    fixed_height: {
      height: "200",
      width: "361",
      size: "274334",
      url: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/200.gif?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=200.gif&ct=g",
      mp4_size: "65212",
      mp4: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/200.mp4?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=200.mp4&ct=g",
      webp_size: "102534",
      webp: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/200.webp?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=200.webp&ct=g",
    },
    fixed_height_downsampled: {
      height: "200",
      width: "361",
      size: "73690",
      url: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/200_d.gif?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=200_d.gif&ct=g",
      webp_size: "47234",
      webp: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/200_d.webp?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=200_d.webp&ct=g",
    },
    fixed_height_small: {
      height: "100",
      width: "181",
      size: "107558",
      url: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/100.gif?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=100.gif&ct=g",
      mp4_size: "25951",
      mp4: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/100.mp4?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=100.mp4&ct=g",
      webp_size: "39486",
      webp: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/100.webp?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=100.webp&ct=g",
    },
    fixed_height_small_still: {
      height: "100",
      width: "181",
      size: "4462",
      url: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/100_s.gif?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=100_s.gif&ct=g",
    },
    fixed_height_still: {
      height: "200",
      width: "361",
      size: "10339",
      url: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/200_s.gif?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=200_s.gif&ct=g",
    },
    fixed_width: {
      height: "111",
      width: "200",
      size: "117485",
      url: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/200w.gif?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=200w.gif&ct=g",
      mp4_size: "28802",
      mp4: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/200w.mp4?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=200w.mp4&ct=g",
      webp_size: "43636",
      webp: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/200w.webp?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=200w.webp&ct=g",
    },
    fixed_width_downsampled: {
      height: "111",
      width: "200",
      size: "30420",
      url: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/200w_d.gif?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=200w_d.gif&ct=g",
      webp_size: "18650",
      webp: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/200w_d.webp?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=200w_d.webp&ct=g",
    },
    fixed_width_small: {
      height: "56",
      width: "100",
      size: "47795",
      url: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/100w.gif?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=100w.gif&ct=g",
      mp4_size: "13016",
      mp4: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/100w.mp4?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=100w.mp4&ct=g",
      webp_size: "17524",
      webp: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/100w.webp?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=100w.webp&ct=g",
    },
    fixed_width_small_still: {
      height: "56",
      width: "100",
      size: "2432",
      url: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/100w_s.gif?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=100w_s.gif&ct=g",
    },
    fixed_width_still: {
      height: "111",
      width: "200",
      size: "4941",
      url: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/200w_s.gif?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=200w_s.gif&ct=g",
    },
    looping: {
      mp4_size: "1256645",
      mp4: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/giphy-loop.mp4?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=giphy-loop.mp4&ct=g",
    },
    original_still: {
      height: "264",
      width: "476",
      size: "23105",
      url: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/giphy_s.gif?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=giphy_s.gif&ct=g",
    },
    original_mp4: {
      height: "266",
      width: "480",
      mp4_size: "105355",
      mp4: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/giphy.mp4?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=giphy.mp4&ct=g",
    },
    preview: {
      height: "180",
      width: "324",
      mp4_size: "31426",
      mp4: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/giphy-preview.mp4?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=giphy-preview.mp4&ct=g",
    },
    preview_gif: {
      height: "121",
      width: "218",
      size: "49684",
      url: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/giphy-preview.gif?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=giphy-preview.gif&ct=g",
    },
    preview_webp: {
      height: "244",
      width: "440",
      size: "49744",
      url: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/giphy-preview.webp?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=giphy-preview.webp&ct=g",
    },
    "480w_still": {
      height: "266",
      width: "480",
      size: "532748",
      url: "https://media4.giphy.com/media/l3fzM2wgd6TygHbYA/480w_s.jpg?cid=51f7326cr7os4gjnkp5252m2ycgl3g7h7tsi4jpcdtna7sn4&rid=480w_s.jpg&ct=g",
    },
  }

  const mockDataEntryAnalyticsAttrs = {
    analytics_response_payload:
      "e=Z2lmX2lkPWwzZnpNMndnZDZUeWdIYllBJmV2ZW50X3R5cGU9R0lGX1NFQVJDSCZjaWQ9NTFmNzMyNmNyN29zNGdqbmtwNTI1Mm0yeWNnbDNnN2g3dHNpNGpwY2R0bmE3c240JmN0PWc",
    analytics: {
      onload: {
        url: "https://giphy-analytics.giphy.com/v2/pingback_simple?analytics_response_payload=e%3DZ2lmX2lkPWwzZnpNMndnZDZUeWdIYllBJmV2ZW50X3R5cGU9R0lGX1NFQVJDSCZjaWQ9NTFmNzMyNmNyN29zNGdqbmtwNTI1Mm0yeWNnbDNnN2g3dHNpNGpwY2R0bmE3c240JmN0PWc&action_type=SEEN",
      },
      onclick: {
        url: "https://giphy-analytics.giphy.com/v2/pingback_simple?analytics_response_payload=e%3DZ2lmX2lkPWwzZnpNMndnZDZUeWdIYllBJmV2ZW50X3R5cGU9R0lGX1NFQVJDSCZjaWQ9NTFmNzMyNmNyN29zNGdqbmtwNTI1Mm0yeWNnbDNnN2g3dHNpNGpwY2R0bmE3c240JmN0PWc&action_type=CLICK",
      },
      onsent: {
        url: "https://giphy-analytics.giphy.com/v2/pingback_simple?analytics_response_payload=e%3DZ2lmX2lkPWwzZnpNMndnZDZUeWdIYllBJmV2ZW50X3R5cGU9R0lGX1NFQVJDSCZjaWQ9NTFmNzMyNmNyN29zNGdqbmtwNTI1Mm0yeWNnbDNnN2g3dHNpNGpwY2R0bmE3c240JmN0PWc&action_type=SENT",
      },
    },
  }

  const mockEmptyResponse = {
    data: [
      {
        ...mockDataEntryBaseAttrsEmpty,
        user: { ...mockDataEntryUserEmpty },
        images: { ...mockDataEntryImageKeys },
        ...mockDataEntryAnalyticsAttrsEmpty,
      },
    ],
    meta: {
      status: 200,
      msg: "",
      response_id: "",
    },
    pagination: {
      total_count: 1,
      count: 1,
      offset: 1,
    },
  }

  // mock response for the "tests" search with only one entry from the data array
  const mockResponse = {
    data: [
      {
        ...mockDataEntryBaseAttrs,
        user: { ...mockDataEntryUser },
        // images: { ...mockDataEntryImages },
        images: Object.fromEntries(
          Object.entries(mockDataEntryImageKeys).map(([key, value]) => [key, { ...value, ...imgKeys }])
        ),
        ...mockDataEntryAnalyticsAttrs,
      },
    ],
    meta: {
      status: 200,
      msg: "OK",
      response_id: "",
    },
    pagination: {
      total_count: 4814,
      count: 9,
      offset: 9,
    },
  }

  return { mockResponse, mockEmptyResponse }
}
