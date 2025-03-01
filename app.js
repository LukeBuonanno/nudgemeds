document.addEventListener("DOMContentLoaded", () => {
    const scanButton = document.getElementById("start-scan");
    const video = document.getElementById("camera-preview");
    const canvas = document.getElementById("barcode-canvas");
    const drugInput = document.getElementById("drug-input");
    const searchButton = document.getElementById("search-drug");
    const drugNameElem = document.querySelector("#drug-name span");
    const drugFactsElem = document.querySelector("#drug-facts span");
    const historyList = document.getElementById("history-list");
    const reminderButton = document.getElementById("set-reminder");
    const themeButton = document.getElementById("toggle-theme");

    let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];

    function updateHistory() {
        historyList.innerHTML = "";
        searchHistory.forEach(drug => {
            let li = document.createElement("li");
            li.textContent = drug;
            li.addEventListener("click", () => fetchDrugInfo(drug));
            historyList.appendChild(li);
        });
    }

    function fetchDrugInfo(query) {
        fetch(`https://api.fda.gov/drug/label.json?search=openfda.product_ndc:${query}+OR+openfda.brand_name:${query}`)
            .then(response => response.json())
            .then(data => {
                let drug = data.results[0];
                let name = drug.openfda.brand_name ? drug.openfda.brand_name[0] : "Unknown";
                let facts = drug.indications_and_usage ? drug.indications_and_usage[0] : "No details found";

                drugNameElem.textContent = name;
                drugFactsElem.textContent = facts;

                if (!searchHistory.includes(query)) {
                    searchHistory.push(query);
                    localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
                    updateHistory();
                }
            })
            .catch(() => {
                drugNameElem.textContent = "Not Found";
                drugFactsElem.textContent = "No data available";
            });
    }

    searchButton.addEventListener("click", () => {
        let query = drugInput.value.trim();
        if (query) fetchDrugInfo(query);
    });

    scanButton.addEventListener("click", () => {
        video.style.display = "block";
        Quagga.init({
            inputStream: { name: "Live", type: "LiveStream", target: video },
            decoder: { readers: ["ean_reader"] }
        }, err => {
            if (!err) Quagga.start();
        });

        Quagga.onDetected(data => {
            Quagga.stop();
            video.style.display = "none";
            let barcode = data.codeResult.code;
            fetchDrugInfo(barcode);
        });
    });

    reminderButton.addEventListener("click", () => {
        let time = prompt("Enter reminder time (HH:MM 24h format):");
        if (time) {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    let now = new Date();
                    let [hour, minute] = time.split(":").map(Number);
                    let reminderTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);

                    let delay = reminderTime - now;
                    if (delay > 0) {
                        setTimeout(() => {
                            new Notification("Medication Reminder", {
                                body: `Time to take ${drugNameElem.textContent}`
                            });
                        }, delay);
                    }
                }
            });
        }
    });

    themeButton.addEventListener("click", () => {
        document.body.classList.toggle("grayscale");
    });

    updateHistory();
});
