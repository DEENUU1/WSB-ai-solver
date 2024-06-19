function fetchContentFromPage() {
    return browser.tabs.query({active: true, currentWindow: true})
        .then((tabs) => {
            const activeTab = tabs[0];
            return browser.tabs.executeScript(activeTab.id, {
                code: `
                    const rawHTMLBaseDiv = document.querySelector('.rawHTML_base');
                    const rawHTMLContent = rawHTMLBaseDiv ? rawHTMLBaseDiv.innerHTML : null;

                    const odpowiedziTestDiv = document.querySelector('.odpowiedziTest');
                    const odpowiedziTestContent = odpowiedziTestDiv ? odpowiedziTestDiv.innerHTML : null;

                    // Return an object with the retrieved content and flags
                    ({ rawHTMLContent: rawHTMLContent, odpowiedziTestContent: odpowiedziTestContent, elementsFound: rawHTMLBaseDiv !== null || odpowiedziTestDiv !== null });
                `
            });
        })
        .then((results) => {
            console.log('Content of rawHTML_base:', results[0].rawHTMLContent);
            console.log('Content of odpowiedziTest:', results[0].odpowiedziTestContent);
            return results[0];
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

    if (fetchButton) {
        fetchButton.addEventListener('click', () => {
            fetchContentFromPage()
                .then(({rawHTMLContent, odpowiedziTestContent, elementsFound}) => {
                    if (elementsFound) {
                        console.log('Element .rawHTML_base found in HTML:', rawHTMLContent);
                        console.log('Element .odpowiedziTest found in HTML:', odpowiedziTestContent);

                        resultDisplay.textContent = "Found HTML content\n";

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
                        resultDisplay.textContent += `\n\nAI Response: ${JSON.stringify(aiResponse)}`;
                    } else {
                        console.error('No valid AI response');
                        resultDisplay.textContent += '\n\nNo valid AI response.';
                    }
                })
                .catch(error => {
                    console.error('Error fetching content or AI response:', error);
                    resultDisplay.textContent += `\n\nError: ${error.message}`;
                });
        });
    } else {
        console.error('Element with ID fetchContent not found');
    }
});
