export interface IHistory {
    initialEntries: string[]
}

const getHistory = (url: string): IHistory => {
    return {initialEntries: [encodeURI(url) || '/']}
}

export default getHistory;
