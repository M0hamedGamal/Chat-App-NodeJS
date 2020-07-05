const generateMessages = (username, text) => {
    return {
        username: username,
        text: text,
        createdAt: new Date().getTime()
    }
}

const generateLocationUrl = (username, url) => {
    return {
        username: username,
        url: url,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateMessages: generateMessages,
    generateLocationUrl: generateLocationUrl
}