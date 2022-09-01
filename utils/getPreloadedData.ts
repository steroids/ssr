import {Request} from 'express';
import {matchPath} from 'react-router-dom';
import {IRouteItem, treeToList} from '@steroidsjs/core/ui/nav/Router/Router';
import {IListProps} from '@steroidsjs/core/ui/list/List/List'
import {IComponents} from '@steroidsjs/core/providers/ComponentsProvider';
import {getConfigId, normalizeConfig, fetchData, IFetchConfig} from '@steroidsjs/core/hooks/useFetch';
import {IPreloadedData} from '@steroidsjs/core/providers/SsrProvider';

const addCancelTokenMock = () => {}

const getRoutePreloadData = (routesTree: IRouteItem, path: Request['path']): (IFetchConfig | IListProps)[] => {
    for (const route of treeToList(routesTree)) {
        const matchResult = matchPath(path, route);
        if (matchResult) {
            return route.preloadedData
                ? route.preloadedData(matchResult)
                : [];
        }
    }

    return [];
};

export const getPreloadConfigs = (routesTree: IRouteItem, path: Request['path']): {routeFetchConfigs: IFetchConfig[], routeListsConfigs: IListProps[]} => {
    const fetchConfigs = [];
    const listsConfigs = [];

    const routePreloadData = getRoutePreloadData(routesTree, path);

    routePreloadData.forEach(config => {
        if ('listId' in config) {
            listsConfigs.push(config);
        } else {
            fetchConfigs.push(config);
        }
    });

    return {
        routeFetchConfigs: fetchConfigs,
        routeListsConfigs: listsConfigs,
    };
}

const getPreloadedFetchesData = async (fetchConfigs: IFetchConfig[], components: IComponents): Promise<IPreloadedData> => {
    const fetchPromises = fetchConfigs
        .map(config => normalizeConfig(config))
        .map(config => fetchData(config, components, addCancelTokenMock));

    return Promise.all(fetchPromises)
        .then(result => result.reduce(
            (fetchedDataByConfigId, fetchedData, fetchIndex) => {
                const configId = getConfigId(fetchConfigs[fetchIndex]);
                fetchedDataByConfigId[configId] = fetchedData;
                return fetchedDataByConfigId;
            },
            {},
        ));
}

export default getPreloadedFetchesData;
