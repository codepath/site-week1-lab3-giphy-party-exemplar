const chaiPkg = "tests/vendor/chai/chai.js"
const chaiSpiesPkg = "tests/vendor/chai/chai-spies.js"
const mochaPkg = "tests/vendor/mocha/mocha.js"
const mochaCssPkg = "tests/vendor/mocha/mocha.css"
const sinonPkg = "tests/vendor/sinon/sinon.js"
const testsScriptName = "test-giphy-party.js"
const testsScriptPath = `tests/${testsScriptName}`

function createScript(src, content) {
  const scriptEl = document.createElement("script")
  if (src) scriptEl.src = src
  scriptEl.setAttribute("type", "text/javascript")
  if (content) {
    const inlineScript = document.createTextNode(content)
    scriptEl.appendChild(inlineScript)
  }

  return scriptEl
}

function safeAccessLocalStorage(key) {
  try {
    const value = localStorage.getItem(key)
    return JSON.parse(value)
  } catch (e) {
    return null
  }
}

function safeStoreInLocalStorage(key, value) {
  try {
    localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value))
    return true
  } catch (e) {
    return false
  }
}

function postExecuteMonkeyPatchMocha() {
  const mochaStatsMenu = document.querySelector("#mocha-stats")
  const reportElement = document.querySelector("#mocha-report")
  const toggleButton = document.createElement("li")

  const reportIsHidden = safeAccessLocalStorage("mocha_report_hidden")

  toggleButton.setAttribute("role", "button")
  toggleButton.id = "mocha-report-toggle-button"
  toggleButton.innerHTML = reportIsHidden ? `<span>open report</span>` : `<span>close report</span>`
  if (reportIsHidden === true) reportElement.classList.toggle("hidden")

  toggleButton.addEventListener("click", () => {
    const reportIsHidden = safeAccessLocalStorage("mocha_report_hidden")
    if (reportIsHidden === null) {
      // show report
      safeStoreInLocalStorage("mocha_report_hidden", false)
      toggleButton.innerHTML = `<span>close report</span>`
    } else if (reportIsHidden) {
      // show report
      safeStoreInLocalStorage("mocha_report_hidden", false)
      toggleButton.innerHTML = `<span>close report</span>`
    } else {
      // hide report
      safeStoreInLocalStorage("mocha_report_hidden", true)
      toggleButton.innerHTML = `<span>open report</span>`
    }

    reportElement.classList.toggle("hidden")
  })
  mochaStatsMenu.appendChild(toggleButton)
}

function executeTestRunner(inlineTestRunScript = "mocha.run()") {
  const body = document.querySelector("body")
  // execute tests
  const runTestsScriptEl = createScript(null, inlineTestRunScript)
  runTestsScriptEl.classList.add("tests-exec")
  body.append(runTestsScriptEl)

  postExecuteMonkeyPatchMocha()
}

function monkeyPatchMochaCss() {
  const head = document.querySelector("head")

  const styleElement = document.createElement("style")

  styleElement.innerHTML = `
    #mocha-report .suite {
      background: #cbcbd7cc;
      border-radius: 4px;
      padding: 0.5rem 1rem;
    }
    #mocha-report.hidden {
      display: none;
    }
    #mocha-report {
      position: absolute;
      left: 0;

      right: 15px;
    }
    #mocha-report-toggle-button {
      cursor: pointer;
    }
    #mocha-report-toggle-button:hover {
      text-decoration: underline
    }
    #mocha-report-toggle-button:active {
      transform: translateY(1px);
    }
  `

  head.appendChild(styleElement)
}

function monkeyPatchMocha() {
  /**
   * Adds code toggle functionality for the provided test's list element.
   *
   * @param {HTMLLIElement} el
   * @param {string} contents
   */
  const HTMLReporter = mocha._reporter
  HTMLReporter.prototype.addCodeToggle = function (el, contents) {}
}

function setupMocha() {
  const body = document.querySelector("body")

  // setup mocha
  const setupScriptEl = createScript()
  body.append(setupScriptEl)

  const inlineMochaSetupScript = `
    mocha.setup({ ui: "bdd", checkLeaks: false })
    monkeyPatchMocha()
  `
  const inlineScript = document.createTextNode(inlineMochaSetupScript)
  setupScriptEl.appendChild(inlineScript)

  setupScriptEl.classList.add("mocha-init")
}

function setupAndLoadTests({ onloadCallback = () => {} }) {
  const body = document.querySelector("body")

  // setup mocha
  setupMocha()

  const testsScriptEl = createScript(testsScriptPath)
  body.append(testsScriptEl)
  testsScriptEl.onload = () => {
    onloadCallback()
  }
}

function loadCssFiles({ cssUrlsToLoad = [] }) {
  const head = document.querySelector("head")

  while (cssUrlsToLoad.length) {
    const linkElement = document.createElement("link")
    linkElement.setAttribute("rel", "stylesheet")
    linkElement.setAttribute("href", cssUrlsToLoad.shift())
    // insert the css before the test-env script
    const testEnvScript = head.querySelector("script#test-env-setup")
    head.insertBefore(linkElement, testEnvScript)
  }

  monkeyPatchMochaCss()
}

function loadScripts({ scriptUrlsToLoad = [], onloadCallback = () => {} }) {
  const body = document.querySelector("body")
  let lastScriptElement = null

  const loadScriptsRecursively = () => {
    const finalOnLoadCallback = () => {
      loadScriptsRecursively()
      onloadCallback()
    }

    const scriptUrl = scriptUrlsToLoad.length ? scriptUrlsToLoad.shift() : null

    if (scriptUrl) {
      lastScriptElement = createScript(scriptUrl)
      body.appendChild(lastScriptElement)
      lastScriptElement.onload = () =>
        Boolean(scriptUrlsToLoad.length) ? loadScriptsRecursively() : finalOnLoadCallback()
    }
  }

  if (!scriptUrlsToLoad.length) {
    onloadCallback()
  }

  loadScriptsRecursively()
}

function loadTestingLibraries({ onloadCallback = () => {} }) {
  const onloadCallbackWithCss = () => {
    loadCssFiles({ cssUrlsToLoad: [mochaCssPkg] })
    onloadCallback()
  }

  loadScripts({
    // scriptUrlsToLoad: [testingLibraryPkg, chaiPkg, chaiSpiesPkg, sinonPkg, mochaPkg],
    scriptUrlsToLoad: [chaiPkg, chaiSpiesPkg, mochaPkg, sinonPkg],
    onloadCallback: () => onloadCallbackWithCss(),
  })
}

function runTestSuite(reportElementId = "mocha") {
  const body = document.querySelector("body")
  // create report div
  const reportDivEl = document.createElement("div")

  reportDivEl.setAttribute("id", reportElementId)
  body.appendChild(reportDivEl)

  // we load the testing libraries
  loadTestingLibraries({
    // then we ensure all setup has occured
    onloadCallback: () =>
      setupAndLoadTests({
        // and we run our test suite for this lab
        onloadCallback: () => executeTestRunner(),
      }),
  })
}

// actually run the setup function
runTestSuite()
