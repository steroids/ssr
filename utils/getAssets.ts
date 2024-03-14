interface IAsset {
    name: string,
    size: number,
    chunks: string[],
    chunkNames: string[],
    info: Record<string, any>,
    emitted: boolean
}

interface IStats {
    errors: any[],
    warnings: any[],
    assetsByChunkName: Record<string, any>,
    assets: IAsset[],
    filteredAssets: number,
    assetsUrls: string[]
}

const getAssets = (stats: IStats): Record<string, string[]> => {
    const assets = stats.assets.filter(asset => {
        const chunkHints = asset.chunks || asset.chunkNames;

        return chunkHints.includes('index') || chunkHints.includes('common')
    });

    return {
        css: assets.filter(asset => /\.css/.test(asset.name)).map(asset => asset.name),
        js: assets.filter(asset => /\.js/.test(asset.name)).map(asset => asset.name),
    }
}

export default getAssets;
