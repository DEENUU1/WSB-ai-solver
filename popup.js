document.addEventListener('DOMContentLoaded', () => {
    const fetchButton = document.getElementById('fetchContent');
    if (fetchButton) {
        fetchButton.addEventListener('click', () => {
            browser.tabs.query({active: true, currentWindow: true})
                .then((tabs) => {
                    const activeTab = tabs[0];
                    return browser.tabs.executeScript(activeTab.id, {
                        code: `

              const rawHTMLBaseDiv = document.querySelector('.rawHTML_base');
              const rawHTMLContent = rawHTMLBaseDiv ? rawHTMLBaseDiv.innerHTML : 'rawHTML_base div not found.';

              const odpowiedziTestDiv = document.querySelector('.odpowiedziTest');
              const odpowiedziTestContent = odpowiedziTestDiv ? odpowiedziTestDiv.innerHTML : 'odpowiedziTest div not found.';

              ({ rawHTMLContent: rawHTMLContent, odpowiedziTestContent: odpowiedziTestContent });
            `
                    });
                })
                .then((results) => {
                    console.log('Content of rawHTML_base:');
                    console.log(results[0].rawHTMLContent);
                    console.log('Content of odpowiedziTest:');
                    console.log(results[0].odpowiedziTestContent);
                })
                .catch((error) => {
                    console.error('Error executing script:', error);
                });
        });
    } else {
        console.error('Element with ID fetchContent not found');
    }
});
