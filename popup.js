let rawHTMLContent = null;
let odpowiedziTestContent = null;
let elementsFound = false;

const contentScript = `
    window.__extension_content = {
        rawHTMLContent: document.querySelector('.rawHTML_base')?.innerHTML || null,
        odpowiedziTestContent: document.querySelector('.odpowiedziTest')?.innerHTML || null,
        elementsFound: !!document.querySelector('.rawHTML_base') || !!document.querySelector('.odpowiedziTest')
    };
`;

// const contentScript = `
//     window.__extension_content = {
//         rowHTMLContent: document.querySelector('.lista-clouda-element ')?.innerHTML || null,
//         odpowiedziTestContent: document.querySelector('.odpowiedziTest')?.innerHTML || null,
//         elementsFound: !!document.querySelector('.lista-clouda-element ') || !!document.querySelector('.odpowiedziTest')
//     };
// `

function fetchContentFromPage() {
    let activeTab;

    return browser.tabs.query({active: true, currentWindow: true})
        .then((tabs) => {
            activeTab = tabs[0];
            return browser.tabs.executeScript(activeTab.id, {code: contentScript});
        })
        .then(() => {
            return browser.tabs.executeScript(activeTab.id, {
                code: `
                    window.__extension_content;
                `
            });
        })
        .then((results) => {
            rawHTMLContent = results[0].rawHTMLContent;
            odpowiedziTestContent = results[0].odpowiedziTestContent;
            elementsFound = results[0].elementsFound;

            console.log('Content of rawHTML_base:', rawHTMLContent);
            console.log('Content of odpowiedziTest:', odpowiedziTestContent);
        })
        .catch((error) => {
            console.error('Error executing script:', error);
            throw error;
        });
}

function getOpenAIResponse(question, answers) {
    const endpoint = 'https://api.openai.com/v1/chat/completions';

    const requestData = {
        model: 'gpt-4-turbo',
        messages: [
            {
                role: 'system',
                content: 'You are an assistant answering questions. In some cases, you are given answers from which you must choose one or many correct answers - depending on the content of the question. If there is no answer, answer in a human-friendly way.'
            },
            {
                role: 'user',
                content: `### Question: ${question}\n ### Answer: ${answers}\n`,
            }
        ]
    };

    return fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer `
        },
        body: JSON.stringify(requestData)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const aiContent = data.choices[0].message.content;
            console.log('AI Response Content:', aiContent);
            return aiContent;
        })
        .catch(error => {
            console.error('Error fetching OpenAI API:', error);
            return null;
        });
}

document.addEventListener('DOMContentLoaded', () => {
    const fetchButton = document.getElementById('fetchContent');
    const resultDisplay = document.getElementById('resultDisplay');
    const aiResponseDisplay = document.getElementById('aiResponse');

    if (fetchButton) {
        let fetching = false;

        fetchButton.addEventListener('click', () => {
            if (fetching) return; // Prevent multiple fetches simultaneously
            fetching = true;

            resultDisplay.textContent = 'Fetching content...';

            fetchContentFromPage()
                .then(() => {
                    if (elementsFound) {
                        console.log('Element .rawHTML_base found in HTML:', rawHTMLContent);
                        console.log('Element .odpowiedziTest found in HTML:', odpowiedziTestContent);

                        const question = rawHTMLContent || 'What is the meaning of life?';
                        const answers = odpowiedziTestContent || null;

                        return getOpenAIResponse(question, answers);
                    } else {
                        console.log('Elements .rawHTML_base or .odpowiedziTest not found in HTML');
                        resultDisplay.textContent = 'No .rawHTML_base or .odpowiedziTest element found in HTML.';
                        return Promise.reject(new Error('Elements .rawHTML_base or .odpowiedziTest not found in HTML'));
                    }
                })
                .then(aiResponse => {
                    if (aiResponse) {
                        console.log('Handling AI response:', aiResponse);
                        aiResponseDisplay.textContent = `AI Response: ${aiResponse}`;
                    } else {
                        console.error('No valid AI response');
                        aiResponseDisplay.textContent = 'No valid AI response.';
                    }
                })
                .catch(error => {
                    console.error('Error fetching content or AI response:', error);
                    resultDisplay.textContent = `Error: ${error.message}`;
                })
                .finally(() => {
                    fetching = false;
                });
        });
    } else {
        console.error('Element with ID fetchContent not found');
    }
});
