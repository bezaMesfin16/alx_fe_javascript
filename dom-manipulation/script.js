const serverUrl = "https://jsonplaceholder.typicode.com/posts"; // Mock API for simulation
const quotes = JSON.parse(localStorage.getItem("quotes")) || [
  {
    text: "The only limit to our realization of tomorrow is our doubts of today",
    category: "Inspirational",
  },
  {
    text: "Success is not final, failure is not fatal: It is the courage to continue that counts.",
    category: "Life Decision",
  },
];

function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function showRandomQuote() {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];
  const quoteDisplay = document.querySelector("#quoteDisplay");
  quoteDisplay.innerHTML = `<p>${quote.text}</p> <em><p>${quote.category}</p></em>`;
  sessionStorage.setItem("lastViewedQuote", JSON.stringify(quote));
}

function createAddQuoteForm() {
  const newQuoteText = document.getElementById("newQuoteText").value;
  const newQuoteCategory = document.getElementById("newQuoteCategory").value;

  if (newQuoteText && newQuoteCategory) {
    const newQuote = { text: newQuoteText, category: newQuoteCategory };
    quotes.push(newQuote);
    saveQuotes();
    postQuoteToServer(newQuote);
    document.getElementById("newQuoteText").value = "";
    document.getElementById("newQuoteCategory").value = "";

    alert("Quote added successfully!");
    populateCategories();
    displayQuotes();
  } else {
    alert("Please add a new quote");
  }
}

async function postQuoteToServer(quote) {
  try {
    const response = await fetch(serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(quote),
    });
    if (!response.ok) throw new Error("Failed to post quote to server.");
  } catch (error) {
    console.error("Error posting quote to server:", error);
  }
}

function exportQuotes() {
  const dataStr = JSON.stringify(quotes);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const exportFileDefaultName = "quotes.json";

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", url);
  linkElement.setAttribute("download", exportFileDefaultName);
  linkElement.click();
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (event) {
    const importedQuotes = JSON.parse(event.target.result);
    quotes.push(...importedQuotes);
    saveQuotes();
    alert("Quotes imported successfully!");
    location.reload(); // Reload the page to reflect the imported quotes
  };
  fileReader.readAsText(event.target.files[0]);
}

function populateCategories() {
  const categoryFilter = document.getElementById("categoryFilter");
  const categories = [...new Set(quotes.map((quote) => quote.category))];
  categoryFilter.innerHTML = '<option value="all">All</option>';
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

function filterQuote() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  const filteredQuotes =
    selectedCategory === "all"
      ? quotes
      : quotes.filter((quote) => quote.category === selectedCategory);
  displayQuotes(filteredQuotes);
}

function displayQuotes(quotesToDisplay = quotes) {
  const quoteContainer = document.getElementById("quoteContainer");
  quoteContainer.innerHTML = "";
  quotesToDisplay.forEach((quote) => {
    const quoteElement = document.createElement("div");
    quoteElement.innerHTML = `<p>${quote.text}</p> <em><p>${quote.category}</p></em>`;
    quoteContainer.appendChild(quoteElement);
  });
}

async function fetchQuotesFromServer() {
  try {
    const response = await fetch(serverUrl);
    const serverQuotes = await response.json();
    resolveConflicts(serverQuotes);
  } catch (error) {
    console.error("Error fetching data from server:", error);
  }
}

function resolveConflicts(serverQuotes) {
  const localQuotes = JSON.parse(localStorage.getItem("quotes")) || [];
  const mergedQuotes = [...serverQuotes, ...localQuotes];

  const uniqueQuotes = mergedQuotes.filter(
    (quote, index, self) =>
      index ===
      self.findIndex(
        (q) => q.text === quote.text && q.category === quote.category
      )
  );

  localStorage.setItem("quotes", JSON.stringify(uniqueQuotes));
  quotes.length = 0; // Clear current quotes array
  quotes.push(...uniqueQuotes);
  displayQuotes();
  notifyUser("Quotes synced with server!"); // Notify user that quotes are synced
}

async function syncQuotes() {
  await fetchQuotesFromServer();
}

function notifyUser(message) {
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.style.position = "fixed";
  notification.style.bottom = "10px";
  notification.style.right = "10px";
  notification.style.backgroundColor = "#333";
  notification.style.color = "#fff";
  notification.style.padding = "10px";
  notification.style.borderRadius = "5px";
  document.body.appendChild(notification);
  setTimeout(() => {
    document.body.removeChild(notification);
  }, 5000);
}

document.getElementById("newQuote").addEventListener("click", showRandomQuote);
document
  .getElementById("addQuote")
  .addEventListener("click", createAddQuoteForm);
document.getElementById("exportQuotes").addEventListener("click", exportQuotes);
document
  .getElementById("importFile")
  .addEventListener("change", importFromJsonFile);
document
  .getElementById("categoryFilter")
  .addEventListener("change", filterQuote);

// Initial setup
populateCategories();
displayQuotes();

// Periodically fetch server data and sync quotes
setInterval(syncQuotes, 60000); // Sync every 60 seconds
