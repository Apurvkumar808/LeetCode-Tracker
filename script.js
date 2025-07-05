document.addEventListener("DOMContentLoaded", function () {
    const searchButton = document.getElementById("search-btn");
    const usernameInput = document.getElementById("user-input");
    const statsContainer = document.querySelector(".stats-container");
    const easyProgressCircle = document.querySelector(".easy-progress");
    const mediumProgressCircle = document.querySelector(".medium-progress");
    const hardProgressCircle = document.querySelector(".hard-progress");
    const easyLabel = document.getElementById("easy-label");
    const mediumLabel = document.getElementById("medium-label");
    const hardLabel = document.getElementById("hard-label");
    const cardStatsContainer = document.querySelector(".stats-cards");
    const recentContainer = document.querySelector(".recent-questions");

    function validateUsername(username) {
        if (username.trim() === "") {
            alert("Username should not be empty");
            return false;
        }
        const regex = /^[a-zA-Z0-9_-]{1,15}$/;
        const isMatching = regex.test(username);
        if (!isMatching) {
            alert("Invalid Username");
        }
        return isMatching;
    }

    async function fetchUserDetails(username) {
        try {
            searchButton.textContent = "Searching...";
            searchButton.disabled = true;

            const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
            const targetUrl = 'https://leetcode.com/graphql/';

            const headers = new Headers();
            headers.append("content-type", "application/json");

            const graphql = JSON.stringify({
                query: `
                    query userData($username: String!) {
                        allQuestionsCount {
                            difficulty
                            count
                        }
                        matchedUser(username: $username) {
                            submitStats {
                                acSubmissionNum {
                                    difficulty
                                    count
                                    submissions
                                }
                                totalSubmissionNum {
                                    difficulty
                                    count
                                    submissions
                                }
                            }
                        }
                        recentAcSubmissionList(username: $username, limit: 10) {
                            title
                            titleSlug
                            timestamp
                        }
                    }
                `,
                variables: { username }
            });

            const response = await fetch(proxyUrl + targetUrl, {
                method: "POST",
                headers: headers,
                body: graphql
            });

            if (!response.ok) {
                throw new Error("Unable to fetch user details.");
            }

            const data = await response.json();
            if (!data.data || !data.data.matchedUser) {
                throw new Error("User not found.");
            }

            displayUserData(data);
        } catch (error) {
            statsContainer.innerHTML = `<p style="color:red;">${error.message}</p>
            <p><a href="https://cors-anywhere.herokuapp.com/corsdemo" target="_blank">Click here to enable CORS if blocked</a></p>`;
        } finally {
            searchButton.textContent = "Search";
            searchButton.disabled = false;
        }
    }

    function updateProgress(solved, total, label, circle) {
        const progressDegree = (solved / total) * 100;
        circle.style.setProperty("--progress-degree", `${progressDegree}%`);
        label.textContent = `${solved}/${total}`;
    }

    function displayUserData(parsedData) {
        const allCounts = parsedData.data.allQuestionsCount;
        const acStats = parsedData.data.matchedUser.submitStats.acSubmissionNum;
        const totalStats = parsedData.data.matchedUser.submitStats.totalSubmissionNum;

        const getCount = (arr, diff) => arr.find(item => item.difficulty === diff)?.count || 0;
        const getSubmissions = (arr, diff) => arr.find(item => item.difficulty === diff)?.submissions || 0;

        updateProgress(getCount(acStats, "Easy"), getCount(allCounts, "Easy"), easyLabel, easyProgressCircle);
        updateProgress(getCount(acStats, "Medium"), getCount(allCounts, "Medium"), mediumLabel, mediumProgressCircle);
        updateProgress(getCount(acStats, "Hard"), getCount(allCounts, "Hard"), hardLabel, hardProgressCircle);

        const cardsData = [
            { label: "Overall Submissions", value: getSubmissions(totalStats, "All") },
            { label: "Overall Easy Submissions", value: getSubmissions(totalStats, "Easy") },
            { label: "Overall Medium Submissions", value: getSubmissions(totalStats, "Medium") },
            { label: "Overall Hard Submissions", value: getSubmissions(totalStats, "Hard") },
        ];

        cardStatsContainer.innerHTML = cardsData.map(
            data =>
                `<div class="card">
                    <h4>${data.label}</h4>
                    <p>${data.value}</p>
                </div>`
        ).join("");

        const recent = parsedData.data.recentAcSubmissionList;
        recentContainer.innerHTML = `
            <h3>Recent Accepted Questions:</h3>
            <ul>
                ${recent.map(q =>
                    `<li><a href="https://leetcode.com/problems/${q.titleSlug}/" target="_blank">${q.title}</a></li>`
                ).join("")}
            </ul>`;
    }

    searchButton.addEventListener('click', function () {
        const username = usernameInput.value.trim();
        if (validateUsername(username)) {
            fetchUserDetails(username);
        }
    });
});
