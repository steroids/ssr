export interface IHistory {
    initialEntries: string[]
}

const getHistory = (url: string): IHistory => {
    return {initialEntries: [url || '/']}
}

export default getHistory;
